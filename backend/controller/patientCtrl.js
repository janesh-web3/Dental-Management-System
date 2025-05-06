const Patient = require("../model/Patient.js");
const cloudinary = require("../config/cloudinary");
const { deleteFile } = require("../middleware/multer");
const validator = require("validator");
const User = require("../model/User.js");
const Appointment = require("../model/Appointment.js");
const Doctor = require("../model/Doctor.js");

const addPatient = async (req, res) => {
  try {
    // Validate required fields
    const { personalDetails } = req.body;
    if (!personalDetails) {
      return res.status(400).json({
        success: false,
        error: "Personal details are required",
      });
    }

    const { name, contactNumber, gender } = personalDetails;
    if (!name || !contactNumber || !gender) {
      return res.status(400).json({
        success: false,
        error: "Name, contact number, and gender are required",
      });
    }

    // Validate contact number format
    if (!/^\d{10}$/.test(contactNumber)) {
      return res.status(400).json({
        success: false,
        error: "Contact number must be 10 digits",
      });
    }

    // Validate name length
    if (name.length < 3) {
      return res.status(400).json({
        success: false,
        error: "Name must contain at least 3 characters",
      });
    }

    // Validate gender
    if (!["Male", "Female", "Other"].includes(gender)) {
      return res.status(400).json({
        success: false,
        error: "Invalid gender value",
      });
    }

    // Ensure medicalHistory is properly nested in medicalDetails
    if (req.body.medicalDetails && !req.body.medicalDetails[0].medicalHistory) {
      req.body.medicalDetails[0].medicalHistory = {
        bloodPressure: "",
        diabetes: false,
        thyroid: false,
        bleedingDisorder: false,
        pregnancy: false,
        asthma: false,
        allergies: "",
        otherConditions: "",
      };
    }

    // Create patient
    const patient = await Patient.create(req.body);
    res.status(201).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create patient",
      details: error.message,
    });
  }
};

const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Patient deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: "Failed to delete patient",
      details: error.message,
    });
  }
};

const getPatient = async (req, res) => {
  try {
    const patients = await Patient.find()
      .populate("appointments")
      .populate({
        path: "medicalDetails.treatmentPlanning.treatedByDoctor",
        model: "Doctor",
      })
      .populate({
        path: "medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.treatedByDoctor",
        model: "Doctor",
      });
      
    res.status(200).json({
      success: true,
      data: patients,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to retrieve patients.",
      details: error.message,
    });
  }
};

const updatePatient = async (req, res) => {
  try {
    const { personalDetails, medicalDetails } = req.body;
    
    // Validate required personal details
    if (
      !personalDetails ||
      !personalDetails.name ||
      !personalDetails.contactNumber
    ) {
      return res.status(400).json({
        success: false,
        error: "Required personal details are missing",
      });
    }

    // Format personal details dates
    const formattedPersonalDetails = {
      ...personalDetails,
      checkUpDate: personalDetails.checkUpDate
        ? new Date(personalDetails.checkUpDate)
        : undefined,
      updatedAt: new Date(),
    };

    // First, get the current patient data with existing documents
    const existingPatient = await Patient.findById(req.params.id);
    if (!existingPatient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Get existing medical details and treatment documents
    const existingMedicalDetails = existingPatient.medicalDetails || [];
    const existingTreatmentDocuments = {};

    // Create a map of treatment IDs to their existing documents
    if (existingMedicalDetails.length > 0 && existingMedicalDetails[0].treatmentPlanning) {
      existingMedicalDetails[0].treatmentPlanning.forEach(treatment => {
        if (treatment._id && treatment.treatmentDocuments) {
          existingTreatmentDocuments[treatment._id.toString()] = treatment.treatmentDocuments;
        }
      });
    }

    // Handle medicalDetails whether it's an array or object
    const medicalDetailsArray = Array.isArray(medicalDetails) ? medicalDetails : [medicalDetails];
    const firstMedicalDetail = medicalDetailsArray[0];
    
    // Format medical details
    const formattedMedicalDetails = {
      chiefComplaint : firstMedicalDetail.chiefComplaint || "",
      diagnosis: firstMedicalDetail.diagnosis,
      investigation: {
        blood: firstMedicalDetail.investigation?.blood || "",
        xray: firstMedicalDetail.investigation?.xray || ""
      },
      medicalHistory: {
        bloodPressure: firstMedicalDetail.medicalHistory?.bloodPressure || "",
        diabetes: firstMedicalDetail.medicalHistory?.diabetes || false,
        thyroid: firstMedicalDetail.medicalHistory?.thyroid || false,
        bleedingDisorder:
          firstMedicalDetail.medicalHistory?.bleedingDisorder || false,
        pregnancy: firstMedicalDetail.medicalHistory?.pregnancy || false,
        asthma: firstMedicalDetail.medicalHistory?.asthma || false,
        allergies: firstMedicalDetail.medicalHistory?.allergies || "",
        otherConditions: firstMedicalDetail.medicalHistory?.otherConditions || "",
        noMedicalIssues: firstMedicalDetail.medicalHistory?.noMedicalIssues || false,
      },
      treatmentPlanning:
        firstMedicalDetail.treatmentPlanning?.map((treatment) => {
          // IMPORTANT: Use existing documents if this treatment has an ID
          const treatmentId = treatment._id ? treatment._id.toString() : null;
          const existingDocs = treatmentId && existingTreatmentDocuments[treatmentId]
            ? existingTreatmentDocuments[treatmentId]
            : [];
          
          return {
            _id: treatment._id, // Preserve the ID if it exists
            patientType: treatment.patientType || "Adult",
            advancedAmount: treatment.advancedAmount?.toString() || "",
            balanceAmount: treatment.balanceAmount?.toString() || "",
            isCompleted: treatment.isCompleted || false,
            selectedTeethDetails:
              treatment.selectedTeethDetails?.map((tooth) => {
                // Get existing tooth data if this tooth has an ID and exists in the database
                const toothId = tooth._id ? tooth._id.toString() : null;
                const existingTooth = treatmentId && toothId && existingPatient?.medicalDetails[0]?.treatmentPlanning?.find(t => 
                  t._id.toString() === treatmentId)?.selectedTeethDetails?.find(t => t._id.toString() === toothId);
                
                return {
                  _id: tooth._id, // Preserve the tooth ID if it exists
                  number: tooth.number,
                  details: tooth.details || "",
                  position: tooth.position || "",
                  procedure: tooth.procedure || "",
                  side: tooth.side || "",
                  dailyTreatments: tooth.dailyTreatments?.map(treatment => ({
                    date: treatment.date ? new Date(treatment.date) : new Date(),
                    treatmentAmount: Number(treatment.treatmentAmount) || 0,
                    paidAmount: Number(treatment.paidAmount) || 0,
                    remainingAmount: Number(treatment.remainingAmount) || 0,
                    notes: treatment.notes || "",
                    treatedByDoctor: treatment.treatedByDoctor || null,
                    procedure: treatment.procedure || "", 
                    // For existing teeth's daily treatments, preserve existing completion status when possible
                    isCompleted: existingTooth && existingTooth.dailyTreatments ? 
                      (existingTooth.dailyTreatments.find(et => 
                        et._id && treatment._id && et._id.toString() === treatment._id.toString())?.isCompleted || treatment.isCompleted || false) : 
                      (treatment.isCompleted || false)
                  })) || [],
                  totalTreatmentAmount: Number(tooth.totalTreatmentAmount) || 0,
                  totalPaidAmount: Number(tooth.totalPaidAmount) || 0,
                  totalRemainingAmount: Number(tooth.totalRemainingAmount) || 0,
                  startDate: tooth.startDate ? new Date(tooth.startDate) : undefined,
                  // Use existing completion status for existing teeth with better fallback handling
                  isCompleted: existingTooth ? 
                    existingTooth.isCompleted : // Use existing completion status if the tooth exists
                    (tooth.isCompleted || false) // Otherwise use the incoming value or default to false
                };
              }) || [],
            teethNumber: treatment.teethNumber || "",
            treatmentAmount: treatment.treatmentAmount?.toString() || "",
            treatmentDate: treatment.treatmentDate
              ? new Date(treatment.treatmentDate)
              : undefined,
            treatmentDetails: treatment.treatmentDetails || "",
            treatedByDoctor: treatment.treatedByDoctor ? 
              (typeof treatment.treatedByDoctor === 'string' ? 
                treatment.treatedByDoctor : treatment.treatedByDoctor._id) : null,
            // IMPORTANT: Use the existing documents instead of what came from the request
            treatmentDocuments: existingDocs,
            treatmentFindings: treatment.treatmentFindings || "",
            completionDate: treatment.isCompleted ? new Date() : null,
            clinicalFindings: treatment.clinicalFindings || [],
            otherFindings: treatment.otherFindings || "",
            followUpDate: treatment.followUpDate
              ? new Date(treatment.followUpDate)
              : undefined,
          };
        }) || [],
    };

    // Update patient with formatted data
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      {
        personalDetails: formattedPersonalDetails,
        medicalDetails: [formattedMedicalDetails], // Always use an array with a single element
      },
      {
        new: true,
        runValidators: true,
      }
    );
    
    // Return the updated patient without trying to populate fields that might not exist
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Try to populate the doctor information if needed
    try {
      // Get the updated patient with populated doctor information
      const populatedPatient = await Patient.findById(patient._id)
        .populate({
          path: "medicalDetails.treatmentPlanning.treatedByDoctor",
          model: "Doctor"
        })
        .populate({
          path: "medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.treatedByDoctor",
          model: "Doctor"
        });
      
      res.status(200).json({
        success: true,
        data: populatedPatient || patient,
      });
    } catch (populateError) {
      // If population fails, still return the unpopulated patient
      console.error("Error populating doctor information:", populateError);
      res.status(200).json({
        success: true,
        data: patient,
      });
    }
  } catch (error) {
    console.error("Error updating patient:", error);
    res.status(400).json({
      success: false,
      error: "Failed to update patient",
      details: error.message,
    });
  }
};

const getSinglePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate("appointments")
      .populate({
        path: "medicalDetails.treatmentPlanning.treatedByDoctor",
        model: "Doctor",
      })
      .populate({
        path: "medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.treatedByDoctor",
        model: "Doctor",
      });
      
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }
    res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: "Invalid patient ID",
      details: error.message,
    });
  }
};

const getPaginatedPatient = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const query = search
      ? {
          "personalDetails.name": { $regex: search, $options: "i" },
        }
      : {};

    // Get patients sorted by createdAt in descending order
    const patients = await Patient.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: "medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.treatedByDoctor",
        model: "Doctor",
      });
    // Sort medical details and treatment planning for each patient
    const sortedPatients = patients.map((patient) => {
      const patientObj = patient.toObject();

      // Sort medical details by checkUpDate in descending order (newest first)
      if (patientObj.medicalDetails?.length > 0) {
        patientObj.medicalDetails.sort((a, b) => {
          const dateA = a.checkUpDate ? new Date(a.checkUpDate) : new Date(0);
          const dateB = b.checkUpDate ? new Date(b.checkUpDate) : new Date(0);
          return dateB - dateA;
        });

        // Sort treatment planning within each medical detail by treatmentDate
        patientObj.medicalDetails.forEach((medical) => {
          if (medical.treatmentPlanning?.length > 0) {
            medical.treatmentPlanning.sort((a, b) => {
              const dateA = a.treatmentDate
                ? new Date(a.treatmentDate)
                : new Date(0);
              const dateB = b.treatmentDate
                ? new Date(b.treatmentDate)
                : new Date(0);
              return dateB - dateA;
            });
          }
        });
      }

      return patientObj;
    });

    const totalPatients = await Patient.countDocuments(query);
    const totalPages = Math.ceil(totalPatients / limit);

    res.status(200).json({
      success: true,
      patients: sortedPatients,
      totalPages,
      patientsOnPage: sortedPatients.length,
      totalPatients,
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching patients",
      error: error.message,
    });
  }
};

const uploadPatientFiles = async (req, res) => {
  try {
    const patientId = req.params.id;
    const files = req.files;
    const { fileTypes, descriptions } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    // Upload files to Cloudinary and collect their data
    const uploadPromises = files.map(async (file, index) => {
      try {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "patient-files",
          resource_type: "auto", // Automatically detect file type
        });

        // Delete local file after upload
        deleteFile(file.path);

        return {
          fileName: file.originalname,
          fileType: fileTypes[index],
          fileUrl: result.secure_url,
          publicId: result.public_id,
          description: descriptions[index] || "",
        };
      } catch (error) {
        console.error("Error uploading file to Cloudinary:", error);
        throw error;
      }
    });

    const fileData = await Promise.all(uploadPromises);

    const patient = await Patient.findByIdAndUpdate(
      patientId,
      { $push: { files: { $each: fileData } } },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to upload files",
      details: error.message,
    });
  }
};

const updateTreatmentStatus = async (req, res) => {
  const { patientId, medicalDetailId, treatmentId } = req.params;
  const { isCompleted } = req.body;

  try {
    // Use findOneAndUpdate to ensure atomic operation
    const patient = await Patient.findOneAndUpdate(
      {
        _id: patientId,
        "medicalDetails._id": medicalDetailId,
        "medicalDetails.treatmentPlanning._id": treatmentId,
      },
      {
        $set: {
          "medicalDetails.$[med].treatmentPlanning.$[treat].isCompleted":
            isCompleted,
          "medicalDetails.$[med].treatmentPlanning.$[treat].completionDate":
            isCompleted ? new Date() : null,
        },
      },
      {
        arrayFilters: [
          { "med._id": medicalDetailId },
          { "treat._id": treatmentId },
        ],
        new: true,
        runValidators: true,
      }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient or treatment not found",
      });
    }

    // Try to populate the doctor information if needed
    try {
      // Get the updated patient with populated doctor information
      const populatedPatient = await Patient.findById(patient._id)
        .populate({
          path: "medicalDetails.treatmentPlanning.treatedByDoctor",
          model: "Doctor"
        })
        .populate({
          path: "medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.treatedByDoctor",
          model: "Doctor"
        });
      
      res.status(200).json({
        success: true,
        data: populatedPatient || patient,
      });
    } catch (populateError) {
      // If population fails, still return the unpopulated patient
      console.error("Error populating doctor information:", populateError);
      res.status(200).json({
        success: true,
        data: patient,
      });
    }
  } catch (error) {
    console.error("Error updating treatment status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update treatment status",
      details: error.message,
    });
  }
};

const getRecentTransactions = async (req, res) => {
  try {
    console.log("Fetching recent transactions from daily treatments...");
    
    const transactions = await Patient.aggregate([
      // Unwind to get to the daily treatments level
      { $unwind: "$medicalDetails" },
      { $unwind: "$medicalDetails.treatmentPlanning" },
      { $unwind: "$medicalDetails.treatmentPlanning.selectedTeethDetails" },
      { $unwind: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments" },

      // Only get treatments with amounts
      {
        $match: {
          "medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.treatmentAmount": {
            $exists: true,
            $ne: 0,
          }
        },
      },

      // Project the required fields
      {
        $project: {
          patientId: "$_id",
          patientName: "$personalDetails.name",
          treatmentDetails: {
            $concat: [
              { $ifNull: ["$medicalDetails.treatmentPlanning.selectedTeethDetails.procedure", "Treatment"] },
              " - Tooth #",
              { $ifNull: ["$medicalDetails.treatmentPlanning.selectedTeethDetails.number", ""] }
            ]
          },
          amount: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.treatmentAmount",
          paid: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.paidAmount",
          date: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date",
          notes: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.notes",
          status: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.isCompleted",
        },
      },

      // Sort by date descending (newest first)
      { $sort: { date: -1 } },

      // Limit to 10 recent transactions
      { $limit: 10 },
    ]);

    console.log(`Found ${transactions.length} transactions`);
    
    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error("Error in getRecentTransactions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch recent transactions",
      details: error.message,
    });
  }
};

// Add this new function to get the next serial number
const getNextSerialNumber = async (req, res) => {
  try {
    // Find the patient with the highest S.N
    const lastPatient = await Patient.findOne({}, { "personalDetails.sn": 1 })
      .sort({ "personalDetails.sn": -1 })
      .limit(1);
    
    let nextSN = 1; // Default start at 1
    
    if (lastPatient && lastPatient.personalDetails.sn) {
      // Try to parse the last S.N and increment it
      const lastSN = parseInt(lastPatient.personalDetails.sn);
      if (!isNaN(lastSN)) {
        nextSN = lastSN + 1;
      }
    }
    
    res.status(200).json({ 
      success: true, 
      nextSerialNumber: nextSN.toString() 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to generate next serial number",
      details: error.message
    });
  }
};

const getFinancialInsights = async (req, res) => {
  try {
    const { from, to } = req.query;
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    // Check if this is an all-time data request
    const isAllTimeRequest = fromDate.getFullYear() <= 2020 && fromDate.getMonth() === 0 && fromDate.getDate() === 1;
    
    // For all-time data, use more efficient queries
    const dateMatchQuery = isAllTimeRequest 
      ? {} 
      : { 
          "medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date": {
            $gte: fromDate,
            $lte: toDate
          }
        };

    // Get all patients with their treatment data
    const patients = await Patient.find(dateMatchQuery).populate({
      path: "medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.treatedByDoctor",
      model: "Doctor"
    });

    // Calculate daily revenue
    const dailyRevenue = patients.reduce((total, patient) => {
      return total + patient.medicalDetails.reduce((medTotal, medDetail) => {
        return medTotal + medDetail.treatmentPlanning.reduce((planTotal, plan) => {
          return planTotal + plan.selectedTeethDetails.reduce((toothTotal, tooth) => {
            return toothTotal + tooth.dailyTreatments.reduce((treatmentTotal, treatment) => {
              const treatmentDate = new Date(treatment.date);
              if (isAllTimeRequest || (treatmentDate >= fromDate && treatmentDate <= toDate)) {
                return treatmentTotal + (treatment.paidAmount || 0);
              }
              return treatmentTotal;
            }, 0);
          }, 0);
        }, 0);
      }, 0);
    }, 0);

    // Calculate revenue by doctor - adjusted for all-time request
    const revenueByDoctor = {};
    patients.forEach(patient => {
      patient.medicalDetails.forEach(medDetail => {
        medDetail.treatmentPlanning.forEach(plan => {
          plan.selectedTeethDetails.forEach(tooth => {
            tooth.dailyTreatments.forEach(treatment => {
              const treatmentDate = new Date(treatment.date);
              if (isAllTimeRequest || (treatmentDate >= fromDate && treatmentDate <= toDate)) {
                const doctorName = treatment.treatedByDoctor?.name || "Unassigned";
                revenueByDoctor[doctorName] = (revenueByDoctor[doctorName] || 0) + (treatment.paidAmount || 0);
              }
            });
          });
        });
      });
    });

    // Calculate revenue by treatment type - adjusted for all-time request
    const revenueByTreatment = {};
    patients.forEach(patient => {
      patient.medicalDetails.forEach(medDetail => {
        medDetail.treatmentPlanning.forEach(plan => {
          plan.selectedTeethDetails.forEach(tooth => {
            tooth.dailyTreatments.forEach(treatment => {
              const treatmentDate = new Date(treatment.date);
              if (isAllTimeRequest || (treatmentDate >= fromDate && treatmentDate <= toDate)) {
                const treatmentType = treatment.procedure || "General Treatment";
                revenueByTreatment[treatmentType] = (revenueByTreatment[treatmentType] || 0) + (treatment.paidAmount || 0);
              }
            });
          });
        });
      });
    });

    // Calculate revenue trend (daily) - with limit for all-time queries
    let revenueTrend = [];
    
    if (isAllTimeRequest) {
      // For all-time, group by month instead of day and limit to most recent data
      const aggregateResult = await Patient.aggregate([
        { $unwind: "$medicalDetails" },
        { $unwind: "$medicalDetails.treatmentPlanning" },
        { $unwind: "$medicalDetails.treatmentPlanning.selectedTeethDetails" },
        { $unwind: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments" },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m",
                date: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date"
              }
            },
            revenue: { $sum: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.paidAmount" }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: 24 }, // Show last 24 months for all-time data
        {
          $project: {
            _id: 0,
            date: { 
              $concat: [
                "$_id", 
                "-01T00:00:00.000Z" // Convert YYYY-MM to YYYY-MM-01T00:00:00.000Z for date parsing
              ]
            },
            revenue: 1
          }
        }
      ]);
      
      revenueTrend = aggregateResult;
    } else {
      const currentDate = new Date(fromDate);
      while (currentDate <= toDate) {
        const dayRevenue = patients.reduce((total, patient) => {
          return total + patient.medicalDetails.reduce((medTotal, medDetail) => {
            return medTotal + medDetail.treatmentPlanning.reduce((planTotal, plan) => {
              return planTotal + plan.selectedTeethDetails.reduce((toothTotal, tooth) => {
                return toothTotal + tooth.dailyTreatments.reduce((treatmentTotal, treatment) => {
                  const treatmentDate = new Date(treatment.date);
                  if (treatmentDate.toDateString() === currentDate.toDateString()) {
                    return treatmentTotal + (treatment.paidAmount || 0);
                  }
                  return treatmentTotal;
                }, 0);
              }, 0);
            }, 0);
          }, 0);
        }, 0);

        revenueTrend.push({
          date: currentDate.toISOString(),
          revenue: dayRevenue
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Determine appropriate period for calculating daily/weekly/monthly revenue
    let dailyAvg, weeklyAvg, monthlyAvg;
    
    if (isAllTimeRequest) {
      // For all-time, calculate based on total months of data
      const totalRevenue = revenueTrend.reduce((sum, item) => sum + item.revenue, 0);
      const monthSpan = revenueTrend.length || 1; // Use number of months from trend data
      monthlyAvg = totalRevenue / monthSpan;
      weeklyAvg = monthlyAvg / 4.33; // Average weeks per month
      dailyAvg = weeklyAvg / 7;
    } else {
      // Calculate based on date range
      const totalRevenue = revenueTrend.reduce((sum, item) => sum + item.revenue, 0);
      const daySpan = Math.max(1, Math.round((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1);
      dailyAvg = totalRevenue / daySpan;
      weeklyAvg = dailyAvg * 7;
      monthlyAvg = dailyAvg * 30;
    }

    const totalRevenue = isAllTimeRequest 
      ? revenueTrend.reduce((sum, item) => sum + item.revenue, 0)
      : monthlyAvg * 12; // For specific date ranges, annualize the monthly average

    res.status(200).json({
      success: true,
      data: {
        daily: dailyAvg,
        weekly: weeklyAvg,
        monthly: monthlyAvg,
        total: totalRevenue,
        revenueByDoctor: Object.entries(revenueByDoctor).map(([doctorName, revenue]) => ({
          doctorName,
          revenue
        })),
        revenueByTreatment: Object.entries(revenueByTreatment).map(([treatmentType, revenue]) => ({
          treatmentType,
          revenue
        })),
        revenueTrend
      }
    });
  } catch (error) {
    console.error("Error getting financial insights:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get financial insights",
      error: error.message
    });
  }
};

const getDashboardMetrics = async (req, res) => {
  try {
    const { from, to } = req.query;
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    // Check if this is an all-time data request (date from 2020-01-01 or earlier)
    const isAllTimeRequest = fromDate.getFullYear() <= 2020 && fromDate.getMonth() === 0 && fromDate.getDate() === 1;
    
    // For all-time data, use more efficient queries
    const dateMatchQuery = isAllTimeRequest 
      ? {} // No date filter for all-time data
      : { 
          date: { 
            $gte: fromDate, 
            $lte: toDate 
          } 
        };
    
    const createdAtMatchQuery = isAllTimeRequest
      ? {}
      : {
          createdAt: {
            $gte: fromDate,
            $lte: toDate
          }
        };

    // Get total patients
    const totalPatients = await Patient.countDocuments();

    // Get total doctors - query both Doctor collection and User collection with dentist role
    const doctorCount = await Doctor.countDocuments();
    const dentistCount = await User.countDocuments({ role: "dentist" });
    const totalDoctors = doctorCount + dentistCount;
    console.log(`Found ${doctorCount} doctors in Doctor collection and ${dentistCount} dentists in User collection`);

    // Get total appointments - use date filter only if not all-time
    const appointmentsQuery = isAllTimeRequest 
      ? {} 
      : {
          appointmentDate: {
            $gte: fromDate.toISOString().split('T')[0],
            $lte: toDate.toISOString().split('T')[0]
          }
        };
    
    const totalAppointments = await Appointment.countDocuments(appointmentsQuery);

    // Get appointment stats
    const appointmentStatus = {
      scheduled: await Appointment.countDocuments({ status: "Pending", ...appointmentsQuery }) || 0,
      completed: await Appointment.countDocuments({ status: "Accepted", ...appointmentsQuery }) || 0,
      canceled: await Appointment.countDocuments({ status: "Rejected", ...appointmentsQuery }) || 0
    };

    // Get today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAppointments = await Appointment.find({
      appointmentDate: today.toISOString().split('T')[0],
    }).populate('doctor');

    // Get patient growth data
    const patientGrowth = await Patient.aggregate([
      {
        $match: createdAtMatchQuery
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          count: 1
        }
      },
      // If all-time query, limit to most recent 30 data points
      ...(isAllTimeRequest ? [{ $limit: 30 }] : [])
    ]);

    // Default to empty array if no results
    if (patientGrowth.length === 0) {
      patientGrowth.push({
        date: fromDate.toISOString().split('T')[0],
        count: 0
      });
    }

    // Get appointment distribution
    const appointmentDistribution = await Appointment.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          count: 1
        }
      }
    ]);

    // Get doctor performance - query both the dedicated Doctor model and Users with dentist/doctor role
    let doctorPerformance = [];

    // First try to get doctor data from Doctor model
    try {
      const doctorsFromDoctorModel = await Doctor.find().lean();
      
      // If we found doctors in the Doctor model, use those
      if (doctorsFromDoctorModel && doctorsFromDoctorModel.length > 0) {
        doctorPerformance = doctorsFromDoctorModel.map(doctor => ({
          _id: doctor._id.toString(),
          doctorName: doctor.name,
          name: doctor.name,
          specialization: doctor.specialization || "General Dentist",
          totalAppointments: doctor.appointments?.length || 0,
          completedAppointments: 0, // We can't calculate this easily without additional lookups
          todayAppointments: 0,
          performanceRate: parseFloat(doctor.totalRating) || 0,
          patientsCount: doctor.totalPatientChecked || 0,
          treatmentsCompleted: 0,
          revenue: 0,
          averageRating: parseFloat(doctor.totalRating) || 0,
          experience: parseInt(doctor.experienceYears) || 0,
          status: doctor.isActive ? "active" : "inactive"
        }));
      } else {
        // Fall back to User model if no doctors found in Doctor model
        const doctorsFromUserModel = await User.find({ 
          role: { $in: ["doctor", "dentist"] } 
        }).lean();
        
        doctorPerformance = doctorsFromUserModel.map(user => ({
          _id: user._id.toString(),
          doctorName: user.name,
          name: user.name,
          specialization: "General Dentist",
          totalAppointments: 0,
          completedAppointments: 0,
          todayAppointments: 0,
          performanceRate: 0,
          patientsCount: 0,
          treatmentsCompleted: 0,
          revenue: 0,
          averageRating: 0,
          experience: 0,
          status: "active"
        }));
      }

      // If we still have no doctors, create a sample one for display purposes
      if (doctorPerformance.length === 0) {
        doctorPerformance = [{
          _id: "sample-doctor-id",
          doctorName: "Dr. Sample Doctor",
          name: "Dr. Sample Doctor",
          specialization: "General Dentist",
          totalAppointments: 0,
          completedAppointments: 0,
          todayAppointments: 0,
          performanceRate: 0,
          patientsCount: 0,
          treatmentsCompleted: 0,
          revenue: 0,
          averageRating: 0,
          experience: 0,
          status: "active"
        }];
        
        console.log("Created sample doctor data for display purposes");
      }
      
      console.log(`Prepared ${doctorPerformance.length} doctor records for dashboard`);
    } catch (error) {
      console.error("Error retrieving doctor data:", error);
      // Provide fallback data
      doctorPerformance = [{
        _id: "error-doctor-id",
        doctorName: "Error retrieving doctors",
        name: "Error retrieving doctors",
        specialization: "Please check server logs",
        totalAppointments: 0,
        completedAppointments: 0,
        todayAppointments: 0,
        performanceRate: 0,
        patientsCount: 0,
        treatmentsCompleted: 0,
        revenue: 0,
        averageRating: 0,
        experience: 0,
        status: "error"
      }];
    }

    // Calculate financial data from patient treatments
    let dailyRevenue = 0;
    let weeklyRevenue = 0;
    let monthlyRevenue = 0;
    let totalRevenue = 0;
    let revenueTrend = [];

    // Daily treatment revenue calculations
    try {
      const treatmentRevenue = await Patient.aggregate([
        {
          $unwind: "$medicalDetails"
        },
        {
          $unwind: "$medicalDetails.treatmentPlanning"
        },
        {
          $unwind: "$medicalDetails.treatmentPlanning.selectedTeethDetails"
        },
        {
          $unwind: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments"
        },
        {
          $match: {
            "medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date": {
              $gte: fromDate,
              $lte: toDate
            }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date"
              }
            },
            revenue: { $sum: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.paidAmount" }
          }
        },
        {
          $sort: { _id: 1 }
        },
        {
          $project: {
            _id: 0,
            date: "$_id",
            revenue: 1
          }
        }
      ]);

      revenueTrend = treatmentRevenue;
      
      // Calculate total revenue
      totalRevenue = treatmentRevenue.reduce((sum, day) => sum + day.revenue, 0);
      
      // Calculate daily, weekly, and monthly revenue
      const oneDay = 24 * 60 * 60 * 1000;
      const daysDiff = Math.round(Math.abs((toDate - fromDate) / oneDay)) + 1;
      
      dailyRevenue = daysDiff > 0 ? totalRevenue / daysDiff : 0;
      weeklyRevenue = dailyRevenue * 7;
      monthlyRevenue = dailyRevenue * 30;

    } catch (error) {
      console.error("Error calculating revenue:", error);
    }
    
    // Get recent treatments
    const recentTreatments = await Patient.aggregate([
      { $unwind: "$medicalDetails" },
      { $unwind: "$medicalDetails.treatmentPlanning" },
      { $unwind: "$medicalDetails.treatmentPlanning.selectedTeethDetails" },
      { $unwind: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments" },
      {
        $match: {
          "medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date": {
            $gte: fromDate,
            $lte: toDate
          }
        }
      },
      {
        $sort: { "medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date": -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          _id: 0,
          patientName: "$personalDetails.name",
          treatment: { $ifNull: ["$medicalDetails.treatmentPlanning.selectedTeethDetails.procedure", "Treatment"] },
          date: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date",
          amount: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.treatmentAmount",
          status: {
            $cond: {
              if: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.isCompleted",
              then: "Completed",
              else: "Pending"
            }
          },
          documents: { $ifNull: ["$medicalDetails.treatmentPlanning.treatmentDocuments", []] }
        }
      }
    ]);
    
    // Format the response to match frontend expectation
    res.status(200).json({
      data: {
        totalPatients,
        totalDoctors,
        totalAppointments,
        appointmentStatus,
        todayAppointmentsCount: todayAppointments.length,
        today: {
          appointments: todayAppointments.map(apt => ({
            id: apt._id.toString(),
            patientName: `${apt.firstName} ${apt.lastName}`,
            time: apt.appointmentTime,
            status: apt.status
          })),
          revenue: dailyRevenue,
          newPatients: patientGrowth.find(p => p.date === today.toISOString().split('T')[0])?.count || 0
        },
        patientGrowth,
        appointmentDistribution,
        doctorPerformance,
        financialAnalysis: {
          daily: dailyRevenue,
          weekly: weeklyRevenue,
          monthly: monthlyRevenue,
          total: totalRevenue,
          revenueByDoctor: doctorPerformance.map(doctor => ({
            doctorName: doctor.doctorName,
            revenue: doctor.revenue || 0
          })),
          revenueByTreatment: [],
          revenueTrend,
          paymentMethods: [],
          profitMargin: 30,
          averageTransactionValue: totalAppointments > 0 ? totalRevenue / totalAppointments : 0
        },
        analytics: {
          patientDemographics: {
            ageGroups: [],
            genderDistribution: []
          },
          appointmentAnalytics: {
            byDay: [],
            byTime: []
          },
          treatmentAnalytics: [],
          recentTreatments
        }
      }
    });

    console.log(`Doctor performance data count: ${doctorPerformance.length}`);
    if (doctorPerformance.length > 0) {
      console.log('Sample doctor data:', JSON.stringify(doctorPerformance[0], null, 2));
    }
  } catch (error) {
    console.error("Error in getDashboardMetrics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard metrics",
      error: error.message
    });
  }
};

module.exports = {
  addPatient,
  getPatient,
  updatePatient,
  deletePatient,
  getSinglePatient,
  getPaginatedPatient,
  uploadPatientFiles,
  updateTreatmentStatus,
  getRecentTransactions,
  getNextSerialNumber,
  getFinancialInsights,
  getDashboardMetrics,
};
