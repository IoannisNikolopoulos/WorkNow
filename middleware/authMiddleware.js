const User = require('../models/user');

// Middleware to check if the user is authenticated
exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    next(); // The user is authenticated, proceed to the next middleware or route handler
  } else {
    return res.status(401).json({ error: 'Unauthorized: You need to log in to access this resource.' });
  }
};

// Middleware to check if the user is an admin
exports.isAdmin = async (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized: You need to log in to access this resource.' });
  }

  try {
    const user = await User.findById(req.session.userId);
    if (user && user.admin) {
      next(); // The user is an admin, proceed to the next middleware or route handler
    } else {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to access this resource.' });
    }
  } catch (error) {
    console.error('Error in isAdmin middleware:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
