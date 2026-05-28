import { Router } from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { transformUser, transformSeries } from '../utils/transform.js';
import { isValidObjectId } from '../utils/validateId.js';

const router = Router();

// GET /api/users/profile — get current user profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('watchHistory.series')
      .populate('watchHistory.episode')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(transformUser(user));
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch profile' });
  }
});

// PATCH /api/users/profile — update profile name/avatar
router.patch('/profile', protect, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const updateData = {};

    if (typeof name === 'string' && name.trim()) updateData['profile.name'] = name.trim();
    if (typeof avatar === 'string' && avatar.trim()) updateData['profile.avatar'] = avatar.trim();

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(transformUser(user));
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update profile' });
  }
});

// PATCH /api/users/continue-watching — update continue watching progress
router.patch('/continue-watching', protect, async (req, res) => {
  try {
    const { showId, episode, progress } = req.body;

    if (showId === undefined || episode === undefined || progress === undefined) {
      return res.status(400).json({ message: 'showId, episode, progress are required' });
    }

    // Validate ObjectIds before using them
    if (!isValidObjectId(showId) || !isValidObjectId(episode)) {
      return res.status(400).json({ message: 'Invalid showId or episode ObjectId' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingIdx = user.watchHistory.findIndex(
      (w) => String(w.series) === String(showId)
    );

    const entry = {
      series: showId,
      episode: episode,
      progress: Math.max(0, Math.min(100, Number(progress))),
      watchedAt: new Date()
    };

    if (existingIdx === -1) {
      user.watchHistory.push(entry);
    } else {
      user.watchHistory[existingIdx] = entry;
    }

    await user.save();

    return res.json({
      continueWatching: (user.watchHistory || []).map(h => ({
        showId: h.series,
        episode: h.episode,
        progress: h.progress,
        watchedAt: h.watchedAt
      }))
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update continue watching' });
  }
});



export default router;
