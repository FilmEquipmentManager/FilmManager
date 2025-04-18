process.noDeprecation = true;

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { createServer } = require("http");
const { Server } = require("socket.io");

const admin = require("firebase-admin");

const DM = require("./services/DatabaseManager");

const FirebaseDecoder = require("./services/FirebaseDecoder");

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

app.get('/api/vouchers', authMiddleware, async (req, res) => {
    try {
        const vouchers = DM.peek(['Vouchers']) || {};
        const userVouchers = Object.values(vouchers).filter(
            voucher => voucher.userId === req.user.uid && !voucher.used
        );
        
        res.json(userVouchers);
    } catch (error) {
        console.log(`\n[API] - FAILED: /api/vouchers GET - ${error.stack || error}\n`);
        res.status(500).json({ error: 'ERROR: Failed to fetch vouchers' });
    }
});

// Create voucher (for testing/admin purposes)
app.post('/api/vouchers', authMiddleware, async (req, res) => {
    try {
        const { code, discount, minSpend, expiresAt } = req.body;
        
        if (!code || !discount) {
            return res.status(400).json({ error: 'UERROR: Missing required fields' });
        }
        
        const newVoucher = {
            id: code,
            userId: req.user.uid,
            code,
            discount: parseFloat(discount),
            minSpend: minSpend ? parseInt(minSpend) : null,
            expiresAt: expiresAt || null,
            used: false,
            createdAt: new Date().toISOString()
        };
        
        DM['Vouchers'][code] = newVoucher;
        await DM.save();
        
        res.json(newVoucher);
    } catch (error) {
        console.log(`\n[API] - FAILED: /api/vouchers POST - ${error.stack || error}\n`);
        res.status(500).json({ error: 'ERROR: Failed to create voucher' });
    }
});

// Redeem endpoint
app.post('/api/redeem', authMiddleware, async (req, res) => {
    try {
        const { items, voucherCode } = req.body;
        const user = DM.peek(['Users', req.user.uid]);
        
        if (!user) {
            return res.status(404).json({ error: 'UERROR: User not found' });
        }

        // Validate items
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'UERROR: Invalid cart items' });
        }

        // Calculate total points
        let subtotal = 0;
        const validatedItems = [];

        for (const item of items) {
            const product = DM.peek(['Barcodes', item.productId]);
            if (!product) {
                return res.status(400).json({ error: `UERROR: Product ${item.productId} not found` });
            }
            if (product.totalCount < item.quantity) {
                return res.status(400).json({ error: `UERROR: Insufficient stock for ${product.itemName}` });
            }
            subtotal += product.pointsToRedeem * item.quantity;
            validatedItems.push({
                productId: item.productId,
                quantity: item.quantity,
                pointsPerItem: product.pointsToRedeem
            });
        }

        // Validate voucher
        let voucher = null;
        if (voucherCode) {
            voucher = DM.peek(['Vouchers', voucherCode]);
            if (!voucher || voucher.userId !== req.user.uid) {
                return res.status(400).json({ error: 'UERROR: Invalid voucher' });
            }
            if (voucher.used) {
                return res.status(400).json({ error: 'UERROR: Voucher already used' });
            }
            if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) {
                return res.status(400).json({ error: 'UERROR: Voucher has expired' });
            }
            if (voucher.minSpend && subtotal < voucher.minSpend) {
                return res.status(400).json({ error: `UERROR: Voucher requires minimum ${voucher.minSpend} points` });
            }
        }

        const discount = voucher ? subtotal * voucher.discount : 0;
        const total = subtotal - discount;

        if (total > user.points) {
            return res.status(400).json({ error: 'UERROR: Insufficient points' });
        }

        // Deduct points
        user.points -= total;
        DM['Users'][req.user.uid] = user;

        // Mark voucher as used
        if (voucher) {
            voucher.used = true;
            DM['Vouchers'][voucherCode] = voucher;
        }

        // Update product stock
        for (const item of validatedItems) {
            const product = DM.peek(['Barcodes', item.productId]);
            product.totalCount -= item.quantity;
            DM['Barcodes'][item.productId] = product;
        }

        await DM.save();

        res.json({ 
            success: true,
            subtotal,
            discount,
            total,
            newBalance: user.points
        });

    } catch (error) {
        console.log(`\n[API] - FAILED: /api/redeem POST - ${error.stack || error}\n`);
        res.status(500).json({ error: 'ERROR: Checkout failed' });
    }
});

app.post('/api/register', async (req, res) => {
    const { email, password, username } = req.body;
    
    if (!email || !password || !username) {
        return res.status(400).json({ 
            error: 'UERROR: Please fill in all required fields.' 
        });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ 
            error: 'UERROR: Please enter a valid email address.' 
        });
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{12,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ 
            error: 'UERROR: Password must be at least 12 characters long and contain at least one uppercase letter, one number, and one special character.' 
        });
    }
    
    const users = DM.peek(['Users']);

    if (users) {
        const existingUserWithUsername = Object.values(users).find(
            (user) => user.username && user.username.toLowerCase() === username.toLowerCase()
        );
        
        if (existingUserWithUsername) {
            return res.status(400).json({ 
                error: 'UERROR: Username already taken.' 
            });
        }
    }
    
    let existingUser = null;
    
    try {
        existingUser = await admin.auth().getUserByEmail(email);
    } catch (error) {
        existingUser = null;
    }

    if (existingUser) {
        return res.status(400).json({
            error: 'UERROR: Email already taken.'
        });
    }
    
    try {
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: username
        });

        DM['Users'][userRecord.uid] = {
            username,
            email,
            role: "User",
            points: 0,
            createdAt: Date.now()
        };
        
        await DM.save();
        
        res.status(200).json({ 
            message: "SUCCESS: Registration successful.", 
            result: userRecord.uid 
        });
        
    } catch (error) {
        console.log("ERROR: " + FirebaseDecoder(error.message));
        return res.status(500).json({
            error: "ERROR: " + FirebaseDecoder(error.message)
        });
    }
});

app.get("/api/barcodes", authMiddleware, async (req, res) => {
    try {
        const barcodes = DM.peek(["Barcodes"]);

        const barcodeList = Array.isArray(barcodes)
            ? barcodes
            : typeof barcodes === "object" && barcodes !== null
            ? Object.values(barcodes)
            : [];

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
        const {
            barcode,
            itemName,
            itemDescription,
            count,
            group,
            location,
            pointsToRedeem,
        } = req.body;

        if (
            (barcode !== null && barcode !== undefined && typeof barcode !== "string") ||
            (itemName !== null && itemName !== undefined && typeof itemName !== "string") ||
            (itemDescription !== null && itemDescription !== undefined && typeof itemDescription !== "string") ||
            (group !== null && group !== undefined && typeof group !== "string") ||
            (location !== null && location !== undefined && typeof location !== "string")
        ) {
            return res.status(400).json({
                error: "UERROR: Invalid input types for strings.",
            });
        }

        if (
            (count !== null && count !== undefined && typeof count !== "number") ||
            (pointsToRedeem !== null && pointsToRedeem !== undefined && typeof pointsToRedeem !== "number")
        ) {
            return res.status(400).json({
                error: "UERROR: Invalid input types for numbers.",
            });
        }

        const now = new Date().toISOString();
        const updatedBy = req.user.name || req.user.email || req.user.uid || "Unknown";

        const newBarcode = {
            id: Date.now().toString(),
            barcode: typeof barcode === "string" ? barcode.trim() : null,
            itemName: typeof itemName === "string" ? itemName.trim() : null,
            itemDescription: typeof itemDescription === "string" ? itemDescription.trim() : null,
            group: typeof group === "string" ? group.trim() : "Unknown",
            location: typeof location === "string" ? location.trim() : "Unknown",
            totalCount: typeof count === "number" ? count : 1,
            pointsToRedeem: typeof pointsToRedeem === "number" ? pointsToRedeem : 0,
            sessionCount: 0,
            createdAt: now,
            updatedAt: now,
            updatedBy,
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

app.put("/api/barcodes/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const operation = req.body.operation || "edit"; 
        const {
            barcode,
            itemName,
            itemDescription,
            count,
            group,
            location,
            pointsToRedeem,
        } = req.body;

        if (
            (barcode !== null && barcode !== undefined && typeof barcode !== "string") ||
            (itemName !== null && itemName !== undefined && typeof itemName !== "string") ||
            (itemDescription !== null && itemDescription !== undefined && typeof itemDescription !== "string") ||
            (group !== null && group !== undefined && typeof group !== "string") ||
            (location !== null && location !== undefined && typeof location !== "string")
        ) {
            return res.status(400).json({
                error: "UERROR: Invalid input types for strings.",
            });
        }

        if (
            (count !== null && count !== undefined && typeof count !== "number") ||
            (pointsToRedeem !== null && pointsToRedeem !== undefined && typeof pointsToRedeem !== "number")
        ) {
            return res.status(400).json({
                error: "UERROR: Invalid input types for numbers.",
            });
        }

        const now = new Date().toISOString();
        const updatedBy = req.user.name || req.user.email || req.user.uid || "Unknown";

        const existingBarcode = DM.peek(["Barcodes", id]);
        if (!existingBarcode) {
            return res.status(404).json({ error: "UERROR: Barcode not found." });
        }

        let newCount = existingBarcode.totalCount;

        if (operation === "receive") {
            if (typeof count !== "number") {
                return res.status(400).json({ error: "UERROR: Item's count must be numeric" });
            }
            newCount += count;
        } else if (operation === "dispatch") {
            if (typeof count !== "number") {
                return res.status(400).json({ error: "UERROR: Item's count must be numeric" });
            }
            if (count > existingBarcode.totalCount) {
                return res.status(400).json({ error: "UERROR: Not enough stock to dispatch. Please rescan the item or check inventory" });
            }
            newCount -= count;
        } else {
            newCount = typeof count === "number" ? count : existingBarcode.totalCount;
        }

        const updatedBarcode = {
            ...existingBarcode,
            barcode: typeof barcode === "string" ? barcode.trim() : existingBarcode.barcode,
            itemName: typeof itemName === "string" ? itemName.trim() : existingBarcode.itemName,
            itemDescription: typeof itemDescription === "string" ? itemDescription.trim() : existingBarcode.itemDescription,
            group: typeof group === "string" ? group.trim() : existingBarcode.group || "",
            location: typeof location === "string" ? location.trim() : existingBarcode.location || "",
            pointsToRedeem: typeof pointsToRedeem === "number" ? pointsToRedeem : existingBarcode.pointsToRedeem || 0,
            totalCount: newCount,
            sessionCount: 0,
            updatedAt: now,
            updatedBy,
        };

        DM["Barcodes"][id] = updatedBarcode;

        await DM.save();
        io.emit("barcodes_updated", Object.values(DM["Barcodes"] || {}));

        res.status(200).json({ message: "SUCCESS: Barcode updated successfully." });
    } catch (error) {
        console.log(`\n[API] - FAILED: /api/barcodes/:id PUT - ${error.stack || error}\n`);
        res.status(500).json({ error: "ERROR: Failed to update barcode." });
    }
});

app.delete("/api/barcodes/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const existingBarcode = DM.peek(["Barcodes", id]);

        if (!existingBarcode) {
            return res.status(404).json({ error: "UERROR: Barcode not found." });
        }

        DM.destroy(["Barcodes", id]);

        await DM.save();

        io.emit("barcodes_updated", Object.values(DM["Barcodes"] || {}));

        res.status(200).json({ message: "SUCCESS: Barcode deleted successfully." });
    } catch (error) {
        console.log(`\n[API] - FAILED: /api/barcodes/:id DELETE - ${error.stack || error}\n`);
        res.status(500).json({ error: "ERROR: Failed to delete barcode." });
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

io.on("disconnect", (socket) => {
    try {
        console.log(`\n[WEBSOCKET] - Client disconnected: ${socket.id}\n`);
    } catch (error) {
        console.log(`\n[WEBSOCKET] - FAILED: Socket disconnection error - ${error.stack || error}\n`);
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