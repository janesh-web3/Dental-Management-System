import { Request, Response } from 'express';
import SMSSettings, { ISMSSettings } from '../models/SMSSettings';
import { UserRole } from '../models/User';

export const getSMSSettings = async (req: Request, res: Response) => {
  try {
    const settings = await SMSSettings.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error getting SMS settings:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateSMSSettings = async (req: Request, res: Response) => {
  try {
    // Only superadmin can update settings
    if (req.user?.role !== UserRole.SUPERADMIN) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only superadmin can update SMS settings' 
      });
    }

    const { bulkSMS, followupSMS, paymentSMS } = req.body;
    
    const updateData: Partial<ISMSSettings> = {
      updatedBy: req.user._id
    };

    if (typeof bulkSMS === 'boolean') updateData.bulkSMS = bulkSMS;
    if (typeof followupSMS === 'boolean') updateData.followupSMS = followupSMS;
    if (typeof paymentSMS === 'boolean') updateData.paymentSMS = paymentSMS;

    const settings = await SMSSettings.findOneAndUpdate(
      {},
      updateData,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ 
      success: true, 
      message: 'SMS settings updated successfully',
      data: settings 
    });
  } catch (error) {
    console.error('Error updating SMS settings:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
