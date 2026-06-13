import mongoose from 'mongoose';

const contentViewSchema = new mongoose.Schema({
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'contentType'
  },
  contentType: {
    type: String,
    enum: ['Series'],
    default: 'Series'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  dateKey: {
    type: String,
    required: true,
    description: 'YYYY-MM-DD for daily aggregation'
  }
}, {
  timestamps: true
});

contentViewSchema.index({ contentId: 1, createdAt: -1 });
contentViewSchema.index({ dateKey: 1 });
contentViewSchema.index({ contentId: 1, dateKey: 1 });

export default mongoose.model('ContentView', contentViewSchema);