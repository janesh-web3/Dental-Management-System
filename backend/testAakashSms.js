/**
 * Aakash SMS API Integration Test
 * 
 * This script tests the Aakash SMS API integration.
 * Run with: node testAakashSms.js
 */

const aakashSmsUtils = require('./utils/aakashSmsUtils');
require('dotenv').config();

// Simple logger for tests
const log = (testName, result) => {
  console.log(`\n=== ${testName} ===`);
  console.log(JSON.stringify(result, null, 2));
  console.log('======================================\n');
};

// Run all tests
const runTests = async () => {
  try {
    // Test 1: Check credit balance
    console.log('Testing credit balance check...');
    const creditResult = await aakashSmsUtils.checkCredit();
    log('Credit Balance Check', creditResult);
    
    // Only continue tests if we have credits
    if (creditResult.success && creditResult.availableCredit > 0) {
      // Test 2: Send a single SMS (uncomment to actually send SMS)
      /*
      console.log('Testing single SMS sending...');
      const singleSmsResult = await aakashSmsUtils.sendSingleSMS(
        '9818000000', // Replace with a real test number
        'Test message from DMS app - ' + new Date().toLocaleTimeString()
      );
      log('Single SMS Send', singleSmsResult);
      */
      
      // Test 3: Format phone number
      console.log('Testing phone number formatting...');
      const phoneNumberTests = [
        '9818000000',
        '+9779818000000',
        '977-9818000000',
        '(977) 9818 000000'
      ];
      
      const formattingResults = phoneNumberTests.map(num => {
        try {
          return {
            original: num,
            formatted: aakashSmsUtils.formatPhoneNumber(num),
            valid: true
          };
        } catch (e) {
          return {
            original: num,
            error: e.message,
            valid: false
          };
        }
      });
      
      log('Phone Number Formatting', formattingResults);
      
      // Test 4: Get detailed credit (admin only)
      console.log('Testing detailed credit info...');
      const detailedCreditResult = await aakashSmsUtils.getDetailedCredit();
      log('Detailed Credit Info', detailedCreditResult);
      
    } else {
      console.warn('Skipping SMS send tests due to no available credits');
    }
    
    console.log('All tests completed!');
    
  } catch (error) {
    console.error('Error running tests:', error);
  }
};

// Run the tests
runTests();
