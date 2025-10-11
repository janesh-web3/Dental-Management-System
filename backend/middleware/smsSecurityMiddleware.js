const User = require('../model/User');
const Patient = require('../model/Patient');

/**
 * Middleware to ensure only authorized users can send SMS
 * Only admin, doctors, and authorized staff can send bulk SMS
 */
const authorizeSMSSending = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to send SMS'
      });
    }

    // Get user details
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check user role - only admin, doctor, or staff can send SMS
    const allowedRoles = ['admin', 'doctor', 'staff'];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to send SMS'
      });
    }

    // For doctors, check if they're active
    if (user.role === 'doctor' && !user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is not active. Contact administrator.'
      });
    }

    // Add user info to request for logging
    req.smsSender = {
      userId: user._id,
      name: user.name,
      role: user.role,
      email: user.email
    };

    next();
  } catch (error) {
    console.error('Error in SMS authorization middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authorization'
    });
  }
};

/**
 * Middleware to prevent duplicate sends to same number for same template within a short time window
 */
const preventDuplicateSMS = async (req, res, next) => {
  try {
    const { phoneNumber, templateId, message } = req.body;
    
    // If we don't have a template ID or phone number, skip duplicate check
    if (!phoneNumber) {
      return next();
    }

    // Import SMSHistory here to avoid circular dependencies
    const SMSHistory = require('../model/SMSHistory');
    
    // Check for recent SMS to the same number with same template or similar message
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    
    const query = {
      recipient: phoneNumber,
      createdAt: { $gte: oneHourAgo }
    };
    
    // If we have a template ID, check for that specifically
    if (templateId) {
      query.templateUsed = templateId;
    } else if (message) {
      // For custom messages, check for similar content (first 50 characters)
      query.message = { $regex: message.substring(0, 50), $options: 'i' };
    }
    
    const recentSMS = await SMSHistory.findOne(query);
    
    if (recentSMS) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate SMS detected. This number has already received a similar message recently.',
        details: {
          lastSent: recentSMS.createdAt,
          recipient: recentSMS.recipient
        }
      });
    }
    
    next();
  } catch (error) {
    console.error('Error in duplicate SMS prevention middleware:', error);
    // Don't block SMS sending if there's an error in duplicate check
    next();
  }
};

/**
 * Middleware to validate Nepal-specific phone numbers
 */
const validateNepalPhoneNumber = (req, res, next) => {
  try {
    const { phoneNumber, phoneNumbers } = req.body;
    
    // Function to validate a single phone number
    const isValidNepalNumber = (number) => {
      if (!number) return false;
      
      // Remove all non-digit characters
      const cleaned = number.replace(/\D/g, '');
      
      // Check if it's a valid 10-digit Nepali number (96, 97, or 98 prefix)
      return /^9[678]\d{8}$/.test(cleaned);
    };
    
    // Validate single phone number
    if (phoneNumber) {
      if (!isValidNepalNumber(phoneNumber)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format. Please provide a valid 10-digit Nepali number starting with 96, 97, or 98.',
          invalidNumber: phoneNumber
        });
      }
    }
    
    // Validate array of phone numbers
    if (phoneNumbers && Array.isArray(phoneNumbers)) {
      const invalidNumbers = phoneNumbers.filter(num => !isValidNepalNumber(num));
      
      if (invalidNumbers.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid phone number format for ${invalidNumbers.length} number(s). Please provide valid 10-digit Nepali numbers starting with 96, 97, or 98.`,
          invalidNumbers: invalidNumbers
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Error in Nepal phone number validation middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating phone number format'
    });
  }
};

/**
 * Middleware to log all SMS sending actions
 */
const logSMSSending = async (req, res, next) => {
  try {
    // Add timestamp to request for logging
    req.smsLog = {
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };
    
    next();
  } catch (error) {
    console.error('Error in SMS logging middleware:', error);
    // Don't block SMS sending if there's an error in logging
    next();
  }
};

module.exports = {
  authorizeSMSSending,
  preventDuplicateSMS,
  validateNepalPhoneNumber,
  logSMSSending
};