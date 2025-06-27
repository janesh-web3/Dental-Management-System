import { Request, Response } from 'express';
import Patient from '../models/Patient';
import SMSLog from '../models/SMSLog';
import { sendSingleSMS, sendBulkSMS, checkSMSCredit } from '../utils/smsUtils';
import { Types } from 'mongoose';

export const sendSingleSMSHandler = async (req: Request, res: Response) => {
  try {
    const { patientId, message } = req.body;
    
    if (!patientId || !message) {
      return res.status(400).json({ success: false, message: 'Patient ID and message are required' });
    }

    // Find patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Send SMS
    const result = await sendSingleSMS(patient.personalDetails.contactNumber, message);
    
    // Log the SMS
    await SMSLog.create({
      patient: patient._id,
      message,
      status: result.status,
      response: result,
      type: 'single',
      sentBy: req.user?._id
    });

    if (result.status === 'error') {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.json({ success: true, message: 'SMS sent successfully' });
  } catch (error) {
    console.error('Error in sendSingleSMS:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const sendBulkSMSHandler = async (req: Request, res: Response) => {
  try {
    const { filters, message } = req.body;
    
    if (!filters || !message) {
      return res.status(400).json({ success: false, message: 'Filters and message are required' });
    }

    // Build query based on filters
    const query: any = {};
    
    if (filters.treatmentStatus) {
      query['treatment.status'] = filters.treatmentStatus;
    }
    
    if (filters.gender) {
      query['personalDetails.gender'] = filters.gender;
    }
    
    if (filters.procedures?.length) {
      query['treatments.procedure'] = { $in: filters.procedures };
    }
    
    if (filters.group) {
      query['treatments.group'] = filters.group;
    }
    
    if (filters.dateRange?.from && filters.dateRange?.to) {
      query['createdAt'] = {
        $gte: new Date(filters.dateRange.from),
        $lte: new Date(filters.dateRange.to)
      };
    }

    // Find patients matching the filters
    const patients = await Patient.find(query, 'personalDetails.contactNumber');
    
    if (patients.length === 0) {
      return res.status(404).json({ success: false, message: 'No patients found matching the criteria' });
    }

    // Prepare data for bulk SMS
    const phoneNumbers = patients.map(p => p.personalDetails.contactNumber);
    const messages = Array(phoneNumbers.length).fill(message);

    // Send bulk SMS
    const result = await sendBulkSMS(phoneNumbers, messages);
    
    // Log the bulk SMS
    await SMSLog.create({
      patients: patients.map(p => p._id),
      message,
      status: result.status,
      response: result,
      type: 'bulk',
      sentBy: req.user?._id,
      filterCriteria: filters
    });

    if (result.status === 'error') {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.json({ 
      success: true, 
      message: `SMS sent to ${patients.length} patients successfully`,
      sentCount: patients.length
    });
  } catch (error) {
    console.error('Error in sendBulkSMS:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const sendFollowUpSMS = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    if (!patient.followUpDate) {
      return res.status(400).json({ success: false, message: 'No follow-up date set for this patient' });
    }

    const clinicName = process.env.CLINIC_NAME || 'Our Clinic';
    const formattedDate = new Date(patient.followUpDate).toLocaleDateString();
    const message = `Reminder: You have a follow-up dental appointment on ${formattedDate} at ${clinicName}. Please visit on time.`;

    const result = await sendSingleSMS(patient.personalDetails.contactNumber, message);
    
    // Log the SMS
    await SMSLog.create({
      patient: patient._id,
      message,
      status: result.status,
      response: result,
      type: 'followup',
      sentBy: req.user?._id
    });

    if (result.status === 'error') {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.json({ success: true, message: 'Follow-up SMS sent successfully' });
  } catch (error) {
    console.error('Error in sendFollowUpSMS:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const sendPaymentReminderSMS = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    
    const patient = await Patient.findById(patientId)
      .populate('treatments.procedure', 'name cost')
      .populate('payments');
    
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Calculate total expected and paid amounts
    const totalExpected = patient.treatments.reduce((sum, treatment) => {
      return sum + (treatment.procedure?.cost || 0);
    }, 0);

    const totalPaid = patient.payments.reduce((sum, payment) => {
      return sum + payment.amount;
    }, 0);

    if (totalPaid >= totalExpected) {
      return res.status(400).json({ success: false, message: 'No pending payment for this patient' });
    }

    const pendingAmount = totalExpected - totalPaid;
    const clinicName = process.env.CLINIC_NAME || 'Our Clinic';
    const message = `Dear ${patient.personalDetails.name}, you have a pending dental bill of Rs ${pendingAmount}. Please clear your dues at your earliest convenience. - ${clinicName}`;

    const result = await sendSingleSMS(patient.personalDetails.contactNumber, message);
    
    // Log the SMS
    await SMSLog.create({
      patient: patient._id,
      message,
      status: result.status,
      response: result,
      type: 'payment_reminder',
      sentBy: req.user?._id,
      amount: pendingAmount
    });

    if (result.status === 'error') {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.json({ success: true, message: 'Payment reminder SMS sent successfully' });
  } catch (error) {
    console.error('Error in sendPaymentReminderSMS:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getSMSCredit = async (req: Request, res: Response) => {
  try {
    const credit = await checkSMSCredit();
    if (credit === null) {
      return res.status(400).json({ success: false, message: 'Failed to check SMS credit' });
    }
    res.json({ success: true, credit });
  } catch (error) {
    console.error('Error getting SMS credit:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
