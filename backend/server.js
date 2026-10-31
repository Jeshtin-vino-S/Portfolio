import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

import contactRoutes from './routes/contact.js';
import projectsRoutes from './routes/projects.js';
import skillsRoutes from './routes/skills.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDist = path.join(__dirname, '../frontend/dist');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// API Routes
app.use('/api/contact', contactRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/admin', adminRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static files if built
app.use(express.static(frontendDist));

// SPA Fallback: Route all non-API paths to React index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) {
      res.send('🚀 Jeshtin Vino Portfolio Backend API is running!');
    }
  });
});

// Start Server with Port Fallback
const server = app.listen(PORT, () => {
  console.log(`📡 Portfolio Backend server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const fallbackPort = Number(PORT) + 1;
    console.warn(`⚠️  Port ${PORT} in use, automatically switching to port ${fallbackPort}...`);
    app.listen(fallbackPort, () => {
      console.log(`📡 Portfolio Backend server running on http://localhost:${fallbackPort}`);
    });
  } else {
    console.error('Server error:', err);
  }
});
