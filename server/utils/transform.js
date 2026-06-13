/**
 * Transform helpers — map DB field names to frontend-expected field names.
 * DB schema stays unchanged; only the API response shape changes.
 * This ensures frontend NEVER breaks when DB changes.
 */

/**
 * Format seconds → "52m" or "1h 23m"
 * Frontend expects duration as string like "52m"
 */
const formatDuration = (seconds) => {
  if (!seconds) return '45m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m === 0) return '45m';
  return `${m}m`;
};

/**
 * Series (Show) transform
 * Frontend expects: id, title, description, genre, rating, year, seasons, banner, poster, premium, tag
 * DB stores:       _id, title, description, genre, rating, releaseYear, totalEpisodes, banner, thumbnail, premium, tag
 */
const transformSeries = (doc) => {
  const s = doc.toObject ? doc.toObject() : { ...doc };
  const poster = s.poster || s.thumbnail || '';
  return {
    id: s._id,
    _id: s._id,
    title: s.title,
    description: s.description,
    genre: s.genre || [],
    tags: s.tags || [],
    rating: s.rating || 0,
    year: s.releaseYear || s.year || null,
    seasons: s.seasons || 1,
    banner: s.banner || poster,
    poster,
    thumbnail: poster,
    logoUrl: s.logoUrl || '',
    trailerUrl: s.trailerUrl || '',
    premium: s.premium || false,
    tag: s.tag || '',
    status: s.status,
    releaseYear: s.releaseYear || s.year || null,
    views: s.views,
    isPublished: s.isPublished,
    director: s.director,
    cast: s.cast,
    categories: s.categories,
    contentType: s.contentType || 'series',
    createdAt: s.createdAt,
  };
};

/**
 * Episode transform
 * Frontend expects: id, showId, title, duration ("52m"), thumb, desc, premium, episodeNumber, season, videoUrl
 * DB stores:       _id, series (ObjectId), title, video.duration (seconds), thumbnail, description, premium, episodeNumber, season, video.url
 */
const transformEpisode = (doc) => {
  const e = doc.toObject ? doc.toObject() : { ...doc };
  return {
    id: e._id,
    _id: e._id,
    showId: e.series?._id || e.series,
    title: e.title,
    duration: formatDuration(e.video?.duration),
    durationSeconds: e.video?.duration,
    durationMinutes: e.durationMinutes || Math.round((e.video?.duration || 0) / 60) || 0,
    thumb: e.thumbnail || '',
    thumbnail: e.thumbnail || '',
    desc: e.description || '',
    description: e.description || '',
    premium: e.premium || false,
    episodeNumber: e.episodeNumber,
    season: e.seasonNumber || 1,
    videoUrl: e.video?.url || '/John_Wick.mp4',
    previewVideoUrl: e.previewVideoUrl || '',
    status: e.status || 'draft',
    order: e.order,
    views: e.views,
    isPublished: e.isPublished,
    releaseDate: e.releaseDate,
  };
};

const transformMovie = (doc) => {
  const m = doc.toObject ? doc.toObject() : { ...doc };
  const poster = m.poster || m.thumbnail || '';
  return {
    id: m._id,
    _id: m._id,
    title: m.title,
    description: m.description || '',
    poster,
    thumbnail: poster,
    banner: m.banner || poster,
    videoUrl: m.video?.url || '/John_Wick.mp4',
    trailerUrl: m.trailerUrl || '',
    status: m.status || 'draft',
    releaseYear: m.releaseYear || null,
    year: m.releaseYear || null,
    durationMinutes: m.durationMinutes || 0,
    rating: m.rating || '',
    genre: m.genre || [],
    tags: m.tags || [],
    director: m.director || '',
    premium: m.premium || m.isPremium || false,
    isPublished: m.isPublished,
    views: m.views,
    contentType: 'movie',
    createdAt: m.createdAt,
  };
};

/**
 * User transform
 * Frontend expects: id, name, email, plan, role, since, avatar, continueWatching[]
 * DB stores:       _id, name, email, subscription.status, role, createdAt, profile.avatar, watchHistory[]
 */
const transformUser = (doc) => {
  const u = doc.toObject ? doc.toObject() : { ...doc };

  const continueWatching = (u.watchHistory || []).map(h => ({
    showId: h.series?._id || h.series,
    episode: h.episode?._id || h.episode,
    progress: h.progress || 0,
    watchedAt: h.watchedAt,
  }));

  // Format "since" as "Month Year" (e.g. "March 2024")
  const since = u.createdAt
    ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  return {
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role || 'user',
    plan: u.subscription?.status || 'Basic',
    subscription: u.subscription,
    avatar: u.profile?.avatar || `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(u.name || 'user')}`,
    profile: u.profile,
    since,
    continueWatching,
    parentalControls: u.parentalControls || false,
    watchlist: u.watchlist || [],
    isActive: u.isActive,
  };
};

export { transformSeries, transformEpisode, transformMovie, transformUser, formatDuration };
