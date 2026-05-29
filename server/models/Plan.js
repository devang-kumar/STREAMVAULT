import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  billingCycle: {
    type: String,
    enum: ['weekly', 'monthly', 'yearly'],
    required: true
  },
  billingDays: {
    type: Number,
    required: true,
    description: 'Number of days this billing cycle lasts'
  },
  features: [{
    type: String,
    trim: true
  }],
  maxDevices: {
    type: Number,
    default: 1,
    min: 1
  },
  streamingQuality: {
    type: String,
    enum: ['SD', 'HD', 'Full HD', '4K'],
    default: 'HD'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  badge: {
    type: String,
    default: ''
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  trialDays: {
    type: Number,
    default: 0,
    min: 0
  },
  razorpayPlanId: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

planSchema.index({ isActive: 1 });
planSchema.index({ sortOrder: 1 });

export default mongoose.model('Plan', planSchema);