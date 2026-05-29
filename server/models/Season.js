import mongoose from 'mongoose';

const seasonSchema = new mongoose.Schema({
  series: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Series',
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
  releaseYear: {
    type: Number
  },
  poster: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  }
}, {
  timestamps: true
});

seasonSchema.index({ series: 1, order: 1 });

export default mongoose.model('Season', seasonSchema);