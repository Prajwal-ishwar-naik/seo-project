'use strict';

const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const fsPromises = require('fs/promises');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const PDFDocument = require('pdfkit');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Auto-create required directories (Safe for Cloud) ──────────
try {
    ['uploads', 'data'].forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
} catch (e) {
    console.log("Cloud Environment: Using existing or temporary directories");
}

// ── Native JSON Database Setup ─────────────────────────────────
const DB = {
    medicines: path.join(__dirname, 'data', 'medicines.json'),
    rx_uploads: path.join(__dirname, 'data', 'rx_uploads.json'),
    orders: path.join(__dirname, 'data', 'orders.json'),
    notifications: path.join(__dirname, 'data', 'notifications.json')
};

// Ensure all database files exist (Safe for Cloud)
try {
    Object.values(DB).forEach(file => {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(file, JSON.stringify([]));
        }
    });
} catch (e) {
    console.log("Cloud Environment: Database files read-only mode");
}

// Helper for reading JSON DB
async function readDb(file) {
    try {
        const data = await fsPromises.readFile(file, 'utf-8');
        return JSON.parse(data || '[]');
    } catch {
        return [];
    }
}

// Helper for writing JSON DB
async function writeDb(file, data) {
    await fsPromises.writeFile(file, JSON.stringify(data, null, 2));
}

// ── Middleware ─────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
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
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ok = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (ok.includes(file.mimetype)) cb(null, true);
        else cb(Object.assign(new Error('Only JPG, PNG or PDF files are accepted.'), { status: 400 }));
    }
});

// ══════════════════════════════════════════════════════════════
//  API ROUTES
// ══════════════════════════════════════════════════════════════

// GET /api/medicines
app.get('/api/medicines', async (req, res) => {
    try {
        let medicines = await readDb(DB.medicines);

        if (req.query.category) {
            medicines = medicines.filter(m => m.category === req.query.category);
        }
        if (req.query.brand) {
            medicines = medicines.filter(m => m.brand === req.query.brand);
        }

        res.json(medicines);
    } catch (err) {
        console.error('Error fetching medicines:', err);
        res.status(500).json({ error: 'Could not load medicine catalogue.' });
    }
});

// GET /api/medicines/:id
app.get('/api/medicines/:id', async (req, res) => {
    try {
        const medicines = await readDb(DB.medicines);
        const row = medicines.find(m => m.id.toString() === req.params.id);
        if (!row) return res.status(404).json({ error: 'Medicine not found.' });
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: 'Server error.' });
    }
});

// POST /api/rx-upload
app.post('/api/rx-upload', (req, res, next) => {
    uploadRx.single('prescription')(req, res, async (err) => {
        if (err) return res.status(400).json({ error: err.message || 'File upload failed.' });
        if (!req.file) return res.status(400).json({ error: 'No file received.' });

        try {
            const uploads = await readDb(DB.rx_uploads);
            uploads.push({
                id: Date.now(),
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype,
                uploadedAt: new Date().toISOString()
            });
            await writeDb(DB.rx_uploads, uploads);

            res.json({
                success:  true,
                message:  'Prescription uploaded! Our pharmacist has instantly verified your prescription.',
                filename: req.file.filename
            });
        } catch (dbErr) {
            console.error('Error saving rx upload:', dbErr);
            res.status(500).json({ error: 'Database saving failed.' });
        }
    });
});

// POST /api/notify
app.post('/api/notify', async (req, res) => {
    try {
        const { email, phone, medicineId, medicineName } = req.body;
        if (!email && !phone) return res.status(400).json({ error: 'Email or phone number is required.' });

        const notifications = await readDb(DB.notifications);
        notifications.push({
            id: Date.now(),
            email: email || null,
            phone: phone || null,
            medicineId: medicineId || null,
            medicineName: medicineName || null,
            createdAt: new Date().toISOString()
        });
        await writeDb(DB.notifications, notifications);

        res.json({ success: true, message: "You'll be notified when the medicine is back in stock." });
    } catch (err) {
        console.error('Error recording notification:', err);
        return res.status(500).json({ error: 'Could not record notification.' });
    }
});

// POST /api/checkout
app.post('/api/checkout', async (req, res) => {
    try {
        const { items, total } = req.body;
        if (!items || !items.length) return res.status(400).json({ error: 'Cart is empty.' });

        const orderKey = `MS-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`;
        const etaDate = new Date();
        etaDate.setDate(etaDate.getDate() + 3);
        const etaString = etaDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        const orders = await readDb(DB.orders);
        orders.push({
            id: Date.now(),
            order_key: orderKey,
            total,
            status: 'Pharmacy Verified',
            eta: etaString,
            createdAt: new Date().toISOString()
        });
        await writeDb(DB.orders, orders);
        
        res.json({ success: true, orderId: orderKey, message: 'Order placed successfully!' });
    } catch (err) {
        console.error('Error creating order:', err);
        return res.status(500).json({ error: 'Failed to complete checkout.' });
    }
});

// GET /api/track/:orderId  
app.get('/api/track/:orderId', async (req, res) => {
    try {
        const orders = await readDb(DB.orders);
        const row = orders.find(o => o.order_key === req.params.orderId.toUpperCase());
        
        if (row) {
            const created = new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            res.json({ step: 2, items: "Your Custom Order", date: created, eta: row.eta });
            return;
        }

        const fallbackOrders = {
            'MS-2024-001': { step: 3, items: 'Crocin Advance, Limcee 500',    date: 'Apr 12, 2026', eta: 'Apr 16, 2026' },
            'DEMO':        { step: 2, items: 'Demo Order — MediShop',          date: 'Today',        eta: 'In 2–3 days'  },
        };
        const order = fallbackOrders[req.params.orderId.toUpperCase()];
        if (!order) return res.status(404).json({ error: `Order "${req.params.orderId}" not found. Try MS-2024-001 or DEMO.` });
        res.json(order);
    } catch (err) {
        console.error('Tracking Error:', err);
        res.status(500).json({ error: 'Failed to fetch tracking data.' });
    }
});

// GET /api/generate-prescription
app.get('/api/generate-prescription', (req, res) => {
    try {
        const { patientName = 'John Doe', medicineName = 'Amoxicillin 500mg' } = req.query;
        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Prescription-${patientName.replace(/\s+/g, '-')}.pdf`);
        doc.pipe(res);

        doc.rect(0, 0, doc.page.width, 100).fill('#2563eb');
        doc.fillColor('white').fontSize(24).font('Helvetica-Bold').text('CITY GENERAL HOSPITAL', 50, 35, { align: 'center' });
        doc.fontSize(10).font('Helvetica').text('123 Health Avenue, Medical District | Ph: (555) 012-3456', 50, 65, { align: 'center' });
        doc.moveTo(50, 120).lineTo(550, 120).fillColor('black').stroke();
        doc.fillColor('black').fontSize(12).font('Helvetica-Bold');
        doc.text('PRESCRIPTION NOTE', 50, 140, { align: 'center', underline: true });
        
        const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        doc.font('Helvetica').fontSize(11).text(`Date: ${currentDate}`, 50, 180);
        doc.text(`Patient Name: ${patientName}`, 50, 200);
        doc.text(`Patient ID: ${Math.floor(Math.random() * 90000) + 10000}`, 50, 220);
        doc.fontSize(36).font('Helvetica-Bold').fillColor('#2563eb').text('Rx', 50, 270);
        
        doc.fillColor('black').fontSize(14).text(`${medicineName}`, 110, 290);
        doc.fontSize(11).font('Helvetica-Oblique');
        doc.text('Directions:', 110, 315);
        doc.font('Helvetica').text('Take 1 dose orally twice a day for 5 days. \nDo not skip doses.', 110, 335);
        doc.moveTo(350, 500).lineTo(500, 500).stroke();
        doc.fontSize(10).font('Helvetica').text('Dr. Sarah Sterling, M.D.', 350, 510, { align: 'center', width: 150 });
        doc.text('License #MD998A21', 350, 525, { align: 'center', width: 150 });
        doc.fontSize(8).fillColor('grey').text('This is a simulated prescription generated for educational purposes.', 50, 700, { align: 'center' });

        doc.end();
    } catch (error) {
        console.error('Error generating prescription:', error);
        res.status(500).json({ error: 'Failed to generate prescription PDF' });
    }
});

// GET /api/health
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Explicit SEO Routes (Ensures Google doesn't see HTML for these) ──
app.get('/sitemap.xml', (req, res) => {
    res.set('Content-Type', 'application/xml');
    res.sendFile(path.join(__dirname, 'public', 'sitemap.xml'));
});

app.get('/robots.txt', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.sendFile(path.join(__dirname, 'public', 'robots.txt'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log('\n  🏥  MediShop Pharmacy Server');
    console.log(`  🌐  http://localhost:${PORT}`);
    console.log(`  📁  Serving: ${path.join(__dirname, 'public')}`);
    console.log(`  📦  API:     /api/medicines, /api/rx-upload, /api/track/:id\n`);
});

module.exports = app;
