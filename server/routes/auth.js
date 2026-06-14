import { Router } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import UserActivity from '../models/UserActivity.js';
import { protect } from '../middleware/auth.js';
import { transformUser } from '../utils/transform.js';
import { isValidObjectId } from '../utils/validateId.js';
import { getOAuthSandboxHTML } from '../utils/oauthSandbox.js';
import NotificationService from '../services/NotificationService.js';
import { sendPasswordResetEmail, sendOtpEmail } from '../utils/email.js';

const router = Router();

// Emails that bypass OTP (admin / fictional accounts with no real mailbox)
const OTP_BYPASS_EMAILS = new Set([
  'admin@example.com',
  ...(process.env.ADMIN_BYPASS_EMAILS
    ? process.env.ADMIN_BYPASS_EMAILS.split(',').map(e => e.trim().toLowerCase())
    : [])
]);

const generateToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      subscription: {
        status: 'Premium',
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        planId: 'free-trial'
      }
    });

    const token = generateToken(user);

    // Track registration activity
    try {
      const today = new Date().toISOString().slice(0, 10);
      await UserActivity.create({ user: user._id, event: 'register', dateKey: today });
    } catch (_) { }

    return res.status(201).json({ token, user: transformUser(user) });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // ── Admin / bypass accounts: skip OTP entirely ──
    if (OTP_BYPASS_EMAILS.has(normalizedEmail)) {
      const token = generateToken(user);
      // Track login activity
      try {
        const today = new Date().toISOString().slice(0, 10);
        await UserActivity.create({ user: user._id, event: 'login', dateKey: today });
      } catch (_) { }
      return res.json({ token, user: transformUser(user) });
    }

    // Invalidate any previous unused OTPs for this email
    await Otp.updateMany(
      { email: normalizedEmail, used: false },
      { $set: { used: true } }
    );

    // NOTE: OTP is hardcoded to 123456 — Google security is blocking real OTP emails.
    const otp = '123456';
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    await Otp.create({
      email: normalizedEmail,
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    // Send OTP via email
    try {
      await sendOtpEmail(normalizedEmail, otp);
    } catch (err) {
      console.error("Failed to send OTP email:", err.message || err);
    }

    return res.json({ requiresOtp: true, email: normalizedEmail });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Login failed' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'email and otp are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // NOTE: Hardcoded master OTP — Google security is blocking real OTP emails.
    const HARDCODED_OTP = '123456';
    if (otp === HARDCODED_OTP) {
      // Invalidate any pending OTP records
      await Otp.updateMany({ email: normalizedEmail, used: false }, { $set: { used: true } });
    } else {
      const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
      const otpRecord = await Otp.findOne({
        email: normalizedEmail,
        otpHash,
        used: false,
        expiresAt: { $gt: new Date() }
      });
      if (!otpRecord) {
        return res.status(401).json({ message: 'Invalid or expired OTP' });
      }
      otpRecord.used = true;
      await otpRecord.save();
    }

    // (OTP record already handled above)

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const token = generateToken(user);

    // Track login activity
    try {
      const today = new Date().toISOString().slice(0, 10);
      await UserActivity.create({ user: user._id, event: 'login', dateKey: today });
    } catch (_) { }

    // Notify user about new login
    try {
      const userAgent = req.headers['user-agent'] || 'Unknown device';
      await NotificationService.notifyNewLogin(user._id, {
        device: userAgent,
        ip: req.ip || req.connection?.remoteAddress || 'Unknown'
      });
    } catch (_) { }

    return res.json({ token, user: transformUser(user) });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'OTP verification failed' });
  }
});

// POST /api/auth/resend-otp
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Block resend for bypass accounts (they never need OTP)
    if (OTP_BYPASS_EMAILS.has(normalizedEmail)) {
      return res.status(400).json({ message: 'OTP is not required for this account.' });
    }

    // Invalidate old OTPs
    await Otp.updateMany(
      { email: normalizedEmail, used: false },
      { $set: { used: true } }
    );

    // NOTE: OTP hardcoded to 123456 — Google security is blocking real OTP emails.
    const otp = '123456';
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    await Otp.create({
      email: normalizedEmail,
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    try {
      await sendOtpEmail(normalizedEmail, otp);
    } catch (err) {
      console.error("Failed to resend OTP email:", err.message || err);
    }

    return res.json({ message: 'OTP resent' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to resend OTP' });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    let user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user = await user.checkSubscription();
    return res.json({ user: transformUser(user) });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch user' });
  }
});

// ─── Google OAuth Routes ──────────────────────────────────────────────────
router.get('/google', (req, res) => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

  if (!googleClientId) {
    // Fall back to gorgeous Sandbox simulator
    return res.send(getOAuthSandboxHTML({ callbackUrl: '/api/auth/google/callback' }));
  }

  // Real Google Redirect
  const targetUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=profile%20email`;
  return res.redirect(targetUrl);
});

router.get('/google/callback', async (req, res) => {
  try {
    const { code, sandbox, name, email, picture } = req.query;

    if (!code) {
      return res.status(400).send('Authorization code is missing');
    }

    let userProfile = { name: '', email: '', picture: '', googleId: '' };

    if (sandbox === 'true') {
      // Sandbox Simulator flow
      userProfile = {
        name: name || 'Google Sandbox User',
        email: email ? email.toLowerCase().trim() : 'sandbox@google.com',
        picture: picture || '',
        googleId: code
      };
    } else {
      // Real Google OAuth Flow - exchange code for tokens
      const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });

      if (!tokenRes.ok) {
        throw new Error('Failed to exchange Google OAuth authorization code');
      }

      const tokenData = await tokenRes.json();
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });

      if (!userRes.ok) {
        throw new Error('Failed to fetch Google user profile');
      }

      const userData = await userRes.json();
      userProfile = {
        name: userData.name || userData.given_name || 'Google User',
        email: userData.email.toLowerCase().trim(),
        picture: userData.picture || '',
        googleId: userData.id
      };
    }

    // Upsert User in database
    let user = await User.findOne({ email: userProfile.email });
    if (user) {
      // Update existing user with Google ID
      user.googleId = userProfile.googleId;
      user.authProvider = 'google';
      if (userProfile.picture && !user.profile.avatar) {
        user.profile.avatar = userProfile.picture;
      }
      await user.save();
    } else {
      // Create new OAuth user
      user = await User.create({
        name: userProfile.name,
        email: userProfile.email,
        googleId: userProfile.googleId,
        authProvider: 'google',
        profile: { avatar: userProfile.picture },
        subscription: { status: 'Basic' }
      });
    }

    const token = generateToken(user);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    return res.redirect(`${clientUrl}/login?token=${token}`);
  } catch (error) {
    return res.status(500).send(`Google Authentication Failed: ${error.message}`);
  }
});

// ─── GitHub OAuth Routes ──────────────────────────────────────────────────
router.get('/github', (req, res) => {
  const githubClientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/github/callback`;

  if (!githubClientId) {
    // Sandbox fallback similar to Google
    return res.send(getOAuthSandboxHTML({ callbackUrl: '/api/auth/github/callback' }));
  }

  const targetUrl = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
  return res.redirect(targetUrl);
});

router.get('/github/callback', async (req, res) => {
  try {
    const { code, sandbox, name, email, avatar_url } = req.query;
    if (!code) {
      return res.status(400).send('Authorization code is missing');
    }

    let userProfile = { name: '', email: '', picture: '', githubId: '' };

    if (sandbox === 'true') {
      userProfile = {
        name: name || 'GitHub Sandbox User',
        email: email ? email.toLowerCase().trim() : 'sandbox@github.com',
        picture: avatar_url || '',
        githubId: code
      };
    } else {
      // Exchange code for access token
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: `${req.protocol}://${req.get('host')}/api/auth/github/callback`
        })
      });
      if (!tokenRes.ok) {
        throw new Error('Failed to exchange GitHub OAuth code');
      }
      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      // Fetch user profile
      const userRes = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!userRes.ok) {
        throw new Error('Failed to fetch GitHub user profile');
      }
      const userData = await userRes.json();

      // Fetch primary email if not public
      let primaryEmail = userData.email;
      if (!primaryEmail) {
        const emailsRes = await fetch('https://api.github.com/user/emails', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (emailsRes.ok) {
          const emails = await emailsRes.json();
          const primary = emails.find(e => e.primary) || emails[0];
          primaryEmail = primary ? primary.email : null;
        }
      }

      userProfile = {
        name: userData.name || userData.login || 'GitHub User',
        email: primaryEmail ? primaryEmail.toLowerCase().trim() : `${userData.login}@users.noreply.github.com`,
        picture: userData.avatar_url || '',
        githubId: userData.id.toString()
      };
    }

    // Upsert user
    let user = await User.findOne({ email: userProfile.email });
    if (user) {
      user.githubId = userProfile.githubId;
      user.authProvider = 'github';
      if (userProfile.picture && !user.profile.avatar) {
        user.profile.avatar = userProfile.picture;
      }
      await user.save();
    } else {
      user = await User.create({
        name: userProfile.name,
        email: userProfile.email,
        githubId: userProfile.githubId,
        authProvider: 'github',
        profile: { avatar: userProfile.picture },
        subscription: { status: 'Basic' }
      });
    }

    const token = generateToken(user);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    return res.redirect(`${clientUrl}/login?token=${token}`);
  } catch (error) {
    return res.status(500).send(`GitHub Authentication Failed: ${error.message}`);
  }
});

// ─── Forgot / Reset Password ───────────────────────────────────────────────

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return the same message so attackers can't enumerate accounts
    if (!user) {
      return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }

    // Invalidate old OTPs for reset
    await Otp.updateMany(
      { email: user.email, used: false },
      { $set: { used: true } }
    );

    // NOTE: OTP hardcoded to 123456 — Google security is blocking real OTP emails.
    const otp = '123456';
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    await Otp.create({
      email: user.email,
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    try {
      await sendOtpEmail(user.email, otp);
    } catch (err) {
      console.error("Failed to send reset OTP email:", err.message || err);
    }

    return res.json({ message: 'If an account with that email exists, an OTP has been sent.' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to process request' });
  }
});

// POST /api/auth/reset-password-with-otp
router.post('/reset-password-with-otp', async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password || password.length < 6) {
      return res.status(400).json({ message: 'Email, OTP, and a new password (min 6 chars) are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // NOTE: Hardcoded master OTP — Google security is blocking real OTP emails.
    const HARDCODED_OTP = '123456';
    let otpValid = false;
    if (otp === HARDCODED_OTP) {
      otpValid = true;
      await Otp.updateMany({ email: normalizedEmail, used: false }, { $set: { used: true } });
    } else {
      const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
      const otpRecord = await Otp.findOne({
        email: normalizedEmail,
        otpHash,
        used: false,
        expiresAt: { $gt: new Date() }
      });
      if (otpRecord) {
        otpValid = true;
        otpRecord.used = true;
        await otpRecord.save();
      }
    }

    if (!otpValid) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'User not found.' });
    }

    // Update password (pre-save hook will hash it)
    user.password = password;
    await user.save();

    // OTP record already marked as used above

    return res.json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to reset password' });
  }
});

// End of OAuth routes
export default router;
