import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  key: { type: String, default: 'platform', unique: true },
  siteName: { type: String, default: 'StreamVault' },
  siteUrl: { type: String, default: 'http://localhost:5173' },
  allowRegistration: { type: Boolean, default: true },
  requireEmailVerification: { type: Boolean, default: false },
  enableNotifications: { type: Boolean, default: true },
  enableAnalytics: { type: Boolean, default: true },
  maintenanceMode: { type: Boolean, default: false },
  enableCaching: { type: Boolean, default: true },
  cacheDuration: { type: String, default: '5' },
  maxUploadSize: { type: String, default: '100' },
  enableCloudinary: { type: Boolean, default: true },
  darkMode: { type: Boolean, default: true },
  accentColor: { type: String, default: '#f5c518' },
  autoPlay: { type: Boolean, default: true },
  showThumbnails: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Settings', settingsSchema);
