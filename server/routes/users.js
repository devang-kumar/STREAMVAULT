import { Router } from 'express';
import bcrypt from 'bcryptjs';
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

export default router;
