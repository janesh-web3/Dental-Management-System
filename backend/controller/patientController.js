const Patient = require("../model/patientModel");
const { optimizedPatientSearch, optimizedPatientFilter } = require("../utils/queryOptimizer");

// Search patients by name, phone, or email - OPTIMIZED
exports.searchPatients = async (req, res) => {
  try {
    const { query, limit = 10 } = req.body;
    
    if (!query) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    // Use optimized search with caching and text indexes
    const patients = await optimizedPatientSearch(Patient, query, limit);

    res.json({ success: true, data: patients });
  } catch (error) {
    console.error('Error searching patients:', error);
    
    // Fallback to regex search if text search fails
    try {
      const searchRegex = new RegExp(query, 'i');
      const patients = await Patient.find({
        $or: [
          { 'personalDetails.name': { $regex: searchRegex } },
          { 'personalDetails.contactNumber': { $regex: searchRegex } },
          { 'personalDetails.emailAddress': { $regex: searchRegex } }
        ]
      })
      .limit(Number(limit))
      .select('personalDetails.name personalDetails.contactNumber personalDetails.emailAddress lastAppointment')
      .lean();

      res.json({ success: true, data: patients });
    } catch (fallbackError) {
      console.error('Fallback search also failed:', fallbackError);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

// Get filtered patients - OPTIMIZED
exports.getFilteredPatients = async (req, res) => {
  try {
    // Get filters from query parameters
    const filters = {
      treatmentStatus: req.query.treatmentStatus,
      procedure: req.query.procedure,
      group: req.query.group,
      from: req.query.from,
      to: req.query.to,
      gender: req.query.gender,
      patientStatus: req.query.patientStatus,
      limit: parseInt(req.query.limit) || 100,
      page: parseInt(req.query.page) || 1,
      skip: (parseInt(req.query.page) || 1 - 1) * (parseInt(req.query.limit) || 100)
    };

    // Use optimized filtering with early pipeline optimization
    const patients = await optimizedPatientFilter(Patient, filters);

    res.json({
      success: true,
      data: patients,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: patients.length
      }
    });
  } catch (error) {
    console.error('Error filtering patients:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
        {
          'medicalDetails.treatmentPlanning.selectedTeethDetails.procedure': { $in: procedures }
        },
        // Match procedure in dailyTreatments
        {
          'medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.procedure': { $in: procedures }
        }
      ];
      hasFilters = true;
    }

    // Apply date range filter - Fixed to match actual date fields
    if (dateRange.from || dateRange.to) {
      const dateQuery = {};
      
      if (dateRange.from) {
        dateQuery.$gte = new Date(dateRange.from);
      }
      
      if (dateRange.to) {
        dateQuery.$lte = new Date(dateRange.to);
      }
      
      // Only add the date filter if we have valid dates
      if (Object.keys(dateQuery).length > 0) {
        query['$or'] = query['$or'] || [];
        
        // Add date queries for all relevant date fields
        query['$or'].push(
          { 'medicalDetails.treatmentPlanning.treatmentDate': dateQuery },
          { 'medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date': dateQuery }
        );
        
        hasFilters = true;
      }
    }

    // If no filters were applied, just return patients with basic information
    if (!hasFilters) {
      console.log("No filters applied, returning all patients");
      const actualLimit = Number(limit) || 100; // Default to 100 if limit is 0 or not specified
      const skip = (Number(page) - 1) * actualLimit;
      
      const [patients, total] = await Promise.all([
        Patient.find({})
          .skip(skip)
          .limit(actualLimit)
          .select('personalDetails.name personalDetails.contactNumber personalDetails.gender personalDetails.emailAddress patientStatus lastVisitDate lastAppointment')
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

    console.log("Applied filters:", JSON.stringify(query, null, 2));

    // Apply pagination with filters
    const skip = (Number(page) - 1) * Number(limit);
    const [patients, total] = await Promise.all([
      Patient.find(query)
        .skip(skip)
        .limit(Number(limit))
        .select('personalDetails.name personalDetails.contactNumber personalDetails.emailAddress personalDetails.gender patientStatus lastVisitDate lastAppointment')
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
