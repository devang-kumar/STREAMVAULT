import { Router } from 'express';
import Series from '../models/Series.js';
import Episode from '../models/Episode.js';
import ContentView from '../models/ContentView.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { transformSeries, transformEpisode } from '../utils/transform.js';
import { validateIdParam } from '../utils/validateId.js';

const router = Router();

// GET /api/shows — returns ARRAY (frontend expects array directly)
router.get('/', async (req, res) => {
  try {
    const { genre, tag, search } = req.query;
    let query = { isPublished: true };

    if (genre) {
      query.genre = { $regex: genre, $options: 'i' };
    }
    if (tag) {
      query.tag = { $regex: tag, $options: 'i' };
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const shows = await Series.find(query).sort({ createdAt: -1 }).lean();
    return res.json(shows.map(transformSeries));
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch shows' });
  }
});

// GET /api/shows/:id — returns single show object (frontend expects object directly)
router.get('/:id', async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;

    const show = await Series.findById(req.params.id).lean();

    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }

    // Increment view count
    await Series.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    // Track daily view for analytics
    try {
      const today = new Date().toISOString().slice(0, 10);
      await ContentView.create({
        contentId: req.params.id,
        contentType: 'Series',
        user: req.user?.id || null,
        dateKey: today
      });
    } catch (_) {}

    return res.json(transformSeries(show));
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch show' });
  }
});

// POST /api/shows — admin create show (frontend expects show object back)
router.post('/', protect, adminOnly, async (req, res) => {
  try {

    const { title, description, genre, rating, year, seasons, banner, poster, premium, tag } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'title is required' });
    }

    const show = await Series.create({
      title,
      description: description || '',
      genre: Array.isArray(genre) ? genre : (genre ? [genre] : []),
      rating: rating ?? 0,
      releaseYear: year || null,
      seasons: seasons || 1,
      thumbnail: poster || banner || '',
      banner: banner || poster || '',
      premium: Boolean(premium),
      tag: tag || 'New',
      isPublished: true,
      status: 'ongoing'
    });

    return res.status(201).json(transformSeries(show));
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to create show' });
  }
});

// PUT /api/shows/:id — admin update show
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;

    let show = await Series.findById(req.params.id);
    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }

    const updateData = { ...req.body };

    // Map frontend "year" → DB "releaseYear"
    if (updateData.year !== undefined) {
      updateData.releaseYear = updateData.year;
      delete updateData.year;
    }
    // Map frontend "poster" → DB "thumbnail"
    if (updateData.poster !== undefined) {
      updateData.thumbnail = updateData.poster;
      delete updateData.poster;
    }

    show = await Series.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    return res.json(transformSeries(show));
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update show' });
  }
});

// DELETE /api/shows/:id — admin delete show
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;

    const show = await Series.findById(req.params.id);
    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }

    // Delete all episodes for this show
    await Episode.deleteMany({ series: req.params.id });
    await show.deleteOne();

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to delete show' });
  }
});

export default router;