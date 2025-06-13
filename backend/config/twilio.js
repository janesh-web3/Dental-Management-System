require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
    console.error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set in environment variables');
    process.exit(1);
}

const client = twilio(accountSid, authToken);

// Create messaging service if it doesn't exist
async function initializeMessagingService() {
    try {
        // Try to get existing service
        const services = await client.messaging.v1.services.list();
        const existingService = services.find(s => s.friendlyName === 'DMS Messaging Service');
        
        if (existingService) {
            console.log('Using existing messaging service:', existingService.sid);
            return existingService.sid;
        }

        // Create new service if none exists
        const service = await client.messaging.v1.services.create({
            friendlyName: 'DMS Messaging Service',
            inboundRequestUrl: 'https://your-domain.com/sms/inbound', // Update this with your domain
            statusCallback: 'https://your-domain.com/sms/status' // Update this with your domain
        });
        
        console.log('Created new messaging service:', service.sid);
        return service.sid;
    } catch (error) {
        console.error('Error initializing messaging service:', error);
        throw error;
    }
}

// Initialize the messaging service and export the configuration
const twilioConfig = {
    client,
    accountSid,
    authToken,
    messagingServiceSid: null, // Will be set after initialization
    // Add your Twilio phone number here
    fromNumber: process.env.TWILIO_PHONE_NUMBER || '+14155238886' // Default to a Twilio number
};

// Initialize messaging service and update config
initializeMessagingService()
    .then(sid => {
        twilioConfig.messagingServiceSid = sid;
        console.log('Twilio configuration initialized successfully');
    })
    .catch(error => {
        console.error('Failed to initialize Twilio configuration:', error);
        process.exit(1);
    });

module.exports = twilioConfig; 