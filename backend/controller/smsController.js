const axios = require('axios');
const aakashSmsConfig = require('../config/aakashSms');
const Patient = require('../model/Patient');
const SMSTemplate = require('../model/SMSTemplate');
const SMSHistory = require('../model/SMSHistory');
const SMSClassConfig = require('../model/SMSClassConfig');
const SMSCampaign = require('../model/SMSCampaign');
const SMSDeliveryReport = require('../model/SMSDeliveryReport');
const mongoose = require('mongoose');
const aakashSmsUtils = require('../utils/aakashSmsUtils');

// Helper function to validate and format phone number for Nepal
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

// Helper function to verify phone number format
const verifyPhoneNumber = (phoneNumber) => {
    const formattedNumber = formatPhoneNumber(phoneNumber);
    
    // Check if it's a valid 10-digit Nepali number
    if (!formattedNumber.match(/^9[678]\d{8}$/)) {
        throw new Error('Invalid phone number format. Please provide a valid 10-digit Nepali number.');
    }
    
    return formattedNumber;
};

// Helper function to replace template variables
const replaceTemplateVariables = (template, variables) => {
    let message = template;
    
    if (variables) {
        Object.keys(variables).forEach(key => {
            const placeholder = new RegExp(`{{${key}}}`, 'g');
            message = message.replace(placeholder, variables[key] || '');
        });
    }
    
    // Remove any remaining placeholders
    message = message.replace(/{{[^{}]+}}/g, '');
    
    return message;
};

// Helper function to save SMS history with enhanced logging
const saveSMSHistory = async (smsData, req) => {
    try {
        // Add additional logging information from the request
        const enhancedSmsData = {
            ...smsData,
            sentBy: req.smsSender ? req.smsSender.userId : smsData.sentBy,
            sentByName: req.smsSender ? req.smsSender.name : null,
            sentByRole: req.smsSender ? req.smsSender.role : null,
            sentAt: req.smsLog ? req.smsLog.timestamp : new Date(),
            sentFromIP: req.smsLog ? req.smsLog.ip : null,
            userAgent: req.smsLog ? req.smsLog.userAgent : null
        };
        
        const smsHistory = new SMSHistory(enhancedSmsData);
        await smsHistory.save();
        return smsHistory;
    } catch (error) {
        console.error('Error saving SMS history:', error);
        // We don't want to fail the SMS sending if history saving fails
        return null;
    }
};

// Send SMS using Aakash SMS API
const sendSingleSMS = async (req, res) => {
    try {
        const { 
            phoneNumber, 
            message, 
            patientId, 
            templateId, 
            variables,
            scheduledFor 
        } = req.body;

        if (!phoneNumber || (!message && !templateId)) {
            return res.status(400).json({ 
                error: 'Phone number and either message or template ID are required' 
            });
        }

        // Format and validate phone number
        let formattedNumber;
        try {
            formattedNumber = verifyPhoneNumber(phoneNumber);
        } catch (error) {
            return res.status(400).json({
                error: 'Invalid phone number',
                details: error.message,
            });
        }

        // Get message content from template if templateId is provided
        let messageContent = message;
        let templateUsed = null;
        
        if (templateId) {
            try {
                const template = await SMSTemplate.findById(templateId);
                if (!template) {
                    return res.status(404).json({ error: 'Template not found' });
                }
                
                messageContent = replaceTemplateVariables(template.content, variables);
                templateUsed = template._id;
                
                // Update template usage stats
                template.lastUsed = new Date();
                template.totalSent += 1;
                await template.save();
            } catch (error) {
                return res.status(500).json({ 
                    error: 'Failed to process template', 
                    details: error.message 
                });
            }
        }

        // Handle scheduled messages
        if (scheduledFor) {
            const scheduledDate = new Date(scheduledFor);
            
            if (isNaN(scheduledDate.getTime())) {
                return res.status(400).json({ error: 'Invalid date format for scheduling' });
            }
            
            if (scheduledDate <= new Date()) {
                return res.status(400).json({ error: 'Scheduled time must be in the future' });
            }
            
            // Save the scheduled SMS to history
            await saveSMSHistory({
                recipient: formattedNumber,
                message: messageContent,
                status: 'scheduled',
                sentBy: req.admin?.id || null,
                patient: patientId || null,
                templateUsed,
                scheduledFor: scheduledDate
            });
            
            // We'll need a separate scheduler service/cron job to actually send these
            return res.status(200).json({
                success: true,
                scheduled: true,
                scheduledFor: scheduledDate
            });
        }

        // Send the message immediately using Aakash SMS API
        const result = await aakashSmsUtils.sendSingleSMS(formattedNumber, messageContent);

        if (!result.success) {
            return res.status(400).json({
                error: 'Failed to send SMS',
                details: result.error,
            });
        }

        // Save to history with enhanced logging
        await saveSMSHistory({
            recipient: formattedNumber,
            message: messageContent,
            status: result.status || 'sent',
            messageId: result.messageId?.toString(),
            networkProvider: result.network,
            credit: result.credit,
            sentBy: req.user?._id || null,
            patient: patientId || null,
            templateUsed
        }, req);

        // Return success response
        res.status(200).json({ 
            success: true, 
            messageId: result.messageId,
            status: result.status,
            to: result.recipient,
            credit: result.credit,
            network: result.network
        });
    } catch (error) {
        console.error('Error sending SMS:', error);
        res.status(500).json({ 
            error: 'Failed to send SMS', 
            details: error.response?.data?.message || error.message,
        });
    }
};

const sendBulkSMS = async (req, res) => {
    try {
        const { 
            message, 
            templateId, 
            variables = {},
            patientIds = [],
            filters = {},
            scheduledFor,
            groupId
        } = req.body;

        if (!message && !templateId) {
            return res.status(400).json({ error: 'Either message or template ID is required' });
        }

        // Get message content from template if templateId is provided
        let messageContent = message;
        let templateUsed = null;
        
        if (templateId) {
            try {
                const template = await SMSTemplate.findById(templateId);
                if (!template) {
                    return res.status(404).json({ error: 'Template not found' });
                }
                
                messageContent = replaceTemplateVariables(template.content, variables);
                templateUsed = template._id;
                
                // Update template usage stats
                template.lastUsed = new Date();
                template.totalSent += 1;
                await template.save();
            } catch (error) {
                return res.status(500).json({ 
                    error: 'Failed to process template', 
                    details: error.message 
                });
            }
        }

        // Build the query to find patients
        let query = {
            'personalDetails.contactNumber': { 
                $exists: true, 
                $ne: null,
                $regex: /^(\+)?[0-9]{10,15}$/ // Validate phone number format
            }
        };

        // Add filter for specific patient IDs if provided
        if (patientIds && patientIds.length > 0) {
            const validIds = patientIds.filter(id => mongoose.Types.ObjectId.isValid(id));
            query._id = { $in: validIds.map(id => new mongoose.Types.ObjectId(id)) };
        }

        // Add additional filters if provided
        if (filters) {
            // Gender filter
            if (filters.gender && filters.gender !== "all") {
                query["personalDetails.gender"] = filters.gender;
            }
            
            // Procedure group filter
            if (filters.group && filters.group !== "all") {
                query["medicalDetails.group"] = filters.group;
            }
            
            // Treatment procedure filter
            if (filters.procedure && filters.procedure !== "all") {
                query["medicalDetails.treatmentPlanning.selectedTeethDetails"] = {
                    $elemMatch: {
                        "dailyTreatments.procedure": filters.procedure
                    }
                };
            }
            
            // Doctor filter
            if (filters.doctor && filters.doctor !== "all") {
                query["assignedDoctor"] = new mongoose.Types.ObjectId(filters.doctor);
            }
            
            // Date range filter
            if (filters.dateRange) {
                const dateQuery = {};
                
                if (filters.dateRange.from) {
                    dateQuery.$gte = new Date(filters.dateRange.from);
                }
                if (filters.dateRange.to) {
                    dateQuery.$lte = new Date(filters.dateRange.to);
                    dateQuery.$lte.setHours(23, 59, 59, 999); // End of the day
                }
                
                if (Object.keys(dateQuery).length > 0) {
                    query.createdAt = dateQuery;
                }
            }
        }

        console.log("Patient filter query:", JSON.stringify(query, null, 2));

        // Get patients matching the query
        const patients = await Patient.find(query);
        
        if (patients.length === 0) {
            return res.status(404).json({ error: 'No patients found matching the criteria' });
        }

        // Handle scheduled messages
        if (scheduledFor) {
            const scheduledDate = new Date(scheduledFor);
            
            if (isNaN(scheduledDate.getTime())) {
                return res.status(400).json({ error: 'Invalid date format for scheduling' });
            }
            
            if (scheduledDate <= new Date()) {
                return res.status(400).json({ error: 'Scheduled time must be in the future' });
            }
            
            // Save each scheduled SMS to history
            const scheduledMessages = patients.map(patient => {
                const phoneNumber = formatPhoneNumber(patient.personalDetails.contactNumber);
                
                // Personalize message if patient-specific variables are provided
                let personalizedMessage = messageContent;
                if (variables) {
                    personalizedMessage = replaceTemplateVariables(messageContent, {
                        ...variables,
                        name: patient.personalDetails.name,
                        patientName: patient.personalDetails.name,
                        // Add more patient-specific variables as needed
                    });
                }
                
                return {
                    recipient: phoneNumber,
                    message: personalizedMessage,
                    status: 'scheduled',
                    sentBy: req.user?._id || req.admin?.id,
                    patient: patient._id,
                    templateUsed,
                    scheduledFor: scheduledDate,
                    isBulk: true,
                    groupId: groupId || null
                };
            });
            
            // Enhance scheduled messages with logging information
            const enhancedScheduledMessages = scheduledMessages.map(msg => ({
                ...msg,
                sentByName: req.smsSender ? req.smsSender.name : null,
                sentByRole: req.smsSender ? req.smsSender.role : null,
                sentAt: req.smsLog ? req.smsLog.timestamp : new Date(),
                sentFromIP: req.smsLog ? req.smsLog.ip : null,
                userAgent: req.smsLog ? req.smsLog.userAgent : null
            }));
            
            await SMSHistory.insertMany(enhancedScheduledMessages);
            
            // Update group last used if groupId is provided
            if (groupId) {
                await require('../model/PatientGroup').findByIdAndUpdate(groupId, {
                    lastUsed: new Date(),
                    lastTemplateUsed: templateUsed
                });
            }
            
            return res.status(200).json({
                success: true,
                scheduled: true,
                scheduledFor: scheduledDate,
                totalScheduled: scheduledMessages.length
            });
        }

        // For immediate sending, prepare the arrays for the v4 API
        const phoneNumbers = [];
        const personalizedMessages = [];
        const patientMap = {};
        
        for (const patient of patients) {
            try {
                const phoneNumber = formatPhoneNumber(patient.personalDetails.contactNumber);
                
                // Skip invalid numbers
                if (!phoneNumber.match(/^9[678]\d{8}$/)) {
                    continue;
                }
                
                // Personalize message if patient-specific variables are provided
                let personalizedMessage = messageContent;
                if (variables) {
                    personalizedMessage = replaceTemplateVariables(messageContent, {
                        ...variables,
                        name: patient.personalDetails.name,
                        patientName: patient.personalDetails.name,
                        // Add more patient-specific variables as needed
                    });
                }
                
                phoneNumbers.push(phoneNumber);
                personalizedMessages.push(personalizedMessage);
                patientMap[phoneNumber] = patient._id;
            } catch (error) {
                console.error(`Error processing patient ${patient._id}:`, error.message);
            }
        }
        if (phoneNumbers.length === 0) {
            return res.status(400).json({ error: 'No valid phone numbers found' });
        }

        // Use the aakashSmsUtils to send the bulk SMS
        const result = await aakashSmsUtils.sendBulkSMS(phoneNumbers, personalizedMessages);
        
        if (!result.success) {
            return res.status(500).json({
                error: result.error || 'Failed to send bulk SMS',
                details: result.code || 'UNKNOWN_ERROR'
            });
        }
        
        // Save to history
        const historyRecords = [];
        
        // Process valid messages
        if (result.validMessages) {
            for (const validMsg of result.validMessages) {
                const patientId = patientMap[validMsg.recipient] || null;
                historyRecords.push({
                    recipient: validMsg.recipient,
                    message: personalizedMessages[phoneNumbers.indexOf(validMsg.recipient)],
                    status: validMsg.status || 'sent',
                    messageId: validMsg.messageId,
                    networkProvider: validMsg.network,
                    credit: validMsg.credit,
                    sentBy: req.user?._id || req.admin?.id,
                    patient: patientId,
                    templateUsed,
                    isBulk: true,
                    groupId: groupId || null
                });
            }
        }
        
        // Process invalid messages
        if (result.invalidMessages) {
            for (const invalidMsg of result.invalidMessages) {
                const patientId = patientMap[invalidMsg.recipient] || null;
                historyRecords.push({
                    recipient: invalidMsg.recipient,
                    message: personalizedMessages[phoneNumbers.indexOf(invalidMsg.recipient)],
                    status: 'failed',
                    errorMessage: invalidMsg.reason || 'Failed to send',
                    sentBy: req.user?._id || req.admin?.id,
                    patient: patientId,
                    templateUsed,
                    isBulk: true,
                    groupId: groupId || null
                });
            }
        }
        
        // Enhance history records with logging information
        const enhancedHistoryRecords = historyRecords.map(record => ({
            ...record,
            sentByName: req.smsSender ? req.smsSender.name : null,
            sentByRole: req.smsSender ? req.smsSender.role : null,
            sentAt: req.smsLog ? req.smsLog.timestamp : new Date(),
            sentFromIP: req.smsLog ? req.smsLog.ip : null,
            userAgent: req.smsLog ? req.smsLog.userAgent : null
        }));
        
        // Save all history records
        if (enhancedHistoryRecords.length > 0) {
            await SMSHistory.insertMany(enhancedHistoryRecords);
        }
        
        // Update group last used if groupId is provided
        if (groupId) {
            await require('../model/PatientGroup').findByIdAndUpdate(groupId, {
                lastUsed: new Date(),
                lastTemplateUsed: templateUsed
            });
        }
        
        // Return success response with details
        res.status(200).json({
            success: true,
            totalSent: result.totalSent,
            totalFailed: result.totalFailed,
            validMessages: result.validMessages,
            invalidMessages: result.invalidMessages
        });
    } catch (error) {
        console.error('Error sending bulk SMS:', error);
        res.status(500).json({ 
            error: 'Failed to send bulk SMS', 
            details: error.response?.data?.message || error.message,
        });
    }
};

// Get all SMS templates
const getTemplates = async (req, res) => {
    try {
        const templates = await SMSTemplate.find()
            .sort({ createdAt: -1 })
            .populate('createdBy', 'name email');
        
        res.status(200).json({ templates });
    } catch (error) {
        console.error('Error getting SMS templates:', error);
        res.status(500).json({ 
            error: 'Failed to get SMS templates', 
            details: error.message 
        });
    }
};

// Create a new SMS template
const createTemplate = async (req, res) => {
    try {
        const { name, content, variables, category, isAutoTriggered, triggerEvent, colorTag, senderId } = req.body;
        
        if (!name || !content) {
            return res.status(400).json({ error: 'Name and content are required' });
        }
        
        // Calculate character count for cost estimation
        const characterCount = content.length;
        
        const template = new SMSTemplate({
            name,
            content,
            variables: variables || [],
            category: category || 'General',
            createdBy: req.user._id,
            isAutoTriggered: isAutoTriggered || false,
            triggerEvent: triggerEvent || null,
            isActive: true,
            characterCount,
            colorTag: colorTag || 'gray',
            senderId: senderId || null
        });
        
        await template.save();
        
        res.status(201).json({ 
            success: true, 
            template 
        });
    } catch (error) {
        console.error('Error creating SMS template:', error);
        res.status(500).json({ 
            error: 'Failed to create SMS template', 
            details: error.message 
        });
    }
};

// Update an SMS template
const updateTemplate = async (req, res) => {
    try {
        const { templateId } = req.params;
        const { name, content, variables, category, isAutoTriggered, triggerEvent, isActive, colorTag, senderId } = req.body;
        
        if (!name || !content) {
            return res.status(400).json({ error: 'Name and content are required' });
        }
        
        // Calculate character count for cost estimation
        const characterCount = content.length;
        
        const updateData = {
            name,
            content,
            variables: variables || [],
            category: category || 'General',
            characterCount
        };
        
        // Add auto-trigger fields if provided
        if (isAutoTriggered !== undefined) updateData.isAutoTriggered = isAutoTriggered;
        if (triggerEvent !== undefined) updateData.triggerEvent = triggerEvent;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (colorTag !== undefined) updateData.colorTag = colorTag;
        if (senderId !== undefined) updateData.senderId = senderId;
        
        const template = await SMSTemplate.findByIdAndUpdate(
            templateId,
            updateData,
            { new: true }
        );
        
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }
        
        res.status(200).json({ 
            success: true, 
            template 
        });
    } catch (error) {
        console.error('Error updating SMS template:', error);
        res.status(500).json({ 
            error: 'Failed to update SMS template', 
            details: error.message 
        });
    }
};

// Delete an SMS template
const deleteTemplate = async (req, res) => {
    try {
        const { templateId } = req.params;
        
        const template = await SMSTemplate.findByIdAndDelete(templateId);
        
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }
        
        res.status(200).json({ 
            success: true, 
            message: 'Template deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting SMS template:', error);
        res.status(500).json({ 
            error: 'Failed to delete SMS template', 
            details: error.message 
        });
    }
};

// Get SMS history
const getSMSHistory = async (req, res) => {
    try {
        const { page = 1, limit = 20, patientId, status, search, groupId } = req.query;
        
        const query = {};
        
        if (patientId) {
            query.patient = patientId;
        }
        
        if (status) {
            query.status = status;
        }
        
        if (groupId) {
            query.groupId = groupId;
        }
        
        // Add search functionality
        if (search) {
            query.$or = [
                { recipient: { $regex: search, $options: 'i' } }, // Search in recipient field
                { message: { $regex: search, $options: 'i' } },   // Search in message content
                { messageId: { $regex: search, $options: 'i' } }  // Search in message ID
            ];
        }
        
        const total = await SMSHistory.countDocuments(query);
        const parsedPage = parseInt(page);
        const parsedLimit = parseInt(limit);
        
        const history = await SMSHistory.find(query)
            .sort({ createdAt: -1 })
            .skip((parsedPage - 1) * parsedLimit)
            .limit(parsedLimit)
            .populate('patient', 'personalDetails.name')
            .populate('sentBy', 'name email')
            .populate('templateUsed', 'name');
        
        res.status(200).json({
            success: true,
            total,
            page: parsedPage,
            limit: parsedLimit,
            pages: Math.ceil(total / parsedLimit),
            hasMore: parsedPage * parsedLimit < total, // Add hasMore property for frontend pagination
            data: {
                history,
                total
            }
        });
    } catch (error) {
        console.error('Error getting SMS history:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get SMS history', 
            details: error.message 
        });
    }
};

// Process scheduled SMS messages (to be called by a cron job or scheduler)
const processScheduledSMS = async (req, res) => {
    try {
        // Validate the scheduler API key
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized: Missing authentication token' 
            });
        }
        
        const token = authHeader.split(' ')[1];
        if (token !== process.env.SMS_SCHEDULER_API_KEY) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized: Invalid API key' 
            });
        }
        
        // Find all scheduled SMS messages that are due to be sent
        const now = new Date();
        const scheduledMessages = await SMSHistory.find({
            status: 'scheduled',
            scheduledFor: { $lte: now }
        }).populate('patient');
        
        if (scheduledMessages.length === 0) {
            return res.status(200).json({ 
                success: true, 
                message: 'No scheduled messages to process' 
            });
        }
        
        const results = [];
        const errors = [];
        
        // For bulk processing with the v4 API
        const bulkPhoneNumbers = [];
        const bulkMessageTexts = [];
        const bulkMessageRecords = [];
        
        // Separate single messages and collect bulk messages
        const singleMessages = scheduledMessages.filter(msg => !msg.isBulk);
        const bulkMessagesToSend = scheduledMessages.filter(msg => msg.isBulk);
        
        // Process single messages one by one
        for (const message of singleMessages) {
            try {
                // Send using aakashSmsUtils
                const result = await aakashSmsUtils.sendSingleSMS(message.recipient, message.message);
                
                if (!result.success) {
                    throw new Error(result.error);
                }
                
                // Update the history record
                message.status = result.status || 'sent';
                message.messageId = result.messageId?.toString();
                message.networkProvider = result.network;
                message.credit = result.credit;
                await message.save();
                
                results.push({
                    historyId: message._id,
                    messageId: result.messageId,
                    status: result.status,
                    to: result.recipient
                });
            } catch (error) {
                // Update the history record with the error
                message.status = 'failed';
                message.errorMessage = error.message;
                await message.save();
                
                errors.push({
                    historyId: message._id,
                    error: error.message
                });
            }
        }
        
        // Process bulk messages using v4 API if there are any
        if (bulkMessagesToSend.length > 0) {
            // Prepare arrays for v4 API
            for (const message of bulkMessagesToSend) {
                bulkPhoneNumbers.push(message.recipient);
                bulkMessageTexts.push(message.message);
                bulkMessageRecords.push(message);
            }
            
            try {
                // Send using aakashSmsUtils
                const result = await aakashSmsUtils.sendBulkSMS(bulkPhoneNumbers, bulkMessageTexts);
                
                if (!result.success) {
                    throw new Error(result.error);
                }
                
                // Process valid messages
                if (result.validMessages) {
                    for (const validMsg of result.validMessages) {
                        // Find the corresponding message record
                        const index = bulkPhoneNumbers.findIndex(num => num === formatPhoneNumber(validMsg.mobile));
                        if (index !== -1) {
                            const message = bulkMessageRecords[index];
                            
                            // Update the history record
                            message.status = validMsg.status || 'sent';
                            message.messageId = validMsg.messageId?.toString();
                            message.networkProvider = validMsg.network;
                            message.credit = validMsg.credit;
                            await message.save();
                            
                            results.push({
                                historyId: message._id,
                                messageId: validMsg.messageId,
                                status: validMsg.status,
                                to: validMsg.mobile
                            });
                        }
                    }
                }
                
                // Process invalid messages
                if (result.invalidMessages) {
                    for (const invalidMsg of result.invalidMessages) {
                        // Find the corresponding message record
                        const index = bulkPhoneNumbers.findIndex(num => num === formatPhoneNumber(invalidMsg.mobile));
                        if (index !== -1) {
                            const message = bulkMessageRecords[index];
                            
                            // Update the history record
                            message.status = 'failed';
                            message.errorMessage = `Failed: ${invalidMsg.status}`;
                            await message.save();
                            
                            errors.push({
                                historyId: message._id,
                                error: `Failed to send: ${invalidMsg.status}`
                            });
                        }
                    }
                }
            } catch (error) {
                // Mark all bulk messages as failed
                for (const message of bulkMessageRecords) {
                    message.status = 'failed';
                    message.errorMessage = error.message;
                    await message.save();
                    
                    errors.push({
                        historyId: message._id,
                        error: error.message
                    });
                }
            }
        }
        
        res.status(200).json({
            success: true,
            totalProcessed: scheduledMessages.length,
            totalSent: results.length,
            totalErrors: errors.length,
            results,
            errors
        });
    } catch (error) {
        console.error('Error processing scheduled SMS messages:', error);
        res.status(500).json({ 
            error: 'Failed to process scheduled SMS messages', 
            details: error.message 
        });
    }
};

// Handle SMS status callback from provider (webhook endpoint)
const smsStatusCallback = async (req, res) => {
    try {
        // For Aakash SMS, we would need to adapt this to their callback format
        // This is a placeholder that will need to be updated once Aakash SMS
        // provides a status callback webhook (if they support it)
        const { id, status } = req.body;
        
        if (!id) {
            return res.status(400).json({ error: 'Message ID is required' });
        }
        
        // Update the history record with the new status
        await SMSHistory.findOneAndUpdate(
            { messageId: id.toString() },
            { status: status || 'delivered' }
        );
        
        res.status(200).send();
    } catch (error) {
        console.error('Error updating SMS status:', error);
        res.status(500).json({ 
            error: 'Failed to update SMS status', 
            details: error.message 
        });
    }
};

// Get credit balance
const checkSMSCredit = async (req, res) => {
    try {
        const result = await aakashSmsConfig.checkCredit();
        
        if (result.success) {
            return res.status(200).json({
                success: true,
                availableCredit: result.credit,
                responseCode: 200
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Could not retrieve credit information'
            });
        }
    } catch (error) {
        console.error('Error checking SMS credit:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to check SMS credit',
            error: error.message
        });
    }
};

// Get detailed credit information
const getDetailedSMSCredit = async (req, res) => {
    try {
        const result = await aakashSmsConfig.getDetailedCredit();
        
        if (result.success) {
            return res.status(200).json({
                success: true,
                data: result.data
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Could not retrieve detailed credit information',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Error getting detailed SMS credit info:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get detailed SMS credit information',
            error: error.message
        });
    }
};

// Get SMS report for a date range
const getSMSReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }
        
        // Validate dates
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        
        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format. Please use YYYY-MM-DD format.'
            });
        }
        
        const result = await aakashSmsUtils.getSMSReport(startDate, endDate);
        
        if (result.success) {
            return res.status(200).json({
                success: true,
                data: result.data
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Could not retrieve SMS report',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Error getting SMS report:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get SMS report',
            error: error.message
        });
    }
};

// Send follow-up reminder SMS to a patient
const sendFollowUpReminder = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { customMessage } = req.body;
        
        // Check if followupSMS is enabled
        const settings = await require('../model/SMSSettings').getSettings();
        if (!settings.followupSMS) {
            return res.status(403).json({
                success: false,
                message: 'Follow-up SMS feature is currently disabled'
            });
        }
        
        // Get patient
        const patient = await require('../model/Patient').findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }
        
        // Check if patient has a contact number
        if (!patient.personalDetails?.contactNumber) {
            return res.status(400).json({
                success: false,
                message: 'Patient does not have a contact number'
            });
        }
        
        // Find the latest treatment with a follow-up date
        let followUpDate = null;
        let latestTreatment = null;
        
        if (patient.medicalDetails && patient.medicalDetails.length > 0) {
            for (const medicalDetail of patient.medicalDetails) {
                if (medicalDetail.treatmentPlanning && medicalDetail.treatmentPlanning.length > 0) {
                    for (const treatment of medicalDetail.treatmentPlanning) {
                        if (treatment.followUpDate) {
                            const treatmentDate = new Date(treatment.followUpDate);
                            
                            if (!followUpDate || treatmentDate > followUpDate) {
                                followUpDate = treatmentDate;
                                latestTreatment = treatment;
                            }
                        }
                    }
                }
            }
        }
        
        // If no follow-up date was found, return an error - even if customMessage is provided
        // This is a change from previous behavior where we would send a custom message even without a follow-up date
        if (!followUpDate) {
            return res.status(400).json({
                success: false,
                message: 'Patient does not have any follow-up appointments scheduled. Cannot send follow-up reminder.'
            });
        }
        
        // Use custom message if provided, otherwise generate default
        let messageToSend;
        if (customMessage) {
            messageToSend = customMessage;
        } else {
            const formattedDate = followUpDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            messageToSend = `Dear ${patient.personalDetails.name}, this is a reminder about your follow-up dental appointment on ${formattedDate} at ${settings.clinicName}. Please visit on time. Thank you.`;
        }
        
        // Send follow-up SMS
        const aakashSmsUtils = require('../utils/aakashSmsUtils');
        const result = await aakashSmsUtils.sendSingleSMS(
            patient.personalDetails.contactNumber,
            messageToSend
        );
        
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: 'Failed to send follow-up SMS',
                error: result.error
            });
        }
        
        // Save to SMS history
        await require('../model/SMSHistory').create({
            recipient: patient.personalDetails.contactNumber,
            message: messageToSend,
            status: result.status || 'sent',
            messageId: result.messageId,
            networkProvider: result.network,
            credit: result.credit,
            sentBy: req.admin?.id,
            patient: patientId,
            isBulk: false
        });
        
        res.status(200).json({
            success: true,
            message: 'Follow-up reminder SMS sent successfully',
            data: result
        });
    } catch (error) {
        console.error('Error sending follow-up reminder SMS:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send follow-up reminder SMS',
            error: error.message
        });
    }
};

// Send payment reminder SMS to a patient
const sendPaymentReminder = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { customMessage } = req.body;
        
        // Check if paymentSMS is enabled
        const settings = await require('../model/SMSSettings').getSettings();
        if (!settings.paymentSMS) {
            return res.status(403).json({
                success: false,
                message: 'Payment reminder SMS feature is currently disabled'
            });
        }
        
        // Get patient
        const patient = await require('../model/Patient').findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }
        
        // Check if patient has a contact number
        if (!patient.personalDetails?.contactNumber) {
            return res.status(400).json({
                success: false,
                message: 'Patient does not have a contact number'
            });
        }
        
        // Calculate total due amount
        let totalDue = 0;
        
        if (patient.medicalDetails && patient.medicalDetails.length > 0) {
            for (const medicalDetail of patient.medicalDetails) {
                if (medicalDetail.treatmentPlanning && medicalDetail.treatmentPlanning.length > 0) {
                    for (const treatment of medicalDetail.treatmentPlanning) {
                        if (treatment.selectedTeethDetails && treatment.selectedTeethDetails.length > 0) {
                            for (const tooth of treatment.selectedTeethDetails) {
                                totalDue += (tooth.totalTreatmentAmount || 0) - (tooth.totalPaidAmount || 0);
                            }
                        }
                    }
                }
            }
        }
        
        // Always check for pending payment, even with custom message
        if (totalDue <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Patient does not have any pending payments. Cannot send payment reminder.'
            });
        }
        
        // Use custom message if provided, otherwise generate default
        let messageToSend;
        if (customMessage) {
            messageToSend = customMessage;
        } else {
            messageToSend = `Dear ${patient.personalDetails.name}, you have a pending dental bill of Rs ${totalDue}. Please clear your dues at your earliest convenience. - ${settings.clinicName}`;
        }
        
        // Send payment reminder SMS
        const aakashSmsUtils = require('../utils/aakashSmsUtils');
        const result = await aakashSmsUtils.sendSingleSMS(
            patient.personalDetails.contactNumber,
            messageToSend
        );
        
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: 'Failed to send payment reminder SMS',
                error: result.error
            });
        }
        
        // Save to SMS history
        await require('../model/SMSHistory').create({
            recipient: patient.personalDetails.contactNumber,
            message: messageToSend,
            status: result.status || 'sent',
            messageId: result.messageId,
            networkProvider: result.network,
            credit: result.credit,
            sentBy: req.admin?.id,
            patient: patientId,
            isBulk: false
        });
        
        res.status(200).json({
            success: true,
            message: 'Payment reminder SMS sent successfully',
            data: result
        });
    } catch (error) {
        console.error('Error sending payment reminder SMS:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send payment reminder SMS',
            error: error.message
        });
    }
};

// Get patients with follow-up dates - ensure we only return patients with actual follow-up dates
const getPatientsWithFollowUp = async (req, res) => {
    try {
        const { 
            filter = 'upcoming', // 'today', 'week', 'month', 'upcoming', 'all'
            page = 1,
            limit = 20
        } = req.query;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Build query based on filter
        let dateQuery = {};
        
        if (filter === 'today') {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateQuery = { 
                $gte: today, 
                $lt: tomorrow 
            };
        } else if (filter === 'week') {
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);
            dateQuery = { 
                $gte: today, 
                $lt: nextWeek 
            };
        } else if (filter === 'month') {
            const nextMonth = new Date(today);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            dateQuery = { 
                $gte: today, 
                $lt: nextMonth 
            };
        } else if (filter === 'upcoming') {
            dateQuery = { $gte: today };
        }
        // If filter is 'all', we include all dates but still enforce that follow-up date exists
        
        // Use aggregation to find patients with follow-up dates
        const aggregationPipeline = [
            // Unwind medical details to get individual records
            { $unwind: { path: '$medicalDetails', preserveNullAndEmptyArrays: false } },
            
            // Unwind treatment planning to get individual treatment plans
            { $unwind: { path: '$medicalDetails.treatmentPlanning', preserveNullAndEmptyArrays: false } },
            
            // Match treatments with follow-up dates - ALWAYS ensure follow-up date exists and is not null
            { 
                $match: { 
                    'medicalDetails.treatmentPlanning.followUpDate': { 
                        $exists: true, 
                        $ne: null,
                        // Add date filter if provided
                        ...(Object.keys(dateQuery).length > 0 ? dateQuery : {})
                    }
                } 
            },
            
            // Make sure patient has a contact number
            { 
                $match: { 
                    'personalDetails.contactNumber': { $exists: true, $ne: null, $ne: '' } 
                } 
            },
            
            // Group by patient to avoid duplicates
            { 
                $group: {
                    _id: '$_id',
                    name: { $first: '$personalDetails.name' },
                    contactNumber: { $first: '$personalDetails.contactNumber' },
                    // Get the earliest follow-up date for this patient
                    nextFollowUpDate: { $min: '$medicalDetails.treatmentPlanning.followUpDate' },
                    treatmentDetails: { 
                        $push: {
                            medicalDetailId: '$medicalDetails._id',
                            treatmentId: '$medicalDetails.treatmentPlanning._id',
                            followUpDate: '$medicalDetails.treatmentPlanning.followUpDate',
                            treatmentFindings: '$medicalDetails.treatmentPlanning.treatmentFindings',
                            completed: '$medicalDetails.treatmentPlanning.isCompleted'
                        }
                    }
                }
            },
            
            // Sort by next follow-up date
            { $sort: { nextFollowUpDate: 1 } },
            
            // Add pagination
            { $skip: (parseInt(page) - 1) * parseInt(limit) },
            { $limit: parseInt(limit) },
            
            // Project final shape
            {
                $project: {
                    _id: 1,
                    name: 1,
                    contactNumber: 1,
                    nextFollowUpDate: 1,
                    treatmentDetails: 1
                }
            }
        ];
        
        // Count total patients matching criteria (for pagination)
        const countPipeline = [...aggregationPipeline];
        // Remove skip, limit and project stages for counting
        countPipeline.splice(-3); // Remove the last 3 stages
        countPipeline.push({ $count: 'total' });
        
        // Execute both queries
        const [patients, countResult] = await Promise.all([
            Patient.aggregate(aggregationPipeline),
            Patient.aggregate(countPipeline)
        ]);
        
        const total = countResult.length > 0 ? countResult[0].total : 0;
        
        return res.status(200).json({
            success: true,
            data: {
                patients,
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching patients with follow-up dates:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch patients with follow-up dates',
            error: error.message
        });
    }
};

// Send bulk follow-up reminders
const sendBulkFollowUpReminders = async (req, res) => {
    try {
        const { patientIds = [], customMessage, scheduleFor } = req.body;
        
        if (!patientIds.length) {
            return res.status(400).json({
                success: false,
                message: 'No patient IDs provided'
            });
        }
        
        // Check if followupSMS is enabled
        const settings = await require('../model/SMSSettings').getSettings();
        if (!settings.followupSMS) {
            return res.status(403).json({
                success: false,
                message: 'Follow-up SMS feature is currently disabled'
            });
        }
        
        // Fetch patients by IDs
        const patients = await Patient.find({
            _id: { $in: patientIds },
            'personalDetails.contactNumber': { $exists: true, $ne: null, $ne: '' }
        });
        
        if (patients.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No valid patients found with contact numbers'
            });
        }
        
        // Prepare array for bulk SMS
        const phoneNumbers = [];
        const messages = [];
        const patientMap = {};
        const clinicName = settings.clinicName || 'Dental Clinic';
        
        // For each patient, find their follow-up date and prepare message
        for (const patient of patients) {
            let followUpDate = null;
            
            // Find the earliest upcoming follow-up date
            if (patient.medicalDetails && patient.medicalDetails.length > 0) {
                for (const medicalDetail of patient.medicalDetails) {
                    if (medicalDetail.treatmentPlanning && medicalDetail.treatmentPlanning.length > 0) {
                        for (const treatment of medicalDetail.treatmentPlanning) {
                            if (treatment.followUpDate) {
                                const treatmentDate = new Date(treatment.followUpDate);
                                const today = new Date();
                                
                                // Only consider upcoming follow-ups (including today)
                                if (treatmentDate >= today && (!followUpDate || treatmentDate < followUpDate)) {
                                    followUpDate = treatmentDate;
                                }
                            }
                        }
                    }
                }
            }
            
            // If patient has follow-up date, prepare message
            if (followUpDate) {
                const formattedDate = followUpDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                
                const message = customMessage 
                    ? customMessage.replace('{{name}}', patient.personalDetails.name)
                                 .replace('{{date}}', formattedDate)
                                 .replace('{{clinic}}', clinicName)
                    : `Dear ${patient.personalDetails.name}, this is a reminder about your follow-up dental appointment on ${formattedDate} at ${clinicName}. Please visit on time. Thank you.`;
                
                phoneNumbers.push(patient.personalDetails.contactNumber);
                messages.push(message);
                patientMap[patient.personalDetails.contactNumber] = patient._id;
            }
        }
        
        if (phoneNumbers.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No patients with upcoming follow-up dates found'
            });
        }
        
        // Handle scheduled messages
        if (scheduleFor) {
            const scheduledDate = new Date(scheduleFor);
            
            if (isNaN(scheduledDate.getTime())) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Invalid date format for scheduling' 
                });
            }
            
            if (scheduledDate <= new Date()) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Scheduled time must be in the future' 
                });
            }
            
            // Save each scheduled SMS to history
            const scheduledMessages = phoneNumbers.map((phone, index) => ({
                recipient: formatPhoneNumber(phone),
                message: messages[index],
                status: 'scheduled',
                sentBy: req.admin?.id,
                patient: patientMap[phone],
                scheduledFor: scheduledDate,
                isBulk: true
            }));
            
            await SMSHistory.insertMany(scheduledMessages);
            
            return res.status(200).json({
                success: true,
                scheduled: true,
                scheduledFor: scheduledDate,
                totalScheduled: scheduledMessages.length
            });
        }
        
        // Send messages immediately
        const result = await aakashSmsUtils.sendBulkSMS(phoneNumbers, messages);
        
        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send bulk follow-up reminders',
                error: result.error
            });
        }
        
        // Save successful sends to history
        if (result.validMessages && result.validMessages.length > 0) {
            const historyRecords = result.validMessages.map(msg => {
                const patientId = patientMap[msg.recipient] || null;
                return {
                    recipient: msg.recipient,
                    message: messages[phoneNumbers.indexOf(msg.recipient)],
                    status: msg.status || 'sent',
                    messageId: msg.messageId,
                    networkProvider: msg.network,
                    credit: msg.credit,
                    sentBy: req.admin?.id,
                    patient: patientId,
                    isBulk: true
                };
            });
            
            await SMSHistory.insertMany(historyRecords);
        }
        
        return res.status(200).json({
            success: true,
            totalSent: result.totalSent,
            totalFailed: result.totalFailed,
            message: `Successfully sent ${result.totalSent} follow-up reminders`
        });
    } catch (error) {
        console.error('Error sending bulk follow-up reminders:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send bulk follow-up reminders',
            error: error.message
        });
    }
};

// Send custom SMS to a patient
const sendCustomSMS = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { customMessage } = req.body;
        
        // Check if SMS features are enabled
        const settings = await require('../model/SMSSettings').getSettings();
        
        // Get patient
        const patient = await require('../model/Patient').findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }
        
        // Check if patient has a contact number
        if (!patient.personalDetails?.contactNumber) {
            return res.status(400).json({
                success: false,
                message: 'Patient does not have a contact number'
            });
        }
        
        // Validate message content
        if (!customMessage || customMessage.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Message content cannot be empty'
            });
        }
        
        // Send custom SMS
        const aakashSmsUtils = require('../utils/aakashSmsUtils');
        const result = await aakashSmsUtils.sendSingleSMS(
            patient.personalDetails.contactNumber,
            customMessage
        );
        
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: 'Failed to send custom SMS',
                error: result.error
            });
        }
        
        // Save to SMS history
        await require('../model/SMSHistory').create({
            recipient: patient.personalDetails.contactNumber,
            message: customMessage,
            status: result.status || 'sent',
            messageId: result.messageId,
            networkProvider: result.network,
            credit: result.credit,
            sentBy: req.admin?.id,
            patient: patientId,
            isBulk: false,
            type: 'custom' // Add a type to distinguish from other SMS types
        });
        
        res.status(200).json({
            success: true,
            message: 'Custom SMS sent successfully',
            data: result
        });
    } catch (error) {
        console.error('Error sending custom SMS:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send custom SMS',
            error: error.message
        });
    }
};

// Get SMS class configurations
const getSMSClassConfigs = async (req, res) => {
    try {
        const configs = await SMSClassConfig.getClassConfigs();
        
        res.status(200).json({
            success: true,
            data: configs
        });
    } catch (error) {
        console.error('Error getting SMS class configurations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get SMS class configurations',
            error: error.message
        });
    }
};

// Update SMS class configuration
const updateSMSClassConfig = async (req, res) => {
    try {
        const { className } = req.params;
        const { patientLimit, description, isActive } = req.body;
        
        if (!['A', 'B', 'C'].includes(className)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid class name. Must be A, B, or C'
            });
        }
        
        const config = await SMSClassConfig.findOneAndUpdate(
            { className },
            { 
                patientLimit: patientLimit || 50,
                description: description || '',
                isActive: isActive !== undefined ? isActive : true,
                lastModifiedBy: req.user?._id || req.admin?.id
            },
            { new: true, upsert: true }
        );
        
        res.status(200).json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Error updating SMS class configuration:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update SMS class configuration',
            error: error.message
        });
    }
};

// Create SMS campaign with class-based patient division
const createSMSCampaign = async (req, res) => {
    try {
        const {
            message,
            templateId,
            variables = {},
            filters = {},
            scheduledFor,
            campaignName
        } = req.body;
        
        if (!message && !templateId) {
            return res.status(400).json({
                success: false,
                message: 'Either message or template ID is required'
            });
        }
        
        // Get message content from template if templateId is provided
        let messageContent = message;
        let templateUsed = null;
        
        if (templateId) {
            const template = await SMSTemplate.findById(templateId);
            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: 'Template not found'
                });
            }
            
            messageContent = replaceTemplateVariables(template.content, variables);
            templateUsed = template._id;
            
            // Update template usage stats
            template.lastUsed = new Date();
            template.totalSent += 1;
            await template.save();
        }
        
        // Build patient query
        let query = {
            'personalDetails.contactNumber': {
                $exists: true,
                $ne: null,
                $regex: /^(\+)?[0-9]{10,15}$/
            }
        };
        
        // Apply filters
        if (filters) {
            if (filters.gender && filters.gender !== "all") {
                query["personalDetails.gender"] = filters.gender;
            }
            if (filters.group && filters.group !== "all") {
                query["medicalDetails.group"] = filters.group;
            }
            if (filters.procedure && filters.procedure !== "all") {
                query["medicalDetails.treatmentPlanning.selectedTeethDetails"] = {
                    $elemMatch: {
                        "dailyTreatments.procedure": filters.procedure
                    }
                };
            }
            if (filters.doctor && filters.doctor !== "all") {
                query["assignedDoctor"] = new mongoose.Types.ObjectId(filters.doctor);
            }
            if (filters.dateRange) {
                const dateQuery = {};
                if (filters.dateRange.from) {
                    dateQuery.$gte = new Date(filters.dateRange.from);
                }
                if (filters.dateRange.to) {
                    dateQuery.$lte = new Date(filters.dateRange.to);
                    dateQuery.$lte.setHours(23, 59, 59, 999);
                }
                if (Object.keys(dateQuery).length > 0) {
                    query.createdAt = dateQuery;
                }
            }
        }
        
        // Get all matching patients
        const patients = await Patient.find(query).sort({ createdAt: 1 });
        
        if (patients.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No patients found matching the criteria'
            });
        }
        
        // Get class configurations
        const classConfigs = await SMSClassConfig.getClassConfigs();
        const activeClasses = classConfigs.filter(c => c.isActive).sort((a, b) => a.className.localeCompare(b.className));
        
        if (activeClasses.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No active patient classes configured'
            });
        }
        
        // Divide patients into classes
        const classes = [];
        let startIndex = 0;
        
        for (const classConfig of activeClasses) {
            const classPatients = patients.slice(startIndex, startIndex + classConfig.patientLimit);
            
            if (classPatients.length > 0) {
                classes.push({
                    className: classConfig.className,
                    patientCount: classPatients.length,
                    patientIds: classPatients.map(p => p._id),
                    sentCount: 0,
                    failedCount: 0,
                    isSent: false
                });
                
                startIndex += classConfig.patientLimit;
            }
            
            if (startIndex >= patients.length) break;
        }
        
        // Create campaign
        const campaign = new SMSCampaign({
            name: campaignName || `Campaign_${Date.now()}`,
            message: messageContent,
            filters,
            totalPatients: patients.length,
            createdBy: req.user?._id || req.admin?.id,
            classes,
            templateUsed,
            scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
            status: 'draft'
        });
        
        await campaign.save();
        
        res.status(201).json({
            success: true,
            data: campaign,
            message: `Campaign created with ${classes.length} classes and ${patients.length} total patients`
        });
    } catch (error) {
        console.error('Error creating SMS campaign:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create SMS campaign',
            error: error.message
        });
    }
};

// Get all SMS campaigns
const getSMSCampaigns = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        
        const query = {};
        if (status) {
            query.status = status;
        }
        
        const total = await SMSCampaign.countDocuments(query);
        const campaigns = await SMSCampaign.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('createdBy', 'name email')
            .populate('templateUsed', 'name');
        
        res.status(200).json({
            success: true,
            data: {
                campaigns,
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error getting SMS campaigns:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get SMS campaigns',
            error: error.message
        });
    }
};

// Get campaign details
const getCampaignDetails = async (req, res) => {
    try {
        const { campaignId } = req.params;
        
        const campaign = await SMSCampaign.findById(campaignId)
            .populate('createdBy', 'name email')
            .populate('templateUsed', 'name')
            .populate('classes.patientIds', 'personalDetails.name personalDetails.contactNumber');
        
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: campaign
        });
    } catch (error) {
        console.error('Error getting campaign details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get campaign details',
            error: error.message
        });
    }
};

// Send SMS to specific class
const sendSMSToClass = async (req, res) => {
    try {
        const { campaignId, className } = req.params;
        
        const campaign = await SMSCampaign.findById(campaignId)
            .populate('classes.patientIds', 'personalDetails.name personalDetails.contactNumber');
        
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }
        
        const classData = campaign.classes.find(c => c.className === className);
        if (!classData) {
            return res.status(404).json({
                success: false,
                message: 'Class not found in campaign'
            });
        }
        
        if (classData.isSent) {
            return res.status(400).json({
                success: false,
                message: 'SMS already sent to this class'
            });
        }
        
        // Prepare arrays for bulk SMS
        const phoneNumbers = [];
        const messages = [];
        const patientMap = {};
        
        for (const patient of classData.patientIds) {
            try {
                const phoneNumber = formatPhoneNumber(patient.personalDetails.contactNumber);
                
                if (!phoneNumber.match(/^9[678]\d{8}$/)) {
                    continue;
                }
                
                // Personalize message
                let personalizedMessage = campaign.message;
                if (personalizedMessage.includes('{{patientName}}') || personalizedMessage.includes('{{name}}')) {
                    personalizedMessage = personalizedMessage
                        .replace(/{{patientName}}/g, patient.personalDetails.name)
                        .replace(/{{name}}/g, patient.personalDetails.name);
                }
                
                phoneNumbers.push(phoneNumber);
                messages.push(personalizedMessage);
                patientMap[phoneNumber] = patient._id;
            } catch (error) {
                console.error(`Error processing patient ${patient._id}:`, error.message);
            }
        }
        
        if (phoneNumbers.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid phone numbers found in this class'
            });
        }
        
        // Generate unique campaign identifier
        const campaignIdentifier = `${campaignId}_${className}_${Date.now()}`;
        
        // Send bulk SMS
        const result = await aakashSmsUtils.sendBulkSMS(phoneNumbers, messages);
        
        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send bulk SMS',
                error: result.error
            });
        }
        
        // Save to SMS history
        const historyRecords = [];
        
        // Process successful sends
        if (result.validMessages) {
            for (const validMsg of result.validMessages) {
                const patientId = patientMap[validMsg.recipient] || null;
                historyRecords.push({
                    recipient: validMsg.recipient,
                    message: messages[phoneNumbers.indexOf(validMsg.recipient)],
                    status: validMsg.status || 'sent',
                    messageId: validMsg.messageId,
                    networkProvider: validMsg.network,
                    credit: validMsg.credit,
                    sentBy: req.user?._id || req.admin?.id,
                    patient: patientId,
                    templateUsed: campaign.templateUsed,
                    isBulk: true,
                    campaignId: campaignIdentifier,
                    patientClass: className
                });
            }
        }
        
        // Process failed sends
        if (result.invalidMessages) {
            for (const invalidMsg of result.invalidMessages) {
                const patientId = patientMap[invalidMsg.recipient] || null;
                historyRecords.push({
                    recipient: invalidMsg.recipient,
                    message: messages[phoneNumbers.indexOf(invalidMsg.recipient)],
                    status: 'failed',
                    errorMessage: invalidMsg.reason || 'Failed to send',
                    sentBy: req.user?._id || req.admin?.id,
                    patient: patientId,
                    templateUsed: campaign.templateUsed,
                    isBulk: true,
                    campaignId: campaignIdentifier,
                    patientClass: className
                });
            }
        }
        
        // Save all history records
        if (historyRecords.length > 0) {
            await SMSHistory.insertMany(historyRecords);
        }
        
        // Update campaign class status
        const classIndex = campaign.classes.findIndex(c => c.className === className);
        campaign.classes[classIndex].sentCount = result.totalSent;
        campaign.classes[classIndex].failedCount = result.totalFailed;
        campaign.classes[classIndex].isSent = true;
        campaign.classes[classIndex].sentAt = new Date();
        
        // Update campaign status
        const allClassesSent = campaign.classes.every(c => c.isSent);
        if (allClassesSent) {
            campaign.status = 'completed';
        } else {
            campaign.status = 'in_progress';
        }
        
        await campaign.save();
        
        res.status(200).json({
            success: true,
            totalSent: result.totalSent,
            totalFailed: result.totalFailed,
            campaignId: campaignIdentifier,
            className,
            message: `SMS sent to Class ${className}: ${result.totalSent} successful, ${result.totalFailed} failed`
        });
    } catch (error) {
        console.error('Error sending SMS to class:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send SMS to class',
            error: error.message
        });
    }
};

// Get SMS history by class/campaign
const getSMSHistoryByClass = async (req, res) => {
    try {
        const { 
            campaignId, 
            className,
            page = 1, 
            limit = 20,
            status 
        } = req.query;
        
        const query = {};
        
        if (campaignId) {
            query.campaignId = { $regex: campaignId, $options: 'i' };
        }
        
        if (className) {
            query.patientClass = className;
        }
        
        if (status) {
            query.status = status;
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
        console.error('Error getting SMS history by class:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get SMS history by class',
            error: error.message
        });
    }
};

// Get delivery reports
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

// Retry failed SMS
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

// Get delivery statistics
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

// Send SMS to a specific patient group
const sendSMSToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { templateId, message, variables } = req.body;
    
    // Validate input
    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: 'Group ID is required'
      });
    }
    
    if (!templateId && !message) {
      return res.status(400).json({
        success: false,
        message: 'Either template ID or message content is required'
      });
    }
    
    // Import PatientGroup model to avoid circular dependencies
    const PatientGroup = require('../model/PatientGroup');
    const Patient = require('../model/Patient');
    const SMSTemplate = require('../model/SMSTemplate');
    
    // Find the patient group
    const patientGroup = await PatientGroup.findById(groupId);
    if (!patientGroup) {
      return res.status(404).json({
        success: false,
        message: 'Patient group not found'
      });
    }
    
    // Get patients in the group
    let patients = [];
    if (patientGroup.category === 'Static') {
      patients = await Patient.find({
        _id: { $in: patientGroup.patientIds },
        isDeleted: { $ne: true }
      }).select('personalDetails.name personalDetails.contactNumber');
    } else if (patientGroup.category === 'Dynamic') {
      // For dynamic groups, we need to build the query from filters
      const buildPatientQueryFromFilters = (filters) => {
        const query = {
          isDeleted: { $ne: true }
        };
        
        // Add gender filter
        if (filters.gender && filters.gender !== 'all') {
          query['personalDetails.gender'] = filters.gender;
        }
        
        // Add group filter
        if (filters.group && filters.group !== 'all') {
          query['medicalDetails.group'] = filters.group;
        }
        
        // Add treatment procedure filter
        if (filters.procedure && filters.procedure !== 'all') {
          query['medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.procedure'] = filters.procedure;
        }
        
        // Add date range filter
        if (filters.dateRange) {
          const dateQuery = {};
          
          if (filters.dateRange.from) {
            dateQuery.$gte = new Date(filters.dateRange.from);
          }
          if (filters.dateRange.to) {
            dateQuery.$lte = new Date(filters.dateRange.to);
            dateQuery.$lte.setHours(23, 59, 59, 999); // End of the day
          }
          
          if (Object.keys(dateQuery).length > 0) {
            query.createdAt = dateQuery;
          }
        }
        
        // Add follow-up date range filter
        if (filters.followUpDateRange) {
          const followUpDateQuery = {};
          
          if (filters.followUpDateRange.from) {
            followUpDateQuery.$gte = new Date(filters.followUpDateRange.from);
          }
          if (filters.followUpDateRange.to) {
            followUpDateQuery.$lte = new Date(filters.followUpDateRange.to);
            followUpDateQuery.$lte.setHours(23, 59, 59, 999); // End of the day
          }
          
          if (Object.keys(followUpDateQuery).length > 0) {
            query['followUpDate'] = followUpDateQuery;
          }
        }
        
        // Add payment status filter
        if (filters.paymentStatus && filters.paymentStatus !== 'all') {
          if (filters.paymentStatus === 'due') {
            query.$expr = { $gt: ['$totalRemainingAmount', 0] };
          } else if (filters.paymentStatus === 'paid') {
            query.$expr = { $eq: ['$totalRemainingAmount', 0] };
          }
        }
        
        return query;
      };
      
      const query = buildPatientQueryFromFilters(patientGroup.filters);
      patients = await Patient.find(query).select('personalDetails.name personalDetails.contactNumber');
    }
    
    // Check if there are patients in the group
    if (patients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No patients found in this group'
      });
    }
    
    // Get message content from template if templateId is provided
    let messageContent = message;
    let templateUsed = null;
    
    if (templateId) {
      try {
        const template = await SMSTemplate.findById(templateId);
        if (!template) {
          return res.status(404).json({ 
            success: false, 
            message: 'Template not found' 
          });
        }
        
        messageContent = replaceTemplateVariables(template.content, variables);
        templateUsed = template._id;
        
        // Update template usage stats
        template.lastUsed = new Date();
        template.totalSent += 1;
        await template.save();
      } catch (error) {
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to process template', 
          details: error.message 
        });
      }
    }
    
    // Prepare phone numbers for sending
    const phoneNumbers = patients
      .filter(patient => patient.personalDetails?.contactNumber)
      .map(patient => patient.personalDetails.contactNumber);
    
    if (phoneNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid phone numbers found in this group'
      });
    }
    
    // Remove duplicates
    const uniquePhoneNumbers = [...new Set(phoneNumbers)];
    
    // Send bulk SMS using the existing sendBulkSMS function logic
    const validMessages = [];
    const invalidMessages = [];
    
    // Process each phone number
    for (const phoneNumber of uniquePhoneNumbers) {
      try {
        // Format and validate phone number
        const formattedNumber = verifyPhoneNumber(phoneNumber);
        validMessages.push({
          phoneNumber: formattedNumber,
          message: messageContent
        });
      } catch (error) {
        invalidMessages.push({
          phoneNumber,
          error: error.message
        });
      }
    }
    
    // Send valid messages
    let totalSent = 0;
    let totalFailed = 0;
    const failedMessages = [];
    
    for (const msg of validMessages) {
      try {
        const result = await aakashSmsUtils.sendSingleSMS(msg.phoneNumber, msg.message);
        
        if (result.success) {
          totalSent++;
          // Save to history with enhanced logging
          await saveSMSHistory({
            recipient: msg.phoneNumber,
            message: msg.message,
            status: result.status || 'sent',
            messageId: result.messageId?.toString(),
            networkProvider: result.network,
            credit: result.credit,
            sentBy: req.user?._id || null,
            templateUsed,
            groupId: patientGroup._id,
            groupName: patientGroup.name
          }, req);
        } else {
          totalFailed++;
          failedMessages.push({
            phoneNumber: msg.phoneNumber,
            error: result.error,
            code: result.code
          });
          
          // Log authentication errors specifically
          if (result.code === 'AUTH_FAILED') {
            console.error('Aakash SMS Authentication failed:', result.error);
          }
        }
      } catch (error) {
        totalFailed++;
        failedMessages.push({
          phoneNumber: msg.phoneNumber,
          error: error.message
        });
      }
    }
    
    // Return success response
    res.status(200).json({
      success: true,
      totalSent,
      totalFailed,
      validMessages: validMessages.length,
      invalidMessages: invalidMessages.length,
      failedMessages,
      groupName: patientGroup.name,
      groupPatientCount: patients.length
    });
  } catch (error) {
    console.error('Error sending SMS to group:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send SMS to group', 
      details: error.message,
    });
  }
};

module.exports = {
    sendSingleSMS,
    sendBulkSMS,
    sendSMSToGroup,
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getSMSHistory,
    processScheduledSMS,
    smsStatusCallback,
    checkSMSCredit,
    getDetailedSMSCredit,
    getSMSReport,
    sendFollowUpReminder,
    sendPaymentReminder,
    getPatientsWithFollowUp,
    sendBulkFollowUpReminders,
    sendCustomSMS,
    // Class-based SMS functions
    getSMSClassConfigs,
    updateSMSClassConfig,
    createSMSCampaign,
    getSMSCampaigns,
    getCampaignDetails,
    sendSMSToClass,
    getSMSHistoryByClass,
    // Delivery report functions
    getDeliveryReports,
    retryFailedSMS,
    getDeliveryStats
};



