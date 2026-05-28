import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 60
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
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  showOnHome: {
    type: Boolean,
    default: true
  },
  sortBy: {
    type: String,
    enum: ['views', 'rating', 'createdAt', 'releaseYear'],
    default: 'views'
  }
}, {
  timestamps: true
});

categorySchema.index({ isActive: 1, showOnHome: 1, displayOrder: 1 });

export default mongoose.model('Category', categorySchema);