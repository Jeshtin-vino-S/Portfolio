import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    num: {
      type: String,
      default: '01'
    },
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true
    },
    type: {
      type: String,
      required: [true, 'Project type is required'],
      default: 'Web Application'
    },
    stack: {
      type: String,
      required: [true, 'Stack is required']
    },
    year: {
      type: String,
      default: new Date().getFullYear().toString()
    },
    outcome: {
      type: String,
      required: [true, 'Measurable outcome is required']
    },
    demoUrl: {
      type: String,
      default: ''
    },
    repoUrl: {
      type: String,
      default: ''
    },
    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const Project = mongoose.model('Project', projectSchema);

export default Project;

