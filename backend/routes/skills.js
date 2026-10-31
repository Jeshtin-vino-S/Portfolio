import express from 'express';
import mongoose from 'mongoose';
import Skill from '../models/Skill.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// GET /api/skills - Get all skills (Public)
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const skills = await Skill.find().sort({ order: 1, createdAt: 1 });
      return res.json({ success: true, count: skills.length, data: skills });
    } else {
      return res.json({ success: true, count: 0, data: [] });
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

// PUT /api/skills/:id - Update skill (Admin protected)
router.put('/:id', auth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'MongoDB not connected.' });
    }

    const { category, name, level, order } = req.body;
    const updateData = {};
    if (category) updateData.category = category;
    if (name) updateData.name = name.trim();
    if (level !== undefined) updateData.level = level.trim();
    if (order !== undefined) updateData.order = order;

    const skill = await Skill.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!skill) {
      return res.status(404).json({ success: false, message: 'Skill not found.' });
    }

    return res.json({ success: true, message: 'Skill updated successfully!', data: skill });
  } catch (error) {
    console.error('Update skill error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error updating skill' });
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

