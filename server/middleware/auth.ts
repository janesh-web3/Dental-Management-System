import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../models/User';
import User from '../models/User';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
      token?: string;
    }
  }
}

// Verify JWT token
export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // Add user from payload
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Token is not valid' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'User account is deactivated' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Token is not valid' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token has expired' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Authorize roles middleware
export const authorize = (roles: UserRole | UserRole[] = []) => {
  // Convert single role to array
  const rolesArray = Array.isArray(roles) ? roles : [roles];
  
  return (req: Request, res: Response, next: NextFunction) => {
    // If no roles specified, allow any authenticated user
    if (rolesArray.length === 0) {
      return next();
    }

    // Check if user has required role
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    // Superadmin has all permissions
    if (req.user.role === UserRole.SUPERADMIN) {
      return next();
    }

    // Check if user has one of the required roles
    if (rolesArray.includes(req.user.role)) {
      return next();
    }

    // User doesn't have required role
    res.status(403).json({ 
      success: false, 
      message: `User role ${req.user.role} is not authorized to access this route` 
    });
  };
};

// Role-based access control middleware
export const roleAccess = {
  // Superadmin has all access
  superadmin: [UserRole.SUPERADMIN],
  
  // Admin has admin, doctor, receptionist, and staff access
  admin: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.STAFF],
  
  // Doctor has doctor and staff access
  doctor: [UserRole.DOCTOR, UserRole.STAFF],
  
  // Receptionist has receptionist and staff access
  receptionist: [UserRole.RECEPTIONIST, UserRole.STAFF],
  
  // Staff has only staff access
  staff: [UserRole.STAFF]
};

// Check if user has permission to access a resource
export const hasPermission = (user: any, requiredRole: UserRole) => {
  if (!user) return false;
  
  // Superadmin has all permissions
  if (user.role === UserRole.SUPERADMIN) return true;
  
  // Check if user's role has the required permission
  const userRoles = roleAccess[user.role as keyof typeof roleAccess] || [];
  return userRoles.includes(requiredRole);
};
