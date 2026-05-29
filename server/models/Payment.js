import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  razorpayOrderId: {
    type: String,
    required: true
  },
  razorpayPaymentId: {
    type: String,
    default: ''
  },
  razorpaySignature: {
    type: String,
    default: ''
  },
  planId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    description: 'Amount in paise'
  },
  amountINR: {
    type: Number,
    required: true,
    description: 'Amount in rupees'
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['created', 'captured', 'failed', 'refunded'],
    default: 'created'
  },
  billingCycle: {
    type: String,
    enum: ['weekly', 'monthly', 'yearly'],
    default: 'monthly'
  },
  planName: {
    type: String,
    default: ''
  },
  failureReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ razorpayOrderId: 1 });

export default mongoose.model('Payment', paymentSchema);