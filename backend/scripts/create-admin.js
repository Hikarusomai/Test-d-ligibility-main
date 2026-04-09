const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

const mongoURI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/visa_requirements';

async function createAdmin() {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB...');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'contact@matchmyschool.com' });
        if (existingAdmin) {
            console.log('✅ Admin user already exists!');
            console.log('Email: contact@matchmyschool.com');
            console.log('Role:', existingAdmin.role);
            process.exit(0);
        }

        // Create admin user
        const admin = new User({
            email: 'contact@matchmyschool.com',
            password: 'Admin@2026',
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin'
        });

        await admin.save();
        console.log('✅ Admin user created successfully!');
        console.log('');
        console.log('=========================================');
        console.log('📧 Admin Email: contact@matchmyschool.com');
        console.log('🔑 Admin Password: Admin@2026');
        console.log('🌐 Admin Dashboard: https://visa.leadops.website');
        console.log('=========================================');
        console.log('');
        console.log('⚠️  Please change the password after first login!');
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin:', error);
        process.exit(1);
    }
}

createAdmin();
