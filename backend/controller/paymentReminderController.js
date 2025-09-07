const PaymentReminderService = require('../services/paymentReminderService');
const User = require('../model/User');

// Create a single instance of the payment reminder service
const paymentReminderService = new PaymentReminderService();

// Start payment reminder service (superadmin/admin only)
const startPaymentReminders = async (req, res) => {
  try {
    // Check if req.user exists
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admin/superadmin can manage payment reminders."
      });
    }

    console.log('✅ Starting payment reminder service for user:', user.name);
    paymentReminderService.start();
    
    const status = paymentReminderService.getStatus();

    res.status(200).json({
      success: true,
      message: "Payment reminder service started successfully",
      data: status
    });

  } catch (error) {
    console.error("❌ Start payment reminders error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Stop payment reminder service (superadmin/admin only)
const stopPaymentReminders = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admin/superadmin can manage payment reminders."
      });
    }

    paymentReminderService.stop();

    res.status(200).json({
      success: true,
      message: "Payment reminder service stopped successfully",
      data: paymentReminderService.getStatus()
    });

  } catch (error) {
    console.error("Stop payment reminders error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get payment reminder service status
const getPaymentReminderStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admin/superadmin can view service status."
      });
    }

    const status = paymentReminderService.getStatus();

    res.status(200).json({
      success: true,
      data: {
        ...status,
        description: "Payment reminder service automatically checks for overdue payments every 5 minutes"
      }
    });

  } catch (error) {
    console.error("Get payment reminder status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Manually trigger payment reminder check (for testing)
const triggerPaymentReminderCheck = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admin/superadmin can trigger manual checks."
      });
    }

    await paymentReminderService.triggerManualCheck();

    res.status(200).json({
      success: true,
      message: "Payment reminder check triggered successfully"
    });

  } catch (error) {
    console.error("Trigger payment reminder check error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Trigger role-specific payment reminders
const triggerRoleSpecificReminders = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admin/superadmin can trigger reminders."
      });
    }

    const { selectedRoles } = req.body;

    if (!selectedRoles || !Array.isArray(selectedRoles) || selectedRoles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one role to send reminders to"
      });
    }

    console.log('🎯 Triggering role-specific payment reminders for:', selectedRoles);
    const result = await paymentReminderService.triggerRoleSpecificCheck(selectedRoles, req.user.id);

    res.status(200).json({
      success: true,
      message: `Payment reminders sent successfully to ${selectedRoles.join(', ')} roles`,
      data: result
    });

  } catch (error) {
    console.error("Trigger role-specific reminders error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Auto-start payment reminder service when server starts
const initializePaymentReminderService = () => {
  try {
    console.log('🚀 Initializing Payment Reminder Service...');
    
    // Start the service automatically
    setTimeout(() => {
      try {
        paymentReminderService.start();
        console.log('💰 Payment Reminder Service initialized and started');
      } catch (startError) {
        console.error('❌ Failed to start payment reminder service:', startError);
      }
    }, 5000); // Start after 5 seconds to ensure database is connected
    
  } catch (error) {
    console.error('❌ Failed to initialize payment reminder service:', error);
  }
};

module.exports = {
  startPaymentReminders,
  stopPaymentReminders,
  getPaymentReminderStatus,
  triggerPaymentReminderCheck,
  triggerRoleSpecificReminders,
  initializePaymentReminderService,
  paymentReminderService // Export the instance for external access
};