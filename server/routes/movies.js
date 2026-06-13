import { Router } from 'express';
import Movie from '../models/Movie.js';
import ContentView from '../models/ContentView.js';
import { transformMovie } from '../utils/transform.js';
import { validateIdParam } from '../utils/validateId.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { genre, tag, search } = req.query;
    const query = { isPublished: true };

    if (genre) query.genre = { $regex: genre, $options: 'i' };
    if (tag) query.tags = { $regex: tag, $options: 'i' };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const movies = await Movie.find(query).sort({ createdAt: -1 }).lean();
    return res.json(movies.map(transformMovie));
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch movies' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;

    const movie = await Movie.findById(req.params.id).lean();
    if (!movie || !movie.isPublished) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    Movie.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).catch(() => {});

    try {
      const today = new Date().toISOString().slice(0, 10);
      await ContentView.create({
        contentId: req.params.id,
        contentType: 'Movie',
        user: req.user?.id || null,
        dateKey: today
      });
    } catch (_) {}

    return res.json(transformMovie(movie));
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch movie' });
  }
});

export default router;
