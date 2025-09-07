const jwt = require('jsonwebtoken');
const User = require('../model/User');
const ErrorResponse = require('../utils/errorResponse');

// Enhanced authentication middleware with RBAC
const authenticateUser = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check for token in cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  console.log("Token found:", token);

  // Make sure token exists
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided.' 
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from the token with permissions
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. User not found.' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account is deactivated. Please contact administrator.' 
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};

// Role-based authorization middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated.' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}` 
      });
    }

    next();
  };
};

// Permission-based authorization middleware
const authorizePermission = (entity, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated.' 
      });
    }

    // Admin and superadmin users have all permissions
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      return next();
    }

    // Check specific permission
    if (!req.user.hasPermission(entity, action)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. You don't have permission to ${action} ${entity}.` 
      });
    }

    next();
  };
};

// Admin-only middleware
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'User not authenticated.' 
    });
  }

  if (!req.user.isAdmin() && !req.user.isSuperAdmin()) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin or superadmin privileges required.' 
    });
  }

  next();
};

// Staff or Admin middleware
const staffOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'User not authenticated.' 
    });
  }

  if (!req.user.isAdmin() && !req.user.isSuperAdmin() && !req.user.isStaff()) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Staff, Admin, or Superadmin privileges required.' 
    });
  }

  next();
};

// Dashboard access middleware
const dashboardAccess = (accessLevel = 'basic') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated.' 
      });
    }

    if (accessLevel === 'full' && !req.user.hasPermission('dashboard', 'fullAccess')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Full dashboard access required.' 
      });
    }

    if (accessLevel === 'analytics' && !req.user.hasPermission('dashboard', 'analytics')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Analytics access required.' 
      });
    }

    if (accessLevel === 'reports' && !req.user.hasPermission('dashboard', 'reports')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Reports access required.' 
      });
    }

    next();
  };
};

// Superadmin-only middleware
const superAdminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'User not authenticated.' 
    });
  }

  if (!req.user.isSuperAdmin()) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Superadmin privileges required.' 
    });
  }

  next();
};

// Admin or Superadmin middleware
const adminOrSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'User not authenticated.' 
    });
  }

  if (!req.user.isAdmin() && !req.user.isSuperAdmin()) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin or Superadmin privileges required.' 
    });
  }

  next();
};

// Self or Admin middleware (for profile operations)
const selfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'User not authenticated.' 
    });
  }

  const targetUserId = req.params.id || req.params.userId;
  
  if (!req.user.isAdmin() && !req.user.isSuperAdmin() && req.user._id.toString() !== targetUserId) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. You can only access your own profile.' 
    });
  }

  next();
};

module.exports = {
  authenticateUser,
  authorizeRoles,
  authorizePermission,
  adminOnly,
  superAdminOnly,
  adminOrSuperAdmin,
  staffOrAdmin,
  dashboardAccess,
  selfOrAdmin,
};