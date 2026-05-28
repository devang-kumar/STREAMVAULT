import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { transformUser } from '../utils/transform.js';
import { isValidObjectId } from '../utils/validateId.js';
import { getOAuthSandboxHTML } from '../utils/oauthSandbox.js';

const router = Router();

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

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    return res.json({ token, user: transformUser(user) });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Login failed' });
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

// End of OAuth routes
export default router;
