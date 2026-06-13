import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Episode from '../models/Episode.js';
import Series from '../models/Series.js';
import User from '../models/User.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { transformEpisode } from '../utils/transform.js';
import { validateIdParam, isValidObjectId, safeObjectId } from '../utils/validateId.js';
import { toBool, toNum, parseDuration, resolveSeriesId } from '../utils/compat.js';

const router = Router();

// Helper to optionally attach user (no fail if not authenticated)
const tryAttachUser = (req) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

// GET /api/episodes?showId= — returns ARRAY (frontend expects array directly)
router.get('/', async (req, res) => {
  try {
    const { showId } = req.query;
    let query = { isPublished: true };

    if (showId) {
      // Only filter by showId if it's a valid ObjectId, else return empty
      if (!isValidObjectId(showId)) {
        return res.json([]);
      }
      query.series = showId;
    }

    const episodes = await Episode.find(query).sort({ season: 1, episodeNumber: 1 }).lean();
    return res.json(episodes.map(transformEpisode));
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch episodes' });
  }
});

// GET /api/episodes/:id — returns single episode object
// Handles premium locking (frontend expects raw episode object or 403 with { locked: true })
router.get('/:id', async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;

    const episode = await Episode.findById(req.params.id).populate('series').populate('season').lean();

    if (!episode) {
      return res.status(404).json({ message: 'Episode not found' });
    }

    // Premium locking check — series, season, or episode level
    const isPremiumContent = episode.series?.premium || episode.season?.premium || episode.premium;
    if (isPremiumContent) {
      const authUser = tryAttachUser(req);
      if (!authUser) {
        return res.status(403).json({ locked: true, message: 'Premium episode is locked' });
      }

      let currentUser = await User.findById(authUser.id);
      if (currentUser) {
        currentUser = await currentUser.checkSubscription();
      }
      const plan = String(currentUser?.subscription?.status || 'Basic');
      if (plan === 'Basic') {
        return res.status(403).json({ locked: true, message: 'Premium episode is locked. Upgrade to Standard or Premium plan.' });
      }
    }

    // Increment view count (fire and forget)
    Episode.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).catch(() => {});

    return res.json(transformEpisode(episode));
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch episode' });
  }
});

// POST /api/episodes — admin create episode (handles both JSON and FormData)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { showId, seriesId, title, duration, thumb, desc, description, premium, episodeNumber, season, videoUrl } = req.body;

    const resolvedSeriesId = resolveSeriesId(req.body);
    if (!resolvedSeriesId || !title || !episodeNumber || !season) {
      return res.status(400).json({ message: 'seriesId/showId, title, episodeNumber, season are required' });
    }

    if (!isValidObjectId(resolvedSeriesId)) {
      return res.status(400).json({ message: 'Invalid seriesId: must be a valid ObjectId' });
    }

    const episode = await Episode.create({
      series: resolvedSeriesId,
      title,
      description: description || desc || '',
      thumbnail: thumb || '',
      season: toNum(season, 1),
      episodeNumber: toNum(episodeNumber, 1),
      premium: toBool(premium),
      video: {
        url: videoUrl || '/John_Wick.mp4',
        duration: parseDuration(duration)
      },
      isPublished: true
    });

    // Update series totalEpisodes count
    try {
      const count = await Episode.countDocuments({ series: resolvedSeriesId });
      await Series.findByIdAndUpdate(resolvedSeriesId, { totalEpisodes: count });
    } catch (_) {}

    return res.status(201).json(transformEpisode(episode));
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to create episode' });
  }
});

// PUT /api/episodes/:id — admin update episode
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;

    let episode = await Episode.findById(req.params.id);
    if (!episode) {
      return res.status(404).json({ message: 'Episode not found' });
    }

    const updateData = { ...req.body };

    // Map frontend field names to DB fields
    if (updateData.desc !== undefined) {
      updateData.description = updateData.desc;
      delete updateData.desc;
    }
    if (updateData.thumb !== undefined) {
      updateData.thumbnail = updateData.thumb;
      delete updateData.thumb;
    }
    if (updateData.videoUrl !== undefined) {
      updateData['video.url'] = updateData.videoUrl;
      delete updateData.videoUrl;
    }
    if (updateData.showId !== undefined) {
      updateData.series = updateData.showId;
      delete updateData.showId;
    }
    if (updateData.seriesId !== undefined) {
      updateData.series = updateData.seriesId;
      delete updateData.seriesId;
    }
    if (updateData.duration !== undefined && updateData.duration !== '') {
      updateData['video.duration'] = parseDuration(updateData.duration);
      delete updateData.duration;
    }

    // Handle premium as boolean
    if (updateData.premium !== undefined) {
      updateData.premium = toBool(updateData.premium);
    }

    episode = await Episode.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    return res.json(transformEpisode(episode));
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update episode' });
  }
});

// DELETE /api/episodes/:id — admin delete episode
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;

    const episode = await Episode.findById(req.params.id);
    if (!episode) {
      return res.status(404).json({ message: 'Episode not found' });
    }

    await episode.deleteOne();
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to delete episode' });
  }
});

export default router;