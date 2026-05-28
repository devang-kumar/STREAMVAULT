import { Router } from 'express';
import Series from '../models/Series.js';
import Category from '../models/Category.js';
import { cacheMiddleware } from '../middleware/cache.js';
import { transformSeries } from '../utils/transform.js';

const router = Router();

const sortMap = {
  views: { views: -1 },
  rating: { rating: -1 },
  createdAt: { createdAt: -1 },
  releaseYear: { releaseYear: -1 }
};

// GET /api/categories — get all active categories
router.get('/', cacheMiddleware(60), async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .select('name slug description displayOrder showOnHome')
      .lean();

    return res.json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/categories/home — homepage rows with series
router.get('/home', cacheMiddleware(60), async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true, showOnHome: true })
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    const rows = await Promise.all(
      categories.map(async (cat) => {
        const sort = sortMap[cat.sortBy] || sortMap.views;
        const series = await Series.find({ isPublished: true })
          .sort(sort)
          .limit(20)
          .lean();
        return {
          category: cat,
          series: series.map(transformSeries)
        };
      })
    );

    // Filter out empty rows
    let filtered = rows.filter((row) => row.series.length > 0);

    // Recently Added row — always first
    const recentlyAdded = await Series.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .limit(24)
      .lean();

    if (recentlyAdded.length > 0) {
      filtered.unshift({
        category: {
          _id: 'recently-added',
          name: 'Recently Added',
          slug: 'recently-added',
          sortBy: 'createdAt'
        },
        series: recentlyAdded.map(transformSeries)
      });
    }

    return res.json({ success: true, count: filtered.length, data: filtered });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/categories/:slug/series — series for a specific category
router.get('/:slug/series', cacheMiddleware(60), async (req, res) => {
  try {
    if (req.params.slug === 'recently-added') {
      const series = await Series.find({ isPublished: true })
        .sort({ createdAt: -1 })
        .limit(40)
        .lean();
      return res.json({
        success: true,
        category: { name: 'Recently Added', slug: 'recently-added' },
        count: series.length,
        data: series.map(transformSeries)
      });
    }

    const category = await Category.findOne({ slug: req.params.slug, isActive: true }).lean();
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const sort = sortMap[category.sortBy] || sortMap.views;
    const series = await Series.find({ isPublished: true })
      .sort(sort)
      .limit(40)
      .lean();

    return res.json({
      success: true,
      category,
      count: series.length,
      data: series.map(transformSeries)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;