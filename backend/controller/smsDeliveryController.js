const SMSDeliveryReport = require('../model/SMSDeliveryReport');
const SMSHistory = require('../model/SMSHistory');

/**
 * Handle SMS delivery report webhook callback from Aakash SMS
 * This endpoint will be called by Aakash SMS when delivery status changes
 */
const handleDeliveryReport = async (req, res) => {
  try {
    const { messageId, status, deliveredAt, network, error } = req.body;

    if (!messageId || !status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message ID and status are required' 
      });
    }

    // Find the SMS history record
    const smsHistory = await SMSHistory.findOne({ messageId });
    
    if (!smsHistory) {
      return res.status(404).json({ 
        success: false, 
        message: 'SMS history record not found' 
      });
    }

    // Update the SMS history record with the new status
    smsHistory.status = status;
    
    if (deliveredAt) {
      smsHistory.deliveredAt = new Date(deliveredAt);
    }
    
    if (error) {
      smsHistory.errorMessage = error;
    }
    
    if (network) {
      smsHistory.networkProvider = network;
    }
    
    await smsHistory.save();

    // Create or update delivery report
    const deliveryReport = await SMSDeliveryReport.findOneAndUpdate(
      { messageId },
      {
        smsHistory: smsHistory._id,
        messageId,
        status,
        deliveredAt: deliveredAt ? new Date(deliveredAt) : null,
        networkProvider: network,
        errorMessage: error,
        recipient: smsHistory.recipient
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Delivery report processed successfully',
      data: deliveryReport
    });
  } catch (error) {
    console.error('Error processing delivery report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process delivery report',
      error: error.message
    });
  }
};

/**
 * Get delivery reports with filtering options
 */
const getDeliveryReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate, search } = req.query;
    
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }
    
    if (search) {
      query.$or = [
        { recipient: { $regex: search, $options: 'i' } },
        { messageId: { $regex: search, $options: 'i' } }
      ];
    }
    
    const total = await SMSDeliveryReport.countDocuments(query);
    const reports = await SMSDeliveryReport.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('smsHistory', 'message templateUsed')
      .populate('smsHistory.templateUsed', 'name');
    
    res.status(200).json({
      success: true,
      data: {
        reports,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching delivery reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery reports',
      error: error.message
    });
  }
};

/**
 * Retry failed SMS messages
 */
const retryFailedSMS = async (req, res) => {
  try {
    const { reportId } = req.params;
    
    // Find the delivery report
    const report = await SMSDeliveryReport.findById(reportId).populate('smsHistory');
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Delivery report not found'
      });
    }
    
    if (report.status !== 'failed' && report.status !== 'undelivered') {
      return res.status(400).json({
        success: false,
        message: 'Only failed or undelivered messages can be retried'
      });
    }
    
    // Increment retry count
    report.retryCount += 1;
    
    // Update the report
    await report.save();
    
    // Here we would implement the actual retry logic
    // For now, we'll just update the status to queued
    report.status = 'queued';
    await report.save();
    
    // Also update the SMS history
    if (report.smsHistory) {
      report.smsHistory.retryCount = report.retryCount;
      report.smsHistory.status = 'queued';
      await report.smsHistory.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'SMS message queued for retry',
      data: report
    });
  } catch (error) {
    console.error('Error retrying SMS:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retry SMS',
      error: error.message
    });
  }
};

/**
 * Get delivery statistics
 */
const getDeliveryStats = async (req, res) => {
  try {
    // Get status breakdown
    const statusBreakdown = await SMSDeliveryReport.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivity = await SMSDeliveryReport.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        statusBreakdown,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Error fetching delivery stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery stats',
      error: error.message
    });
  }
};

module.exports = {
  handleDeliveryReport,
  getDeliveryReports,
  retryFailedSMS,
  getDeliveryStats
};