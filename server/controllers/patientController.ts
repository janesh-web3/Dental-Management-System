import { Request, Response } from 'express';
import Patient from '../models/Patient';
import { FilterQuery } from 'mongoose';
import { IPatient } from '../models/Patient';

export const searchPatients = async (req: Request, res: Response) => {
  try {
    const { query, limit = 10 } = req.body;
    
    if (!query) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const searchRegex = new RegExp(query, 'i');
    
    const patients = await Patient.find({
      $or: [
        { 'personalDetails.name': { $regex: searchRegex } },
        { 'personalDetails.contactNumber': { $regex: searchRegex } },
        { 'personalDetails.emailAddress': { $regex: searchRegex } }
      ]
    })
    .limit(Number(limit))
    .select('personalDetails name contactNumber emailAddress lastAppointment')
    .lean();

    res.json({ success: true, data: patients });
  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getFilteredPatients = async (req: Request, res: Response) => {
  try {
    const { 
      treatmentStatus, 
      procedures = [], 
      group, 
      dateRange = {},
      gender,
      limit = 1000,
      page = 1
    } = req.body;

    const query: FilterQuery<IPatient> = {};

    // Apply treatment status filter
    if (treatmentStatus) {
      query['treatments.status'] = treatmentStatus;
    }

    // Apply procedures filter
    if (procedures.length > 0) {
      query['treatments.procedure'] = { $in: procedures };
    }

    // Apply group filter
    if (group) {
      query['treatments.group'] = group;
    }

    // Apply gender filter
    if (gender) {
      query['personalDetails.gender'] = gender;
    }

    // Apply date range filter
    if (dateRange.from || dateRange.to) {
      query['treatments.date'] = {};
      if (dateRange.from) {
        query['treatments.date'].$gte = new Date(dateRange.from);
      }
      if (dateRange.to) {
        query['treatments.date'].$lte = new Date(dateRange.to);
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [patients, total] = await Promise.all([
      Patient.find(query)
        .skip(skip)
        .limit(Number(limit))
        .select('personalDetails name contactNumber emailAddress lastAppointment')
        .lean(),
      Patient.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: patients,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Error getting filtered patients:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getPatientsCount = async (req: Request, res: Response) => {
  try {
    const { 
      treatmentStatus, 
      procedures = [], 
      group, 
      dateRange = {},
      gender
    } = req.body;

    const query: FilterQuery<IPatient> = {};

    // Apply treatment status filter
    if (treatmentStatus) {
      query['treatments.status'] = treatmentStatus;
    }

    // Apply procedures filter
    if (procedures.length > 0) {
      query['treatments.procedure'] = { $in: procedures };
    }

    // Apply group filter
    if (group) {
      query['treatments.group'] = group;
    }

    // Apply gender filter
    if (gender) {
      query['personalDetails.gender'] = gender;
    }

    // Apply date range filter
    if (dateRange.from || dateRange.to) {
      query['treatments.date'] = {};
      if (dateRange.from) {
        query['treatments.date'].$gte = new Date(dateRange.from);
      }
      if (dateRange.to) {
        query['treatments.date'].$lte = new Date(dateRange.to);
      }
    }

    const count = await Patient.countDocuments(query);

    res.json({ success: true, count });
  } catch (error) {
    console.error('Error getting patients count:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
