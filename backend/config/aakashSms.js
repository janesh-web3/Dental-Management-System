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
    // Check if the token looks like a valid token (not the fake one)
    if (this.authToken.includes('fake') || this.authToken.length < 50) {
      console.error('AAKASH_SMS_AUTH_TOKEN appears to be invalid or fake. Please replace with a valid token from your Aakash SMS dashboard.');
      return false;
    }
    return true;
  },
  
  // Get configuration status for debugging
  getConfigStatus: function() {
    return {
      hasAuthToken: !!this.authToken,
      authTokenLength: this.authToken ? this.authToken.length : 0,
      isTokenValidFormat: this.authToken && !this.authToken.includes('fake') && this.authToken.length >= 50,
      apiUrl: this.apiUrl,
      apiUrlV4: this.apiUrlV4,
      creditUrl: this.creditUrl
    };
  },
  
  // Credit check methods
  checkCredit: async function() {
    try {
      // Log the auth token being used (first 10 chars only for security)
      console.log('Checking SMS credit with auth token:', this.authToken?.substring(0, 10) + '...');
      
      // Check configuration first
      if (!this.authToken) {
        return {
          success: false,
          credit: 0,
          error: 'Aakash SMS auth token is not configured',
          details: 'Please set AAKASH_SMS_AUTH_TOKEN in your environment variables'
        };
      }
      
      const response = await axios.get(this.creditUrl, {
        headers: { 'auth-token': this.authToken }
      });
      
      // Check if response is HTML (error page) instead of JSON
      if (typeof response.data === 'string' && response.data.includes('<html')) {
        return {
          success: false,
          credit: 0,
          error: 'Received HTML error page instead of JSON response',
          details: 'This usually indicates an authentication issue or incorrect endpoint',
          response: response.data.substring(0, 200) + '...'
        };
      }
      
      console.log('Credit check response:', response.data);
      
      // Check if response has the expected structure
      if (response.data && (response.data.credit !== undefined || response.data.available_credit !== undefined)) {
        return {
          success: true,
          credit: response.data.credit || response.data.available_credit || 0
        };
      } else if (response.data && response.data.response_code === 200 && response.data.message) {
        // Handle alternative response format
        const creditMatch = response.data.message.match(/(\d+)/);
        const credit = creditMatch ? parseInt(creditMatch[1]) : 0;
        return {
          success: true,
          credit: credit
        };
      } else {
        // If response structure is not as expected, return an error
        return {
          success: false,
          credit: 0,
          error: 'Unexpected response format from Aakash SMS credit API',
          response: response.data
        };
      }
    } catch (error) {
      console.error('Error checking SMS credit:', error.message);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      // Check if we received HTML error page
      if (error.response?.data && typeof error.response.data === 'string' && error.response.data.includes('<html')) {
        return {
          success: false,
          credit: 0,
          error: 'Authentication failed or invalid endpoint',
          details: 'Received HTML error page. Please check your Aakash SMS auth token and endpoint.',
          response: error.response.data.substring(0, 200) + '...'
        };
      }
      
      return {
        success: false,
        credit: 0,
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      };
    }
  },
  
  getDetailedCredit: async function() {
    try {
      // Log the auth token being used (first 10 chars only for security)
      console.log('Getting detailed SMS credit with auth token:', this.authToken?.substring(0, 10) + '...');
      
      // Check configuration first
      if (!this.authToken) {
        return {
          success: false,
          data: null,
          error: 'Aakash SMS auth token is not configured',
          details: 'Please set AAKASH_SMS_AUTH_TOKEN in your environment variables'
        };
      }
      
      const response = await axios.get(this.availableCreditUrl, {
        headers: { 'auth-token': this.authToken }
      });
      
      // Check if response is HTML (error page) instead of JSON
      if (typeof response.data === 'string' && response.data.includes('<html')) {
        return {
          success: false,
          data: null,
          error: 'Received HTML error page instead of JSON response',
          details: 'This usually indicates an authentication issue or incorrect endpoint',
          response: response.data.substring(0, 200) + '...'
        };
      }
      
      console.log('Detailed credit response:', response.data);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error getting detailed SMS credit:', error.message);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      return {
        success: false,
        data: null,
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      };
    }
  }
};

// Verify configuration on startup
if (!aakashSmsConfig.verifyConfig()) {
  console.warn('Aakash SMS configuration is incomplete or invalid. SMS functionality may not work properly.');
  // Log detailed config status for debugging
  console.log('Aakash SMS Config Status:', aakashSmsConfig.getConfigStatus());
}

module.exports = aakashSmsConfig;