import Notification from '../models/Notification.js';
import User from '../models/User.js';
import logger from '../config/logger.js';

/**
 * Central notification service — all notifications should be created through this service.
 * Handles:
 * - Single user notifications
 * - Bulk/audience-based notifications
 * - System-generated notifications
 * - Admin custom notifications
 */
class NotificationService {
  /**
   * Create a notification for a specific user.
   * @param {Object} options
   * @param {string} options.userId - Target user ID
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message
   * @param {string} options.type - Notification type
   * @param {string} options.category - Notification category
   * @param {string} [options.actionUrl] - URL to navigate to on click
   * @param {Object} [options.metadata] - Additional data
   * @param {string} [options.priority] - low, normal, high
   * @param {boolean} [options.isSystemGenerated] - Whether this is system-generated
   * @param {string} [options.sentBy] - Admin who sent it
   * @returns {Promise<Object>} Created notification
   */
  static async create({
    userId,
    title,
    message,
    type = 'system',
    category = 'other',
    actionUrl = '',
    metadata = {},
    priority = 'normal',
    isSystemGenerated = true,
    sentBy = null
  }) {
    try {
      if (!userId || !title || !message) {
        throw new Error('userId, title, and message are required');
      }

      const notification = await Notification.create({
        userId,
        title,
        message,
        type,
        category,
        actionUrl,
        metadata,
        priority,
        isSystemGenerated,
        sentBy
      });

      return notification;
    } catch (error) {
      logger.error(`NotificationService.create error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create notifications for multiple users at once.
   * @param {string[]} userIds - Array of user IDs
   * @param {Object} notificationData - Notification data (without userId)
   * @returns {Promise<Object>} Result with count of created notifications
   */
  static async createBulk(userIds, notificationData) {
    try {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return { created: 0, errors: 0 };
      }

      const notifications = userIds.map(userId => ({
        userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || 'system',
        category: notificationData.category || 'other',
        actionUrl: notificationData.actionUrl || '',
        metadata: notificationData.metadata || {},
        priority: notificationData.priority || 'normal',
        isSystemGenerated: notificationData.isSystemGenerated !== false,
        sentBy: notificationData.sentBy || null,
        targetAudience: notificationData.targetAudience || 'specificUser'
      }));

      const result = await Notification.insertMany(notifications, { ordered: false });
      return { created: result.length, errors: 0 };
    } catch (error) {
      // Bulk write errors might be partial
      if (error.insertedDocs) {
        return { created: error.insertedDocs.length, errors: userIds.length - error.insertedDocs.length };
      }
      logger.error(`NotificationService.createBulk error: ${error.message}`);
      return { created: 0, errors: userIds.length };
    }
  }

  /**
   * Send notification to users based on target audience.
   * @param {string} targetAudience - all, premium, free, admin, specificUser
   * @param {Object} notificationData - Notification data
   * @param {string} [specificUserId] - Required if targetAudience is 'specificUser'
   * @returns {Promise<Object>} Result with count
   */
  static async sendToAudience(targetAudience, notificationData, specificUserId = null) {
    try {
      let query = { isActive: true };

      switch (targetAudience) {
        case 'all':
          // No additional filter
          break;
        case 'premium':
          query['subscription.status'] = 'Premium';
          break;
        case 'free':
          query['subscription.status'] = { $ne: 'Premium' };
          break;
        case 'admin':
          query.role = 'admin';
          break;
        case 'specificUser':
          if (!specificUserId) {
            throw new Error('specificUserId is required for specificUser target');
          }
          return this.create({
            ...notificationData,
            userId: specificUserId,
            targetAudience: 'specificUser'
          });
        default:
          throw new Error(`Invalid target audience: ${targetAudience}`);
      }

      const users = await User.find(query).select('_id').lean();
      const userIds = users.map(u => String(u._id));

      if (userIds.length === 0) {
        return { created: 0, errors: 0 };
      }

      return this.createBulk(userIds, {
        ...notificationData,
        targetAudience
      });
    } catch (error) {
      logger.error(`NotificationService.sendToAudience error: ${error.message}`);
      throw error;
    }
  }

  // ─── Convenience Methods for System Events ────────────────────────────────

  static async notifyNewMovieAdded(movieTitle, movieId) {
    const users = await User.find({ isActive: true }).select('_id').lean();
    return this.createBulk(users.map(u => String(u._id)), {
      title: '🎥 New Movie Added',
      message: `${movieTitle} is now available to stream.`,
      type: 'content',
      category: 'new_movie',
      actionUrl: `/series/${movieId}`,
      metadata: { movieId, movieTitle },
      isSystemGenerated: true
    });
  }

  static async notifyNewSeriesAdded(seriesTitle, seriesId) {
    const users = await User.find({ isActive: true }).select('_id').lean();
    return this.createBulk(users.map(u => String(u._id)), {
      title: '📺 New Series Added',
      message: `${seriesTitle} is now streaming.`,
      type: 'content',
      category: 'new_series',
      actionUrl: `/series/${seriesId}`,
      metadata: { seriesId, seriesTitle },
      isSystemGenerated: true
    });
  }

  static async notifyNewSeason(seriesTitle, seasonNumber, seriesId) {
    const users = await User.find({ isActive: true }).select('_id').lean();
    return this.createBulk(users.map(u => String(u._id)), {
      title: '🎬 New Season Released',
      message: `Season ${seasonNumber} of ${seriesTitle} is available.`,
      type: 'content',
      category: 'new_season',
      actionUrl: `/series/${seriesId}`,
      metadata: { seriesId, seriesTitle, seasonNumber },
      isSystemGenerated: true
    });
  }

  static async notifyNewEpisode(seriesTitle, episodeNumber, seriesId) {
    const users = await User.find({ isActive: true }).select('_id').lean();
    return this.createBulk(users.map(u => String(u._id)), {
      title: '🎞 New Episode Available',
      message: `Episode ${episodeNumber} of ${seriesTitle} is available now.`,
      type: 'content',
      category: 'new_episode',
      actionUrl: `/series/${seriesId}`,
      metadata: { seriesId, seriesTitle, episodeNumber },
      isSystemGenerated: true
    });
  }

  static async notifySubscriptionActivated(userId, planName = 'Premium') {
    return this.create({
      userId,
      title: '💳 Subscription Activated',
      message: `Your ${planName} plan is now active.`,
      type: 'subscription',
      category: 'subscription_activated',
      actionUrl: '/subscription',
      metadata: { planName },
      isSystemGenerated: true
    });
  }

  static async notifySubscriptionRenewed(userId, planName = 'Premium') {
    return this.create({
      userId,
      title: '💳 Subscription Renewed',
      message: 'Your subscription has been renewed successfully.',
      type: 'subscription',
      category: 'subscription_renewed',
      actionUrl: '/subscription',
      metadata: { planName },
      isSystemGenerated: true
    });
  }

  static async notifySubscriptionExpiring(userId, daysLeft) {
    return this.create({
      userId,
      title: '⚠️ Subscription Expiring',
      message: `Your subscription expires in ${daysLeft} days.`,
      type: 'subscription',
      category: 'subscription_expiring',
      actionUrl: '/subscription',
      priority: 'high',
      metadata: { daysLeft },
      isSystemGenerated: true
    });
  }

  static async notifyPaymentSuccess(userId, metadata = {}) {
    return this.create({
      userId,
      title: '✅ Payment Successful',
      message: 'Payment processed successfully.',
      type: 'payment',
      category: 'payment_success',
      actionUrl: '/subscription',
      metadata,
      isSystemGenerated: true
    });
  }

  static async notifyPaymentFailed(userId, metadata = {}) {
    return this.create({
      userId,
      title: '❌ Payment Failed',
      message: 'Payment could not be processed. Please try again.',
      type: 'payment',
      category: 'payment_failed',
      actionUrl: '/subscription',
      priority: 'high',
      metadata,
      isSystemGenerated: true
    });
  }

  static async notifyEmailChanged(userId) {
    return this.create({
      userId,
      title: '✉️ Email Updated',
      message: 'Your email address has been updated.',
      type: 'security',
      category: 'email_changed',
      isSystemGenerated: true
    });
  }

  static async notifyPasswordChanged(userId) {
    return this.create({
      userId,
      title: '🔒 Password Changed',
      message: 'Your password was updated successfully.',
      type: 'security',
      category: 'password_changed',
      isSystemGenerated: true
    });
  }

  static async notifyNewLogin(userId, metadata = {}) {
    return this.create({
      userId,
      title: '🔐 New Login Detected',
      message: 'A login was detected from a new device.',
      type: 'security',
      category: 'login_new_device',
      priority: 'high',
      metadata,
      isSystemGenerated: true
    });
  }
}

export default NotificationService;