import mongoose from 'mongoose';

const seriesSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
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
  banner: {
    type: String,
    default: ''
  },
  media: {
    posterPublicId: { type: String, default: '' },
    bannerPublicId: { type: String, default: '' }
  },
  logoUrl: {
    type: String,
    default: ''
  },
  trailerUrl: {
    type: String,
    default: ''
  },
  // Frontend expects "poster" — transform layer maps thumbnail → poster
  // Frontend expects "year" — transform layer maps releaseYear → year
  // Frontend expects "seasons"

  genre: [{
    type: String,
    default: []
  }],
  tags: [{
    type: String,
    default: []
  }],
  contentType: {
    type: String,
    enum: ['series', 'movie'],
    default: 'series'
  },
  cast: [{
    name: String,
    role: String,
    image: String
  }],
  director: String,
  releaseYear: Number,
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  // Frontend uses "seasons" as a display number for how many seasons exist
  seasons: {
    type: Number,
    default: 1
  },
  totalEpisodes: {
    type: Number,
    default: 0
  },
  // Frontend "premium" flag
  premium: {
    type: Boolean,
    default: false
  },
  // Frontend "tag" — display category (Top Pick, New, Recommended, Upcoming)
  tag: {
    type: String,
    enum: ['Top Pick', 'New', 'Recommended', 'Upcoming', ''],
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'upcoming', 'ongoing', 'completed'],
    default: 'draft'
  },
  categories: [{
    type: String,
    enum: ['top-picks', 'recommended', 'new-releases', 'upcoming'],
    default: []
  }],
  browseCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
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

// Indexes for faster category and sorting queries
seriesSchema.index({ categories: 1, isPublished: 1 });
seriesSchema.index({ browseCategories: 1, isPublished: 1 });
seriesSchema.index({ views: -1 });
seriesSchema.index({ rating: -1 });
seriesSchema.index({ createdAt: -1 });
seriesSchema.index({ title: 'text' });
seriesSchema.index({ tag: 1, isPublished: 1 });

export default mongoose.model('Series', seriesSchema);
