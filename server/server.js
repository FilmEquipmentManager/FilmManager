process.noDeprecation = true;

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { createServer } = require("http");
const { Server } = require("socket.io");

const admin = require("firebase-admin");

const DM = require("./services/DatabaseManager");

const port = process.env.PORT || 3000;

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
    path: "/socket.io",
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
    },
});

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'UERROR: Missing authorization token.' });
        }

        const token = authHeader.split(' ')[1];

        const decodedToken = await admin.auth().verifyIdToken(token);

        req.user = decodedToken;

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ error: 'UERROR: Invalid or expired token.' });
    }
};

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
    })
);

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server healthy!");
});

app.get('/api/user', authMiddleware, async (req, res) => {
    try {
        const userData = DM.peek(['Users', req.user.uid]);

        if (!userData) return res.status(404).json({ error: 'UERROR: User not found' });

        res.json(userData);
    } catch (error) {
        console.log(`\n[API] - FAILED: /api/user GET - ${error.stack || error}\n`);
        res.status(500).json({ error: 'ERROR: Failed to fetch user data' });
    }
});

app.post('/api/user', authMiddleware, async (req, res) => {
    try {
        const { username, points } = req.body;
        
        DM['Users'][req.user.uid] = {
            ...DM.peek(['Users', req.user.uid]),
            username,
            points: parseInt(points) || 0
        };
        
        await DM.save();

        res.json({ success: true });
    } catch (error) {
        console.log(`\n[API] - FAILED: /api/user POST - ${error.stack || error}\n`);
        res.status(500).json({ error: 'ERROR: Failed to update user' });
    }
});

app.post('/api/register', async (req, res) => {
    try {
        const { email, password, username } = req.body;
        
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: username
        });

        DM['Users'][userRecord.uid] = {
            username,
            email,
            points: 0,
            createdAt: Date.now()
        };
        
        await DM.save();
        
        res.status(200).json({ message: "SUCCESS: Successfully registered user", result: userRecord.uid });
    } catch (error) {
        console.log(`\n[API] - FAILED: /api/register POST - ${error.stack || error}\n`);
        res.status(400).json({ error: error.message });
    }
});

app.get("/api/barcodes", authMiddleware, async (req, res) => {
    try {
        const barcodes = DM.peek(["Barcodes"]);

        const barcodeList = Array.isArray(barcodes) ? barcodes : typeof barcodes === "object" && barcodes !== null ? Object.values(barcodes) : [];

        res.status(200).json({
            message: "SUCCESS: Data fetched successfully.",
            result: barcodeList,
        });
    } catch (error) {
        console.log(`\n[API] - FAILED: /api/barcodes GET - ${error.stack || error}\n`);
        res.status(500).json({ error: "ERROR: Failed to fetch data." });
    }
});

app.post("/api/barcodes", authMiddleware, async (req, res) => {
    try {
        const { barcode } = req.body;

        if (typeof barcode !== "string" || barcode.trim() === "") {
            return res.status(400).json({
                error: "UERROR: One or more required parameters missing.",
            });
        }

        const newBarcode = {
            id: Date.now().toString(),
            value: barcode.trim(),
            timestamp: new Date().toISOString(),
        };

        DM["Barcodes"][newBarcode.id] = newBarcode;

        await DM.save();

        const barcodeList = Object.values(DM["Barcodes"] || {});

        io.emit("barcodes_updated", barcodeList);

        res.status(200).json({
            message: "SUCCESS: Barcode saved successfully.",
            result: newBarcode,
        });
    } catch (error) {
        console.log(`\n[API] - FAILED: /api/barcodes POST - ${error.stack || error}\n`);
        res.status(500).json({ error: "ERROR: Failed to save data." });
    }
});

io.on("connection", (socket) => {
    try {
        console.log(`\n[WEBSOCKET] - New client connected: ${socket.id}\n`);

        const barcodes = DM.peek(["Barcodes"]);

        const barcodeList = barcodes && typeof barcodes === "object" ? Object.values(barcodes) : [];

        socket.emit("barcodes_updated", barcodeList);
    } catch (error) {
        console.log(`\n[WEBSOCKET] - FAILED: Socket connection error - ${error.stack || error}\n`);
    }
});

async function startServer() {
    try {
        await DM.load();
        console.log(`\n[DATABASEMANAGER] - SUCCESS: Data loaded from Firebase RTDB.\n`);

        httpServer.listen(port, "0.0.0.0", () => {
            console.log(`\nServer is running on http://localhost:${port}\n`);
        });
    } catch (error) {
        console.log(`\n[DATABASEMANAGER] - FAILED: ${error}\n`);
        process.exit(1);
    }
}

startServer();