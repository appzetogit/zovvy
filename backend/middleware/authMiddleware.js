import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@farmlyf.com';
const DEFAULT_ADMIN_NAME = process.env.ADMIN_NAME || 'Super Admin';

export const protect = async (req, res, next) => {
  let token;

  // Try to get token from cookie first (local development)
  token = req.cookies.jwt;

  // If no cookie, check for Bearer token in Authorization header (production/cross-domain)
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');

      if (decoded.id === 'admin_01') {
        const admin = await Admin.findOne({ email: process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL }).select('-password') ||
          await Admin.findOne({}).sort({ createdAt: 1 }).select('-password');

        req.user = admin ? {
          _id: 'admin_01',
          id: 'admin_01',
          name: admin.name,
          email: admin.email,
          role: 'admin'
        } : {
          _id: 'admin_01',
          id: 'admin_01',
          name: DEFAULT_ADMIN_NAME,
          email: DEFAULT_ADMIN_EMAIL,
          role: 'admin'
        };
      } else {
        req.user = await User.findOne({ id: decoded.id }).select('-password');
      }

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error('Token verification failed:', error.message, '| Token:', token.substring(0, 20) + '...');
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    console.warn('Auth failed: No token provided in cookies or headers');
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else if (req.user && req.user.email === DEFAULT_ADMIN_EMAIL) {
    // Handling the backdoor admin for now
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};
