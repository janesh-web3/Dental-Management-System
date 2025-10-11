const SMSHistory = require('../model/SMSHistory');
const SMSTemplate = require('../model/SMSTemplate');
const Patient = require('../model/Patient');
const mongoose = require('mongoose');
const aakashSmsUtils = require('../utils/aakashSmsUtils');

// Schedule an SMS for later delivery
const scheduleSMS = async (req, res) => {
  try {
    const { 
      recipient, 
      message, 
      templateId, 
      variables,
      scheduledFor,
      patientId,
      isBulk = false
    } = req.body;
    
    // Validate required fields
    if (!recipient && !patientId) {
      return res.status(400).json({
        success: false,
        message: 'Recipient phone number or patient ID is required'
      });
    }
    
    if (!message && !templateId) {
      return res.status(400).json({
        success: false,
        message: 'Message content or template ID is required'
      });
    }
    
    if (!scheduledFor) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled time is required'
      });
    }
    
    // Validate scheduled time
    const scheduledDate = new Date(scheduledFor);
    const now = new Date();
    
    if (scheduledDate <= now) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled time must be in the future'
      });
    }
    
    // Get message content from template if templateId is provided
    let messageContent = message;
    let templateUsed = null;
    
    if (templateId) {
      try {
        const template = await SMSTemplate.findById(templateId);
        if (!template) {
          return res.status(404).json({ 
            success: false, 
            message: 'Template not found' 
          });
        }
        
        // Replace variables in template
        messageContent = replaceTemplateVariables(template.content, variables);
        templateUsed = template._id;
      } catch (error) {
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to process template',
          error: error.message 
        });
      }
    }
    
    // Format phone number if recipient is provided directly
    let formattedRecipient = recipient;
    if (recipient) {
      formattedRecipient = formatPhoneNumber(recipient);
    }
    
    // Create scheduled SMS record
    const scheduledSMS = new SMSHistory({
      recipient: formattedRecipient,
      message: messageContent,
      status: 'scheduled',
      scheduledFor: scheduledDate,
      sentBy: req.user?._id || req.admin?.id,
      patient: patientId || null,
      templateUsed,
      isBulk
    });
    
    await scheduledSMS.save();
    
    res.status(201).json({
      success: true,
      data: scheduledSMS,
      message: 'SMS scheduled successfully'
    });
  } catch (error) {
    console.error('Error scheduling SMS:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule SMS',
      error: error.message
    });
  }
};

// Get all scheduled SMS
const getScheduledSMS = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'scheduled' } = req.query;
    
    const query = { status };
    
    const total = await SMSHistory.countDocuments(query);
    const scheduledSMS = await SMSHistory.find(query)
      .sort({ scheduledFor: 1 }) // Sort by scheduled time ascending
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('patient', 'personalDetails.name personalDetails.contactNumber')
      .populate('sentBy', 'name email')
      .populate('templateUsed', 'name');
    
    res.status(200).json({
      success: true,
      data: {
        scheduledSMS,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting scheduled SMS:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get scheduled SMS',
      error: error.message
    });
  }
};

// Cancel a scheduled SMS
const cancelScheduledSMS = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid SMS ID'
      });
    }
    
    // Find the scheduled SMS
    const scheduledSMS = await SMSHistory.findById(id);
    
    if (!scheduledSMS) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled SMS not found'
      });
    }
    
    // Check if it's actually scheduled
    if (scheduledSMS.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'SMS is not scheduled or has already been processed'
      });
    }
    
    // Update status to cancelled
    scheduledSMS.status = 'cancelled';
    await scheduledSMS.save();
    
    res.status(200).json({
      success: true,
      data: scheduledSMS,
      message: 'Scheduled SMS cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling scheduled SMS:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel scheduled SMS',
      error: error.message
    });
  }
};

// Process scheduled SMS (to be called by cron job)
const processScheduledSMS = async () => {
  try {
    const now = new Date();
    
    // Find all scheduled SMS that are due to be sent
    const dueSMS = await SMSHistory.find({
      status: 'scheduled',
      scheduledFor: { $lte: now }
    });
    
    if (dueSMS.length === 0) {
      console.log('No scheduled SMS to process');
      return { processed: 0, sent: 0, failed: 0 };
    }
    
    console.log(`Processing ${dueSMS.length} scheduled SMS`);
    
    let sentCount = 0;
    let failedCount = 0;
    
    // Process each scheduled SMS
    for (const sms of dueSMS) {
      try {
        // Send the SMS using Aakash SMS
        const result = await aakashSmsUtils.sendSingleSMS(sms.recipient, sms.message);
        
        if (result.success) {
          // Update the SMS record
          sms.status = 'sent';
          sms.messageId = result.messageId;
          sms.networkProvider = result.network;
          sms.credit = result.credit;
          sms.deliveredAt = new Date();
          await sms.save();
          
          sentCount++;
          console.log(`SMS sent successfully to ${sms.recipient}`);
        } else {
          // Mark as failed
          sms.status = 'failed';
          sms.errorMessage = result.error || 'Failed to send';
          await sms.save();
          
          failedCount++;
          console.error(`Failed to send SMS to ${sms.recipient}:`, result.error);
        }
      } catch (error) {
        // Mark as failed
        sms.status = 'failed';
        sms.errorMessage = error.message;
        await sms.save();
        
        failedCount++;
        console.error(`Error sending SMS to ${sms.recipient}:`, error.message);
      }
    }
    
    return {
      processed: dueSMS.length,
      sent: sentCount,
      failed: failedCount
    };
  } catch (error) {
    console.error('Error processing scheduled SMS:', error);
    throw error;
  }
};

// Helper function to validate and format phone number for Nepal
const formatPhoneNumber = (phoneNumber) => {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // If the number starts with '977' (Nepal country code), remove it for Aakash SMS
  if (cleaned.startsWith('977')) {
    return cleaned.substring(3);
  }
  
  // If the number starts with '+977', remove the country code
  if (cleaned.startsWith('+977')) {
    return cleaned.substring(4);
  }
  
  // Return the 10-digit number (Aakash SMS expects 10-digit numbers without country code)
  return cleaned;
};

// Helper function to replace template variables
const replaceTemplateVariables = (template, variables) => {
  let message = template;
  
  if (variables) {
    Object.keys(variables).forEach(key => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      message = message.replace(placeholder, variables[key] || '');
    });
  }
  
  // Remove any remaining placeholders
  message = message.replace(/{{[^{}]+}}/g, '');
  
  return message;
};

module.exports = {
  scheduleSMS,
  getScheduledSMS,
  cancelScheduledSMS,
  processScheduledSMS
};