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
  return {
    id: s._id,
    title: s.title,
    description: s.description,
    genre: s.genre || [],
    rating: s.rating || 0,
    year: s.releaseYear || s.year || null,
    seasons: s.seasons || 1,
    banner: s.banner || s.thumbnail || '',
    poster: s.thumbnail || '',
    premium: s.premium || false,
    tag: s.tag || '',
    status: s.status,
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
    showId: e.series?._id || e.series,
    title: e.title,
    duration: formatDuration(e.video?.duration),
    durationSeconds: e.video?.duration,
    thumb: e.thumbnail || '',
    desc: e.description || '',
    description: e.description || '',
    premium: e.premium || false,
    episodeNumber: e.episodeNumber,
    season: e.season || 1,
    videoUrl: e.video?.url || '/John_Wick.mp4',
    views: e.views,
    isPublished: e.isPublished,
    releaseDate: e.releaseDate,
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

export { transformSeries, transformEpisode, transformUser, formatDuration };
