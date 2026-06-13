import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  releaseYear: {
    type: Number,
    required: true
  },
  durationMinutes: {
    type: Number,
    required: true
  },
  director: {
    type: String,
    default: ''
  },
  rating: {
    type: String,
    enum: ['G', 'PG', 'PG-13', 'R', 'NR', ''],
    default: ''
  },
  genre: [{
    type: String,
    default: []
  }],
  tags: [{
    type: String,
    default: []
  }],
  cast: [{
    name: String,
    role: String,
    image: String
  }],
  banner: {
    type: String,
    default: ''
  },
  bannerPublicId: {
    type: String,
    default: ''
  },
  thumbnail: {
    type: String,
    default: ''
  },
  poster: {
    type: String,
    default: ''
  },
  posterPublicId: {
    type: String,
    default: ''
  },
  trailerUrl: {
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
      type: Number,
      default: 0
    }
  },
  premium: {
    type: Boolean,
    default: false
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

movieSchema.index({ title: 'text', description: 'text' });
movieSchema.index({ genre: 1, status: 1 });
movieSchema.index({ releaseYear: -1 });
movieSchema.index({ views: -1 });

export default mongoose.model('Movie', movieSchema);
