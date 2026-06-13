import 'dotenv/config.js';
import mongoose from 'mongoose';
import Plan from './models/Plan.js';
import { DEFAULT_PLANS } from './utils/ensurePlans.js';

async function seedPlans() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/streamvault';
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if plans already exist
    const existingCount = await Plan.countDocuments();
    if (existingCount > 0) {
      console.log(`ℹ️  ${existingCount} plan(s) already exist. Skipping seed.`);
      console.log('   Use the admin panel to manage plans.');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Insert default plans
    const result = await Plan.insertMany(DEFAULT_PLANS);
    console.log(`✅ Seeded ${result.length} default plans:`);
    result.forEach(p => {
      console.log(`   - ${p.name} (₹${p.price}/${p.billingCycle}) [${p.isActive ? 'Active' : 'Inactive'}]`);
    });

    await mongoose.disconnect();
    console.log('\n🎉 Plan seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding plans:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedPlans();