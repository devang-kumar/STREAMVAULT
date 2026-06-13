import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/streamvault';
    console.log('Connecting to:', mongoUri);

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const adminEmail = 'admin@example.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('⚠️ Admin user already exists');
      process.exit(0);
    }

    const adminUser = new User({
      name: 'Admin User',
      email: adminEmail,
      password: 'admin123',
      role: 'admin',
      subscription: { status: 'Premium' }
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();