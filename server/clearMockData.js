import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import Series from './models/Series.js';
import Episode from './models/Episode.js';

async function clearDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/streamvault';
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected.\n');

  console.log('Clearing existing series and episodes...');
  await Episode.deleteMany({});
  await Series.deleteMany({});

  console.log('\n========================================');
  console.log('Mock content data cleared! Categories and Users were preserved.');
  console.log('========================================\n');

  await mongoose.connection.close();
  process.exit(0);
}

clearDB().catch((err) => {
  console.error('Clear failed:', err);
  process.exit(1);
});
