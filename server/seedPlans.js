import 'dotenv/config.js';
import mongoose from 'mongoose';
import Plan from './models/Plan.js';

const DEFAULT_PLANS = [
  {
    name: 'Free',
    slug: 'free',
    description: 'Forever free — limited access',
    price: 0,
    currency: 'INR',
    billingCycle: 'monthly',
    billingDays: 30,
    features: ['Trailer access only', 'Limited browsing', 'No downloads', 'Ads supported'],
    maxDevices: 1,
    streamingQuality: 'SD',
    isActive: true,
    isPopular: false,
    badge: '',
    sortOrder: 0,
    trialDays: 0,
  },
  {
    name: 'Weekly',
    slug: 'weekly',
    description: 'Perfect for trying out',
    price: 99,
    currency: 'INR',
    billingCycle: 'weekly',
    billingDays: 7,
    features: ['7-day free trial', 'Full HD streaming', '1 screen at a time', 'Full episode library', 'Mobile access'],
    maxDevices: 1,
    streamingQuality: 'Full HD',
    isActive: true,
    isPopular: false,
    badge: 'Try Free',
    sortOrder: 1,
    trialDays: 7,
  },
  {
    name: 'Monthly',
    slug: 'monthly',
    description: 'Most popular choice',
    price: 199,
    currency: 'INR',
    billingCycle: 'monthly',
    billingDays: 30,
    features: ['7-day free trial', 'Full HD + 4K', '2 screens simultaneously', 'Full episode library', 'Downloads (5/month)', 'No ads'],
    maxDevices: 2,
    streamingQuality: '4K',
    isActive: true,
    isPopular: true,
    badge: 'Most Popular',
    sortOrder: 2,
    trialDays: 7,
  },
  {
    name: 'Yearly',
    slug: 'yearly',
    description: 'Best value for money',
    price: 1999,
    currency: 'INR',
    billingCycle: 'yearly',
    billingDays: 365,
    features: ['7-day free trial', '4K + HDR streaming', '4 screens simultaneously', 'Full episode library', 'Unlimited downloads', 'No ads', 'Early access to new shows', 'Priority support'],
    maxDevices: 4,
    streamingQuality: '4K',
    isActive: true,
    isPopular: false,
    badge: 'Best Value',
    sortOrder: 3,
    trialDays: 7,
  },
];

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