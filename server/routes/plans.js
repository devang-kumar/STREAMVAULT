import { Router } from 'express';
import Plan from '../models/Plan.js';
import User from '../models/User.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { flushCache } from '../middleware/cache.js';
import { validateIdParam } from '../utils/validateId.js';

const router = Router();

// ─── PUBLIC ROUTES ─────────────────────────────────────────────────────────
// GET /api/plans — list all active plans (public, for subscription page)
router.get('/', async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true })
      .sort({ sortOrder: 1, price: 1 })
      .lean();
    return res.json({ data: plans });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch plans' });
  }
});

// ─── ADMIN ROUTES (must come before /:id to avoid route conflict) ─────────
// GET /api/plans/admin/all — list ALL plans including inactive (admin only)
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const plans = await Plan.find({})
      .sort({ sortOrder: 1, price: 1 })
      .lean();

    // Enrich with subscriber counts
    const allUsers = await User.find({}, 'subscription.planId subscription.status').lean();
    const subscriberMap = {};
    allUsers.forEach(u => {
      const planId = u.subscription?.planId;
      if (planId) {
        subscriberMap[planId] = (subscriberMap[planId] || 0) + 1;
      }
    });

    const enriched = plans.map(p => ({
      ...p,
      subscriberCount: subscriberMap[p._id.toString()] || subscriberMap[p.slug] || 0
    }));

    // Compute summary stats
    const totalPlans = plans.length;
    const activePlans = plans.filter(p => p.isActive).length;
    const totalSubscribers = allUsers.filter(u => u.subscription?.status === 'Premium').length;

    return res.json({
      plans: enriched,
      stats: { totalPlans, activePlans, totalSubscribers }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch plans' });
  }
});

// GET /api/plans/:id — get single plan details
router.get('/:id', async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id).lean();
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    return res.json({ data: plan });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch plan' });
  }
});

// POST /api/plans/admin — create a new plan
router.post('/admin', protect, adminOnly, async (req, res) => {
  try {
    const {
      name, slug, description, price, currency, billingCycle, billingDays,
      features, maxDevices, streamingQuality, isActive, isPopular, badge,
      sortOrder, trialDays, razorpayPlanId
    } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Plan name is required' });
    }
    if (price === undefined || price === null || price < 0) {
      return res.status(400).json({ message: 'Valid price is required' });
    }
    if (!billingCycle || !['weekly', 'monthly', 'yearly'].includes(billingCycle)) {
      return res.status(400).json({ message: 'Valid billing cycle is required (weekly, monthly, yearly)' });
    }

    // Auto-generate slug if not provided
    const planSlug = slug || name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Auto-calculate billingDays if not provided
    let days = billingDays;
    if (!days) {
      if (billingCycle === 'weekly') days = 7;
      else if (billingCycle === 'monthly') days = 30;
      else if (billingCycle === 'yearly') days = 365;
    }

    // Parse features if sent as comma-separated string
    let parsedFeatures = features;
    if (typeof features === 'string') {
      parsedFeatures = features.split(',').map(f => f.trim()).filter(Boolean);
    }

    const plan = await Plan.create({
      name: name.trim(),
      slug: planSlug,
      description: description || '',
      price: Number(price),
      currency: currency || 'INR',
      billingCycle,
      billingDays: days,
      features: parsedFeatures || [],
      maxDevices: maxDevices || 1,
      streamingQuality: streamingQuality || 'HD',
      isActive: isActive !== false,
      isPopular: isPopular === true,
      badge: badge || '',
      sortOrder: sortOrder || 0,
      trialDays: trialDays || 0,
      razorpayPlanId: razorpayPlanId || ''
    });

    flushCache();
    return res.status(201).json({ data: plan });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({ message: `A plan with this ${field} already exists` });
    }
    return res.status(500).json({ message: error.message || 'Failed to create plan' });
  }
});

// PUT /api/plans/admin/:id — update a plan
router.put('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;

    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    const updateData = {};
    const allowedFields = [
      'name', 'slug', 'description', 'price', 'currency', 'billingCycle',
      'billingDays', 'maxDevices', 'streamingQuality', 'isActive', 'isPopular',
      'badge', 'sortOrder', 'trialDays', 'razorpayPlanId'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Handle features specially (could be array or comma-separated string)
    if (req.body.features !== undefined) {
      if (typeof req.body.features === 'string') {
        updateData.features = req.body.features.split(',').map(f => f.trim()).filter(Boolean);
      } else {
        updateData.features = req.body.features;
      }
    }

    // Auto-calculate billingDays if billingCycle changed but billingDays not
    if (updateData.billingCycle && !updateData.billingDays) {
      if (updateData.billingCycle === 'weekly') updateData.billingDays = 7;
      else if (updateData.billingCycle === 'monthly') updateData.billingDays = 30;
      else if (updateData.billingCycle === 'yearly') updateData.billingDays = 365;
    }

    // Clean slug
    if (updateData.name && !req.body.slug) {
      updateData.slug = updateData.name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    const updated = await Plan.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    flushCache();
    return res.json({ data: updated });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({ message: `A plan with this ${field} already exists` });
    }
    return res.status(500).json({ message: error.message || 'Failed to update plan' });
  }
});

// PATCH /api/plans/admin/:id/toggle — toggle active status
router.patch('/admin/:id/toggle', protect, adminOnly, async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;

    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    plan.isActive = !plan.isActive;
    await plan.save();

    flushCache();
    return res.json({ data: plan });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to toggle plan status' });
  }
});

// DELETE /api/plans/admin/:id — delete a plan
router.delete('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;

    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    // Check if any active subscribers use this plan
    const activeSubscribers = await User.countDocuments({
      'subscription.planId': plan._id.toString(),
      'subscription.status': 'Premium'
    });

    if (activeSubscribers > 0) {
      return res.status(400).json({
        message: `Cannot delete plan: ${activeSubscribers} active subscriber(s) still on this plan. Deactivate it instead.`
      });
    }

    await plan.deleteOne();
    flushCache();
    return res.json({ success: true, message: 'Plan deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to delete plan' });
  }
});

export default router;