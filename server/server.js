process.noDeprecation = true;

const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const DM = require("./services/DatabaseManager");

const app = express();

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
    })
);

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server healthy!");
});

app.get("/api/barcodes", async (req, res) => {
    try {
        const barcodes = DM.peek(["barcodes"]);

        const barcodeList = Array.isArray(barcodes) ? barcodes : typeof barcodes === "object" && barcodes !== null ? Object.values(barcodes) : [];
        
        res.status(200).json({ message: "SUCCESS: Data fetched successfully.", result: barcodeList });
    } catch (error) {
        console.log(`\n[API] - FAILED: /api/barcodes GET - ${error.stack || error}\n`);
        res.status(500).json({ error: "ERROR: Failed to fetch data." });
    }
});


app.post("/api/barcodes", async (req, res) => {
    try {
        const { barcode } = req.body;

        if (typeof barcode !== "string" || barcode.trim() === "") {
            return res.status(400).json({ error: "UERROR: One or more required parameters missing." });
        }

        const newBarcode = {
            id: Date.now().toString(),
            value: barcode.trim(),
            timestamp: new Date().toISOString(),
        };

        DM["Barcodes"][newBarcode.id] = newBarcode;

        await DM.save();

        const barcodeList = Object.values(DM["barcodes"] || {});

        io.emit("barcodes_updated", barcodeList);

        res.status(200).json({ message: "SUCCESS: Barcode saved successfully.", result: newBarcode });
    } catch (error) {
        console.log(`\n[API] - FAILED: /api/barcodes POST - ${error.stack || error}\n`);
        res.status(500).json({ error: "ERROR: Failed to save data." });
    }
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
    path: "/socket.io",
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
    },
});

io.on("connection", (socket) => {
    console.log(`\n[WEBSOCKET] - New client connected: ${socket.id}\n`);

    try {
        const barcodes = DM.peek(["barcodes"]);

        const barcodeList = barcodes && typeof barcodes === "object" ? Object.values(barcodes) : [];

        socket.emit("barcodes_updated", barcodeList);
    } catch (error) {
        console.log(`\n[WEBSOCKET] - FAILED: Socket connection error - ${error.stack || error}\n`);
    }
});

const port = process.env.PORT || 3000;

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