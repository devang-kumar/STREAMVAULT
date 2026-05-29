import 'dotenv/config.js';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import logger from './config/logger.js';

const app = express();

// ─── Security Middlewares ──────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// ─── Rate Limiting ────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: { success: false, message: 'Too many requests, please try again later.' },
  skip: (req) => req.path.startsWith('/api/admin') // Skip rate limiting for admin uploads
});
app.use('/api/', limiter);

// ─── CORS Configuration ──────────────────────────────────────────────────
const corsOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:3000',
  'https://streamvault-wheat-three.vercel.app',
]);
if (process.env.CLIENT_URL) {
  corsOrigins.add(process.env.CLIENT_URL.replace(/\/$/, ''));
}
app.use(cors({
  origin(origin, callback) {
    if (!origin || corsOrigins.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true,
}));

// ─── Body Parsing ────────────────────────────────────────────────────────
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cookieParser());

// ─── Database Connection ──────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/streamvault';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    logger.info('✅ MongoDB Connected');
    try {
      const { ensureDefaultPlans } = await import('./utils/ensurePlans.js');
      await ensureDefaultPlans();
    } catch (err) {
      logger.warn('⚠️ Could not ensure default plans:', err.message);
    }
  })
  .catch(err => logger.error('❌ MongoDB Connection Error:', err));

mongoose.connection.on('error', (err) => {
  logger.error('❌ MongoDB runtime error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️ MongoDB disconnected');
});

// ─── API Routes ───────────────────────────────────────────────────────────
// Note: Frontend API client (src/api/client.js) maps these exact paths
// Frontend uses /api/shows, /api/episodes?showId=, /api/auth, etc.
// The routes below maintain COMPLETE backward compatibility with frontend expectations.

import authRoutes from './routes/auth.js';
import showsRoutes from './routes/shows.js';
import episodesRoutes from './routes/episodes.js';
import usersRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/upload.js';
import categoriesRoutes from './routes/categories.js';
import paymentsRoutes from './routes/payments.js';
import cmsRoutes from './routes/cms.js';
import plansRoutes from './routes/plans.js';

app.use('/api/auth', authRoutes);
app.use('/api/shows', showsRoutes);
app.use('/api/episodes', episodesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', uploadRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/plans', plansRoutes);

// ─── Health Check ────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'streamvault-server',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
});

// ─── Global Error Handler ────────────────────────────────────────────────
app.use((err, req, res, next) => {
  // Handle Mongoose CastError (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: `Invalid ${err.path}: "${err.value}"` });
  }
  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, message: messages.join(', ') });
  }
  // Handle Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ success: false, message: `Duplicate ${field}. This ${field} already exists.` });
  }

  logger.error(`[Error] ${err.message}`, { stack: err.stack });
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ─── Start Server ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`Server running on http://localhost:${PORT}`);
});

// ─── Server Timeout for Large File Uploads ───────────────────────────────
server.timeout = 600000;      // 10 minutes
server.keepAliveTimeout = 600000;
server.headersTimeout = 601000;

// ─── Graceful Shutdown ───────────────────────────────────────────────────
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    logger.info('HTTP server closed');
    try {
      await mongoose.connection.close(false);
      logger.info('MongoDB connection closed');
    } catch (_) {}
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    logger.info('HTTP server closed');
    try {
      await mongoose.connection.close(false);
      logger.info('MongoDB connection closed');
    } catch (_) {}
    process.exit(0);
  });
});