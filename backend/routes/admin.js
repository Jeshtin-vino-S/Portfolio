import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import Message from '../models/Message.js';
import Project from '../models/Project.js';
import Skill from '../models/Skill.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// POST /api/admin/login - Authenticate admin against MongoDB
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database not connected. Please ensure MongoDB Atlas is connected.'
      });
    }

    // Query admin user in database (by username, email, or find the admin document)
    let admin = null;
    if (username) {
      admin = await Admin.findOne({
        $or: [
          { username: username.trim().toLowerCase() },
          { email: username.trim().toLowerCase() }
        ]
      });
    } else {
      admin = await Admin.findOne();
    }

    // If no admin user exists in DB yet, create the default one
    if (!admin) {
      const count = await Admin.countDocuments();
      if (count === 0) {
        admin = new Admin({
          username: 'admin',
          email: 'jestinvino824@gmail.com',
          password: 'Jeshtin@03'
        });
        await admin.save();
      } else {
        return res.status(401).json({ success: false, message: 'Admin user not found' });
      }
    }

    // Verify password against hashed password in database
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    const secret = process.env.JWT_SECRET || 'portfolio_admin_jwt_secret_key_2026';
    const token = jwt.sign({ id: admin._id, username: admin.username, role: 'admin' }, secret, {
      expiresIn: '7d'
    });

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        username: admin.username,
        email: admin.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// PUT /api/admin/change-password - Change admin password in MongoDB (Protected)
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const admin = await Admin.findById(req.admin.id) || await Admin.findOne();
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin user not found in database' });
    }

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    // Set new password (pre-save hook will hash it)
    admin.password = newPassword;
    await admin.save();

    return res.json({ success: true, message: 'Password updated successfully in database!' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Error changing password' });
  }
});

// GET /api/admin/messages - Retrieve all messages (Protected)
router.get('/messages', auth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        success: true,
        count: 0,
        data: [],
        notice: 'MongoDB Atlas connection is not active yet.'
      });
    }

    const messages = await Message.find().sort({ createdAt: -1 });
    return res.json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    console.error('Fetch messages error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching messages' });
  }
});

// PATCH /api/admin/messages/:id/read - Mark message as read (Protected)
router.patch('/messages/:id/read', auth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'MongoDB not connected' });
    }

    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    return res.json({ success: true, data: message });
  } catch (error) {
    console.error('Mark read error:', error);
    return res.status(500).json({ success: false, message: 'Error updating message' });
  }
});

// DELETE /api/admin/messages/:id - Delete a message (Protected)
router.delete('/messages/:id', auth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'MongoDB not connected' });
    }

    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    return res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    return res.status(500).json({ success: false, message: 'Error deleting message' });
  }
});

// GET /api/admin/stats - Overview stats (Protected)
router.get('/stats', auth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        success: true,
        data: { messagesCount: 0, projectsCount: 4, skillsCount: 20, dbConnected: false }
      });
    }

    const [messagesCount, projectsCount, skillsCount] = await Promise.all([
      Message.countDocuments(),
      Project.countDocuments(),
      Skill.countDocuments()
    ]);

    return res.json({
      success: true,
      data: {
        messagesCount,
        projectsCount,
        skillsCount,
        dbConnected: true
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching stats' });
  }
});

export default router;
