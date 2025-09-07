const cron = require('node-cron');
const Patient = require('../model/Patient');
const Popup = require('../model/Popup');
const User = require('../model/User');
const { notifyPopup } = require('../socket');

class PaymentReminderService {
  constructor() {
    this.isRunning = false;
    this.reminderJob = null;
  }

  /**
   * Start the payment reminder service (every 5 minutes)
   */
  start() {
    try {
      if (this.isRunning) {
        console.log('💡 Payment reminder service is already running');
        return;
      }

      console.log('🔄 Starting Payment Reminder Service (every 5 minutes)...');
      
      // Schedule to run every 5 minutes
      this.reminderJob = cron.schedule('*/5 * * * *', async () => {
        try {
          console.log('⏰ Payment reminder cron job triggered');
          await this.checkAndCreatePaymentReminders();
        } catch (error) {
          console.error('❌ Error in payment reminder cron job:', error);
        }
      }, {
        scheduled: true,
        timezone: "Asia/Kathmandu" // Adjust timezone as needed
      });

      this.isRunning = true;
      console.log('✅ Payment Reminder Service started successfully');
    } catch (error) {
      console.error('❌ Failed to start payment reminder service:', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop the payment reminder service
   */
  stop() {
    if (this.reminderJob) {
      this.reminderJob.destroy();
      this.reminderJob = null;
    }
    this.isRunning = false;
    console.log('🛑 Payment Reminder Service stopped');
  }

  /**
   * Check for patients with overdue payments and create reminders
   */
  async checkAndCreatePaymentReminders() {
    try {
      console.log('🔍 Checking for overdue payments...');

      // Find patients with remaining amounts > 0
      const patientsWithDues = await Patient.find({
        isDeleted: false,
        $or: [
          // Check daily treatments with remaining amount
          {
            'treatments.dailyTreatments': {
              $elemMatch: {
                remainingAmount: { $gt: 0 }
              }
            }
          },
          // Check group treatments with remaining amount
          {
            'groupTreatmentDetails': {
              $elemMatch: {
                totalRemainingAmount: { $gt: 0 }
              }
            }
          }
        ]
      }).populate('treatments.dailyTreatments.treatedByDoctor', 'name')
        .populate('groupTreatmentDetails.treatedByDoctor', 'name');

      console.log(`📋 Found ${patientsWithDues.length} patients with outstanding payments`);

      if (patientsWithDues.length === 0) {
        return;
      }

      // Get system admin to create reminders
      const systemAdmin = await User.findOne({ 
        role: { $in: ['superadmin', 'admin'] } 
      });

      if (!systemAdmin) {
        console.error('No admin user found to create payment reminders');
        return;
      }

      for (const patient of patientsWithDues) {
        await this.createPaymentReminderForPatient(patient, systemAdmin._id);
      }

    } catch (error) {
      console.error('Error checking overdue payments:', error);
    }
  }

  /**
   * Create payment reminder popup for a specific patient
   */
  async createPaymentReminderForPatient(patient, adminId) {
    try {
      // Calculate total due amount
      let totalDue = 0;
      const overdueDetails = [];

      // Check daily treatments
      if (patient.treatments && patient.treatments.length > 0) {
        patient.treatments.forEach(treatment => {
          if (treatment.dailyTreatments && treatment.dailyTreatments.length > 0) {
            treatment.dailyTreatments.forEach(daily => {
              if (daily.remainingAmount > 0) {
                totalDue += daily.remainingAmount;
                overdueDetails.push({
                  type: 'Daily Treatment',
                  date: daily.date,
                  amount: daily.remainingAmount,
                  procedure: daily.procedure || 'Treatment',
                  doctor: daily.treatedByDoctor ? daily.treatedByDoctor.name : 'N/A'
                });
              }
            });
          }
        });
      }

      // Check group treatments
      if (patient.groupTreatmentDetails && patient.groupTreatmentDetails.length > 0) {
        patient.groupTreatmentDetails.forEach(group => {
          if (group.totalRemainingAmount > 0) {
            totalDue += group.totalRemainingAmount;
            overdueDetails.push({
              type: 'Group Treatment',
              group: group.groupName,
              amount: group.totalRemainingAmount,
              procedure: group.procedure || 'Treatment',
              doctor: group.treatedByDoctor ? group.treatedByDoctor.name : 'N/A'
            });
          }
        });
      }

      if (totalDue <= 0) return;

      // Check if there's already an active payment reminder for this patient
      const existingReminder = await Popup.findOne({
        type: 'Payment Reminder',
        isActive: true,
        'title': { $regex: patient.name, $options: 'i' },
        createdAt: { 
          $gte: new Date(Date.now() - 5 * 60 * 1000) // Created within last 5 minutes
        }
      });

      if (existingReminder) {
        // Update existing reminder instead of creating new one
        await this.updateExistingReminder(existingReminder, patient, totalDue, overdueDetails);
        return;
      }

      // Create detailed reminder message
      const message = this.generateReminderMessage(patient, totalDue, overdueDetails);

      // Create new payment reminder popup
      const reminderPopup = new Popup({
        popupId: `payment_reminder_${patient._id}_${Date.now()}`,
        title: `💰 Payment Due - ${patient.name}`,
        message: message,
        type: 'Payment Reminder',
        rolesVisibleTo: ['superadmin', 'admin', 'staff', 'reception'],
        createdBy: adminId,
        startTime: new Date(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Valid for 24 hours
        reminderTime: {
          value: 5,
          unit: 'minutes'
        },
        displayType: 'Toast',
        actions: [
          {
            label: '📄 View Patient',
            action: 'redirect',
            url: `/patients?search=${patient.contact || patient.name}`
          },
          {
            label: '💳 Record Payment',
            action: 'redirect',
            url: `/patients?search=${patient.contact || patient.name}&tab=payments`
          },
          {
            label: 'Dismiss',
            action: 'close'
          }
        ]
      });

      await reminderPopup.save();
      console.log(`💰 Created payment reminder for ${patient.name} - ₹${totalDue} due`);

    } catch (error) {
      console.error(`Error creating payment reminder for patient ${patient.name}:`, error);
    }
  }

  /**
   * Update existing payment reminder
   */
  async updateExistingReminder(existingReminder, patient, totalDue, overdueDetails) {
    try {
      const message = this.generateReminderMessage(patient, totalDue, overdueDetails);
      
      existingReminder.message = message;
      existingReminder.title = `💰 Payment Due - ${patient.name} (Updated)`;
      existingReminder.startTime = new Date();
      
      await existingReminder.save();
      console.log(`🔄 Updated payment reminder for ${patient.name} - ₹${totalDue} due`);
    } catch (error) {
      console.error(`Error updating payment reminder for patient ${patient.name}:`, error);
    }
  }

  /**
   * Generate detailed reminder message
   */
  generateReminderMessage(patient, totalDue, overdueDetails) {
    let message = `Patient: ${patient.name}\n`;
    message += `Contact: ${patient.contact || 'N/A'}\n`;
    message += `Total Outstanding: ₹${totalDue.toLocaleString()}\n\n`;
    
    message += `📋 Outstanding Items:\n`;
    overdueDetails.forEach((detail, index) => {
      message += `${index + 1}. ${detail.type}`;
      if (detail.group) message += ` (${detail.group})`;
      message += `\n   • Procedure: ${detail.procedure}`;
      if (detail.date) message += `\n   • Date: ${new Date(detail.date).toLocaleDateString()}`;
      message += `\n   • Doctor: ${detail.doctor}`;
      message += `\n   • Amount Due: ₹${detail.amount.toLocaleString()}\n\n`;
    });

    message += `⏰ This reminder will appear every 5 minutes until payment is recorded.\n`;
    message += `📞 Please contact the patient or update payment records.`;

    return message;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: this.reminderJob && this.isRunning ? "Next run in ≤5 minutes" : null,
      interval: "Every 5 minutes",
      timezone: "Asia/Kathmandu"
    };
  }

  /**
   * Manually trigger payment reminder check (for testing)
   */
  async triggerManualCheck() {
    console.log('🔍 Manually triggering payment reminder check...');
    await this.checkAndCreatePaymentReminders();
  }

  /**
   * Trigger role-specific payment reminder check
   */
  async triggerRoleSpecificCheck(selectedRoles, adminId) {
    console.log('🎯 Manually triggering role-specific payment reminder check for roles:', selectedRoles);
    return await this.checkAndCreateRoleSpecificReminders(selectedRoles, adminId);
  }

  /**
   * Check subscription status and create role-specific reminders for system owners
   */
  async checkAndCreateRoleSpecificReminders(selectedRoles, adminId) {
    try {
      console.log('🔍 Checking subscription status for system payment reminders...');

      // Always create subscription reminder for system owners (simulating subscription check)
      const subscriptionStatus = await this.checkSystemSubscriptionStatus();
      
      console.log(`📋 System subscription status:`, subscriptionStatus);

      if (subscriptionStatus.isPaid && !subscriptionStatus.isExpiring) {
        return {
          remindersCreated: 0,
          message: 'Subscription is current and not expiring soon'
        };
      }

      // Create subscription payment reminder
      const created = await this.createSubscriptionPaymentReminder(adminId, selectedRoles, subscriptionStatus);

      return {
        remindersCreated: created ? 1 : 0,
        selectedRoles,
        subscriptionStatus,
        message: `Created subscription payment reminder for ${selectedRoles.join(', ')} roles`
      };

    } catch (error) {
      console.error('Error in role-specific subscription reminder check:', error);
      throw error;
    }
  }

  /**
   * Create role-specific payment reminder popup for a patient
   */
  async createRoleSpecificPaymentReminder(patient, adminId, selectedRoles) {
    try {
      // Calculate total due amount (same logic as general reminder)
      let totalDue = 0;
      const overdueDetails = [];

      // Check daily treatments
      if (patient.treatments && patient.treatments.length > 0) {
        patient.treatments.forEach(treatment => {
          if (treatment.dailyTreatments && treatment.dailyTreatments.length > 0) {
            treatment.dailyTreatments.forEach(daily => {
              if (daily.remainingAmount > 0) {
                totalDue += daily.remainingAmount;
                overdueDetails.push({
                  type: 'Daily Treatment',
                  date: daily.date,
                  amount: daily.remainingAmount,
                  procedure: daily.procedure || 'Treatment',
                  doctor: daily.treatedByDoctor ? daily.treatedByDoctor.name : 'N/A'
                });
              }
            });
          }
        });
      }

      // Check group treatments
      if (patient.groupTreatmentDetails && patient.groupTreatmentDetails.length > 0) {
        patient.groupTreatmentDetails.forEach(group => {
          if (group.totalRemainingAmount > 0) {
            totalDue += group.totalRemainingAmount;
            overdueDetails.push({
              type: 'Group Treatment',
              group: group.groupName,
              amount: group.totalRemainingAmount,
              procedure: group.procedure || 'Treatment',
              doctor: group.treatedByDoctor ? group.treatedByDoctor.name : 'N/A'
            });
          }
        });
      }

      if (totalDue <= 0) return false;

      // Create detailed reminder message
      const message = this.generateRoleSpecificReminderMessage(patient, totalDue, overdueDetails, selectedRoles);

      // Create new payment reminder popup for selected roles
      const reminderPopup = new Popup({
        popupId: `manual_payment_reminder_${patient._id}_${Date.now()}`,
        title: `🚨 Manual Payment Reminder - ${patient.name}`,
        message: message,
        type: 'Payment Reminder',
        rolesVisibleTo: selectedRoles,
        createdBy: adminId,
        startTime: new Date(),
        endTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // Valid for 4 hours
        reminderTime: {
          value: 1,
          unit: 'hours'
        },
        displayType: 'Banner',
        actions: [
          {
            label: '👀 View Patient',
            action: 'redirect',
            url: `/patients?search=${patient.contact || patient.name}`
          },
          {
            label: '💰 Record Payment',
            action: 'redirect',
            url: `/patients?search=${patient.contact || patient.name}&tab=payments`
          },
          {
            label: '📞 Contact Patient',
            action: 'custom',
            customAction: `tel:${patient.contact}`
          },
          {
            label: 'Dismiss',
            action: 'close'
          }
        ]
      });

      await reminderPopup.save();
      console.log(`🎯 Created manual payment reminder for ${patient.name} - ₹${totalDue} due (Roles: ${selectedRoles.join(', ')})`);
      
      return true;

    } catch (error) {
      console.error(`Error creating role-specific payment reminder for patient ${patient.name}:`, error);
      return false;
    }
  }

  /**
   * Check system subscription status (mock implementation)
   */
  async checkSystemSubscriptionStatus() {
    // Mock subscription data - in real implementation, this would check your payment system
    const now = new Date();
    const subscriptionEndDate = new Date('2024-12-31'); // Example: subscription ends Dec 31, 2024
    const daysUntilExpiry = Math.ceil((subscriptionEndDate - now) / (1000 * 60 * 60 * 24));
    
    return {
      isPaid: false, // Set to false to always show reminders for demo
      isExpiring: daysUntilExpiry <= 30 && daysUntilExpiry > 0,
      isExpired: daysUntilExpiry <= 0,
      expiryDate: subscriptionEndDate,
      daysUntilExpiry: Math.max(0, daysUntilExpiry),
      planType: "Professional Plan",
      amount: 15000, // ₹15,000 per year example
      features: ["Unlimited Patients", "Advanced Analytics", "Multi-user Access", "Priority Support"]
    };
  }

  /**
   * Create subscription payment reminder popup
   */
  async createSubscriptionPaymentReminder(adminId, selectedRoles, subscriptionStatus) {
    try {
      console.log('💰 Creating subscription payment reminder...');

      // Generate subscription reminder message
      const message = this.generateSubscriptionReminderMessage(subscriptionStatus, selectedRoles);

      // Create new subscription reminder popup
      const reminderPopup = new Popup({
        popupId: `subscription_reminder_${Date.now()}`,
        title: `💳 Subscription Payment Required - ${subscriptionStatus.planType}`,
        message: message,
        type: 'Payment Reminder',
        rolesVisibleTo: selectedRoles,
        createdBy: adminId,
        startTime: new Date(),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Valid for 7 days
        reminderTime: {
          value: 1,
          unit: 'days'
        },
        displayType: 'Banner',
        actions: [
          {
            label: '💳 Pay Now',
            action: 'redirect',
            url: '/subscription/payment'
          },
          {
            label: '📊 View Plans',
            action: 'redirect',
            url: '/subscription/plans'
          },
          {
            label: '📞 Contact Support',
            action: 'custom',
            customAction: 'contact-support'
          },
          {
            label: 'Dismiss',
            action: 'close'
          }
        ]
      });

      await reminderPopup.save();
      console.log(`💳 Created subscription payment reminder for ${subscriptionStatus.planType} - ₹${subscriptionStatus.amount} (Roles: ${selectedRoles.join(', ')})`);
      
      // Emit real-time popup notification to selected roles
      try {
        notifyPopup(reminderPopup, selectedRoles);
      } catch (socketError) {
        console.error('⚠️ Failed to emit real-time popup notification:', socketError);
        // Continue anyway, popup is saved in database
      }
      
      return true;

    } catch (error) {
      console.error(`Error creating subscription payment reminder:`, error);
      return false;
    }
  }

  /**
   * Generate subscription reminder message
   */
  generateSubscriptionReminderMessage(subscriptionStatus, selectedRoles) {
    let message = `🚨 SUBSCRIPTION PAYMENT REMINDER\n\n`;
    message += `Plan: ${subscriptionStatus.planType}\n`;
    message += `Amount Due: ₹${subscriptionStatus.amount.toLocaleString()}\n`;
    message += `Status: ${subscriptionStatus.isExpired ? 'EXPIRED' : subscriptionStatus.isExpiring ? 'EXPIRING SOON' : 'PAYMENT REQUIRED'}\n`;
    
    if (!subscriptionStatus.isExpired) {
      message += `Days Until Expiry: ${subscriptionStatus.daysUntilExpiry}\n`;
    }
    
    message += `Expiry Date: ${subscriptionStatus.expiryDate.toLocaleDateString()}\n`;
    message += `Sent to: ${selectedRoles.join(', ')} roles\n\n`;
    
    message += `🎯 Plan Features:\n`;
    subscriptionStatus.features.forEach((feature, index) => {
      message += `${index + 1}. ${feature}\n`;
    });

    message += `\n⚡ Action Required: Complete your subscription payment to continue using all features.\n`;
    message += `📞 Contact support for assistance or questions about your subscription.`;

    return message;
  }

  /**
   * Generate detailed reminder message for role-specific reminders (legacy patient reminders)
   */
  generateRoleSpecificReminderMessage(patient, totalDue, overdueDetails, selectedRoles) {
    let message = `🚨 MANUAL PAYMENT REMINDER\n\n`;
    message += `Patient: ${patient.name}\n`;
    message += `Contact: ${patient.contact || 'N/A'}\n`;
    message += `Total Outstanding: ₹${totalDue.toLocaleString()}\n`;
    message += `Sent to: ${selectedRoles.join(', ')} roles\n\n`;
    
    message += `📋 Outstanding Items:\n`;
    overdueDetails.forEach((detail, index) => {
      message += `${index + 1}. ${detail.type}`;
      if (detail.group) message += ` (${detail.group})`;
      message += `\n   • Procedure: ${detail.procedure}`;
      if (detail.date) message += `\n   • Date: ${new Date(detail.date).toLocaleDateString()}`;
      message += `\n   • Doctor: ${detail.doctor}`;
      message += `\n   • Amount Due: ₹${detail.amount.toLocaleString()}\n\n`;
    });

    message += `⚡ This is a manual reminder sent immediately.\n`;
    message += `📞 Please contact the patient or update payment records promptly.`;

    return message;
  }
}

module.exports = PaymentReminderService;