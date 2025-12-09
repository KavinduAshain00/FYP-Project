const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  // Allow preflight requests to pass through without authentication
  if (req.method === 'OPTIONS') {
    return next();
  }
  try {
    // Get token from header
    const authHeader = req.get('Authorization') || req.get('authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;

    if (!token) {
      // No token present - client not authorized to access this route
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;
