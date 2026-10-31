import express from 'express';
import mongoose from 'mongoose';
import Project from '../models/Project.js';
import { defaultProjects } from '../config/seedData.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// GET /api/projects - Get all projects (Public)
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      let projects = await Project.find().sort({ order: 1, createdAt: 1 });

      // If database has no projects yet, seed initial default projects
      if (projects.length === 0) {
        projects = await Project.insertMany(defaultProjects);
      }

      return res.json({ success: true, count: projects.length, data: projects });
    } else {
      // Return default data if DB is pending connection
      return res.json({ success: true, count: defaultProjects.length, data: defaultProjects });
    }
  } catch (error) {
    console.error('Fetch projects error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching projects' });
  }
});

// POST /api/projects - Add new project (Admin protected)
router.post('/', auth, async (req, res) => {
  try {
    const { title, type, stack, year, outcome, demoUrl, repoUrl, num, order } = req.body;

    if (!title || !outcome) {
      return res.status(400).json({ success: false, message: 'Title and measurable outcome are required.' });
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
      outcome: outcome.trim(),
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

    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
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

