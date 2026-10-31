import mongoose from 'mongoose';
import { initAdminUser } from './initAdmin.js';

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri || uri.includes('<username>')) {
    console.warn('⚠️  MONGO_URI is not set or has placeholder values. MongoDB Atlas not connected yet.');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, { dbName: 'portfolio' });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    // Ensure initial admin user exists in DB
    await initAdminUser();
    return true;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    return false;
  }
};

export default connectDB;
