import express from 'express';
import mongoose from 'mongoose';
import Project from '../models/Project.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// GET /api/projects - Get all projects (Public)
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const projects = await Project.find().sort({ order: 1, createdAt: 1 });
      return res.json({ success: true, count: projects.length, data: projects });
    } else {
      return res.json({ success: true, count: 0, data: [] });
    }
  } catch (error) {
    console.error('Fetch projects error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching projects' });
  }
});

// POST /api/projects - Add new project (Admin protected)
router.post('/', auth, async (req, res) => {
  try {
    const { title, type, stack, year, outcome, summary, demoUrl, repoUrl, num, order } = req.body;
    const projectSummary = (outcome || summary || '').trim();

    if (!title || !projectSummary) {
      return res.status(400).json({ success: false, message: 'Title and 1-line project summary are required.' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'MongoDB not connected. Please configure MONGO_URI in .env' });
    }

    // Auto-calculate num if not provided
    const count = await Project.countDocuments();
    const formattedNum = num || String(count + 1).padStart(2, '0');

    const project = await Project.create({
      num: formattedNum,
      title: title.trim(),
      type: type || 'Web Application',
      stack: stack || 'React.js · JavaScript',
      year: year || new Date().getFullYear().toString(),
      outcome: projectSummary,
      demoUrl: demoUrl || '',
      repoUrl: repoUrl || '',
      order: order !== undefined ? order : count + 1
    });

    return res.status(201).json({ success: true, message: 'Project added successfully!', data: project });
  } catch (error) {
    console.error('Create project error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error creating project' });
  }
});

// PUT /api/projects/:id - Update project (Admin protected)
router.put('/:id', auth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'MongoDB not connected.' });
    }

    const updateData = { ...req.body };
    if (updateData.summary && !updateData.outcome) {
      updateData.outcome = updateData.summary;
    }

    const project = await Project.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    return res.json({ success: true, message: 'Project updated successfully!', data: project });
  } catch (error) {
    console.error('Update project error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error updating project' });
  }
});

// DELETE /api/projects/:id - Delete project (Admin protected)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'MongoDB not connected.' });
    }

    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    return res.json({ success: true, message: 'Project deleted successfully!' });
  } catch (error) {
    console.error('Delete project error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error deleting project' });
  }
});

export default router;

