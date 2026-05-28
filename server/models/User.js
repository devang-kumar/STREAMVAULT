import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    minlength: 6
  },
  githubId: {
    type: String,
    default: ''
  },
  authProvider: {
    type: String,
    default: 'local'
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  profile: {
    avatar: {
      type: String,
      default: ''
    },
    preferences: {
      type: [String],
      default: []
    }
  },
  watchlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Series'
  }],
  watchHistory: [{
    series: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Series'
    },
    episode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Episode'
    },
    watchedAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      default: 0
    }
  }],
  subscription: {
    status: {
      type: String,
      enum: ['Basic', 'Premium'],
      default: 'Basic'
    },
    expiryDate: Date,
    planId: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving (only if password exists and is modified)
userSchema.pre('save', async function(next) {
  if (!this.password || !this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Check if subscription is expired and downgrade if necessary
userSchema.methods.checkSubscription = async function () {
  if (this.subscription.status === 'Premium' && this.subscription.expiryDate) {
    if (new Date() > this.subscription.expiryDate) {
      this.subscription.status = 'Basic';
      await this.save();
    }
  }
  return this;
};

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);