import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { transformUser, transformSeries } from '../utils/transform.js';
import { isValidObjectId } from '../utils/validateId.js';
import NotificationService from '../services/NotificationService.js';

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

// PATCH /api/users/profile — update profile name/avatar/parental controls
router.patch('/profile', protect, async (req, res) => {
  try {
    const { name, avatar, parentalControls } = req.body;
    const updateData = {};

    if (typeof name === 'string' && name.trim()) updateData['name'] = name.trim();
    if (typeof avatar === 'string' && avatar.trim()) updateData['profile.avatar'] = avatar.trim();
    if (parentalControls !== undefined) updateData['parentalControls'] = Boolean(parentalControls);

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

// GET /api/users/continue-watching — get user's continue watching list
router.get('/continue-watching', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'watchHistory.series',
        select: 'title poster thumbnail'
      })
      .populate({
        path: 'watchHistory.episode',
        select: 'title thumbnail episodeNumber season'
      })
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Filter to only include items with progress between 1% and 94%
    // (not yet completed, but started watching)
    const continueWatching = (user.watchHistory || [])
      .filter(h => h.progress > 0 && h.progress < 95 && h.series && h.episode)
      .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt))
      .slice(0, 20)
      .map(h => ({
        showId: h.series._id,
        showTitle: h.series.title,
        poster: h.series.poster || h.series.thumbnail,
        episodeId: h.episode._id,
        episodeTitle: h.episode.title,
        episodeNumber: h.episode.episodeNumber,
        seasonNumber: h.episode.seasonNumber || 1,
        progress: h.progress,
        duration: h.duration || 0,
        lastPosition: h.lastPosition || 0,
        watchedAt: h.watchedAt
      }));

    return res.json(continueWatching);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch continue watching' });
  }
});

// PATCH /api/users/continue-watching — update continue watching progress
router.patch('/continue-watching', protect, async (req, res) => {
  try {
    const { showId, episodeId, episode, progress, duration, lastPosition } = req.body;

    // Accept either episodeId or episode (for backwards compatibility)
    const epId = episodeId || episode;

    if (!showId || !epId) {
      return res.status(400).json({ message: 'showId and episodeId are required' });
    }

    if (!isValidObjectId(showId) || !isValidObjectId(epId)) {
      return res.status(400).json({ message: 'Invalid showId or episodeId' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingIdx = user.watchHistory.findIndex(
      (w) => String(w.series) === String(showId) && String(w.episode) === String(epId)
    );

    const entry = {
      series: showId,
      episode: epId,
      progress: Math.max(0, Math.min(100, Number(progress) || 0)),
      duration: Number(duration) || 0,
      lastPosition: Number(lastPosition) || 0,
      watchedAt: new Date()
    };

    if (existingIdx === -1) {
      user.watchHistory.push(entry);
    } else {
      // Merge with existing entry
      user.watchHistory[existingIdx] = { ...user.watchHistory[existingIdx], ...entry };
    }

    // Keep only the most recent 50 entries to prevent bloat
    if (user.watchHistory.length > 50) {
      user.watchHistory = user.watchHistory
        .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt))
        .slice(0, 50);
    }

    await user.save();

    return res.json({
      success: true,
      continueWatching: (user.watchHistory || []).map(h => ({
        showId: h.series,
        episodeId: h.episode,
        progress: h.progress,
        duration: h.duration,
        lastPosition: h.lastPosition,
        watchedAt: h.watchedAt
      }))
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update continue watching' });
  }
});



// PUT /api/users/change-email — change user email
router.put('/change-email', protect, async (req, res) => {
  try {
    const { password, newEmail, confirmEmail } = req.body;

    if (!password || !newEmail || !confirmEmail) {
      return res.status(400).json({ message: 'Password, new email, and confirm email are required' });
    }

    if (newEmail !== confirmEmail) {
      return res.status(400).json({ message: 'New email and confirmation do not match' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Check if email already exists
    const normalizedEmail = newEmail.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
    if (existingUser) {
      return res.status(409).json({ message: 'This email is already in use' });
    }

    user.email = normalizedEmail;
    await user.save();

    // Notify about email change
    try {
      await NotificationService.notifyEmailChanged(user._id);
    } catch (_) {}

    return res.json({ message: 'Email updated successfully', email: normalizedEmail });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to change email' });
  }
});

// PUT /api/users/change-password — change user password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Current password, new password, and confirmation are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New password and confirmation do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save(); // pre-save hook will hash

    // Notify about password change
    try {
      await NotificationService.notifyPasswordChanged(user._id);
    } catch (_) {}

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to change password' });
  }
});

// GET /api/users/subscription — get subscription details
router.get('/subscription', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.checkSubscription();

    return res.json({
      subscription: {
        plan: user.subscription?.status || 'Basic',
        status: user.subscription?.status || 'Basic',
        planId: user.subscription?.planId || null,
        expiryDate: user.subscription?.expiryDate || null,
        isActive: user.subscription?.status === 'Premium',
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch subscription' });
  }
});

// DELETE /api/users/subscription — cancel subscription
router.delete('/subscription', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $set: {
        'subscription.status': 'Basic',
        'subscription.planId': 'free',
      }
    });

    return res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to cancel subscription' });
  }
});

// PATCH /api/users/plan — update user plan directly
router.patch('/plan', protect, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!plan || !['Basic', 'Premium'].includes(plan)) {
      return res.status(400).json({ message: 'Valid plan status (Basic or Premium) is required' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        $set: { 
          'subscription.status': plan,
          'subscription.planId': plan === 'Premium' ? 'premium' : 'free',
          'subscription.expiryDate': plan === 'Premium' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null 
        } 
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(transformUser(user));
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update plan' });
  }
});

// GET /api/users/watchlist — get user's watchlist
router.get('/watchlist', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'watchlist',
        select: 'title poster thumbnail seasons releaseYear year premium tag rating genre'
      })
      .populate({
        path: 'movieWatchlist',
        select: 'title poster thumbnail durationMinutes releaseYear year premium tag rating genre'
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Merge and annotate with contentType so the frontend can route correctly
    const seriesItems = (user.watchlist || []).map(item => ({
      ...item.toObject(),
      id: item._id.toString(),
      contentType: 'series'
    }));
    const movieItems = (user.movieWatchlist || []).map(item => ({
      ...item.toObject(),
      id: item._id.toString(),
      contentType: 'movie'
    }));

    return res.json({ watchlist: [...seriesItems, ...movieItems] });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch watchlist' });
  }
});

// POST /api/users/watchlist — add to watchlist (supports series & movies)
router.post('/watchlist', protect, async (req, res) => {
  try {
    const { showId, contentType } = req.body;
    if (!showId || !isValidObjectId(showId)) {
      return res.status(400).json({ message: 'Valid showId is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (contentType === 'movie') {
      if (!user.movieWatchlist.map(id => id.toString()).includes(showId)) {
        user.movieWatchlist.push(showId);
      }
    } else {
      if (!user.watchlist.map(id => id.toString()).includes(showId)) {
        user.watchlist.push(showId);
      }
    }

    await user.save();
    return res.json({ message: 'Added to watchlist successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to add to watchlist' });
  }
});

// DELETE /api/users/watchlist/:showId — remove from watchlist
router.delete('/watchlist/:showId', protect, async (req, res) => {
  try {
    const { showId } = req.params;
    const { contentType } = req.query;
    if (!showId || !isValidObjectId(showId)) {
      return res.status(400).json({ message: 'Valid showId is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (contentType === 'movie') {
      user.movieWatchlist = user.movieWatchlist.filter(id => id.toString() !== showId);
    } else {
      user.watchlist = user.watchlist.filter(id => id.toString() !== showId);
    }

    // Also try removing from both lists in case contentType is missing/wrong
    if (!contentType) {
      user.watchlist = user.watchlist.filter(id => id.toString() !== showId);
      user.movieWatchlist = user.movieWatchlist.filter(id => id.toString() !== showId);
    }

    await user.save();
    return res.json({ message: 'Removed from watchlist successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to remove from watchlist' });
  }
});

export default router;
