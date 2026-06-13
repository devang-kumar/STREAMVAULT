// ── Mock data — replace with API calls later ──

// Poster images from TMDB-style landscape/portrait via picsum
export const SHOWS = [
  {
    id: 1,
    title: 'Dark Horizons',
    description: 'A billionaire tech mogul vanishes, leaving behind a trail of encrypted messages that could topple governments. One journalist dares to follow the signal.',
    genre: ['Thriller', 'Sci-Fi'],
    rating: 9.1,
    year: 2024,
    seasons: 2,
    banner: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1400&q=80',
    poster: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&q=80',
    premium: false,
    tag: 'Top Pick',
  },
  {
    id: 2,
    title: 'Neon Requiem',
    description: 'In a city that never sleeps, a retired assassin is pulled back by a ghost from her past. Stylish, violent, and deeply human.',
    genre: ['Action', 'Crime'],
    rating: 8.7,
    year: 2024,
    seasons: 1,
    banner: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1400&q=80',
    poster: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=400&q=80',
    premium: true,
    tag: 'New',
  },
  {
    id: 3,
    title: 'The Quiet Algorithm',
    description: 'An AI gains emotional awareness and must navigate a world that fears what it has become. Deeply philosophical and visually stunning.',
    genre: ['Sci-Fi', 'Drama'],
    rating: 8.9,
    year: 2023,
    seasons: 3,
    banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1400&q=80',
    poster: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80',
    premium: false,
    tag: 'Recommended',
  },
  {
    id: 4,
    title: 'Saltwater Empire',
    description: 'Three fishing dynasties clash over a dying sea. A saga of greed, love, and survival set against breathtaking coastal vistas.',
    genre: ['Drama', 'Family'],
    rating: 8.3,
    year: 2024,
    seasons: 2,
    banner: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1400&q=80',
    poster: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400&q=80',
    premium: false,
    tag: 'Top Pick',
  },
  {
    id: 5,
    title: 'Void Protocol',
    description: 'Earth receives a signal. The response could save humanity — or end it. Six scientists. 72 hours. One impossible decision.',
    genre: ['Sci-Fi', 'Thriller'],
    rating: 9.3,
    year: 2025,
    seasons: 1,
    banner: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1400&q=80',
    poster: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&q=80',
    premium: true,
    tag: 'Upcoming',
  },
  {
    id: 6,
    title: 'Crimson Street',
    description: 'A detective with a haunted past investigates murders that mirror crimes from 30 years ago. Someone is rewriting history.',
    genre: ['Crime', 'Mystery'],
    rating: 8.5,
    year: 2023,
    seasons: 4,
    banner: 'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=1400&q=80',
    poster: 'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=400&q=80',
    premium: false,
    tag: 'Recommended',
  },
  {
    id: 7,
    title: 'Fractured Sky',
    description: 'After a solar event cracks reality, a small town becomes the epicenter of impossible phenomena. Who can you trust when physics breaks?',
    genre: ['Sci-Fi', 'Horror'],
    rating: 8.1,
    year: 2025,
    seasons: 1,
    banner: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1400&q=80',
    poster: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&q=80',
    premium: true,
    tag: 'New',
  },
  {
    id: 8,
    title: 'The Last Archive',
    description: 'The world\'s last librarian guards humanity\'s entire knowledge in a post-collapse society. Knowledge is power. Power is dangerous.',
    genre: ['Drama', 'Post-Apocalyptic'],
    rating: 8.8,
    year: 2024,
    seasons: 2,
    banner: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1400&q=80',
    poster: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    premium: false,
    tag: 'Top Pick',
  },
];

// Episodes for a show (shared mock structure)
export const EPISODES = [
  { id: 1, title: 'Signal Zero', duration: '52m', thumb: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&q=60', desc: 'The signal is first detected. No one believes it.', premium: false, watched: true, videoUrl: '/John_Wick.mp4' },
  { id: 2, title: 'The Descent', duration: '48m', thumb: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&q=60', desc: 'Our hero follows the breadcrumbs underground.', premium: false, watched: true, videoUrl: '/John_Wick.mp4' },
  { id: 3, title: 'Red Room', duration: '55m', thumb: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300&q=60', desc: 'A hidden facility. A darker truth emerges.', premium: false, watched: false, videoUrl: '/John_Wick.mp4' },
  { id: 4, title: 'Fracture Point', duration: '61m', thumb: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=300&q=60', desc: 'Loyalties are tested. Someone betrays the team.', premium: true, watched: false, videoUrl: '/John_Wick.mp4' },
  { id: 5, title: 'Cascade', duration: '58m', thumb: 'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=300&q=60', desc: 'Everything accelerates toward the point of no return.', premium: true, watched: false, videoUrl: '/John_Wick.mp4' },
  { id: 6, title: 'Final Protocol', duration: '72m', thumb: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=300&q=60', desc: 'The season finale. Nothing will ever be the same.', premium: true, watched: false, videoUrl: '/John_Wick.mp4' },
];

// Categories for nav & admin
export const CATEGORIES = ['Action', 'Crime', 'Drama', 'Sci-Fi', 'Thriller', 'Horror', 'Mystery', 'Romance', 'Comedy', 'Documentary'];

// Row definitions — which shows appear in which section
export const ROWS = [
  { title: 'Top Picks', shows: [1, 4, 8, 6, 2] },
  { title: 'Recommended For You', shows: [3, 6, 1, 7, 5] },
  { title: 'New Releases', shows: [2, 7, 5, 1, 3] },
  { title: 'Upcoming', shows: [5, 7, 2, 4, 8] },
];

// Admin dashboard stats
export const STATS = [
  { label: 'Total Users', value: '142,891', change: '+12%' },
  { label: 'Active Subscriptions', value: '98,204', change: '+8%' },
  { label: 'Revenue (MRR)', value: '$412,300', change: '+21%' },
  { label: 'Content Library', value: '1,847', change: '+34' },
];

// Subscription plans
export const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: { monthly: 9, yearly: 89 },
    features: ['HD Streaming', '1 Screen', 'Limited Library', 'Mobile Access'],
    highlight: false,
  },
  {
    id: 'standard',
    name: 'Standard',
    price: { monthly: 15, yearly: 149 },
    features: ['Full HD + 4K', '2 Screens', 'Full Library', 'Downloads', 'No Ads'],
    highlight: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: { monthly: 22, yearly: 219 },
    features: ['4K + HDR', '4 Screens', 'Full Library', 'Downloads', 'No Ads', 'Early Access', 'Priority Support'],
    highlight: false,
  },
];

// Mock user profile
export const USER = {
  name: 'Alex Rivera',
  email: 'alex@example.com',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80',
  plan: 'Standard',
  since: 'March 2023',
  continueWatching: [
    { showId: 1, episode: 3, progress: 65 },
    { showId: 4, episode: 1, progress: 30 },
    { showId: 6, episode: 7, progress: 88 },
  ],
};

// Helper: find show by id
export const getShow = (id) => SHOWS.find(s => s.id === Number(id));

// Helper: get shows for a row
export const getRowShows = (ids) => ids.map(id => SHOWS.find(s => s.id === id)).filter(Boolean);
