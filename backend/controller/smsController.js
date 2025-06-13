const twilioConfig = require('../config/twilio');
const Patient = require('../model/Patient');

const sendSingleSMS = async (req, res) => {
    try {
        const { phoneNumber, message } = req.body;

        if (!phoneNumber || !message) {
            return res.status(400).json({ error: 'Phone number and message are required' });
        }

        // Validate phone number format
        if (!phoneNumber.match(/^\+?[1-9]\d{1,14}$/)) {
            return res.status(400).json({ error: 'Invalid phone number format. Please use E.164 format (e.g., +9779812345678)' });
        }

        // Ensure phone number has country code
        const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

        // First, verify the phone number
        try {
            await twilioConfig.client.lookups.v2.phoneNumbers(formattedNumber).fetch();
        } catch (error) {
            return res.status(400).json({
                error: 'Invalid phone number',
                details: 'The provided phone number could not be verified',
                code: error.code
            });
        }

        // Send the message using a specific phone number instead of messaging service
        const result = await twilioConfig.client.messages.create({
            body: message,
            to: formattedNumber,
            from: twilioConfig.fromNumber // Use specific phone number
        });

        console.log('SMS Result:', {
            sid: result.sid,
            status: result.status,
            to: result.to,
            from: result.from,
            dateCreated: result.dateCreated,
            errorMessage: result.errorMessage,
            errorCode: result.errorCode
        });

        // Return more detailed response
        res.status(200).json({ 
            success: true, 
            messageId: result.sid,
            status: result.status,
            to: result.to,
            from: result.from,
            dateCreated: result.dateCreated,
            direction: result.direction,
            numSegments: result.numSegments,
            price: result.price,
            priceUnit: result.priceUnit,
            errorMessage: result.errorMessage,
            errorCode: result.errorCode
        });
    } catch (error) {
        console.error('Error sending SMS:', error);
        res.status(500).json({ 
            error: 'Failed to send SMS', 
            details: error.message,
            code: error.code || 'UNKNOWN_ERROR',
            moreInfo: error.moreInfo
        });
    }
};

const sendBulkSMS = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get all patients with phone numbers
        const patients = await Patient.find({ 
            'personalDetails.contactNumber': { 
                $exists: true, 
                $ne: null,
                $regex: /^\+?[1-9]\d{1,14}$/ // Validate phone number format
            } 
        });
        
        const results = [];
        const errors = [];

        // Send SMS to each patient
        for (const patient of patients) {
            try {
                // Ensure phone number has country code
                const phoneNumber = patient.personalDetails.contactNumber.startsWith('+') 
                    ? patient.personalDetails.contactNumber 
                    : `+${patient.personalDetails.contactNumber}`;

                const result = await twilioConfig.client.messages.create({
                    body: message,
                    to: phoneNumber,
                    messagingServiceSid: twilioConfig.messagingServiceSid
                });
                
                results.push({ 
                    patientId: patient._id, 
                    messageId: result.sid,
                    status: result.status,
                    to: result.to,
                    dateCreated: result.dateCreated,
                    direction: result.direction,
                    numSegments: result.numSegments,
                    price: result.price,
                    priceUnit: result.priceUnit
                });
            } catch (error) {
                errors.push({ 
                    patientId: patient._id, 
                    error: error.message,
                    code: error.code || 'UNKNOWN_ERROR',
                    moreInfo: error.moreInfo
                });
            }
        }

        res.status(200).json({
            success: true,
            totalSent: results.length,
            totalErrors: errors.length,
            results,
            errors
        });
    } catch (error) {
        console.error('Error sending bulk SMS:', error);
        res.status(500).json({ 
            error: 'Failed to send bulk SMS', 
            details: error.message,
            code: error.code || 'UNKNOWN_ERROR',
            moreInfo: error.moreInfo
        });
    }
};

module.exports = {
    sendSingleSMS,
    sendBulkSMS
}; 