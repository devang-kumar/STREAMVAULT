import { Router } from 'express';
import Notification from '../models/Notification.js';
import NotificationService from '../services/NotificationService.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { validateIdParam } from '../utils/validateId.js';
import { body, query, validationResult } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(protect);

// ─── GET /api/notifications — Get user notifications ──────────────────────
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, type, category, unreadOnly } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    const filter = { userId: req.user.id };
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (unreadOnly === 'true') filter.isRead = false;

    const skip = (pageNum - 1) * limitNum;

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Notification.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      data: notifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch notifications' });
  }
});

// ─── GET /api/notifications/unread-count — Get unread count ──────────────
router.get('/unread-count', async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.id,
      isRead: false
    });

    return res.json({ success: true, count });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch unread count' });
  }
});

// ─── GET /api/notifications/history — Paginated history with grouping ────
router.get('/history', async (req, res) => {
  try {
    const { page = 1, limit = 30, type, category, search } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const filter = { userId: req.user.id };
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (pageNum - 1) * limitNum;

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Notification.countDocuments(filter)
    ]);

    // Group by date
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const grouped = { today: [], yesterday: [], earlier: [] };
    notifications.forEach(n => {
      const d = new Date(n.createdAt);
      if (d >= todayStart) grouped.today.push(n);
      else if (d >= yesterdayStart) grouped.yesterday.push(n);
      else grouped.earlier.push(n);
    });

    return res.json({
      success: true,
      data: grouped,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch notification history' });
  }
});

// ─── PATCH /api/notifications/:id/read — Mark one as read ───────────────
router.patch('/:id/read', async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.json({ success: true, data: notification });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to mark notification as read' });
  }
});

// ─── PATCH /api/notifications/read-all — Mark all as read ───────────────
router.patch('/read-all', async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true }
    );

    return res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to mark all as read' });
  }
});

// ─── DELETE /api/notifications/:id — Delete one notification ─────────────
router.delete('/:id', async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;

    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete notification' });
  }
});

// ─── DELETE /api/notifications — Clear all user notifications ────────────
router.delete('/', async (req, res) => {
  try {
    const result = await Notification.deleteMany({ userId: req.user.id });
    return res.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to clear notifications' });
  }
});

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────

// POST /api/notifications/send — Admin sends custom notification
router.post('/send', adminOnly, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('targetAudience').isIn(['all', 'premium', 'free', 'admin', 'specificUser']).withMessage('Invalid target audience'),
  body('type').optional().isIn(['content', 'subscription', 'payment', 'announcement', 'account', 'system', 'security', 'admin']),
  body('priority').optional().isIn(['low', 'normal', 'high']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { title, message, type = 'admin', targetAudience, specificUserId, actionUrl, priority } = req.body;

    const notificationData = {
      title,
      message,
      type,
      category: 'admin_custom',
      actionUrl: actionUrl || '',
      priority: priority || 'normal',
      isSystemGenerated: false,
      sentBy: req.user.id
    };

    const result = await NotificationService.sendToAudience(
      targetAudience,
      notificationData,
      specificUserId
    );

    return res.json({
      success: true,
      message: `Notification sent to ${result.created} user(s)`,
      data: { created: result.created, errors: result.errors }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to send notification' });
  }
});

// GET /api/notifications/admin/stats — Admin notification statistics
router.get('/admin/stats', adminOnly, async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
    const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1);

    const [
      totalSent,
      totalUnread,
      totalRead,
      sentToday,
      sentThisWeek,
      sentThisMonth,
      adminSent,
      systemSent,
      typeBreakdown
    ] = await Promise.all([
      Notification.countDocuments({}),
      Notification.countDocuments({ isRead: false }),
      Notification.countDocuments({ isRead: true }),
      Notification.countDocuments({ createdAt: { $gte: todayStart } }),
      Notification.countDocuments({ createdAt: { $gte: weekAgo } }),
      Notification.countDocuments({ createdAt: { $gte: monthAgo } }),
      Notification.countDocuments({ isSystemGenerated: false }),
      Notification.countDocuments({ isSystemGenerated: true }),
      Notification.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    return res.json({
      success: true,
      data: {
        totalSent,
        totalUnread,
        totalRead,
        sentToday,
        sentThisWeek,
        sentThisMonth,
        adminSent,
        systemSent,
        readRate: totalSent > 0 ? Number(((totalRead / totalSent) * 100).toFixed(1)) : 0,
        typeBreakdown: typeBreakdown.map(t => ({ type: t._id, count: t.count }))
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch notification stats' });
  }
});

// GET /api/notifications/admin/all — Admin can view all notifications
router.get('/admin/all', adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 50, type, userId } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const filter = {};
    if (type) filter.type = type;
    if (userId) filter.userId = userId;

    const skip = (pageNum - 1) * limitNum;

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .populate('userId', 'name email')
        .populate('sentBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Notification.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      data: notifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch notifications' });
  }
});

export default router;