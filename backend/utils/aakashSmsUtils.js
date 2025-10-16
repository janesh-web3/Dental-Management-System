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
        
        // Send SMS using Aakash SMS v3 API
        // According to Aakash SMS documentation, the parameter should be 'token' not 'auth_token'
        const response = await axios.post(aakashSmsConfig.apiUrl, null, {
            params: {
                token: aakashSmsConfig.authToken,  // Changed from 'auth_token' to 'token'
                to: formattedNumber,
                text: message
            }
        });
        
        // Check for API error
        if (response.data.error) {
            return {
                success: false,
                error: response.data.message || 'Failed to send SMS',
                code: response.data.code || 'UNKNOWN_ERROR'
            };
        }
        
        // Check for authentication errors
        if (response.data.auth_status === false || response.data.auth === false) {
            return {
                success: false,
                error: 'Authentication failed. Please check your Aakash SMS auth token.',
                code: 'AUTH_FAILED'
            };
        }
        
        // Extract SMS result
        const smsResult = response.data.data && response.data.data.valid ? 
            response.data.data.valid[0] : null;
        
        if (!smsResult) {
            return {
                success: false,
                error: 'No valid response from SMS provider',
                code: 'INVALID_RESPONSE'
            };
        }
        
        return {
            success: true,
            messageId: smsResult.id,
            status: smsResult.status,
            recipient: smsResult.mobile,
            credit: smsResult.credit,
            network: smsResult.network
        };
    } catch (error) {
        console.error('Error sending single SMS:', error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message,
            code: error.response?.data?.code || 'REQUEST_FAILED'
        };
    }
};

/**
 * Send bulk SMS using Aakash SMS v4 API (multiple messages to multiple recipients)
 * @param {string[]} phoneNumbers - Array of recipient phone numbers
 * @param {string|string[]} messages - Single message for all or array of messages for each recipient
 * @returns {Promise<object>} - Response from Aakash SMS API
 */
const sendBulkSMS = async (phoneNumbers, messages) => {
    try {
        // Validate and format phone numbers
        const formattedNumbers = [];
        const validRecipients = [];
        const invalidRecipients = [];
        
        for (let i = 0; i < phoneNumbers.length; i++) {
            try {
                const formattedNumber = formatPhoneNumber(phoneNumbers[i]);
                // Basic validation for Nepal numbers
                if (formattedNumber.match(/^9[678]\d{8}$/)) {
                    formattedNumbers.push(formattedNumber);
                    validRecipients.push({
                        originalNumber: phoneNumbers[i],
                        formattedNumber,
                        index: i
                    });
                } else {
                    invalidRecipients.push({
                        originalNumber: phoneNumbers[i],
                        reason: 'Invalid phone number format'
                    });
                }
            } catch (error) {
                invalidRecipients.push({
                    originalNumber: phoneNumbers[i],
                    reason: error.message
                });
            }
        }
        
        // If no valid recipients, return error
        if (formattedNumbers.length === 0) {
            return {
                success: false,
                error: 'No valid phone numbers provided',
                code: 'NO_VALID_RECIPIENTS',
                invalidRecipients
            };
        }
        
        // Prepare message array if single message is provided
        const messageArray = Array.isArray(messages) ? messages : formattedNumbers.map(() => messages);
        
        // Ensure messageArray matches formattedNumbers length
        if (Array.isArray(messages) && messageArray.length !== formattedNumbers.length) {
            // If messages array is shorter, pad with the last message
            const lastMessage = messageArray[messageArray.length - 1];
            while (messageArray.length < formattedNumbers.length) {
                messageArray.push(lastMessage);
            }
            // If messages array is longer, truncate
            if (messageArray.length > formattedNumbers.length) {
                messageArray.length = formattedNumbers.length;
            }
        }
        
        // Send SMS using Aakash SMS v4 API
        const payload = {
            to: formattedNumbers,
            text: messageArray.length === 1 ? messageArray[0] : messageArray
        };
        
        const response = await axios.post(
            aakashSmsConfig.apiUrlV4,
            payload,
            {
                headers: {
                    'auth-token': aakashSmsConfig.authToken,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        // Check for API error
        if (response.data.error) {
            return {
                success: false,
                error: response.data.message || 'Failed to send bulk SMS',
                code: response.data.code || 'UNKNOWN_ERROR',
                invalidRecipients
            };
        }
        
        // Check for authentication errors
        if (response.data.auth_status === false || response.data.auth === false) {
            return {
                success: false,
                error: 'Authentication failed. Please check your Aakash SMS auth token.',
                code: 'AUTH_FAILED',
                invalidRecipients
            };
        }
        
        // Process results
        const results = {
            success: true,
            totalSent: 0,
            totalFailed: 0,
            validMessages: [],
            invalidMessages: [],
            invalidRecipients
        };
        
        console.log('Aakash SMS API response data:', JSON.stringify(response.data, null, 2));
        
        // Process valid messages
        if (response.data.data && response.data.data.valid) {
            console.log('Processing valid messages:', response.data.data.valid);
            results.validMessages = response.data.data.valid.map(result => ({
                messageId: result.id,
                status: result.status,
                recipient: result.mobile,
                credit: result.credit,
                network: result.network
            }));
            results.totalSent = results.validMessages.length;
            console.log('Total valid messages:', results.totalSent);
        }
        
        // Process invalid messages
        if (response.data.data && response.data.data.invalid) {
            console.log('Processing invalid messages:', response.data.data.invalid);
            results.invalidMessages = response.data.data.invalid.map(result => ({
                recipient: result.mobile,
                status: result.status,
                reason: result.network
            }));
            results.totalFailed = results.invalidMessages.length;
            console.log('Total invalid messages:', results.totalFailed);
        }
        
        return results;
    } catch (error) {
        console.error('Error sending bulk SMS:', error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message,
            code: error.response?.data?.code || 'REQUEST_FAILED'
        };
    }
};

/**
 * Check SMS credit balance
 * @returns {Promise<object>} - Credit balance information
 */
const checkCredit = async () => {
    try {
        // Log the auth token being used (first 10 chars only for security)
        console.log('Checking SMS credit with auth token:', aakashSmsConfig.authToken?.substring(0, 10) + '...');
        
        const response = await axios.get(aakashSmsConfig.creditUrl, {
            headers: {
                'auth-token': aakashSmsConfig.authToken
            }
        });
        
        console.log('Credit check response:', response.data);
        
        if (response.data && response.data.credit !== undefined) {
            return {
                success: true,
                availableCredit: response.data.credit,
                message: 'Credit balance retrieved successfully'
            };
        } else {
            return {
                success: false,
                availableCredit: 0,
                error: 'Could not retrieve credit information'
            };
        }
    } catch (error) {
        console.error('Error checking SMS credit:', error.message);
        console.error('Error response:', error.response?.data);
        return {
            success: false,
            availableCredit: 0,
            error: error.response?.data?.message || error.message
        };
    }
};

/**
 * Get detailed credit information
 * @returns {Promise<object>} - Detailed credit information
 */
const getDetailedCredit = async () => {
    try {
        const response = await axios.get(aakashSmsConfig.availableCreditUrl, {
            headers: {
                'auth-token': aakashSmsConfig.authToken
            }
        });
        
        return {
            success: true,
            data: response.data,
            message: 'Detailed credit information retrieved successfully'
        };
    } catch (error) {
        console.error('Error getting detailed SMS credit:', error.message);
        return {
            success: false,
            data: null,
            error: error.response?.data?.message || error.message
        };
    }
};

/**
 * Get SMS report for a date range
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<object>} - SMS report
 */
const getSMSReport = async (startDate, endDate) => {
    try {
        const response = await axios.post(
            aakashSmsConfig.reportApiUrl,
            {
                start_date: startDate,
                end_date: endDate
            },
            {
                headers: {
                    'auth-token': aakashSmsConfig.authToken
                }
            }
        );
        
        return {
            success: true,
            data: response.data,
            message: 'SMS report retrieved successfully'
        };
    } catch (error) {
        console.error('Error getting SMS report:', error.message);
        return {
            success: false,
            data: null,
            error: error.response?.data?.message || error.message
        };
    }
};

/**
 * Send interactive SMS (for campaigns, forms, etc.)
 * @param {object} options - Interactive SMS options
 * @returns {Promise<object>} - Response from Aakash SMS API
 */
const sendInteractiveSMS = async (options) => {
    try {
        const { to, text, replyCallback, expiryTime, campaignId } = options;
        
        // Format and validate phone number
        const formattedNumber = verifyPhoneNumber(to);
        
        // Send interactive SMS
        const response = await axios.post(
            aakashSmsConfig.interactiveSmsUrl,
            {
                to: formattedNumber,
                text: text,
                reply_callback: replyCallback,
                expiry_time: expiryTime || 86400, // Default 24 hours
                campaign_id: campaignId
            },
            {
                headers: {
                    'auth-token': aakashSmsConfig.authToken
                }
            }
        );
        
        // Check for API error
        if (response.data.error) {
            return {
                success: false,
                error: response.data.message || 'Failed to send interactive SMS',
                code: response.data.code || 'UNKNOWN_ERROR'
            };
        }
        
        return {
            success: true,
            data: response.data,
            message: 'Interactive SMS sent successfully'
        };
    } catch (error) {
        console.error('Error sending interactive SMS:', error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message,
            code: error.response?.data?.code || 'REQUEST_FAILED'
        };
    }
};

/**
 * Send follow-up SMS to a patient
 * @param {string} phoneNumber - Patient's phone number
 * @param {Date} followUpDate - Follow-up appointment date
 * @param {string} patientName - Patient's name
 * @param {string} clinicName - Clinic name
 * @returns {Promise<object>} - Response from SMS API
 */
const sendFollowUpSMS = async (phoneNumber, followUpDate, patientName, clinicName) => {
    try {
        const formattedDate = new Date(followUpDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const message = `Dear ${patientName}, this is a reminder about your follow-up dental appointment on ${formattedDate} at ${clinicName}. Please visit on time. Thank you.`;
        
        return await sendSingleSMS(phoneNumber, message);
    } catch (error) {
        console.error('Error sending follow-up SMS:', error.message);
        return {
            success: false,
            error: error.message,
            code: 'FOLLOWUP_SMS_FAILED'
        };
    }
};

/**
 * Send payment reminder SMS to a patient
 * @param {string} phoneNumber - Patient's phone number
 * @param {string} patientName - Patient's name
 * @param {number} amountDue - Amount due
 * @param {string} clinicName - Clinic name
 * @returns {Promise<object>} - Response from SMS API
 */
const sendPaymentReminderSMS = async (phoneNumber, patientName, amountDue, clinicName) => {
    try {
        const message = `Dear ${patientName}, you have a pending dental bill of Rs ${amountDue}. Please clear your dues at your earliest convenience. - ${clinicName}`;
        
        return await sendSingleSMS(phoneNumber, message);
    } catch (error) {
        console.error('Error sending payment reminder SMS:', error.message);
        return {
            success: false,
            error: error.message,
            code: 'PAYMENT_SMS_FAILED'
        };
    }
};

module.exports = {
    formatPhoneNumber,
    verifyPhoneNumber,
    sendSingleSMS,
    sendBulkSMS,
    checkCredit,
    getDetailedCredit,
    getSMSReport,
    sendInteractiveSMS,
    sendFollowUpSMS,
    sendPaymentReminderSMS
};
