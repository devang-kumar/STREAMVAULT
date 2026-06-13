import { Router } from 'express';
import Series from '../models/Series.js';
import Episode from '../models/Episode.js';
import Movie from '../models/Movie.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import Plan from '../models/Plan.js';
import UserActivity from '../models/UserActivity.js';
import WatchSession from '../models/WatchSession.js';
import Settings from '../models/Settings.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { upload, uploadToCloudinary, deleteFromCloudinary, generateSignature } from '../config/cloudinary.js';
import logger from '../config/logger.js';
import { flushCache } from '../middleware/cache.js';
import { transformSeries, transformEpisode, transformUser } from '../utils/transform.js';
import { validateIdParam, isValidObjectId } from '../utils/validateId.js';
import { toBool, toNum, safeParseArray, parseDuration, resolveSeriesId, resolveYear } from '../utils/compat.js';
import NotificationService from '../services/NotificationService.js';

const router = Router();

const calcGrowth = (curr, prev) => {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Number(((curr - prev) / prev * 100).toFixed(1));
};

const formatTimeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const EVENT_LABELS = {
  login: 'User logged in',
  register: 'New user registered',
  logout: 'User logged out',
  watch: 'Content watched',
  watch_start: 'Started watching content',
  watch_complete: 'Finished watching episode',
  search: 'User searched content',
  browse: 'User browsed catalog',
  subscribe: 'New subscription',
  profile_update: 'Profile updated',
};

// Authenticated users can record watch/activity (feeds admin analytics)
router.use(protect);

router.post('/activity', async (req, res) => {
  try {
    const { event, metadata } = req.body;
    if (!event) return res.status(400).json({ message: 'event is required' });

    const today = new Date().toISOString().slice(0, 10);
    await UserActivity.create({
      user: req.user.id,
      event,
      metadata: metadata || {},
      dateKey: today
    });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to track activity' });
  }
});

router.post('/watch/save', async (req, res) => {
  try {
    const { episodeId, seriesId, durationWatched, episodeDuration, progress, completed, lastPosition } = req.body;
    if (!seriesId) return res.status(400).json({ message: 'seriesId is required' });

    const today = new Date().toISOString().slice(0, 10);
    const epDuration = episodeDuration || 0;
    const prog = Math.min(progress || 0, 100);
    const durWatched = Math.min(durationWatched || 0, epDuration);

    await WatchSession.create({
      user: req.user.id,
      episode: episodeId || null,
      series: seriesId,
      contentType: 'series',
      durationWatched: Math.floor(durWatched),
      episodeDuration: Math.floor(epDuration),
      progress: prog,
      completed: completed === true || prog >= 90,
      lastPosition: lastPosition || 0,
      dateKey: today
    });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to save watch session' });
  }
});

// Admin-only routes below
router.use(adminOnly);

// ─── ADMIN STATS ──────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const [
      totalUsers, activeUsers, totalSeries, totalMovies, totalEpisodes,
      publishedSeries, publishedMovies, premiumShows,
      usersThisMonth, usersLastMonth, episodesThisWeek, watchSessionsThisWeek,
      allUsers, allShows
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isActive: true }),
      Series.countDocuments({ contentType: { $ne: 'movie' } }),
      Movie.countDocuments({}),
      Episode.countDocuments({}),
      Series.countDocuments({ contentType: { $ne: 'movie' }, status: 'published' }),
      Movie.countDocuments({ status: 'published' }),
      Series.countDocuments({ premium: true }),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      User.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      Episode.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      WatchSession.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      User.find({}, 'subscription.status'),
      Series.find({ contentType: { $ne: 'movie' } }, 'episodeCount'),
    ]);

    const totalShows = totalSeries + totalMovies;
    const totalEpisodesFromSeries = allShows.reduce((acc, s) => acc + (s.episodeCount || 0), 0);
    const episodeCount = totalEpisodes > 0 ? totalEpisodes : totalEpisodesFromSeries;

    const plans = { Basic: 0, Standard: 0, Premium: 0, Free: 0 };
    allUsers.forEach(u => {
      const plan = u.subscription?.status || 'Free';
      if (plans[plan] !== undefined) plans[plan] += 1;
      else plans.Free += 1;
    });

    return res.json({
      totalUsers: activeUsers,
      totalUsersAll: totalUsers,
      totalShows,
      totalSeries,
      totalMovies,
      totalEpisodes: episodeCount,
      publishedSeries,
      publishedMovies,
      premiumShows,
      plans,
      userGrowth: calcGrowth(usersThisMonth, usersLastMonth),
      episodeGrowth: watchSessionsThisWeek > 0
        ? calcGrowth(watchSessionsThisWeek, Math.max(episodesThisWeek, 1))
        : calcGrowth(episodesThisWeek, 0),
      contentGrowth: calcGrowth(publishedSeries + publishedMovies, totalShows - (publishedSeries + publishedMovies)),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch stats' });
  }
});

// GET /api/admin/analytics
router.get('/analytics', async (req, res) => {
  try {
    const now = new Date();
    const twelveMonthsAgo = new Date(now);
    twelveMonthsAgo.setMonth(now.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [
      allUsers,
      topSeries,
      topMovies,
      monthlyPayments,
      allSessions,
      recentActivities,
      usersThisMonth,
      usersLastMonth,
      seriesThisMonth,
      seriesLastMonth,
      weeklyActivityRaw,
    ] = await Promise.all([
      User.find({}, 'createdAt subscription.status isActive'),
      Series.find({ contentType: { $ne: 'movie' } }, 'title views status').sort({ views: -1 }).limit(5).lean(),
      Movie.find({}, 'title views status').sort({ views: -1 }).limit(5).lean(),
      Payment.aggregate([
        { $match: { status: 'captured', createdAt: { $gte: twelveMonthsAgo } } },
        { $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: '$amountINR' },
        }},
      ]),
      WatchSession.find({}).lean(),
      UserActivity.find({}).sort({ createdAt: -1 }).limit(10).populate('user', 'name email').lean(),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      User.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      Series.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Series.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      UserActivity.aggregate([
        { $match: { createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: '$dateKey', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const monthRevenues = Array(12).fill(0);
    monthlyPayments.forEach((row) => {
      const monthIndex = (row._id.year - now.getFullYear()) * 12 + (row._id.month - 1 - now.getMonth()) + 11;
      if (monthIndex >= 0 && monthIndex < 12) monthRevenues[monthIndex] = row.total;
    });

    let freeCount = 0, basicCount = 0, standardCount = 0, premiumCount = 0;
    const totalUsers = allUsers.length;
    allUsers.forEach(u => {
      const plan = u.subscription?.status;
      if (plan === 'Basic') basicCount++;
      else if (plan === 'Standard') standardCount++;
      else if (plan === 'Premium') premiumCount++;
      else freeCount++;
    });

    const planDistribution = totalUsers > 0 ? [
      { plan: 'Free', pct: Math.round((freeCount / totalUsers) * 100), color: 'bg-gray-400' },
      { plan: 'Basic', pct: Math.round((basicCount / totalUsers) * 100), color: 'bg-blue-400' },
      { plan: 'Standard', pct: Math.round((standardCount / totalUsers) * 100), color: 'bg-green-400' },
      { plan: 'Premium', pct: Math.round((premiumCount / totalUsers) * 100), color: 'bg-[#F5C518]' },
    ].filter(p => p.pct > 0) : [{ plan: 'Free', pct: 100, color: 'bg-gray-400' }];

    const combinedTop = [...topSeries, ...topMovies]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);

    const topContent = combinedTop.map(s => ({
      title: s.title,
      views: (s.views || 0) >= 1000 ? ((s.views || 0) / 1000).toFixed(1) + 'k' : String(s.views || 0),
      trend: s.status === 'published' ? 'Live' : 'Draft',
    }));

    const totalViews = combinedTop.reduce((acc, s) => acc + (s.views || 0), 0);
    const totalRevenue = monthRevenues.reduce((acc, val) => acc + val, 0);
    const totalSessions = allSessions.length;
    const totalWatchSeconds = allSessions.reduce((s, sess) => s + (sess.durationWatched || 0), 0);
    const avgWatchMinutes = totalSessions > 0 ? Math.round((totalWatchSeconds / totalSessions) / 60) : 0;
    const inactiveUsers = allUsers.filter(u => u.isActive === false).length;
    const churnRate = totalUsers > 0 ? Number(((inactiveUsers / totalUsers) * 100).toFixed(1)) : 0;

    const kpis = [
      { label: 'Total Views', value: totalViews >= 1000 ? (totalViews / 1000).toFixed(1) + 'k' : String(totalViews), sub: 'All time' },
      { label: 'Avg Watch Time', value: avgWatchMinutes > 0 ? `${avgWatchMinutes} min` : '0 min', sub: 'Per session' },
      { label: 'Churn Rate', value: `${churnRate}%`, sub: 'Inactive users' },
      { label: 'Revenue', value: '₹' + totalRevenue.toLocaleString('en-IN'), sub: 'Last 12 months (payments)' },
    ];

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const found = weeklyActivityRaw.find(a => a._id === key);
      weeklyActivity.push({
        label: dayLabels[d.getDay()],
        value: found?.count || 0,
      });
    }

    const recentEvents = recentActivities.map(a => ({
      event: a.event,
      text: EVENT_LABELS[a.event] || a.event.replace(/_/g, ' '),
      time: formatTimeAgo(a.createdAt),
      userName: a.user?.name || a.user?.email || 'User',
      metadata: a.metadata || {},
    }));

    const metrics = {
      userGrowth: calcGrowth(usersThisMonth, usersLastMonth),
      contentGrowth: calcGrowth(seriesThisMonth, seriesLastMonth),
      episodeGrowth: totalSessions > 0 ? calcGrowth(
        allSessions.filter(s => new Date(s.createdAt) >= startOfMonth).length,
        allSessions.filter(s => {
          const d = new Date(s.createdAt);
          return d >= startOfLastMonth && d <= endOfLastMonth;
        }).length
      ) : 0,
    };

    return res.json({
      revenueData: monthRevenues,
      topContent,
      planDistribution,
      kpis,
      weeklyActivity,
      recentEvents,
      metrics,
      totalUsers,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch analytics' });
  }
});

// GET /api/admin/content-performance
router.get('/content-performance', async (req, res) => {
  try {
    const allSessions = await WatchSession.find({}).lean();
    const seriesMap = {};
    allSessions.forEach(s => {
      const sid = String(s.series);
      if (!seriesMap[sid]) seriesMap[sid] = { sessions: 0, totalDuration: 0, completed: 0, uniqueUsers: new Set() };
      seriesMap[sid].sessions += 1;
      seriesMap[sid].totalDuration += s.durationWatched || 0;
      if (s.completed) seriesMap[sid].completed += 1;
      if (s.user) seriesMap[sid].uniqueUsers.add(String(s.user));
    });

    const seriesData = await Series.find({ _id: { $in: Object.keys(seriesMap) } }, 'title views thumbnail status').lean();
    const titleMap = Object.fromEntries(seriesData.map(s => [String(s._id), s]));

    const performance = Object.entries(seriesMap).map(([sid, data]) => ({
      seriesId: sid,
      title: titleMap[sid]?.title || 'Unknown',
      views: titleMap[sid]?.views || 0,
      status: titleMap[sid]?.status || 'draft',
      sessions: data.sessions,
      uniqueViewers: data.uniqueUsers.size,
      avgWatchMinutes: data.sessions > 0 ? Math.round((data.totalDuration / data.sessions) / 60 * 10) / 10 : 0,
      completionRate: data.sessions > 0 ? Number(((data.completed / data.sessions) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.sessions - a.sessions);

    const topSeries = await Series.find({ contentType: { $ne: 'movie' } }, 'title views').sort({ views: -1 }).limit(10).lean();
    const unwatched = topSeries.filter(s => !seriesMap[String(s._id)]);

    return res.json({
      performance,
      unwatchedSeries: unwatched.map(s => ({ title: s.title, views: s.views || 0 })),
      totalSessions: allSessions.length,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch content performance' });
  }
});

// GET /api/admin/activity — comprehensive user activity analytics
router.get('/activity', async (req, res) => {
  try {
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 29); thirtyDaysAgo.setHours(0, 0, 0, 0);
    const twelveWeeksAgo = new Date(now); twelveWeeksAgo.setDate(now.getDate() - (12 * 7 - 1)); twelveWeeksAgo.setHours(0, 0, 0, 0);
    const twelveMonthsAgo = new Date(now); twelveMonthsAgo.setMonth(now.getMonth() - 11); twelveMonthsAgo.setDate(1); twelveMonthsAgo.setHours(0, 0, 0, 0);

    // ── Current DAU/WAU/MAU ──
    const [dauResult, wauResult, mauResult, totalUsers, activeUsers] = await Promise.all([
      UserActivity.distinct('user', { dateKey: todayKey }).then(users => users.length),
      UserActivity.distinct('user', { createdAt: { $gte: startOfWeek } }).then(users => users.length),
      UserActivity.distinct('user', { createdAt: { $gte: startOfMonth } }).then(users => users.length),
      User.countDocuments({}),
      User.countDocuments({ isActive: true })
    ]);

    // ── Previous periods for growth ──
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().slice(0, 10);
    const lastWeekStart = new Date(startOfWeek); lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(startOfWeek); lastWeekEnd.setDate(lastWeekEnd.getDate() - 1); lastWeekEnd.setHours(23, 59, 59, 999);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0); lastMonthEnd.setHours(23, 59, 59, 999);

    const [prevDau, prevWau, prevMau] = await Promise.all([
      UserActivity.distinct('user', { dateKey: yesterdayKey }).then(users => users.length),
      UserActivity.distinct('user', { createdAt: { $gte: lastWeekStart, $lte: lastWeekEnd } }).then(users => users.length),
      UserActivity.distinct('user', { createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } }).then(users => users.length)
    ]);

    const calcGrowth = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Number(((curr - prev) / prev * 100).toFixed(1));
    };

    // ── Daily active users trend — use dateKey field instead of createdAt to avoid aggregation issues ──
    const dailyActivity = await UserActivity.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: {
          _id: '$dateKey',
          events: { $sum: 1 },
          uniqueUsers: { $addToSet: '$user' }
      }},
      { $sort: { _id: 1 } }
    ]);

    const dailyTrend = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const found = dailyActivity.find(a => a._id === key);
      dailyTrend.push({
        date: key,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dau: found ? found.uniqueUsers?.length || 0 : 0,
        events: found?.events || 0
      });
    }

    // ── Weekly active users trend — use dateKey + manual week grouping to avoid $dateToString issues ──
    const allWeeklyDocs = await UserActivity.find(
      { createdAt: { $gte: twelveWeeksAgo } },
      { user: 1, createdAt: 1 }
    ).lean();

    const weeklyBuckets = {};
    allWeeklyDocs.forEach(doc => {
      const d = new Date(doc.createdAt);
      const weekStart = new Date(d); weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      if (!weeklyBuckets[key]) weeklyBuckets[key] = { users: new Set(), events: 0 };
      weeklyBuckets[key].users.add(String(doc.user));
      weeklyBuckets[key].events += 1;
    });

    const weeklyTrend = Object.entries(weeklyBuckets)
      .map(([key, data]) => ({
        label: new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        wau: data.users.size,
        events: data.events
      }))
      .sort((a, b) => new Date(a.label) - new Date(b.label));

    // ── Monthly active users trend ──
    const allMonthlyDocs = await UserActivity.find(
      { createdAt: { $gte: twelveMonthsAgo } },
      { user: 1, createdAt: 1 }
    ).lean();

    const monthlyBuckets = {};
    allMonthlyDocs.forEach(doc => {
      const d = new Date(doc.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyBuckets[key]) monthlyBuckets[key] = { users: new Set(), events: 0, year: d.getFullYear(), month: d.getMonth() + 1 };
      monthlyBuckets[key].users.add(String(doc.user));
      monthlyBuckets[key].events += 1;
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrend = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now); d.setMonth(now.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const found = monthlyBuckets[key];
      monthlyTrend.push({
        label: monthNames[d.getMonth()],
        mau: found ? found.users.size : 0,
        events: found?.events || 0
      });
    }

    // ── Event distribution (last 30 days) ──
    const eventDistribution = await UserActivity.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: {
          _id: '$event',
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$user' }
      }},
      { $project: {
          event: '$_id',
          count: 1,
          uniqueUsers: { $size: '$uniqueUsers' }
      }},
      { $sort: { count: -1 } }
    ]);

    // ── Peak activity hours (last 7 days) ──
    const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(now.getDate() - 6); sevenDaysAgo.setHours(0, 0, 0, 0);
    const hourlyDocs = await UserActivity.find(
      { createdAt: { $gte: sevenDaysAgo } },
      { user: 1, createdAt: 1 }
    ).lean();

    const hourlyBuckets = {};
    hourlyDocs.forEach(doc => {
      const h = new Date(doc.createdAt).getHours();
      if (!hourlyBuckets[h]) hourlyBuckets[h] = { users: new Set(), events: 0 };
      hourlyBuckets[h].users.add(String(doc.user));
      hourlyBuckets[h].events += 1;
    });

    const hourlyDistribution = Array.from({ length: 24 }, (_, h) => {
      const found = hourlyBuckets[h];
      return {
        hour: h,
        label: `${h.toString().padStart(2, '0')}:00`,
        events: found?.events || 0,
        users: found ? found.users.size : 0
      };
    });

    return res.json({
      overview: {
        dau: dauResult, wau: wauResult, mau: mauResult,
        totalUsers, activeUsers,
        dauGrowth: calcGrowth(dauResult, prevDau),
        wauGrowth: calcGrowth(wauResult, prevWau),
        mauGrowth: calcGrowth(mauResult, prevMau),
        retentionRate: totalUsers > 0 ? Number((mauResult / totalUsers * 100).toFixed(1)) : 0
      },
      dailyTrend, weeklyTrend, monthlyTrend,
      eventDistribution: eventDistribution.map(e => ({ event: e.event, count: e.count, uniqueUsers: e.uniqueUsers })),
      hourlyDistribution
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch activity analytics' });
  }
});

// ─── ADMIN WATCH / ENGAGEMENT ANALYTICS ──────────────────────────────────
router.get('/engagement', async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 29); thirtyDaysAgo.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(now.getDate() - 6); sevenDaysAgo.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const allSessions = await WatchSession.find({}).lean();
    const totalSessions = allSessions.length;
    const totalWatchTimeSeconds = allSessions.reduce((s, sess) => s + (sess.durationWatched || 0), 0);
    const totalWatchTimeHours = totalSessions > 0 ? Math.round(totalWatchTimeSeconds / 3600 * 10) / 10 : 0;
    const avgWatchDuration = totalSessions > 0 ? Math.round(totalWatchTimeSeconds / totalSessions) : 0;
    const completedSessions = allSessions.filter(s => s.completed === true);
    const overallCompletionRate = totalSessions > 0 ? Number(((completedSessions.length / totalSessions) * 100).toFixed(1)) : 0;

    const recentSessions = allSessions.filter(s => new Date(s.createdAt) >= thirtyDaysAgo);
    const weeklySessions = allSessions.filter(s => new Date(s.createdAt) >= sevenDaysAgo);
    const monthlySessions = allSessions.filter(s => new Date(s.createdAt) >= startOfMonth);
    const recentWatchTime = recentSessions.reduce((s, sess) => s + (sess.durationWatched || 0), 0);

    const seriesSessions = allSessions.filter(s => s.contentType === 'series');
    const completedSeries = seriesSessions.filter(s => s.completed);
    const seriesCompletionRate = seriesSessions.length > 0
      ? Number(((completedSeries.length / seriesSessions.length) * 100).toFixed(1)) : 0;

    const dailyData = {};
    recentSessions.forEach(s => {
      const key = s.dateKey;
      if (!dailyData[key]) dailyData[key] = { seconds: 0, sessions: 0, completed: 0 };
      dailyData[key].seconds += s.durationWatched || 0;
      dailyData[key].sessions += 1;
      if (s.completed) dailyData[key].completed += 1;
    });

    const watchTimeTrend = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const found = dailyData[key];
      watchTimeTrend.push({
        date: key,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        hours: found ? Math.round((found.seconds / 3600) * 10) / 10 : 0,
        sessions: found?.sessions || 0,
        completed: found?.completed || 0
      });
    }

    const seriesMap = {};
    allSessions.forEach(s => {
      const sid = String(s.series);
      if (!seriesMap[sid]) seriesMap[sid] = { seriesId: sid, sessions: 0, totalDuration: 0, completed: 0, uniqueUsers: new Set() };
      seriesMap[sid].sessions += 1;
      seriesMap[sid].totalDuration += s.durationWatched || 0;
      if (s.completed) seriesMap[sid].completed += 1;
      if (s.user) seriesMap[sid].uniqueUsers.add(String(s.user));
    });

    const seriesData = await Series.find({ _id: { $in: Object.keys(seriesMap) } }).lean();
    const seriesTitleMap = {};
    seriesData.forEach(s => { seriesTitleMap[String(s._id)] = s.title; });

    const engagementByContent = Object.entries(seriesMap).map(([sid, data]) => ({
      seriesId: sid,
      title: seriesTitleMap[sid] || 'Unknown',
      avgWatchDuration: data.sessions > 0 ? Math.round(data.totalDuration / data.sessions) : 0,
      avgWatchMinutes: data.sessions > 0 ? Math.round((data.totalDuration / data.sessions) / 60 * 10) / 10 : 0,
      totalWatchHours: Math.round(data.totalDuration / 3600 * 10) / 10,
      sessions: data.sessions,
      completionRate: data.sessions > 0 ? Number(((data.completed / data.sessions) * 100).toFixed(1)) : 0,
      uniqueViewers: data.uniqueUsers.size
    }));

    engagementByContent.sort((a, b) => b.avgWatchDuration - a.avgWatchDuration);

    const uniqueViewers = new Set(allSessions.map(s => String(s.user)).filter(Boolean));

    return res.json({
      overview: {
        totalWatchTimeHours, totalWatchTimeSeconds,
        avgWatchDuration, avgWatchMinutes: Math.round((avgWatchDuration / 60) * 10) / 10,
        totalSessions, totalUniqueViewers: uniqueViewers.size,
        overallCompletionRate, seriesCompletionRate,
        recentWatchTimeHours: Math.round((recentWatchTime / 3600) * 10) / 10,
        weeklySessions: weeklySessions.length, monthlySessions: monthlySessions.length
      },
      watchTimeTrend,
      highestEngagement: engagementByContent.slice(0, 10),
      lowestEngagement: engagementByContent.filter(c => c.sessions > 0).slice(-10).reverse(),
      completionSummary: {
        totalEpisodesCompleted: completedSessions.length, totalSessions,
        seriesCompletionRate, overallCompletionRate
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch engagement analytics' });
  }
});

// ─── ADMIN REVENUE ANALYTICS ─────────────────────────────────────────────
router.get('/revenue', async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const twelveMonthsAgo = new Date(now); twelveMonthsAgo.setMonth(now.getMonth() - 11); twelveMonthsAgo.setDate(1); twelveMonthsAgo.setHours(0, 0, 0, 0);

    const [totalRevenueResult, monthlyRevenueResult, weeklyRevenueResult, dailyRevenueResult, capturedPayments, totalPaidUsers, totalFreeUsers, totalUsers] = await Promise.all([
      Payment.aggregate([{ $match: { status: 'captured' } }, { $group: { _id: null, total: { $sum: '$amountINR' }, count: { $sum: 1 } } }]),
      Payment.aggregate([{ $match: { status: 'captured', createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$amountINR' }, count: { $sum: 1 } } }]),
      Payment.aggregate([{ $match: { status: 'captured', createdAt: { $gte: startOfWeek } } }, { $group: { _id: null, total: { $sum: '$amountINR' }, count: { $sum: 1 } } }]),
      Payment.aggregate([{ $match: { status: 'captured', createdAt: { $gte: startOfDay } } }, { $group: { _id: null, total: { $sum: '$amountINR' }, count: { $sum: 1 } } }]),
      Payment.find({ status: 'captured' }).lean(),
      User.countDocuments({ 'subscription.status': 'Premium' }),
      User.countDocuments({ 'subscription.status': { $ne: 'Premium' } }),
      User.countDocuments({})
    ]);

    const totalRevenue = totalRevenueResult[0]?.total || 0;
    const monthlyRevenue = monthlyRevenueResult[0]?.total || 0;
    const weeklyRevenue = weeklyRevenueResult[0]?.total || 0;
    const dailyRevenue = dailyRevenueResult[0]?.total || 0;
    const conversionRate = totalUsers > 0 ? Number(((totalPaidUsers / totalUsers) * 100).toFixed(1)) : 0;
    const revenuePerUser = totalUsers > 0 ? Number((totalRevenue / totalUsers).toFixed(2)) : 0;

    // Monthly revenue trend — use JS aggregation to avoid $dateToString
    const monthlyPayments = await Payment.find(
      { status: 'captured', createdAt: { $gte: twelveMonthsAgo } },
      { amountINR: 1, createdAt: 1 }
    ).lean();

    const monthBuckets = {};
    monthlyPayments.forEach(p => {
      const d = new Date(p.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!monthBuckets[key]) monthBuckets[key] = { revenue: 0, transactions: 0 };
      monthBuckets[key].revenue += p.amountINR || 0;
      monthBuckets[key].transactions += 1;
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueTrend = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now); d.setMonth(now.getMonth() - (11 - i));
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const found = monthBuckets[key];
      revenueTrend.push({
        label: monthNames[d.getMonth()],
        year: d.getFullYear(), month: d.getMonth() + 1,
        revenue: found?.revenue || 0, transactions: found?.transactions || 0
      });
    }

    // Subscription growth — use JS aggregation
    const allCaptured = await Payment.find({ status: 'captured' }, { user: 1, createdAt: 1 }).sort({ createdAt: 1 }).lean();
    const firstPayment = {};
    allCaptured.forEach(p => {
      const uid = String(p.user);
      if (!firstPayment[uid] || p.createdAt < firstPayment[uid].createdAt) {
        firstPayment[uid] = p;
      }
    });

    const subBuckets = {};
    Object.values(firstPayment).forEach(p => {
      const d = new Date(p.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!subBuckets[key]) subBuckets[key] = 0;
      subBuckets[key] += 1;
    });

    const subGrowth = [];
    let cumulativePaid = 0;
    for (let i = 0; i < 12; i++) {
      const d = new Date(now); d.setMonth(now.getMonth() - (11 - i));
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      cumulativePaid += subBuckets[key] || 0;
      subGrowth.push({
        label: monthNames[d.getMonth()], year: d.getFullYear(), month: d.getMonth() + 1,
        paid: cumulativePaid, newSubscribers: subBuckets[key] || 0
      });
    }

    // Revenue by plan
    const revenueByPlan = await Payment.aggregate([
      { $match: { status: 'captured' } },
      { $group: { _id: { planName: '$planName', billingCycle: '$billingCycle' }, revenue: { $sum: '$amountINR' }, transactions: { $sum: 1 } } },
      { $sort: { revenue: -1 } }
    ]);

    const recentPayments = await Payment.find({}).populate('user', 'name email').sort({ createdAt: -1 }).limit(10).lean();

    return res.json({
      overview: { totalRevenue, monthlyRevenue, weeklyRevenue, dailyRevenue, totalPaidUsers, totalFreeUsers, totalUsers, conversionRate, revenuePerUser, totalTransactions: totalRevenueResult[0]?.count || 0 },
      revenueTrend, subscriptionGrowth: subGrowth,
      revenueByPlan: revenueByPlan.map(r => ({ planName: r._id.planName || 'Unknown', billingCycle: r._id.billingCycle || 'monthly', revenue: r.revenue, transactions: r.transactions })),
      recentPayments: recentPayments.map(p => ({ id: p._id, user: p.user?.name || 'Unknown', email: p.user?.email || '', planName: p.planName, amount: p.amountINR, status: p.status, date: p.createdAt }))
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch revenue analytics' });
  }
});

// ─── ADMIN USERS ──────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 50, q = '', role, plan, status, sort = 'createdAt', order = 'desc' } = req.query;
    const query = {};

    if (q && q.trim()) {
      const term = q.trim();
      query.$or = [{ name: { $regex: term, $options: 'i' } }, { email: { $regex: term, $options: 'i' } }];
    }
    if (role && role !== 'all') query.role = role;
    if (plan && plan !== 'all') {
      if (plan === 'premium') query['subscription.status'] = 'Premium';
      else if (plan === 'free') query['subscription.status'] = { $ne: 'Premium' };
    }
    if (status && status !== 'all') query.isActive = status === 'active';

    const skip = (Number(page) - 1) * Number(limit);
    const sortObj = {}; sortObj[sort] = order === 'asc' ? 1 : -1;

    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort(sortObj).skip(skip).limit(Number(limit)).lean(),
      User.countDocuments(query)
    ]);

    const [totalUsers, activeUsers, premiumUsers] = await Promise.all([
      User.countDocuments({}), User.countDocuments({ isActive: true }), User.countDocuments({ 'subscription.status': 'Premium' })
    ]);

    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
    const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: startOfMonth } });
    const freeUsers = totalUsers - premiumUsers;

    return res.json({ users: users.map(transformUser), stats: { totalUsers, activeUsers, premiumUsers, freeUsers, newUsers: newUsersThisMonth }, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch users' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(transformUser(user));
  } catch (error) { return res.status(500).json({ message: error.message || 'Failed to fetch user' }); }
});

router.delete('/users/:id', async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;
    if (String(req.params.id) === String(req.user.id)) return res.status(400).json({ message: 'You cannot delete your own account' });
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ success: true });
  } catch (error) { return res.status(500).json({ message: error.message || 'Failed to delete user' }); }
});

router.patch('/users/:id/suspend', async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;
    if (String(req.params.id) === String(req.user.id)) return res.status(400).json({ message: 'You cannot suspend your own account' });
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ success: true, message: 'User suspended', user: transformUser(user) });
  } catch (error) { return res.status(500).json({ message: error.message || 'Failed to suspend user' }); }
});

router.patch('/users/:id/reactivate', async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ success: true, message: 'User reactivated', user: transformUser(user) });
  } catch (error) { return res.status(500).json({ message: error.message || 'Failed to reactivate user' }); }
});

router.patch('/users/:id/role', async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ message: 'role must be user or admin' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(transformUser(user));
  } catch (error) { return res.status(500).json({ message: error.message || 'Failed to update user role' }); }
});

// ─── ADMIN SERIES MANAGEMENT ─────────────────────────────────────────────
router.get('/series', async (req, res) => {
  try {
    const { type } = req.query;
    const query = {};
    if (type === 'series' || type === 'movie') query.contentType = type;
    const series = await Series.find(query).sort({ createdAt: -1 });
    return res.json(series.map(transformSeries));
  } catch (error) { return res.status(500).json({ message: error.message }); }
});

router.get('/content-index', async (req, res) => {
  try {
    const { q = '', type = 'series' } = req.query;
    const term = String(q || '').trim();
    const targetType = type === 'movie' ? 'movie' : 'series';

    let items = [];
    if (term && targetType === 'series') {
      const titleHits = await Series.find({ contentType: 'series', title: { $regex: term, $options: 'i' } }).lean();
      const episodeHits = await Episode.find({ title: { $regex: term, $options: 'i' } }).select('series').lean();
      const episodeSeriesIds = Array.from(new Set(episodeHits.map((e) => String(e.series))));
      const episodeSeries = episodeSeriesIds.length ? await Series.find({ _id: { $in: episodeSeriesIds }, contentType: 'series' }).lean() : [];
      const map = new Map();
      [...titleHits, ...episodeSeries].forEach((s) => map.set(String(s._id), s));
      items = Array.from(map.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      const query = { contentType: targetType };
      if (term) query.title = { $regex: term, $options: 'i' };
      items = await Series.find(query).sort({ createdAt: -1 }).lean();
    }

    if (type === 'movie') return res.json(items.map((s) => ({ ...transformSeries(s), seasonsMeta: [] })));

    const seriesIds = items.map((s) => s._id);
    const episodes = await Episode.find({ series: { $in: seriesIds } }).lean();
    const episodeBySeries = new Map();
    episodes.forEach((ep) => { const key = String(ep.series); if (!episodeBySeries.has(key)) episodeBySeries.set(key, []); episodeBySeries.get(key).push(ep); });

    const out = items.map((s) => {
      const eps = episodeBySeries.get(String(s._id)) || [];
      const seasonMap = {};
      eps.forEach((ep) => { const seasonNo = Number(ep.season || 1); if (!seasonMap[seasonNo]) seasonMap[seasonNo] = { season: seasonNo, count: 0 }; seasonMap[seasonNo].count += 1; });
      const seasonsMeta = Object.values(seasonMap).sort((a, b) => a.season - b.season);
      return { ...transformSeries(s), totalEpisodes: eps.length, seasonsMeta };
    });
    return res.json(out);
  } catch (error) { return res.status(500).json({ message: error.message || 'Failed to fetch content index' }); }
});

router.post('/series', upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), async (req, res) => {
  try {
    const { title, description, genre, director, releaseYear, year, categories, tag, premium, seasons, status, contentType, poster, banner, rating } = req.body;
    const mappedReleaseYear = resolveYear(req.body);
    let thumbnailUrl = poster || '', bannerUrl = banner || '';
    if (req.files?.thumbnail) { const result = await uploadToCloudinary(req.files.thumbnail[0].buffer, 'streamvault/series/thumbnails', 'image'); thumbnailUrl = result.secure_url; }
    if (req.files?.banner) { const result = await uploadToCloudinary(req.files.banner[0].buffer, 'streamvault/series/banners', 'image'); bannerUrl = result.secure_url; }
    const parsedGenre = safeParseArray(genre); const parsedCategories = safeParseArray(categories);
    const series = await Series.create({
      title: title || 'Untitled Series', description: description || '', thumbnail: thumbnailUrl, banner: bannerUrl,
      genre: parsedGenre, categories: parsedCategories, director: director || '', releaseYear: mappedReleaseYear,
      seasons: toNum(seasons, 1), premium: toBool(premium), tag: tag || 'New', rating: toNum(rating, 0),
      status: status || 'ongoing', contentType: contentType === 'movie' ? 'movie' : 'series', isPublished: true
    });
    flushCache();
    try { await NotificationService.notifyNewSeriesAdded(series.title, series._id); } catch (_) {}
    return res.status(201).json(transformSeries(series));
  } catch (error) {
    logger.error(`Admin create series error: ${error.message}`);
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/series/:id', upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;
    let series = await Series.findById(req.params.id);
    if (!series) return res.status(404).json({ message: 'Series not found' });
    const updateData = {};
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.year !== undefined) updateData.releaseYear = toNum(req.body.year);
    if (req.body.releaseYear !== undefined) updateData.releaseYear = toNum(req.body.releaseYear);
    if (req.body.seasons !== undefined) updateData.seasons = toNum(req.body.seasons, 1);
    if (req.body.rating !== undefined) updateData.rating = toNum(req.body.rating, 0);
    if (req.body.tag !== undefined) updateData.tag = req.body.tag;
    if (req.body.director !== undefined) updateData.director = req.body.director;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.contentType !== undefined) updateData.contentType = req.body.contentType === 'movie' ? 'movie' : 'series';
    if (req.body.premium !== undefined) updateData.premium = toBool(req.body.premium);
    if (req.body.genre !== undefined) updateData.genre = safeParseArray(req.body.genre);
    if (req.body.categories !== undefined) updateData.categories = safeParseArray(req.body.categories);
    if (req.body.poster !== undefined) updateData.thumbnail = req.body.poster;
    if (req.files?.thumbnail) { const result = await uploadToCloudinary(req.files.thumbnail[0].buffer, 'streamvault/series/thumbnails', 'image'); updateData.thumbnail = result.secure_url; }
    if (req.files?.banner) { const result = await uploadToCloudinary(req.files.banner[0].buffer, 'streamvault/series/banners', 'image'); updateData.banner = result.secure_url; }
    series = await Series.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true, runValidators: true });
    flushCache();
    return res.json(transformSeries(series));
  } catch (error) { return res.status(500).json({ message: error.message }); }
});

router.delete('/series/:id', async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;
    const series = await Series.findById(req.params.id);
    if (!series) return res.status(404).json({ message: 'Series not found' });
    await Episode.deleteMany({ series: req.params.id });
    await series.deleteOne();
    flushCache();
    return res.json({ success: true, message: 'Series and all episodes deleted' });
  } catch (error) { return res.status(500).json({ message: error.message }); }
});

router.patch('/series/:id/publish', async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;
    const series = await Series.findById(req.params.id);
    if (!series) return res.status(404).json({ message: 'Series not found' });
    series.isPublished = !series.isPublished; await series.save();
    flushCache();
    return res.json(transformSeries(series));
  } catch (error) { return res.status(500).json({ message: error.message }); }
});

router.get('/movies', async (req, res) => {
  try {
    const movies = await Series.find({ contentType: 'movie' }).sort({ createdAt: -1 });
    return res.json(movies.map(transformSeries));
  } catch (error) { return res.status(500).json({ message: error.message || 'Failed to fetch movies' }); }
});

router.post('/movies', upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), async (req, res) => {
  try {
    const { title, description, genre, tag, premium, poster, banner, rating, releaseYear, year } = req.body;
    let thumbnailUrl = poster || '', bannerUrl = banner || '';
    if (req.files?.thumbnail) { const result = await uploadToCloudinary(req.files.thumbnail[0].buffer, 'streamvault/movies/thumbnails', 'image'); thumbnailUrl = result.secure_url; }
    if (req.files?.banner) { const result = await uploadToCloudinary(req.files.banner[0].buffer, 'streamvault/movies/banners', 'image'); bannerUrl = result.secure_url; }
    const movie = await Series.create({
      title: title || 'Untitled Movie', description: description || '', thumbnail: thumbnailUrl, banner: bannerUrl,
      genre: safeParseArray(genre), releaseYear: toNum(releaseYear ?? year, null), seasons: 1, premium: toBool(premium),
      tag: tag || 'New', rating: toNum(rating, 0), status: 'completed', contentType: 'movie', isPublished: true
    });
    flushCache();
    try { await NotificationService.notifyNewMovieAdded(movie.title, movie._id); } catch (_) {}
    return res.status(201).json(transformSeries(movie));
  } catch (error) { return res.status(500).json({ message: error.message || 'Failed to create movie' }); }
});

router.put('/movies/:id', upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;
    let movie = await Series.findById(req.params.id);
    if (!movie || movie.contentType !== 'movie') return res.status(404).json({ message: 'Movie not found' });
    const updateData = { contentType: 'movie', seasons: 1 };
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.genre !== undefined) updateData.genre = safeParseArray(req.body.genre);
    if (req.body.rating !== undefined) updateData.rating = toNum(req.body.rating, 0);
    if (req.body.tag !== undefined) updateData.tag = req.body.tag;
    if (req.body.premium !== undefined) updateData.premium = toBool(req.body.premium);
    if (req.body.releaseYear !== undefined || req.body.year !== undefined) updateData.releaseYear = toNum(req.body.releaseYear ?? req.body.year, null);
    if (req.body.poster !== undefined) updateData.thumbnail = req.body.poster;
    if (req.body.banner !== undefined) updateData.banner = req.body.banner;
    if (req.files?.thumbnail) { const result = await uploadToCloudinary(req.files.thumbnail[0].buffer, 'streamvault/movies/thumbnails', 'image'); updateData.thumbnail = result.secure_url; }
    if (req.files?.banner) { const result = await uploadToCloudinary(req.files.banner[0].buffer, 'streamvault/movies/banners', 'image'); updateData.banner = result.secure_url; }
    movie = await Series.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true, runValidators: true });
    flushCache();
    return res.json(transformSeries(movie));
  } catch (error) { return res.status(500).json({ message: error.message || 'Failed to update movie' }); }
});

router.delete('/movies/:id', async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;
    const movie = await Series.findById(req.params.id);
    if (!movie || movie.contentType !== 'movie') return res.status(404).json({ message: 'Movie not found' });
    await movie.deleteOne();
    flushCache();
    return res.json({ success: true, message: 'Movie deleted' });
  } catch (error) { return res.status(500).json({ message: error.message || 'Failed to delete movie' }); }
});

// ─── ADMIN EPISODE MANAGEMENT ────────────────────────────────────────────
router.get('/episodes', async (req, res) => {
  try {
    const episodes = await Episode.find().populate('series', 'title').sort({ createdAt: -1 });
    return res.json(episodes.map(transformEpisode));
  } catch (error) { return res.status(500).json({ message: error.message }); }
});

router.post('/episodes', upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
  try {
    const { episodeNumber, title, description, desc, videoUrl, thumbnail, duration, premium, season } = req.body;
    const resolvedSeriesId = resolveSeriesId(req.body);
    if (!resolvedSeriesId) return res.status(400).json({ message: 'seriesId is required' });
    if (!title) return res.status(400).json({ message: 'title is required' });
    let thumbnailUrl = thumbnail || '';
    if (req.files?.thumbnail) { const result = await uploadToCloudinary(req.files.thumbnail[0].buffer, 'streamvault/episodes/thumbnails', 'image'); thumbnailUrl = result.secure_url; }
    let videoUrlFinal = videoUrl || '', videoPublicId = '';
    if (req.files?.video && !videoUrlFinal) { const result = await uploadToCloudinary(req.files.video[0].buffer, 'streamvault/episodes/videos', 'video'); videoUrlFinal = result.secure_url; videoPublicId = result.public_id; }
    if (!videoUrlFinal) videoUrlFinal = '/John_Wick.mp4';
    const episode = await Episode.create({
      series: resolvedSeriesId, episodeNumber: toNum(episodeNumber, 1), season: toNum(season, 1), title,
      description: description || desc || '', thumbnail: thumbnailUrl, premium: toBool(premium),
      video: { url: videoUrlFinal, publicId: videoPublicId, duration: parseDuration(duration) }, isPublished: true
    });
    try {
      const sDoc = await Series.findById(resolvedSeriesId).select('title').lean();
      await NotificationService.notifyNewEpisode(sDoc?.title || 'Series', episode.episodeNumber || 1, resolvedSeriesId);
    } catch (_) {}
    try { const count = await Episode.countDocuments({ series: resolvedSeriesId }); await Series.findByIdAndUpdate(resolvedSeriesId, { totalEpisodes: count }); } catch (_) {}
    flushCache();
    return res.status(201).json(transformEpisode(episode));
  } catch (error) { logger.error(`Admin create episode error: ${error.message}`); return res.status(500).json({ message: error.message }); }
});

router.put('/episodes/:id', upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;
    let episode = await Episode.findById(req.params.id);
    if (!episode) return res.status(404).json({ message: 'Episode not found' });
    const updateData = {};
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.desc !== undefined) updateData.description = req.body.desc;
    if (req.body.episodeNumber !== undefined) updateData.episodeNumber = toNum(req.body.episodeNumber, 1);
    if (req.body.season !== undefined) updateData.season = toNum(req.body.season, 1);
    if (req.body.premium !== undefined) updateData.premium = toBool(req.body.premium);
    if (req.body.seriesId !== undefined) updateData.series = req.body.seriesId;
    if (req.body.showId !== undefined) updateData.series = req.body.showId;
    if (req.files?.thumbnail) { const result = await uploadToCloudinary(req.files.thumbnail[0].buffer, 'streamvault/episodes/thumbnails', 'image'); updateData.thumbnail = result.secure_url; }
    if (req.files?.video) { if (episode.video?.publicId) await deleteFromCloudinary(episode.video.publicId, 'video').catch(() => {}); const result = await uploadToCloudinary(req.files.video[0].buffer, 'streamvault/episodes/videos', 'video'); updateData['video.url'] = result.secure_url; updateData['video.publicId'] = result.public_id; }
    else if (req.body.videoUrl) { if (episode.video?.publicId) await deleteFromCloudinary(episode.video.publicId, 'video').catch(() => {}); updateData['video.url'] = req.body.videoUrl; updateData['video.publicId'] = ''; }
    if (req.body.duration !== undefined && req.body.duration !== '') updateData['video.duration'] = parseDuration(req.body.duration);
    episode = await Episode.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true, runValidators: true });
    flushCache();
    return res.json(transformEpisode(episode));
  } catch (error) { return res.status(500).json({ message: error.message }); }
});

router.delete('/episodes/:id', async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;
    const episode = await Episode.findById(req.params.id);
    if (!episode) return res.status(404).json({ message: 'Episode not found' });
    if (episode.video?.publicId) await deleteFromCloudinary(episode.video.publicId, 'video').catch(() => {});
    await episode.deleteOne();
    flushCache();
    return res.json({ success: true, message: 'Episode deleted' });
  } catch (error) { return res.status(500).json({ message: error.message }); }
});

// ─── UPLOAD SIGNATURE ────────────────────────────────────────────────────
router.get('/upload-signature', (req, res) => {
  try {
    const folder = req.query.folder || 'streamvault/general';
    const signatureData = generateSignature(folder);
    return res.json({ success: true, ...signatureData });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
});

// ─── PLATFORM SETTINGS ───────────────────────────────────────────────────
async function getOrCreateSettings() {
  let settings = await Settings.findOne({ key: 'platform' });
  if (!settings) {
    settings = await Settings.create({ key: 'platform' });
  }
  return settings;
}

router.get('/settings', async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    const { key, _id, __v, createdAt, updatedAt, ...data } = settings.toObject();
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    const allowed = [
      'siteName', 'siteUrl', 'allowRegistration', 'requireEmailVerification',
      'enableNotifications', 'enableAnalytics', 'maintenanceMode', 'enableCaching',
      'cacheDuration', 'maxUploadSize', 'enableCloudinary', 'darkMode', 'accentColor',
      'autoPlay', 'showThumbnails',
    ];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) settings[field] = req.body[field];
    });
    await settings.save();
    flushCache();
    const { key, _id, __v, createdAt, updatedAt, ...data } = settings.toObject();
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/cache/flush', async (req, res) => {
  try {
    flushCache();
    return res.json({ success: true, message: 'Cache cleared' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ─── CATEGORIES MANAGEMENT ───────────────────────────────────────────────
const slugify = (text) => text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');

router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ displayOrder: 1, name: 1 });
    return res.json({ success: true, count: categories.length, data: categories });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
});

router.post('/categories', async (req, res) => {
  try {
    const { name, slug, description, displayOrder, isActive, showOnHome, sortBy } = req.body;
    const categorySlug = slug || slugify(name);
    const existing = await Category.findOne({ slug: categorySlug });
    if (existing) return res.status(400).json({ success: false, message: 'Category slug already exists' });
    const category = await Category.create({ name, slug: categorySlug, description: description || '', displayOrder: displayOrder ?? 0, isActive: isActive !== false, showOnHome: showOnHome !== false, sortBy: sortBy || 'views' });
    flushCache();
    return res.status(201).json({ success: true, data: category });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
});

router.put('/categories/:id', async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    const { name, slug, description, displayOrder, isActive, showOnHome, sortBy } = req.body;
    if (name) category.name = name;
    if (slug) category.slug = slug;
    else if (name) category.slug = slugify(name);
    if (description !== undefined) category.description = description;
    if (displayOrder !== undefined) category.displayOrder = displayOrder;
    if (isActive !== undefined) category.isActive = isActive;
    if (showOnHome !== undefined) category.showOnHome = showOnHome;
    if (sortBy) category.sortBy = sortBy;
    await category.save();
    flushCache();
    return res.json({ success: true, data: category });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    if (!validateIdParam(req, res)) return;
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    await Series.updateMany({ browseCategories: category._id }, { $pull: { browseCategories: category._id } });
    await category.deleteOne();
    flushCache();
    return res.json({ success: true, message: 'Category deleted' });
  } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
});

export default router;