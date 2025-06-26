/**
 * Aakash SMS Utility Functions
 * 
 * This file contains utility functions for interacting with the Aakash SMS API
 * including sending single and bulk SMS, checking credit, and retrieving reports.
 */

const axios = require('axios');
const aakashSmsConfig = require('../config/aakashSms');

/**
 * Format and validate a phone number for Nepal
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} - Formatted 10-digit phone number
 */
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

/**
 * Verify a phone number is a valid Nepal phone number
 * @param {string} phoneNumber - The phone number to verify
 * @returns {string} - Validated phone number
 * @throws {Error} - If phone number is invalid
 */
const verifyPhoneNumber = (phoneNumber) => {
    const formattedNumber = formatPhoneNumber(phoneNumber);
    
    // Check if it's a valid 10-digit Nepali number
    if (!formattedNumber.match(/^9[678]\d{8}$/)) {
        throw new Error('Invalid phone number format. Please provide a valid 10-digit Nepali number.');
    }
    
    return formattedNumber;
};

/**
 * Send a single SMS using Aakash SMS v3 API
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} message - SMS content
 * @returns {Promise<object>} - Response from Aakash SMS API
 */
const sendSingleSMS = async (phoneNumber, message) => {
    try {
        // Format and validate phone number
        const formattedNumber = verifyPhoneNumber(phoneNumber);
        
        // Send the message via Aakash SMS v3 API
        const response = await axios.post(aakashSmsConfig.apiUrl, null, {
            params: {
                auth_token: aakashSmsConfig.authToken,
                to: formattedNumber,
                text: message
            }
        });
        
        if (response.data.error) {
            throw new Error(response.data.message || 'Failed to send SMS');
        }
        
        return {
            success: true,
            messageId: response.data.data.valid[0]?.id,
            status: response.data.data.valid[0]?.status,
            credit: response.data.data.valid[0]?.credit,
            network: response.data.data.valid[0]?.network,
            message: response.data.message
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            details: error.response?.data
        };
    }
};

/**
 * Send bulk SMS using Aakash SMS v4 API
 * @param {string[]} phoneNumbers - Array of recipient phone numbers
 * @param {string|string[]} messages - SMS content (single message or array of messages)
 * @returns {Promise<object>} - Response from Aakash SMS API
 */
const sendBulkSMS = async (phoneNumbers, messages) => {
    try {
        // Format and validate all phone numbers
        const formattedNumbers = phoneNumbers.map(number => {
            try {
                return verifyPhoneNumber(number);
            } catch (error) {
                console.warn(`Invalid phone number skipped: ${number}`);
                return null;
            }
        }).filter(number => number !== null);
        
        if (formattedNumbers.length === 0) {
            throw new Error('No valid phone numbers provided');
        }
        
        // Prepare the text array based on whether we have single or multiple messages
        let textArray;
        if (Array.isArray(messages)) {
            // If messages is an array, use it as is
            textArray = messages;
        } else {
            // If messages is a single string, create an array with just that message
            textArray = [messages];
        }
        
        // Send the messages via Aakash SMS v4 API
        const response = await axios.post(
            aakashSmsConfig.apiUrlV4,
            {
                to: formattedNumbers,
                text: textArray
            },
            {
                headers: {
                    'auth-token': aakashSmsConfig.authToken,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (response.data.error) {
            throw new Error(response.data.message || 'Failed to send bulk SMS');
        }
        
        return {
            success: true,
            responses: response.data.responses,
            errors: response.data.errors
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            details: error.response?.data
        };
    }
};

/**
 * Get SMS sending report for a date range
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<object>} - SMS report data
 */
const getSMSReport = async (startDate, endDate) => {
    try {
        const response = await axios.post(
            aakashSmsConfig.reportApiUrl,
            { start_date: startDate, end_date: endDate },
            { 
                headers: { 'auth-token': aakashSmsConfig.authToken }
            }
        );
        
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            details: error.response?.data
        };
    }
};

/**
 * Get paginated SMS reports
 * @param {number} page - Page number (starts from 1)
 * @returns {Promise<object>} - Paginated SMS report data
 */
const getPaginatedSMSReport = async (page = 1) => {
    try {
        const response = await axios.post(
            aakashSmsConfig.reportApiUrlV1,
            { 
                auth_token: aakashSmsConfig.authToken,
                page: page 
            }
        );
        
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            details: error.response?.data
        };
    }
};

/**
 * Send an interactive SMS (for campaigns)
 * @param {string|string[]} phoneNumbers - Recipient phone numbers
 * @param {string} message - SMS content
 * @param {number} campaignId - Campaign ID from Aakash SMS dashboard
 * @returns {Promise<object>} - Response from Aakash SMS API
 */
const sendInteractiveSMS = async (phoneNumbers, message, campaignId) => {
    try {
        // Format phone numbers as comma-separated string if it's an array
        const to = Array.isArray(phoneNumbers) 
            ? phoneNumbers.map(num => verifyPhoneNumber(num)).join(',')
            : verifyPhoneNumber(phoneNumbers);
        
        const response = await axios.post(
            aakashSmsConfig.interactiveSmsUrl,
            {
                auth_token: aakashSmsConfig.authToken,
                campaign_id: campaignId,
                to: to,
                text: message
            }
        );
        
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            details: error.response?.data
        };
    }
};

module.exports = {
    formatPhoneNumber,
    verifyPhoneNumber,
    sendSingleSMS,
    sendBulkSMS,
    getSMSReport,
    getPaginatedSMSReport,
    sendInteractiveSMS,
    checkCredit: aakashSmsConfig.checkCredit.bind(aakashSmsConfig),
    getDetailedCredit: aakashSmsConfig.getDetailedCredit.bind(aakashSmsConfig)
};
