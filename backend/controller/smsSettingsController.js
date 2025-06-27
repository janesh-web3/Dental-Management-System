const SMSSettings = require('../model/SMSSettings');

// Get SMS settings
const getSMSSettings = async (req, res) => {
  try {
    const settings = await SMSSettings.getSettings();
    
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error getting SMS settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get SMS settings',
      error: error.message
    });
  }
};

// Update SMS settings
const updateSMSSettings = async (req, res) => {
  try {
    // Only superadmin can update settings
    if (req.admin.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmin can update SMS settings'
      });
    }
    
    const {
      bulkSMS,
      followupSMS,
      paymentSMS,
      autoAppointmentReminder,
      reminderHoursBeforeAppointment,
      dailyLimit,
      clinicName,
      senderName
    } = req.body;
    
    // Find settings or create if not exists
    let settings = await SMSSettings.findOne({});
    
    if (!settings) {
      settings = new SMSSettings({});
    }
    
    // Update fields
    if (bulkSMS !== undefined) settings.bulkSMS = bulkSMS;
    if (followupSMS !== undefined) settings.followupSMS = followupSMS;
    if (paymentSMS !== undefined) settings.paymentSMS = paymentSMS;
    if (autoAppointmentReminder !== undefined) settings.autoAppointmentReminder = autoAppointmentReminder;
    if (reminderHoursBeforeAppointment !== undefined) settings.reminderHoursBeforeAppointment = reminderHoursBeforeAppointment;
    if (dailyLimit !== undefined) settings.dailyLimit = dailyLimit;
    if (clinicName) settings.clinicName = clinicName;
    if (senderName) settings.senderName = senderName;
    
    // Set updatedBy
    settings.updatedBy = req.admin.id;
    
    // Save settings
    await settings.save();
    
    res.status(200).json({
      success: true,
      data: settings,
      message: 'SMS settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating SMS settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update SMS settings',
      error: error.message
    });
  }
};

module.exports = {
  getSMSSettings,
  updateSMSSettings
};
