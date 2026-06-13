import mongoose from 'mongoose';

const footerPageSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  lastUpdated: { type: String, default: '22-06-2025' },
  content: { type: String, default: '' },
  faqs: [
    {
      question: { type: String, required: true },
      answer: { type: String, required: true }
    }
  ],
  settings: {
    contactEmail: { type: String, default: 'xyz@domain.com' },
    careersText: { type: String, default: 'no job openings update soon.' }
  }
}, { timestamps: true });

export default mongoose.model('FooterPage', footerPageSchema);