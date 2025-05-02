const Patient = require("../model/Patient.js");
const cloudinary = require("../config/cloudinary");
const { deleteFile } = require("../middleware/multer");
const validator = require("validator");

const addPatient = async (req, res) => {
  try {
    // Validate required fields
    const { personalDetails } = req.body;
    console.log(req.body);
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
};
