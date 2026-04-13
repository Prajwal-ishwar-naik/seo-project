'use strict';

const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Auto-create required directories ──────────────────────────
['uploads', 'data'].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const MEDICINES_FILE = path.join(__dirname, 'data', 'medicines.json');

// ── Middleware ─────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Multer — Prescription upload ──────────────────────────────
const rxStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
    filename:    (req, file, cb) => {
        const stamp = `rx-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        cb(null, stamp + path.extname(file.originalname).toLowerCase());
    }
});

const uploadRx = multer({
    storage: rxStorage,
    limits: { fileSize: 5 * 1024 * 1024 },   // 5 MB
    fileFilter: (req, file, cb) => {
        const ok = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (ok.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(Object.assign(new Error('Only JPG, PNG or PDF files are accepted.'), { status: 400 }));
        }
    }
});

// ══════════════════════════════════════════════════════════════
//  API ROUTES
// ══════════════════════════════════════════════════════════════

// GET /api/medicines  — full catalogue from JSON "database"
app.get('/api/medicines', (req, res) => {
    try {
        const raw  = fs.readFileSync(MEDICINES_FILE, 'utf-8');
        let   list = JSON.parse(raw);

        // Optional query filters (for future scalability)
        if (req.query.category) list = list.filter(m => m.category === req.query.category);
        if (req.query.brand)    list = list.filter(m => m.brand    === req.query.brand);

        res.json(list);
    } catch (err) {
        console.error('Error reading medicines:', err);
        res.status(500).json({ error: 'Could not load medicine catalogue.' });
    }
});

// GET /api/medicines/:id  — single medicine
app.get('/api/medicines/:id', (req, res) => {
    try {
        const list = JSON.parse(fs.readFileSync(MEDICINES_FILE, 'utf-8'));
        const med  = list.find(m => m.id === parseInt(req.params.id));
        if (!med) return res.status(404).json({ error: 'Medicine not found.' });
        res.json(med);
    } catch {
        res.status(500).json({ error: 'Server error.' });
    }
});

// POST /api/rx-upload  — prescription file upload (Multer)
app.post('/api/rx-upload', (req, res, next) => {
    uploadRx.single('prescription')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message || 'File upload failed.' });
        }
        if (!req.file) return res.status(400).json({ error: 'No file received.' });

        // Log upload (in production: save record to DB)
        const logFile = path.join(__dirname, 'data', 'rx-uploads.json');
        let   logs    = [];
        try { logs = JSON.parse(fs.readFileSync(logFile, 'utf-8')); } catch {}
        logs.push({
            filename:     req.file.filename,
            originalName: req.file.originalname,
            size:         req.file.size,
            mimetype:     req.file.mimetype,
            uploadedAt:   new Date().toISOString()
        });
        fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));

        res.json({
            success:  true,
            message:  'Prescription uploaded! Our pharmacist will verify it within 2 hours.',
            filename: req.file.filename
        });
    });
});

// POST /api/notify  — "Notify me when back in stock"
app.post('/api/notify', (req, res) => {
    const { email, phone, medicineId, medicineName } = req.body;
    if (!email && !phone) return res.status(400).json({ error: 'Email or phone number is required.' });

    const notifyFile = path.join(__dirname, 'data', 'notifications.json');
    let   list       = [];
    try { list = JSON.parse(fs.readFileSync(notifyFile, 'utf-8')); } catch {}

    list.push({
        email:        email       || null,
        phone:        phone       || null,
        medicineId:   medicineId  || null,
        medicineName: medicineName || null,
        createdAt:    new Date().toISOString()
    });
    fs.writeFileSync(notifyFile, JSON.stringify(list, null, 2));

    res.json({ success: true, message: "You'll be notified when the medicine is back in stock." });
});

// POST /api/cart/save  — optional server-side cart persistence
app.post('/api/cart/save', (req, res) => {
    const { sessionId, items } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'Session ID required.' });

    const cartFile = path.join(__dirname, 'data', 'carts.json');
    let   carts    = {};
    try { carts = JSON.parse(fs.readFileSync(cartFile, 'utf-8')); } catch {}
    carts[sessionId] = { items, savedAt: new Date().toISOString() };
    fs.writeFileSync(cartFile, JSON.stringify(carts, null, 2));

    res.json({ success: true });
});

// GET /api/track/:orderId  — order status (mock; replace with DB query)
app.get('/api/track/:orderId', (req, res) => {
    const ORDERS = {
        'MS-2024-001': { step: 3, items: 'Crocin Advance, Limcee 500',    date: 'Apr 12, 2026', eta: 'Apr 16, 2026' },
        'MS-2024-002': { step: 5, items: 'Pantocid 40, Glucophage 500',   date: 'Apr 10, 2026', eta: 'Delivered'    },
        'MS-2024-003': { step: 1, items: 'Allegra 120',                    date: 'Apr 14, 2026', eta: 'Apr 18, 2026' },
        'DEMO':        { step: 2, items: 'Demo Order — MediShop',          date: 'Today',        eta: 'In 2–3 days'  },
    };
    const order = ORDERS[req.params.orderId.toUpperCase()];
    if (!order) return res.status(404).json({ error: `Order "${req.params.orderId}" not found. Try MS-2024-001 or DEMO.` });
    res.json(order);
});

// GET /api/health  — health check for Render uptime monitoring
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── SPA catch-all: always serve index.html ────────────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n  🏥  MediShop Pharmacy Server`);
    console.log(`  🌐  http://localhost:${PORT}`);
    console.log(`  📁  Serving: ${path.join(__dirname, 'public')}`);
    console.log(`  📦  API:     /api/medicines, /api/rx-upload, /api/track/:id\n`);
});
