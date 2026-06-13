import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import Series from './models/Series.js';
import Episode from './models/Episode.js';
import User from './models/User.js';
import Category from './models/Category.js';
import Season from './models/Season.js';

async function seedDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/streamvault';
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected.\n');

  console.log('Seeding mock users for analytics...');
  const now = new Date();
  
  // Seed 10 users with random join dates over the last 12 months and different plans
  const plans = ['Basic', 'Premium', 'Premium', 'Premium', 'Basic', 'Basic', 'Premium', 'Premium', 'Basic', 'Premium'];
  
  for (let i = 0; i < 10; i++) {
    const randomMonthOffset = Math.floor(Math.random() * 12);
    const joinDate = new Date(now.getFullYear(), now.getMonth() - randomMonthOffset, 15);
    
    await User.create({
      name: `Test User ${i}`,
      email: `testuser${i}_${Date.now()}@example.com`,
      password: 'password123',
      role: 'user',
      subscription: {
        status: plans[i]
      },
      createdAt: joinDate
    });
  }

  console.log('Seeding mock series for analytics...');
  const seriesData = [
    { title: 'The Great Awakening', views: 45000, rating: 8.5 },
    { title: 'Cybernetic Echoes', views: 12500, rating: 9.1 },
    { title: 'Lost in the Abyss', views: 3400, rating: 7.2 },
    { title: 'Neon Dreams', views: 89000, rating: 9.5 },
    { title: 'Shattered Skies', views: 500, rating: 6.8 }
  ];

  const cat = await Category.findOne({}); // Just grab any category for reference

  for (const s of seriesData) {
    const series = await Series.create({
      title: s.title,
      description: 'A fantastic mock series to populate your analytics dashboard.',
      thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80',
      banner: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=1920&q=80',
      genre: ['Sci-Fi', 'Action'],
      releaseYear: 2024,
      rating: s.rating,
      seasons: 1,
      premium: false,
      tag: 'New',
      status: 'ongoing',
      categories: cat ? [cat.slug] : [],
      views: s.views,
      isPublished: true,
      totalEpisodes: 1
    });

    const seasonDoc = await Season.create({
      series: series._id,
      title: 'Season 1',
      description: `First season of ${series.title}`,
      order: 1,
      status: 'published',
    });

    await Episode.create({
      series: series._id,
      episodeNumber: 1,
      season: seasonDoc._id,
      seasonNumber: 1,
      title: 'Pilot',
      description: 'The beginning of everything.',
      video: {
        url: '/John_Wick.mp4',
        duration: 1200
      },
      isPublished: true
    });
  }

  console.log('\n========================================');
  console.log('Successfully seeded analytics data!');
  console.log('========================================\n');

  await mongoose.connection.close();
  process.exit(0);
}

seedDB().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
