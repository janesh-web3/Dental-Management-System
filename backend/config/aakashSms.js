require('dotenv').config();
const axios = require('axios');

const aakashSmsConfig = {
  // Base SMS sending APIs
  apiUrl: 'https://sms.aakashsms.com/sms/v3/send',
  apiUrlV4: 'https://sms.aakashsms.com/sms/v4/send-user',
  
  // Credit check APIs
  creditUrl: 'https://sms.aakashsms.com/sms/v4/credit',
  availableCreditUrl: 'https://sms.aakashsms.com/sms/v4/available-credit',
  
  // Report APIs
  reportApiUrl: 'https://sms.aakashsms.com/sms/v4/api-report',
  reportApiUrlV1: 'https://sms.aakashsms.com/sms/v1/report/api',
  
  // Interactive SMS APIs
  interactiveSmsUrl: 'https://sms.aakashsms.com/sms/v1/send/interactive-sms',
  interactiveSmsJsonUrl: 'https://sms.aakashsms.com/sms/v1/send/interactive-sms-json',
  interactiveSmsReportUrl: 'https://sms.aakashsms.com/sms/v1/report/interactive-sms',
  
  // Authentication token
  authToken: process.env.AAKASH_SMS_AUTH_TOKEN,
  
  // A function to verify the configuration
  verifyConfig: function() {
    if (!this.authToken) {
      console.error('AAKASH_SMS_AUTH_TOKEN must be set in environment variables');
      return false;
    }
    return true;
  },
  
  // Credit check methods
  checkCredit: async function() {
    try {
      const response = await axios.get(this.creditUrl, {
        headers: { 'auth-token': this.authToken }
      });
      return {
        success: true,
        credit: response.data.credit || 0
      };
    } catch (error) {
      console.error('Error checking SMS credit:', error.message);
      return {
        success: false,
        credit: 0,
        error: error.message
      };
    }
  },
  
  getDetailedCredit: async function() {
    try {
      const response = await axios.get(this.availableCreditUrl, {
        headers: { 'auth-token': this.authToken }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error getting detailed SMS credit:', error.message);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }
};

// Verify configuration on startup
if (!aakashSmsConfig.verifyConfig()) {
  console.warn('Aakash SMS configuration is incomplete. SMS functionality may not work properly.');
}

module.exports = aakashSmsConfig;
