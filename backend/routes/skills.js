import express from 'express';
import mongoose from 'mongoose';
import Skill from '../models/Skill.js';
import { defaultSkills } from '../config/seedData.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// GET /api/skills - Get all skills (Public)
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      let skills = await Skill.find().sort({ order: 1, createdAt: 1 });

      // Seed if empty
      if (skills.length === 0) {
        skills = await Skill.insertMany(defaultSkills);
      }

      return res.json({ success: true, count: skills.length, data: skills });
    } else {
      return res.json({ success: true, count: defaultSkills.length, data: defaultSkills });
    }
  } catch (error) {
    console.error('Fetch skills error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching skills' });
  }
});

// POST /api/skills - Add new skill (Admin protected)
router.post('/', auth, async (req, res) => {
  try {
    const { category, name, level, order } = req.body;

    if (!category || !name) {
      return res.status(400).json({ success: false, message: 'Category and skill name are required.' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'MongoDB not connected. Please configure MONGO_URI in .env' });
    }

    const skill = await Skill.create({
      category,
      name: name.trim(),
      level: level ? level.trim() : 'Proficient',
      order: order || 0
    });

    return res.status(201).json({ success: true, message: 'Skill added successfully!', data: skill });
  } catch (error) {
    console.error('Create skill error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error creating skill' });
  }
});

// DELETE /api/skills/:id - Delete skill (Admin protected)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'MongoDB not connected.' });
    }

    const skill = await Skill.findByIdAndDelete(req.params.id);
    if (!skill) {
      return res.status(404).json({ success: false, message: 'Skill not found.' });
    }

    return res.json({ success: true, message: 'Skill deleted successfully!' });
  } catch (error) {
    console.error('Delete skill error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error deleting skill' });
  }
});

export default router;

