const SMSHistory = require('../model/SMSHistory');
const SMSTemplate = require('../model/SMSTemplate');
const Patient = require('../model/Patient');
const mongoose = require('mongoose');

// Get SMS dashboard statistics
const getSMSDashboardStats = async (req, res) => {
  try {
    // Get total SMS sent
    const totalSMS = await SMSHistory.countDocuments();
    
    // Get delivery status breakdown
    const statusBreakdown = await SMSHistory.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get recent SMS activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivity = await SMSHistory.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Get top templates by usage
    const topTemplates = await SMSTemplate.aggregate([
      {
        $match: {
          totalSent: { $gt: 0 }
        }
      },
      {
        $sort: { totalSent: -1 }
      },
      {
        $limit: 5
      },
      {
        $project: {
          name: 1,
          totalSent: 1
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalSMS,
        statusBreakdown,
        recentActivity,
        topTemplates
      }
    });
  } catch (error) {
    console.error('Error getting SMS dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get SMS dashboard stats',
      error: error.message
    });
  }
};

// Get detailed SMS history with filtering
const getDetailedSMSHistory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      templateId,
      startDate,
      endDate,
      search
    } = req.query;
    
    const query = {};
    
    // Add status filter
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Add template filter
    if (templateId) {
      query.templateUsed = templateId;
    }
    
    // Add date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
        // Set to end of day
        query.createdAt.$lte.setHours(23, 59, 59, 999);
      }
    }
    
    // Add search filter
    if (search) {
      query.$or = [
        { recipient: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }
    
    const total = await SMSHistory.countDocuments(query);
    const history = await SMSHistory.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('patient', 'personalDetails.name personalDetails.contactNumber')
      .populate('sentBy', 'name email')
      .populate('templateUsed', 'name');
    
    res.status(200).json({
      success: true,
      data: {
        history,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting detailed SMS history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get detailed SMS history',
      error: error.message
    });
  }
};

// Get template usage analytics
const getTemplateAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Get template usage over time
    const templateUsage = await SMSHistory.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          templateUsed: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            templateId: '$templateUsed',
            date: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'smstemplates',
          localField: '_id.templateId',
          foreignField: '_id',
          as: 'template'
        }
      },
      {
        $unwind: '$template'
      },
      {
        $group: {
          _id: '$template.name',
          usageData: {
            $push: {
              date: '$_id.date',
              count: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      },
      {
        $sort: { total: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: templateUsage
    });
  } catch (error) {
    console.error('Error getting template analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get template analytics',
      error: error.message
    });
  }
};

// Get SMS cost analytics
const getSMSCostAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Get daily SMS costs
    const dailyCosts = await SMSHistory.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          credit: { $exists: true }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          totalCredit: { $sum: '$credit' },
          smsCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Calculate total credits used
    const totalCredits = dailyCosts.reduce((sum, day) => sum + day.totalCredit, 0);
    const totalSMS = dailyCosts.reduce((sum, day) => sum + day.smsCount, 0);
    
    res.status(200).json({
      success: true,
      data: {
        dailyCosts,
        totalCredits,
        totalSMS,
        averageCostPerSMS: totalSMS > 0 ? totalCredits / totalSMS : 0
      }
    });
  } catch (error) {
    console.error('Error getting SMS cost analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get SMS cost analytics',
      error: error.message
    });
  }
};

module.exports = {
  getSMSDashboardStats,
  getDetailedSMSHistory,
  getTemplateAnalytics,
  getSMSCostAnalytics
};