const PatientGroup = require('../model/PatientGroup');
const Patient = require('../model/Patient');
const mongoose = require('mongoose');

// Create a new patient group
const createPatientGroup = async (req, res) => {
  try {
    const { name, description, filters, patientIds } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Group name is required'
      });
    }
    
    // Determine group category
    let category = 'Static';
    if (filters && Object.keys(filters).length > 0) {
      category = 'Dynamic';
    }
    
    // Calculate patient count
    let patientCount = 0;
    if (patientIds && patientIds.length > 0) {
      patientCount = patientIds.length;
    } else if (filters && Object.keys(filters).length > 0) {
      // For dynamic groups, we'll calculate the count later
      patientCount = await getPatientCountByFilters(filters);
    }
    
    // Create the group
    const patientGroup = new PatientGroup({
      name,
      description,
      filters: filters || {},
      patientIds: patientIds || [],
      patientCount,
      category,
      createdBy: req.user?._id || req.admin?.id
    });
    
    await patientGroup.save();
    
    // Return data in a format that matches what the frontend expects
    res.status(201).json({
      success: true,
      data: patientGroup
    });
  } catch (error) {
    console.error('Error creating patient group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create patient group',
      error: error.message
    });
  }
};

// Get all patient groups
const getPatientGroups = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category } = req.query;
    
    const query = {};
    
    // Add search filter
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    // Add category filter
    if (category) {
      query.category = category;
    }
    
    const total = await PatientGroup.countDocuments(query);
    const patientGroups = await PatientGroup.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email');
    
    // Return data in a format that matches what the frontend expects
    res.status(200).json({
      success: true,
      data: patientGroups
    });
  } catch (error) {
    console.error('Error fetching patient groups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient groups',
      error: error.message
    });
  }
};

// Get a single patient group by ID
const getPatientGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
    }
    
    const patientGroup = await PatientGroup.findById(id)
      .populate('createdBy', 'name email')
      .populate('patientIds', 'personalDetails.name personalDetails.contactNumber');
    
    if (!patientGroup) {
      return res.status(404).json({
        success: false,
        message: 'Patient group not found'
      });
    }
    
    // Return data in a format that matches what the frontend expects
    res.status(200).json({
      success: true,
      data: patientGroup
    });
  } catch (error) {
    console.error('Error fetching patient group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient group',
      error: error.message
    });
  }
};

// Update a patient group
const updatePatientGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, filters, patientIds } = req.body;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
    }
    
    const updateData = {};
    
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (filters) updateData.filters = filters;
    if (patientIds) updateData.patientIds = patientIds;
    
    // Recalculate patient count if needed
    if (patientIds || filters) {
      if (patientIds) {
        updateData.patientCount = patientIds.length;
      } else if (filters) {
        updateData.patientCount = await getPatientCountByFilters(filters);
      }
    }
    
    const patientGroup = await PatientGroup.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!patientGroup) {
      return res.status(404).json({
        success: false,
        message: 'Patient group not found'
      });
    }
    
    // Return data in a format that matches what the frontend expects
    res.status(200).json({
      success: true,
      data: patientGroup
    });
  } catch (error) {
    console.error('Error updating patient group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update patient group',
      error: error.message
    });
  }
};

// Delete a patient group
const deletePatientGroup = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
    }
    
    const patientGroup = await PatientGroup.findByIdAndDelete(id);
    
    if (!patientGroup) {
      return res.status(404).json({
        success: false,
        message: 'Patient group not found'
      });
    }
    
    // Return data in a format that matches what the frontend expects
    res.status(200).json({
      success: true,
      data: patientGroup,
      message: 'Patient group deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting patient group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete patient group',
      error: error.message
    });
  }
};

// Get patients for a group (resolve dynamic filters)
const getGroupPatients = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
    }
    
    const patientGroup = await PatientGroup.findById(id);
    
    if (!patientGroup) {
      return res.status(404).json({
        success: false,
        message: 'Patient group not found'
      });
    }
    
    let patients = [];
    
    // For static groups, return the patient IDs directly
    if (patientGroup.category === 'Static') {
      patients = await Patient.find({
        _id: { $in: patientGroup.patientIds }
      }).select('personalDetails.name personalDetails.contactNumber');
    } 
    // For dynamic groups, resolve the filters
    else if (patientGroup.category === 'Dynamic') {
      const query = buildPatientQueryFromFilters(patientGroup.filters);
      patients = await Patient.find(query).select('personalDetails.name personalDetails.contactNumber');
    }
    
    // Return data in a format that matches what the frontend expects
    res.status(200).json({
      success: true,
      data: {
        patients,
        count: patients.length
      }
    });
  } catch (error) {
    console.error('Error fetching group patients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch group patients',
      error: error.message
    });
  }
};

// Filter patients for creating groups
const filterPatientsForGroup = async (req, res) => {
  try {
    const filters = req.body;
    
    const query = buildPatientQueryFromFilters(filters);
    
    // Get patients matching the filters
    const patients = await Patient.find(query)
      .select('personalDetails.name personalDetails.contactNumber personalDetails.gender createdAt followUpDate totalRemainingAmount');
    
    // Return data in a format that matches what the frontend expects
    res.status(200).json({
      success: true,
      data: patients
    });
  } catch (error) {
    console.error('Error filtering patients for group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to filter patients',
      error: error.message
    });
  }
};

// Helper function to build patient query from filters
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

// Helper function to get patient count by filters
const getPatientCountByFilters = async (filters) => {
  try {
    const query = buildPatientQueryFromFilters(filters);
    return await Patient.countDocuments(query);
  } catch (error) {
    console.error('Error counting patients by filters:', error);
    return 0;
  }
};

module.exports = {
  createPatientGroup,
  getPatientGroups,
  getPatientGroupById,
  updatePatientGroup,
  deletePatientGroup,
  getGroupPatients,
  filterPatientsForGroup
};
















