import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  otpHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 });

const Otp = mongoose.model('Otp', otpSchema);
export default Otp;
