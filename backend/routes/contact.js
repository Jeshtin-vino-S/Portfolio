import express from 'express';
import mongoose from 'mongoose';
import Message from '../models/Message.js';

const router = express.Router();

// POST /api/contact - Submit a contact message (Public)
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are all required.'
      });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address format.'
      });
    }

    // If MongoDB is connected, save into collection
    if (mongoose.connection.readyState === 1) {
      const newMessage = await Message.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        message: message.trim()
      });

      return res.status(201).json({
        success: true,
        message: 'Your message has been sent and saved successfully!',
        data: newMessage
      });
    } else {
      // Fallback for before Mongo Atlas URI is added
      console.log('📬 Contact Message Received (DB offline/pending):', { name, email, message });
      return res.status(201).json({
        success: true,
        message: 'Your message has been received! (Connect MongoDB Atlas in .env to persist)',
        data: { name, email, message, createdAt: new Date() }
      });
    }
  } catch (error) {
    console.error('Contact submit error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while sending message. Please try again later.'
    });
  }
});

export default router;

