# MediShop — Online Pharmacy

> A full-stack online pharmacy platform built with **jQuery + Node.js/Express**

---

## 🚀 Quick Start (Local)

```bash
npm install
npm start
```
Visit → `http://localhost:3000`

---

## 📁 Project Structure

```
medishop/
├── server.js            ← Express backend (API + static file server)
├── package.json
├── public/              ← Frontend (served by Express)
│   ├── index.html
│   ├── styles.css
│   └── app.js           ← jQuery frontend with real API calls
├── data/
│   ├── medicines.json   ← Medicine catalogue (your "database")
│   ├── notifications.json  ← Auto-created: notify-me requests
│   └── rx-uploads.json     ← Auto-created: prescription upload log
└── uploads/             ← Auto-created: prescription files stored here
```

---

## 🌐 Deploy to Render (Free)

1. Push this project to a **GitHub repository**
2. Go to **https://render.com** → New → **Web Service**
3. Connect your GitHub repo
4. Fill in:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** `Node`
5. Click **Deploy** → Render gives you a free `*.onrender.com` URL

> **Custom Domain:** Go to your Render service → Settings → Custom Domain → add your domain and follow the CNAME/A record instructions.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/medicines` | Full medicine catalogue |
| `GET` | `/api/medicines/:id` | Single medicine by ID |
| `POST` | `/api/rx-upload` | Upload prescription (multipart/form-data, field: `prescription`) |
| `POST` | `/api/notify` | Save notify-me request `{ email, phone, medicineId }` |
| `GET` | `/api/track/:orderId` | Order tracking status |
| `GET` | `/api/health` | Health check for uptime monitoring |

---

## ✨ Features

- 🔍 **Live Search** with autocomplete dropdown
- 🗂 **Multi-Criteria Filtering** — Category, Brand, Price, Stock, OTC/Rx
- 🛒 **AJAX Cart** with localStorage persistence
- 💊 **Drug Interaction Alerts** — warns when conflicting meds are combined
- 📄 **Prescription Upload** — drag & drop, validates JPG/PNG/PDF before upload
- 📦 **Order Tracking Stepper** — animated status steps
- 🔔 **Notify Me** — saves email/phone when medicine is out of stock
- 📱 **Fully Responsive** — works on mobile, tablet, desktop

---

## 🛠 Tech Stack

- **Frontend:** HTML5, CSS3 (vanilla), jQuery 3.7.1
- **Backend:** Node.js, Express.js
- **File Upload:** Multer
- **Database:** JSON files (swap with MongoDB/MySQL for production)
- **Hosting:** Render (free tier)
