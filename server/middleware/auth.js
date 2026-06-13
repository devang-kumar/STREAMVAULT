import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Verify JWT Token — attaches full user doc to req.user
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers (primary) or cookies (fallback)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized to access this route' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Validate decoded.id is a real ObjectId before querying
    if (!decoded.id || decoded.id.length < 10) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired, please login again' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    return res.status(401).json({ message: 'Not authorized to access this route' });
  }
};

// Admin only middleware — must be used AFTER protect
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};
