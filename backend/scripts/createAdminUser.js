const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const email = process.argv[2] || 'contact@matchmyschool.com';
const password = process.argv[3] || 'MatchMySchool2024!';

async function createAdmin() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/visa_requirements';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB...');

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`User ${email} already exists. Updating to admin...`);
      existingUser.role = 'admin';
      await existingUser.save();
      console.log('User updated successfully.');
    } else {
      console.log(`Creating new admin user: ${email}`);
      const admin = new User({
        email,
        password,
        role: 'admin',
        firstName: 'Admin',
        lastName: 'MMS'
      });
      await admin.save();
      console.log('Admin user created successfully.');
      console.log(`Credentials:\nEmail: ${email}\nPassword: ${password}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();
