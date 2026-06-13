import Plan from '../models/Plan.js';
import logger from '../config/logger.js';

export const DEFAULT_PLANS = [
  {
    name: 'Free',
    slug: 'free',
    description: 'Forever free — limited access',
    price: 0,
    currency: 'INR',
    billingCycle: 'monthly',
    billingDays: 30,
    features: ['Trailer access only', 'Limited browsing', 'No downloads', 'Ads supported'],
    maxDevices: 1,
    streamingQuality: 'SD',
    isActive: true,
    isPopular: false,
    badge: '',
    sortOrder: 0,
    trialDays: 0,
  },
  {
    name: 'Weekly',
    slug: 'weekly',
    description: 'Perfect for trying out',
    price: 99,
    currency: 'INR',
    billingCycle: 'weekly',
    billingDays: 7,
    features: ['7-day free trial', 'Full HD streaming', '1 screen at a time', 'Full episode library', 'Mobile access'],
    maxDevices: 1,
    streamingQuality: 'Full HD',
    isActive: true,
    isPopular: false,
    badge: 'Try Free',
    sortOrder: 1,
    trialDays: 7,
  },
  {
    name: 'Monthly',
    slug: 'monthly',
    description: 'Most popular choice',
    price: 199,
    currency: 'INR',
    billingCycle: 'monthly',
    billingDays: 30,
    features: ['7-day free trial', 'Full HD + 4K', '2 screens simultaneously', 'Full episode library', 'Downloads (5/month)', 'No ads'],
    maxDevices: 2,
    streamingQuality: '4K',
    isActive: true,
    isPopular: true,
    badge: 'Most Popular',
    sortOrder: 2,
    trialDays: 7,
  },
  {
    name: 'Yearly',
    slug: 'yearly',
    description: 'Best value for money',
    price: 1999,
    currency: 'INR',
    billingCycle: 'yearly',
    billingDays: 365,
    features: ['7-day free trial', '4K + HDR streaming', '4 screens simultaneously', 'Full episode library', 'Unlimited downloads', 'No ads', 'Early access to new shows', 'Priority support'],
    maxDevices: 4,
    streamingQuality: '4K',
    isActive: true,
    isPopular: false,
    badge: 'Best Value',
    sortOrder: 3,
    trialDays: 7,
  },
];

/** Create default plans if the collection is empty (e.g. fresh Render deploy). */
export async function ensureDefaultPlans() {
  const count = await Plan.countDocuments();
  if (count > 0) return count;

  const created = await Plan.insertMany(DEFAULT_PLANS);
  logger.info(`✅ Seeded ${created.length} default subscription plans`);
  return created.length;
}
