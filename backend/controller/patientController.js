const Patient = require("../model/patientModel");

// Search patients by name, phone, or email
exports.searchPatients = async (req, res) => {
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

// Get filtered patients
exports.getFilteredPatients = async (req, res) => {
  try {
    // Get filters from query parameters
    const { 
      treatmentStatus, 
      procedure, 
      group, 
      from,
      to,
      gender,
      limit = 1000,
      page = 1
    } = req.query;
    
    // Convert procedure to array if it exists
    const procedures = procedure ? [procedure] : [];
    const dateRange = from || to ? { from, to } : {};

    const query = {};
    const treatmentQuery = {};
    let hasFilters = false;

    // Apply treatment status filter
    if (treatmentStatus) {
      treatmentQuery['treatments.status'] = treatmentStatus;
      hasFilters = true;
    }

    // Apply procedures filter - UPDATED LOGIC
    if (procedures.length > 0) {
      query['$or'] = [
        // Match procedure in dailyTreatments array where procedure field is directly stored
        {
          'medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.procedure': { $in: procedures }
        },
        // Keep the existing query paths as fallback
        {
          'medicalDetails': {
            $elemMatch: {
              'treatmentPlanning': {
                $elemMatch: {
                  'selectedTeethDetails': {
                    $elemMatch: {
                      'procedure': { $in: procedures }
                    }
                  }
                }
              }
            }
          }
        }
      ];
      hasFilters = true;
    }

    // Apply group filter
    if (group) {
      query['medicalDetails.group'] = group;
      hasFilters = true;
    }

    // Apply gender filter
    if (gender) {
      query['personalDetails.gender'] = gender;
      hasFilters = true;
    }

    // Apply date range filter
    if (dateRange.from || dateRange.to) {
      treatmentQuery['treatments.date'] = {};
      if (dateRange.from) {
        treatmentQuery['treatments.date'].$gte = new Date(dateRange.from);
      }
      if (dateRange.to) {
        treatmentQuery['treatments.date'].$lte = new Date(dateRange.to);
      }
      hasFilters = true;
    }

    // Only apply treatment query if there are any treatment filters
    if (Object.keys(treatmentQuery).length > 0) {
      query.$or = [
        { 'medicalDetails.treatmentPlanning': { $exists: true, $ne: [] } },
        { 'treatments': { $exists: true, $ne: [] } }
      ];
      
      // Find patients with matching treatments
      const patientsWithTreatments = await Patient.aggregate([
        {
          $lookup: {
            from: 'treatments',
            localField: '_id',
            foreignField: 'patientId',
            as: 'treatments'
          }
        },
        { $match: treatmentQuery },
        { $project: { _id: 1 } }
      ]);
      
      const patientIds = patientsWithTreatments.map(p => p._id);
      if (patientIds.length > 0) {
        query._id = { $in: patientIds };
      } else {
        // If no patients match the treatment filters, return empty array
        return res.json({
          success: true,
          data: [],
          total: 0,
          page: 1,
          totalPages: 0
        });
      }
    }

    // If no filters were applied, just return patients with basic information
    // This enables the "show all patients when no filters" requirement
    if (!hasFilters) {
      console.log("No filters applied, returning all patients");
      const actualLimit = Number(limit) || 100; // Default to 100 if limit is 0 or not specified
      const skip = (Number(page) - 1) * actualLimit;
      
      const [patients, total] = await Promise.all([
        Patient.find({})
          .skip(skip)
          .limit(actualLimit)
          .select('personalDetails.name personalDetails.contactNumber personalDetails.gender personalDetails.emailAddress lastAppointment')
          .sort({ 'personalDetails.name': 1 })
          .lean(),
        Patient.countDocuments({})
      ]);

      return res.json({
        success: true,
        data: patients,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / actualLimit)
      });
    }

    // If limit is 0, return all matching patients without pagination
    if (limit === 0) {
      const patients = await Patient.find(query)
        .select('personalDetails name contactNumber emailAddress lastAppointment')
        .lean();
      
      return res.json({
        success: true,
        data: patients,
        total: patients.length,
        page: 1,
        totalPages: 1
      });
    }

    // Otherwise, apply pagination
    const skip = (Number(page) - 1) * Number(limit);
    const [patients, total] = await Promise.all([
      Patient.find(query)
        .skip(skip)
        .limit(Number(limit))
        .select('personalDetails.name personalDetails.contactNumber personalDetails.emailAddress personalDetails.gender lastAppointment')
        .sort({ 'personalDetails.name': 1 })
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

// Get count of filtered patients
exports.getPatientsCount = async (req, res) => {
  try {
    const { 
      treatmentStatus, 
      procedures = [], 
      group, 
      dateRange = {},
      gender
    } = req.body;

    const query = {};

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
