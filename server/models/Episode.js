import mongoose from 'mongoose';

const episodeSchema = new mongoose.Schema({
  series: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Series',
    required: true
  },
  season: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Season'
  },
  seasonNumber: {
    type: Number,
    default: 1
  },
  episodeNumber: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  durationMinutes: {
    type: Number,
    default: 0
  },
  thumbnail: {
    type: String,
    default: ''
  },
  video: {
    url: {
      type: String,
      default: '/John_Wick.mp4'
    },
    publicId: {
      type: String,
      default: ''
    },
    duration: {
      type: Number, // in seconds
      default: 0
    }
  },
  order: {
    type: Number,
    default: 1
  },
  premium: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  releaseDate: {
    type: Date,
    default: Date.now
  },
  views: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for series + season + episode number + order
episodeSchema.index({ series: 1, season: 1, episodeNumber: 1 }, { unique: true });
episodeSchema.index({ series: 1, seasonNumber: 1, order: 1 });
episodeSchema.index({ series: 1, seasonNumber: 1, episodeNumber: 1 }, { unique: true });

export default mongoose.model('Episode', episodeSchema);