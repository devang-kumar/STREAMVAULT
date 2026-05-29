import { Router } from 'express';
import Series from '../models/Series.js';
import Season from '../models/Season.js';
import Episode from '../models/Episode.js';
import Movie from '../models/Movie.js';
import Genre from '../models/Genre.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { upload, uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';
import { flushCache } from '../middleware/cache.js';
import { transformSeries, transformEpisode } from '../utils/transform.js';
import { validateIdParam, isValidObjectId } from '../utils/validateId.js';
import { toBool, toNum, safeParseArray, parseDuration, resolveSeriesId, normalizePublicationStatus } from '../utils/compat.js';
import logger from '../config/logger.js';

const router = Router();

// ─── Auth middleware ──────────────────────────────────────────────────────
router.use(protect);
router.use(adminOnly);

// =========================================================================
//  GENRES
// =========================================================================
router.get('/genres', async (req, res) => {
  try {
    const genres = await Genre.find().sort({ name: 1 });
    return res.json({ data: genres });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post('/genres', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const genre = await Genre.create({ name });
    return res.status(201).json({ data: genre });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Genre already exists' });
    return res.status(500).json({ message: error.message });
  }
});

// =========================================================================
//  SERIES CRUD
// =========================================================================

// GET /api/cms/series — paginated, filterable
router.get('/series', async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', status, genre, year_from, year_to, q } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (genre) query.genre = { $regex: genre, $options: 'i' };
    if (year_from || year_to) {
      query.releaseYear = {};
      if (year_from) query.releaseYear.$gte = Number(year_from);
      if (year_to) query.releaseYear.$lte = Number(year_to);
    }
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortObj = {};
    sortObj[sort] = order === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      Series.find(query).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
      Series.countDocuments(query)
    ]);

    // Enrich with season/episode counts
    const seriesIds = items.map(s => s._id);
    const episodes = await Episode.find({ series: { $in: seriesIds } }).lean();
    const epBySeries = new Map();
    episodes.forEach(ep => {
      const key = String(ep.series);
      if (!epBySeries.has(key)) epBySeries.set(key, []);
      epBySeries.get(key).push(ep);
    });

    const data = items.map(s => {
      const eps = epBySeries.get(String(s._id)) || [];
      const seasonsSet = new Set(eps.map(ep => ep.seasonNumber || 1));
      return {
        ...transformSeries(s),
        seasonCount: seasonsSet.size,
        episodeCount: eps.length,
      };
    });

    return res.json({ data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// GET /api/cms/series/:id
router.get('/series/:id', async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;
    const series = await Series.findById(req.params.id).lean();
    if (!series) return res.status(404).json({ message: 'Series not found' });

    const seasons = await Season.find({ series: req.params.id }).sort({ order: 1 }).lean();
    const episodes = await Episode.find({ series: req.params.id }).sort({ seasonNumber: 1, order: 1 }).lean();

    return res.json({ data: { ...transformSeries(series), seasons, episodes } });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// POST /api/cms/series
router.post('/series', upload.fields([
  { name: 'banner', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, release_year, description, genre_ids, tags, is_premium, status } = req.body;

    if (!title) return res.status(400).json({ message: 'Title is required' });

    let bannerUrl = req.body.banner_url || '';
    let thumbnailUrl = req.body.thumbnail_url || '';

    if (req.files?.banner) {
      const result = await uploadToCloudinary(req.files.banner[0].buffer, 'streamvault/series/banners', 'image');
      bannerUrl = result.secure_url;
    }
    if (req.files?.thumbnail) {
      const result = await uploadToCloudinary(req.files.thumbnail[0].buffer, 'streamvault/series/thumbnails', 'image');
      thumbnailUrl = result.secure_url;
    }

    const publicationStatus = normalizePublicationStatus(status, 'draft');
    const series = await Series.create({
      title,
      releaseYear: toNum(release_year, null),
      description: description || '',
      genre: safeParseArray(genre_ids),
      banner: bannerUrl,
      thumbnail: thumbnailUrl,
      premium: toBool(is_premium),
      tag: req.body.tag || 'New',
      status: publicationStatus,
      contentType: 'series',
      isPublished: publicationStatus === 'published',
    });

    flushCache();
    return res.status(201).json({ data: transformSeries(series) });
  } catch (error) {
    logger.error('CMS create series error:', error);
    return res.status(500).json({ message: error.message });
  }
});

// PATCH /api/cms/series/:id
router.patch('/series/:id', upload.fields([
  { name: 'banner', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;
    const series = await Series.findById(req.params.id);
    if (!series) return res.status(404).json({ message: 'Series not found' });

    const updateData = {};
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.release_year !== undefined) updateData.releaseYear = toNum(req.body.release_year);
    if (req.body.genre_ids !== undefined) updateData.genre = safeParseArray(req.body.genre_ids);
    if (req.body.tags !== undefined) updateData.tags = safeParseArray(req.body.tags);
    if (req.body.is_premium !== undefined) updateData.premium = toBool(req.body.is_premium);
    if (req.body.status !== undefined) {
      const publicationStatus = normalizePublicationStatus(req.body.status, 'draft');
      updateData.status = publicationStatus;
      updateData.isPublished = publicationStatus === 'published';
    }

    if (req.files?.banner) {
      const result = await uploadToCloudinary(req.files.banner[0].buffer, 'streamvault/series/banners', 'image');
      updateData.banner = result.secure_url;
    }
    if (req.body.banner_url) updateData.banner = req.body.banner_url;
    if (req.files?.thumbnail) {
      const result = await uploadToCloudinary(req.files.thumbnail[0].buffer, 'streamvault/series/thumbnails', 'image');
      updateData.thumbnail = result.secure_url;
    }
    if (req.body.thumbnail_url) updateData.thumbnail = req.body.thumbnail_url;

    const updated = await Series.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
    flushCache();
    return res.json({ data: transformSeries(updated) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// DELETE /api/cms/series/:id
router.delete('/series/:id', async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;
    const series = await Series.findById(req.params.id);
    if (!series) return res.status(404).json({ message: 'Series not found' });

    await Episode.deleteMany({ series: req.params.id });
    await Season.deleteMany({ series: req.params.id });
    await series.deleteOne();
    flushCache();
    return res.json({ success: true, message: 'Series and all seasons/episodes deleted' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// =========================================================================
//  SEASONS CRUD
// =========================================================================

// GET /api/cms/series/:seriesId/seasons
router.get('/series/:seriesId/seasons', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.seriesId)) {
      return res.status(400).json({ message: 'Invalid series ID' });
    }
    const seasons = await Season.find({ series: req.params.seriesId }).sort({ order: 1 }).lean();
    const seasonIds = seasons.map(s => s._id);
    const episodes = await Episode.find({ season: { $in: seasonIds } }).lean();
    const epBySeason = new Map();
    episodes.forEach(ep => {
      const key = String(ep.season);
      if (!epBySeason.has(key)) epBySeason.set(key, []);
      epBySeason.get(key).push(ep);
    });

    const data = seasons.map(s => ({
      ...s,
      episodeCount: (epBySeason.get(String(s._id)) || []).length,
    }));
    return res.json({ data });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// POST /api/cms/series/:seriesId/seasons
router.post('/series/:seriesId/seasons', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.seriesId)) {
      return res.status(400).json({ message: 'Invalid series ID' });
    }
    const series = await Series.findById(req.params.seriesId);
    if (!series) return res.status(404).json({ message: 'Series not found' });

    const { title, release_year, description, poster_url, order } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    // Auto-assign order if not provided
    let seasonOrder = order;
    if (seasonOrder === undefined) {
      const lastSeason = await Season.findOne({ series: req.params.seriesId }).sort({ order: -1 });
      seasonOrder = (lastSeason?.order || 0) + 1;
    }

    const season = await Season.create({
      series: req.params.seriesId,
      title,
      releaseYear: toNum(release_year, null),
      description: description || '',
      poster: poster_url || '',
      order: toNum(seasonOrder, 1),
    });

    // Update series season count
    const seasonCount = await Season.countDocuments({ series: req.params.seriesId });
    await Series.findByIdAndUpdate(req.params.seriesId, { seasons: seasonCount });

    flushCache();
    return res.status(201).json({ data: season });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// GET /api/cms/series/:seriesId/seasons/:seasonId
router.get('/series/:seriesId/seasons/:seasonId', async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;
    const season = await Season.findOne({ _id: req.params.seasonId, series: req.params.seriesId }).lean();
    if (!season) return res.status(404).json({ message: 'Season not found' });

    const episodes = await Episode.find({ season: req.params.seasonId }).sort({ order: 1 }).lean();
    return res.json({ data: { ...season, episodes } });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// PATCH /api/cms/series/:seriesId/seasons/:seasonId
router.patch('/series/:seriesId/seasons/:seasonId', async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;
    const season = await Season.findOne({ _id: req.params.seasonId, series: req.params.seriesId });
    if (!season) return res.status(404).json({ message: 'Season not found' });

    const updateData = {};
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.release_year !== undefined) updateData.releaseYear = toNum(req.body.release_year);
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.poster_url !== undefined) updateData.poster = req.body.poster_url;
    if (req.body.order !== undefined) updateData.order = toNum(req.body.order);
    if (req.body.status !== undefined) updateData.status = req.body.status;

    const updated = await Season.findByIdAndUpdate(req.params.seasonId, { $set: updateData }, { new: true });
    flushCache();
    return res.json({ data: updated });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// DELETE /api/cms/series/:seriesId/seasons/:seasonId
router.delete('/series/:seriesId/seasons/:seasonId', async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;
    const season = await Season.findOne({ _id: req.params.seasonId, series: req.params.seriesId });
    if (!season) return res.status(404).json({ message: 'Season not found' });

    await Episode.deleteMany({ season: req.params.seasonId });
    await season.deleteOne();

    const seasonCount = await Season.countDocuments({ series: req.params.seriesId });
    await Series.findByIdAndUpdate(req.params.seriesId, { seasons: seasonCount });

    flushCache();
    return res.json({ success: true, message: 'Season and its episodes deleted' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// =========================================================================
//  EPISODES CRUD
// =========================================================================

// GET /api/cms/series/:seriesId/seasons/:seasonId/episodes
router.get('/series/:seriesId/seasons/:seasonId/episodes', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.seasonId)) {
      return res.status(400).json({ message: 'Invalid season ID' });
    }
    const episodes = await Episode.find({ season: req.params.seasonId }).sort({ order: 1 }).lean();
    return res.json({ data: episodes });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// POST /api/cms/series/:seriesId/seasons/:seasonId/episodes
router.post('/series/:seriesId/seasons/:seasonId/episodes', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.seriesId) || !isValidObjectId(req.params.seasonId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const season = await Season.findById(req.params.seasonId);
    if (!season) return res.status(404).json({ message: 'Season not found' });

    const { title, episode_number, duration_minutes, description, status } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    let videoUrl = req.body.video_url || '';
    let thumbnailUrl = req.body.thumbnail_url || '';

    if (req.files?.video) {
      const result = await uploadToCloudinary(req.files.video[0].buffer, 'streamvault/episodes/videos', 'video');
      videoUrl = result.secure_url;
    }
    if (req.files?.thumbnail) {
      const result = await uploadToCloudinary(req.files.thumbnail[0].buffer, 'streamvault/episodes/thumbnails', 'image');
      thumbnailUrl = result.secure_url;
    }

    if (!videoUrl) {
      videoUrl = '/John_Wick.mp4';
    }

    // Auto-assign order
    let epOrder = toNum(req.body.order, undefined);
    if (epOrder === undefined) {
      const lastEp = await Episode.findOne({ season: req.params.seasonId }).sort({ order: -1 });
      epOrder = (lastEp?.order || 0) + 1;
    }

    const episodeStatus = normalizePublicationStatus(status, 'draft');
    const episode = await Episode.create({
      series: req.params.seriesId,
      season: req.params.seasonId,
      seasonNumber: season.order,
      episodeNumber: toNum(episode_number, 1),
      title,
      description: description || '',
      durationMinutes: toNum(duration_minutes, 0),
      video: { url: videoUrl, duration: parseDuration(duration_minutes) },
      thumbnail: thumbnailUrl,
      order: toNum(epOrder, 1),
      status: episodeStatus,
      isPublished: episodeStatus === 'published',
    });

    // Update series total episodes count
    const totalEp = await Episode.countDocuments({ series: req.params.seriesId });
    await Series.findByIdAndUpdate(req.params.seriesId, { totalEpisodes: totalEp });

    flushCache();
    return res.status(201).json({ data: episode });
  } catch (error) {
    logger.error('CMS create episode error:', error);
    return res.status(500).json({ message: error.message });
  }
});

// GET /api/cms/episodes/:episodeId
router.get('/episodes/:episodeId', async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;
    const episode = await Episode.findById(req.params.episodeId).populate('series', 'title').populate('season', 'title').lean();
    if (!episode) return res.status(404).json({ message: 'Episode not found' });
    return res.json({ data: episode });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// PATCH /api/cms/episodes/:episodeId
router.patch('/episodes/:episodeId', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;
    const episode = await Episode.findById(req.params.episodeId);
    if (!episode) return res.status(404).json({ message: 'Episode not found' });

    const updateData = {};
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.episode_number !== undefined) updateData.episodeNumber = toNum(req.body.episode_number);
    if (req.body.duration_minutes !== undefined) {
      updateData.durationMinutes = toNum(req.body.duration_minutes);
    }
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.status !== undefined) {
      updateData.status = req.body.status;
      updateData.isPublished = req.body.status === 'published';
    }
    if (req.body.order !== undefined) updateData.order = toNum(req.body.order);

    if (req.files?.video) {
      if (episode.video?.publicId) {
        await deleteFromCloudinary(episode.video.publicId, 'video').catch(() => {});
      }
      const result = await uploadToCloudinary(req.files.video[0].buffer, 'streamvault/episodes/videos', 'video');
      updateData['video.url'] = result.secure_url;
      updateData['video.publicId'] = result.public_id;
    }
    if (req.files?.thumbnail) {
      const result = await uploadToCloudinary(req.files.thumbnail[0].buffer, 'streamvault/episodes/thumbnails', 'image');
      updateData.thumbnail = result.secure_url;
    }
    if (req.body.video_url) updateData['video.url'] = req.body.video_url;
    if (req.body.thumbnail_url) updateData.thumbnail = req.body.thumbnail_url;

    const updated = await Episode.findByIdAndUpdate(req.params.episodeId, { $set: updateData }, { new: true });
    flushCache();
    return res.json({ data: updated });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// DELETE /api/cms/episodes/:episodeId
router.delete('/episodes/:episodeId', async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;
    const episode = await Episode.findById(req.params.episodeId);
    if (!episode) return res.status(404).json({ message: 'Episode not found' });

    if (episode.video?.publicId) {
      await deleteFromCloudinary(episode.video.publicId, 'video').catch(() => {});
    }

    await episode.deleteOne();
    const totalEp = await Episode.countDocuments({ series: episode.series });
    await Series.findByIdAndUpdate(episode.series, { totalEpisodes: totalEp });

    flushCache();
    return res.json({ success: true, message: 'Episode deleted' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// PATCH /api/cms/episodes/reorder — bulk order update
router.patch('/episodes/reorder', async (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) return res.status(400).json({ message: 'order must be an array of {episode_id, order}' });

    const ops = order.map(item => ({
      updateOne: {
        filter: { _id: item.episode_id },
        update: { $set: { order: item.order } }
      }
    }));

    await Episode.bulkWrite(ops);
    flushCache();
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// =========================================================================
//  MOVIES CRUD
// =========================================================================

// GET /api/cms/movies — paginated, filterable
router.get('/movies', async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', status, genre, year_from, year_to, q } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (genre) query.genre = { $regex: genre, $options: 'i' };
    if (year_from || year_to) {
      query.releaseYear = {};
      if (year_from) query.releaseYear.$gte = Number(year_from);
      if (year_to) query.releaseYear.$lte = Number(year_to);
    }
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortObj = {};
    sortObj[sort] = order === 'asc' ? 1 : -1;

    const [items, total] = await Promise.all([
      Movie.find(query).sort(sortObj).skip(skip).limit(Number(limit)).lean(),
      Movie.countDocuments(query)
    ]);

    return res.json({ data: items, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// GET /api/cms/movies/:id
router.get('/movies/:id', async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;
    const movie = await Movie.findById(req.params.id).lean();
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    return res.json({ data: movie });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// POST /api/cms/movies
router.post('/movies', upload.fields([
  { name: 'banner', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      title, release_year, duration_minutes, description, genre_ids, tags,
      director, cast, rating, is_premium, trailer_url, status
    } = req.body;

    if (!title) return res.status(400).json({ message: 'Title is required' });
    if (!release_year) return res.status(400).json({ message: 'Release year is required' });
    if (!duration_minutes) return res.status(400).json({ message: 'Duration is required' });

    let bannerUrl = req.body.banner_url || '';
    let thumbnailUrl = req.body.thumbnail_url || '';
    let videoUrl = req.body.video_url || '';

    if (req.files?.banner) {
      const result = await uploadToCloudinary(req.files.banner[0].buffer, 'streamvault/movies/banners', 'image');
      bannerUrl = result.secure_url;
    }
    if (req.files?.thumbnail) {
      const result = await uploadToCloudinary(req.files.thumbnail[0].buffer, 'streamvault/movies/posters', 'image');
      thumbnailUrl = result.secure_url;
    }
    if (req.files?.video && !videoUrl) {
      const result = await uploadToCloudinary(req.files.video[0].buffer, 'streamvault/movies/videos', 'video');
      videoUrl = result.secure_url;
    }
    if (!videoUrl) videoUrl = '/John_Wick.mp4';

    const movieStatus = normalizePublicationStatus(status, 'draft');
    const movie = await Movie.create({
      title,
      releaseYear: toNum(release_year),
      durationMinutes: toNum(duration_minutes),
      description: description || '',
      genre: safeParseArray(genre_ids),
      tags: safeParseArray(tags),
      director: director || '',
      cast: cast ? (typeof cast === 'string' ? JSON.parse(cast) : cast) : [],
      rating: rating || '',
      premium: toBool(is_premium),
      isPremium: toBool(is_premium),
      banner: bannerUrl,
      thumbnail: thumbnailUrl,
      trailerUrl: trailer_url || '',
      video: { url: videoUrl },
      status: movieStatus,
      isPublished: movieStatus === 'published',
    });

    flushCache();
    return res.status(201).json({ data: movie });
  } catch (error) {
    logger.error('CMS create movie error:', error);
    return res.status(500).json({ message: error.message });
  }
});

// PATCH /api/cms/movies/:id
router.patch('/movies/:id', upload.fields([
  { name: 'banner', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });

    const updateData = {};
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.release_year !== undefined) updateData.releaseYear = toNum(req.body.release_year);
    if (req.body.duration_minutes !== undefined) updateData.durationMinutes = toNum(req.body.duration_minutes);
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.genre_ids !== undefined) updateData.genre = safeParseArray(req.body.genre_ids);
    if (req.body.tags !== undefined) updateData.tags = safeParseArray(req.body.tags);
    if (req.body.director !== undefined) updateData.director = req.body.director;
    if (req.body.cast !== undefined) updateData.cast = typeof req.body.cast === 'string' ? JSON.parse(req.body.cast) : req.body.cast;
    if (req.body.rating !== undefined) updateData.rating = req.body.rating;
    if (req.body.is_premium !== undefined) updateData.premium = toBool(req.body.is_premium);
    updateData.isPremium = updateData.premium;
    if (req.body.trailer_url !== undefined) updateData.trailerUrl = req.body.trailer_url;
    if (req.body.status !== undefined) {
      updateData.status = req.body.status;
      updateData.isPublished = req.body.status === 'published';
    }

    if (req.files?.banner) {
      const result = await uploadToCloudinary(req.files.banner[0].buffer, 'streamvault/movies/banners', 'image');
      updateData.banner = result.secure_url;
    }
    if (req.files?.thumbnail) {
      const result = await uploadToCloudinary(req.files.thumbnail[0].buffer, 'streamvault/movies/posters', 'image');
      updateData.thumbnail = result.secure_url;
    }
    if (req.files?.video) {
      if (movie.video?.publicId) {
        await deleteFromCloudinary(movie.video.publicId, 'video').catch(() => {});
      }
      const result = await uploadToCloudinary(req.files.video[0].buffer, 'streamvault/movies/videos', 'video');
      updateData['video.url'] = result.secure_url;
      updateData['video.publicId'] = result.public_id;
    }
    if (req.body.banner_url) updateData.banner = req.body.banner_url;
    if (req.body.thumbnail_url) updateData.thumbnail = req.body.thumbnail_url;
    if (req.body.video_url) updateData['video.url'] = req.body.video_url;

    const updated = await Movie.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
    flushCache();
    return res.json({ data: updated });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// DELETE /api/cms/movies/:id
router.delete('/movies/:id', async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    if (movie.video?.publicId) {
      await deleteFromCloudinary(movie.video.publicId, 'video').catch(() => {});
    }
    await movie.deleteOne();
    flushCache();
    return res.json({ success: true, message: 'Movie deleted' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// =========================================================================
//  SEARCH
// =========================================================================

// GET /api/cms/search?q=...&type=all|series|movies
router.get('/search', async (req, res) => {
  try {
    const { q = '', type = 'all' } = req.query;
    const term = String(q || '').trim();

    if (!term) {
      return res.json({ data: { series: [], seasons: [], episodes: [], movies: [] } });
    }

    const regex = { $regex: term, $options: 'i' };
    const results = { series: [], seasons: [], episodes: [], movies: [] };

    if (type === 'all' || type === 'series') {
      const series = await Series.find({ title: regex }).select('title thumbnail status').limit(10).lean();
      results.series = series.map(s => ({ id: s._id, title: s.title, thumbnail_url: s.thumbnail, type: 'series', status: s.status }));
    }

    if (type === 'all' || type === 'seasons' || type === 'series') {
      const seasons = await Season.find({ title: regex })
        .populate('series', 'title')
        .select('title series')
        .limit(10)
        .lean();
      results.seasons = seasons.map(s => ({
        id: s._id,
        title: s.title,
        series_title: s.series?.title || '',
        type: 'season',
        breadcrumb: `${s.series?.title || ''} › ${s.title}`,
      }));
    }

    if (type === 'all' || type === 'episodes' || type === 'series') {
      const episodes = await Episode.find({ title: regex })
        .populate('series', 'title')
        .populate('season', 'title')
        .select('title series season episodeNumber')
        .limit(10)
        .lean();
      results.episodes = episodes.map(ep => ({
        id: ep._id,
        title: ep.title,
        series_title: ep.series?.title || '',
        season_title: ep.season?.title || `Season ${ep.seasonNumber || 1}`,
        breadcrumb: `${ep.series?.title || ''} › ${ep.season?.title || `Season ${ep.seasonNumber || 1}`} › ${ep.title}`,
        type: 'episode',
      }));
    }

    if (type === 'all' || type === 'movies') {
      const movies = await Movie.find({ title: regex }).select('title thumbnail status').limit(10).lean();
      results.movies = movies.map(m => ({ id: m._id, title: m.title, thumbnail_url: m.thumbnail, type: 'movie', status: m.status }));
    }

    return res.json({ data: results });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;