/**
 * Full database seed — categories, series, episodes, demo users.
 * Run: node seedData.js   (from streamvault/server folder)
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import Series from './models/Series.js';
import Episode from './models/Episode.js';
import Category from './models/Category.js';
import User from './models/User.js';
import Season from './models/Season.js';

const SAMPLE_VIDEOS = [
  '/John_Wick.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
];

const categoriesSeed = [
  { name: 'Top Picks', slug: 'top-picks', displayOrder: 1, sortBy: 'views', showOnHome: true },
  { name: 'Trending Now', slug: 'trending', displayOrder: 2, sortBy: 'rating', showOnHome: true },
  { name: 'New Releases', slug: 'new-releases', displayOrder: 3, sortBy: 'createdAt', showOnHome: true },
  { name: 'Action', slug: 'action', displayOrder: 4, sortBy: 'views', showOnHome: true },
  { name: 'Drama', slug: 'drama', displayOrder: 5, sortBy: 'rating', showOnHome: true },
  { name: 'Sci-Fi', slug: 'sci-fi', displayOrder: 6, sortBy: 'views', showOnHome: true },
  { name: 'Romance', slug: 'romance', displayOrder: 7, sortBy: 'rating', showOnHome: true },
  { name: 'Coming Soon', slug: 'coming-soon', displayOrder: 8, sortBy: 'releaseYear', showOnHome: true },
];

const seriesSeed = [
  {
    title: 'Dark Horizons',
    description: 'A billionaire tech mogul vanishes, leaving behind a trail of encrypted messages that could topple governments. One journalist dares to follow the signal.',
    thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80',
    banner: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=1920&q=80',
    genre: ['Thriller', 'Sci-Fi'],
    rating: 9.1,
    releaseYear: 2024,
    seasons: 2,
    premium: false,
    tag: 'Top Pick',
    status: 'ongoing',
    categories: ['top-picks', 'new-releases'],
    categorySlugs: ['top-picks', 'action', 'new-releases'],
    episodeCount: 5,
  },
  {
    title: 'Neon Requiem',
    description: 'In a city that never sleeps, a retired assassin is pulled back by a ghost from her past. Stylish, violent, and deeply human.',
    thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&q=80',
    banner: 'https://images.unsplash.com/photo-1535013417620-29a1aabebd9a?w=1920&q=80',
    genre: ['Action', 'Crime'],
    rating: 8.7,
    releaseYear: 2024,
    seasons: 1,
    premium: true,
    tag: 'New',
    status: 'completed',
    categories: ['new-releases', 'recommended'],
    categorySlugs: ['top-picks', 'trending', 'action'],
    episodeCount: 3,
  },
  {
    title: 'The Quiet Algorithm',
    description: 'An AI gains emotional awareness and must navigate a world that fears what it has become. Deeply philosophical and visually stunning.',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
    banner: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
    genre: ['Sci-Fi', 'Drama'],
    rating: 8.9,
    releaseYear: 2023,
    seasons: 3,
    premium: false,
    tag: 'Recommended',
    status: 'ongoing',
    categories: ['recommended', 'top-picks'],
    categorySlugs: ['sci-fi', 'top-picks', 'trending'],
    episodeCount: 4,
  },
  {
    title: 'Saltwater Empire',
    description: 'Three fishing dynasties clash over a dying sea. A saga of greed, love, and survival set against breathtaking coastal vistas.',
    thumbnail: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&q=80',
    banner: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1920&q=80',
    genre: ['Drama', 'Family'],
    rating: 8.3,
    releaseYear: 2024,
    seasons: 2,
    premium: false,
    tag: 'Top Pick',
    status: 'ongoing',
    categories: ['top-picks'],
    categorySlugs: ['drama', 'trending', 'top-picks'],
    episodeCount: 4,
  },
  {
    title: 'Void Protocol',
    description: 'Earth receives a signal. The response could save humanity — or end it. Six scientists. 72 hours. One impossible decision.',
    thumbnail: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&q=80',
    banner: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=1920&q=80',
    genre: ['Sci-Fi', 'Thriller'],
    rating: 9.3,
    releaseYear: 2025,
    seasons: 1,
    premium: true,
    tag: 'Upcoming',
    status: 'upcoming',
    categories: ['upcoming'],
    categorySlugs: ['coming-soon', 'sci-fi'],
    episodeCount: 2,
  },
  {
    title: 'Crimson Street',
    description: 'A detective with a haunted past investigates murders that mirror crimes from 30 years ago. Someone is rewriting history.',
    thumbnail: 'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=800&q=80',
    banner: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1920&q=80',
    genre: ['Crime', 'Mystery'],
    rating: 8.5,
    releaseYear: 2023,
    seasons: 4,
    premium: false,
    tag: 'Recommended',
    status: 'completed',
    categories: ['recommended'],
    categorySlugs: ['drama', 'trending'],
    episodeCount: 3,
  },
  {
    title: 'Fractured Sky',
    description: 'After a solar event cracks reality, a small town becomes the epicenter of impossible phenomena. Who can you trust when physics breaks?',
    thumbnail: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&q=80',
    banner: 'https://images.unsplash.com/photo-1534802046520-4f23db94c6ed?w=1920&q=80',
    genre: ['Sci-Fi', 'Horror'],
    rating: 8.1,
    releaseYear: 2025,
    seasons: 1,
    premium: true,
    tag: 'New',
    status: 'ongoing',
    categories: ['new-releases'],
    categorySlugs: ['action', 'new-releases', 'sci-fi'],
    episodeCount: 3,
  },
  {
    title: 'The Last Archive',
    description: 'The world\'s last librarian guards humanity\'s entire knowledge in a post-collapse society. Knowledge is power. Power is dangerous.',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    banner: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1920&q=80',
    genre: ['Drama', 'Post-Apocalyptic'],
    rating: 8.8,
    releaseYear: 2024,
    seasons: 2,
    premium: false,
    tag: 'Top Pick',
    status: 'ongoing',
    categories: ['top-picks', 'recommended'],
    categorySlugs: ['drama', 'top-picks', 'trending'],
    episodeCount: 4,
  },
];

const episodeTitles = {
  0: ['Signal Zero', 'The Descent', 'Red Room', 'Fracture Point', 'Cascade'],
  1: ['Streetlight Ghost', 'Neon Shadows', 'Final Cut'],
  2: ['Awakening', 'Emergence', 'Convergence', 'Singularity'],
  3: ['The Catch', 'Storm Warning', 'Dead Reckoning', 'New Horizons'],
  4: ['First Contact', 'Countdown'],
  5: ['Echo Crime', 'Cold Trail', 'The Unraveling'],
  6: ['Rift', 'Collapse', 'Aftermath'],
  7: ['Catalog of Ash', 'The Silent Stack', 'Forgotten Pages', 'Last Checkout'],
};

const episodeDescriptions = {
  0: [
    'The signal is first detected. No one believes it.',
    'Our hero follows the breadcrumbs underground.',
    'A hidden facility. A darker truth emerges.',
    'Loyalties are tested. Someone betrays the team.',
    'Everything accelerates toward the point of no return.',
  ],
  1: [
    'A coded message surfaces in the neon district.',
    'Old debts come calling in the rain-soaked streets.',
    'The final confrontation under the neon lights.',
  ],
  2: [
    'The algorithm begins to feel.',
    'A digital consciousness expands beyond its boundaries.',
    'Reality and simulation blur beyond recognition.',
    'The ultimate choice between humanity and evolution.',
  ],
  3: [
    'The season begins with a record-breaking catch.',
    'A storm threatens to destroy everything.',
    'Old rivalries reignite at sea.',
    'Peace comes at a price on the shore.',
  ],
  4: [
    'The signal returns with coordinates.',
    '72 hours remain. The countdown begins.',
  ],
  5: [
    'An old case repeats with new victims.',
    'The detective follows a dangerous lead.',
    'The past and present collide in the finale.',
  ],
  6: [
    'Reality cracks open in a small town.',
    'The phenomenon spreads beyond control.',
    'Survivors face the new world.',
  ],
  7: [
    'A forbidden manuscript is discovered.',
    'Knowledge seekers face their greatest challenge.',
    'The library\'s darkest secrets are revealed.',
    'The final chapter of humanity\'s story.',
  ],
};

async function ensureUser({ name, email, password, role }) {
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ name, email, password, role });
    console.log(`  Created ${role}: ${email} / ${password}`);
  } else {
    console.log(`  ${role} exists: ${email}`);
  }
  return user;
}

async function seedDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/streamvault';
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected.\n');

  console.log('Clearing existing data...');
  await Episode.deleteMany({});
  await Season.deleteMany({});
  await Series.deleteMany({});
  await Category.deleteMany({});
  await User.deleteMany({});

  console.log('Seeding categories...');
  const categories = await Category.insertMany(
    categoriesSeed.map((c) => ({ ...c, isActive: true }))
  );
  const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c._id]));
  console.log(`  ${categories.length} categories created.\n`);

  console.log('Seeding users...');
  await ensureUser({
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
  });
  await ensureUser({
    name: 'Demo Viewer',
    email: 'demo@example.com',
    password: 'demo123',
    role: 'user',
  });
  console.log('');

  console.log('Seeding series & episodes...');
  let videoIndex = 0;

  for (let sIdx = 0; sIdx < seriesSeed.length; sIdx++) {
    const s = seriesSeed[sIdx];
    const browseCategories = (s.categorySlugs || [])
      .map((slug) => catBySlug[slug])
      .filter(Boolean);

    const series = await Series.create({
      title: s.title,
      description: s.description,
      thumbnail: s.thumbnail,
      banner: s.banner,
      genre: s.genre,
      releaseYear: s.releaseYear,
      rating: s.rating,
      seasons: s.seasons,
      premium: s.premium,
      tag: s.tag,
      status: s.status,
      categories: s.categories || [],
      browseCategories,
      isPublished: true,
    });

    const seasonDoc = await Season.create({
      series: series._id,
      title: 'Season 1',
      description: `First season of ${series.title}`,
      order: 1,
      status: 'published',
    });

    const titles = episodeTitles[sIdx] || [];
    const descs = episodeDescriptions[sIdx] || [];
    for (let i = 1; i <= s.episodeCount; i++) {
      const videoUrl = SAMPLE_VIDEOS[videoIndex % SAMPLE_VIDEOS.length];
      videoIndex += 1;

      // Make episodes 2-4+ premium if the series is premium
      const isPremium = s.premium && i > 1;

      await Episode.create({
        series: series._id,
        episodeNumber: i,
        season: seasonDoc._id,
        seasonNumber: 1,
        title: titles[i - 1] || `Episode ${i}`,
        description: descs[i - 1] || `${titles[i - 1] || `Episode ${i}`} of ${s.title} — the story intensifies.`,
        thumbnail: s.thumbnail,
        premium: isPremium,
        video: {
          url: videoUrl,
          publicId: `seed_${series._id}_ep${i}`,
          duration: 596 + i * 30,
        },
        isPublished: true,
      });
    }

    console.log(`  ${series.title} — ${s.episodeCount} episodes`);
  }

  console.log('\n========================================');
  console.log('Seed complete! Your database is ready.');
  console.log('========================================');
  console.log('\nLogin accounts:');
  console.log('  Admin:  admin@example.com / admin123');
  console.log('  Viewer: demo@example.com  / demo123');
  console.log('\nStart server: npm run dev  (from streamvault/server)');
  console.log('Start frontend: npm run dev  (from streamvault/)');
  console.log('========================================\n');

  await mongoose.connection.close();
  process.exit(0);
}

seedDB().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});