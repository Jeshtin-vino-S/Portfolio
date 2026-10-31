import Admin from '../models/Admin.js';

export const initAdminUser = async () => {
  try {
    const count = await Admin.countDocuments();
    if (count === 0) {
      // Create initial Admin in MongoDB Atlas with secure hashed password
      const initialAdmin = new Admin({
        username: 'admin',
        email: 'jestinvino824@gmail.com',
        password: 'Jeshtin@03'
      });
      await initialAdmin.save();
      console.log('👑 Initial Admin user created in MongoDB Atlas (username: admin)');
    }
  } catch (error) {
    console.error('Admin initialization error:', error.message);
  }
};

