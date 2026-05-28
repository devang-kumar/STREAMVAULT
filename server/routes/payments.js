import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Initialize Razorpay instance
const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys are missing in environment variables');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// @route   POST /api/payments/create-order
// @desc    Create a new Razorpay order
// @access  Private
router.post(
  '/create-order',
  protect,
  [
    body('planId').notEmpty().withMessage('Plan ID is required'),
    body('amount').isNumeric().withMessage('Amount is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { planId, amount } = req.body;

    try {
      const razorpay = getRazorpayInstance();
      
      const options = {
        amount: amount, // Amount in paise
        currency: 'INR',
        receipt: `rcpt_${req.user._id.toString().slice(-4)}_${Date.now()}`,
        notes: {
          planId: planId,
          userId: req.user._id.toString()
        }
      };

      const order = await razorpay.orders.create(options);
      
      res.json({
        orderId: order.id,
        currency: order.currency,
        amount: order.amount,
        key: process.env.RAZORPAY_KEY_ID // Send public key to frontend
      });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ message: 'Error creating payment order', error: error.message });
    }
  }
);

// @route   POST /api/payments/verify
// @desc    Verify payment and update user subscription
// @access  Private
router.post('/verify', protect, async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      planId,
      amount
    } = req.body;

    // Verify signature
    const bodyText = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(bodyText.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Determine plan duration
    let daysToAdd = 0;
    if (planId === 'weekly') daysToAdd = 7;
    else if (planId === 'monthly') daysToAdd = 30;
    else if (planId === 'yearly') daysToAdd = 365;
    else daysToAdd = 30; // fallback

    // Add 7 days free trial for new subscriptions
    daysToAdd += 7;

    // Update user subscription
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysToAdd);

    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        'subscription.status': 'Premium',
        'subscription.expiryDate': expiryDate,
        'subscription.planId': planId
      }
    });

    res.json({ message: 'Payment verified successfully', success: true });
  } catch (error) {
    console.error('Payment verification failed:', error);
    res.status(500).json({ message: 'Payment verification failed' });
  }
});

export default router;
