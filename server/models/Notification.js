import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['content', 'subscription', 'payment', 'announcement', 'account', 'system', 'security', 'admin'],
    default: 'system',
    index: true
  },
  category: {
    type: String,
    enum: ['new_movie', 'new_series', 'new_season', 'new_episode',
           'subscription_activated', 'subscription_renewed', 'subscription_expiring',
           'payment_success', 'payment_failed',
           'email_changed', 'password_changed', 'login_new_device',
           'admin_custom', 'system_announcement', 'other'],
    default: 'other'
  },
  targetAudience: {
    type: String,
    enum: ['all', 'premium', 'free', 'admin', 'specificUser'],
    default: 'specificUser'
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  isSystemGenerated: {
    type: Boolean,
    default: true
  },
  actionUrl: {
    type: String,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },
  // For admin-sent notifications, track who sent it
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });

// Auto-delete notifications older than 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model('Notification', notificationSchema);