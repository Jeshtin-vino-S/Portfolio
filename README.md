# Jeshtin Vino - Fullstack Portfolio with Admin CMS

A high-performance Dark Editorial Portfolio built with React, Node.js, Express, and MongoDB Atlas.

---

## 📁 Project Architecture
```text
PORTFOLIO/
├── backend/                  # Node.js + Express.js API
│   ├── config/
│   │   ├── db.js             # Mongoose connection to MongoDB Atlas
│   │   └── initAdmin.js      # Initial admin verification in MongoDB
│   ├── models/
│   │   ├── Message.js        # Contact Form Messages Schema
│   │   ├── Project.js        # Projects Schema
│   │   └── Skill.js          # Skills Schema
│   ├── routes/
│   │   ├── contact.js        # POST /api/contact (Public)
│   │   ├── projects.js       # GET, POST, PUT, DELETE /api/projects
│   │   ├── skills.js         # GET, POST, DELETE /api/skills
│   │   └── admin.js          # POST /api/admin/login, GET/DELETE messages
│   ├── middleware/
│   │   └── auth.js           # JWT Admin Protection
│   ├── .env                  # Environment Variables (MONGO_URI, ADMIN_PASSWORD)
│   └── server.js             # Express API Entry Point (Port 5000)
│
├── frontend/                 # React + Vite Client
│   ├── src/
│   │   ├── assets/           # Profile and project images
│   │   ├── App.jsx           # Main Dark Editorial Portfolio Component
│   │   ├── Admin.jsx         # Full Admin CMS Dashboard
│   │   ├── index.css         # Dark Editorial Design System
│   │   └── main.jsx          # React Root
│   └── vite.config.js
│
└── package.json              # Root scripts
```

---

## ⚙️ 1. MongoDB Atlas Configuration

Open [`backend/.env`](file:///d:/Fullstack%20Projects/PORTFOLIO/backend/.env) and paste your MongoDB Atlas connection string:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/portfolio?retryWrites=true&w=majority
ADMIN_PASSWORD=admin123
JWT_SECRET=jeshtin_portfolio_jwt_secret_key_2026
```

---

## 🚀 2. Running the Fullstack Application

Open two terminals (or run from root):

### Terminal 1: Backend API (Port 5000)
```bash
npm run server
```

### Terminal 2: Frontend Client (Port 5173)
```bash
npm run client
```

---

## 🔒 3. Admin CMS Dashboard

Access the admin dashboard at:
👉 **`http://localhost:5173/admin`** (or click **"🔒 Admin CMS"** in the footer)

* **Default Password**: `admin123` (change anytime in `backend/.env`)
* **Features**:
  * 📬 **Messages Inbox**: View all contact messages with sender details, date, and delete options.
  * 💼 **Projects Manager**: Add new projects with demo/repo links and outcomes — instantly reflected on the live website.
  * 🛠️ **Skills Manager**: Add and delete skills across Frontend, Backend, Database, and Languages — instantly reflected on the live website.
