import mongoose from 'mongoose';

const contactSubmissionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  description: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('ContactSubmission', contactSubmissionSchema);
