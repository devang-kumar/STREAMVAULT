import { Router } from 'express';
import FooterPage from '../models/FooterPage.js';
import ContactSubmission from '../models/ContactSubmission.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { flushCache } from '../middleware/cache.js';

const router = Router();

// =========================================================================
//  PUBLIC ROUTES
// =========================================================================

// GET /api/footer-pages/:slug
router.get('/footer-pages/:slug', async (req, res) => {
  try {
    const page = await FooterPage.findOne({ slug: req.params.slug }).lean();
    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }
    return res.json({ success: true, data: page });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/contact-submissions
router.post('/contact-submissions', async (req, res) => {
  try {
    const { name, phone, email, description } = req.body;
    if (!name || !phone || !email || !description) {
      return res.status(400).json({ success: false, message: 'All fields (name, phone, email, description) are required' });
    }

    const submission = await ContactSubmission.create({
      name,
      phone,
      email,
      description
    });

    return res.status(201).json({ success: true, data: submission });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// =========================================================================
//  ADMIN ROUTES (Protected)
// =========================================================================
router.use('/admin', protect, adminOnly);

// GET /api/admin/footer-pages
router.get('/admin/footer-pages', async (req, res) => {
  try {
    const pages = await FooterPage.find().sort({ title: 1 }).lean();
    return res.json({ success: true, data: pages });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/footer-pages/:slug
router.get('/admin/footer-pages/:slug', async (req, res) => {
  try {
    const page = await FooterPage.findOne({ slug: req.params.slug }).lean();
    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }
    return res.json({ success: true, data: page });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/admin/footer-pages/:slug
router.put('/admin/footer-pages/:slug', async (req, res) => {
  try {
    const { title, lastUpdated, content, faqs, settings } = req.body;
    const page = await FooterPage.findOne({ slug: req.params.slug });
    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    if (title !== undefined) page.title = title;
    if (lastUpdated !== undefined) page.lastUpdated = lastUpdated;
    if (content !== undefined) page.content = content;
    if (faqs !== undefined) page.faqs = faqs;
    if (settings !== undefined) {
      page.settings = {
        ...page.settings,
        ...settings
      };
    }

    await page.save();
    flushCache();

    return res.json({ success: true, data: page });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/contact-submissions
router.get('/admin/contact-submissions', async (req, res) => {
  try {
    const submissions = await ContactSubmission.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: submissions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/admin/contact-submissions/:id
router.delete('/admin/contact-submissions/:id', async (req, res) => {
  try {
    const submission = await ContactSubmission.findByIdAndDelete(req.params.id);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    return res.json({ success: true, message: 'Submission deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;