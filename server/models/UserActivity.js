import mongoose from 'mongoose';

const userActivitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: String,
    enum: ['login', 'register', 'logout', 'watch', 'search', 'browse', 'subscribe', 'profile_update'],
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  dateKey: {
    type: String,
    required: true,
    description: 'YYYY-MM-DD for easy daily aggregation'
  }
}, {
  timestamps: true
});

// Compound indexes for fast aggregation queries
userActivitySchema.index({ user: 1, event: 1, createdAt: -1 });
userActivitySchema.index({ dateKey: 1, event: 1 });
userActivitySchema.index({ dateKey: 1 });
userActivitySchema.index({ createdAt: -1 });

export default mongoose.model('UserActivity', userActivitySchema);