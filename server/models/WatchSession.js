import mongoose from 'mongoose';

const watchSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  episode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Episode',
    default: null
  },
  series: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Series',
    required: true
  },
  contentType: {
    type: String,
    enum: ['series', 'movie'],
    default: 'series'
  },
  durationWatched: {
    type: Number, // in seconds
    default: 0
  },
  episodeDuration: {
    type: Number, // in seconds
    default: 0
  },
  progress: {
    type: Number, // 0-100
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  lastPosition: {
    type: Number, // in seconds
    default: 0
  },
  dateKey: {
    type: String, // YYYY-MM-DD
    required: true
  }
}, {
  timestamps: true
});

watchSessionSchema.index({ user: 1, createdAt: -1 });
watchSessionSchema.index({ series: 1, dateKey: 1 });
watchSessionSchema.index({ episode: 1 });
watchSessionSchema.index({ dateKey: 1 });
watchSessionSchema.index({ completed: 1 });

export default mongoose.model('WatchSession', watchSessionSchema);