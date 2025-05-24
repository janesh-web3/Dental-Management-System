const Prescription = require("../model/Prescription");
const Patient = require("../model/Patient");
const Doctor = require("../model/Doctor");
const mongoose = require("mongoose");

// Create a new prescription
exports.createPrescription = async (req, res) => {
  try {
    const { patient, doctor, diagnosis, medications, tests, nextVisitDate, instructions } = req.body;

    // Validate required fields
    if (!patient || !doctor || !diagnosis || !medications || medications.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: patient, doctor, diagnosis, and medications are required",
      });
    }

    // Validate patient and doctor IDs
    if (!mongoose.Types.ObjectId.isValid(patient) || !mongoose.Types.ObjectId.isValid(doctor)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient or doctor ID",
      });
    }

    // Check if patient exists
    const patientExists = await Patient.findById(patient);
    if (!patientExists) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Check if doctor exists
    const doctorExists = await Doctor.findById(doctor);
    if (!doctorExists) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Create prescription object
    const prescriptionData = {
      patient,
      doctor,
      diagnosis,
      medications,
      instructions: instructions || "",
    };

    // Add tests to instructions if provided
    if (tests && tests.trim() !== "") {
      prescriptionData.instructions += `\n\nRecommended Tests: ${tests}`;
    }

    // Add next visit date to instructions if provided
    if (nextVisitDate) {
      const formattedDate = new Date(nextVisitDate).toLocaleDateString();
      prescriptionData.instructions += `\n\nNext Visit Date: ${formattedDate}`;
    }

    // Create and save the prescription
    const newPrescription = new Prescription(prescriptionData);
    await newPrescription.save();

    // Return success response
    return res.status(201).json({
      success: true,
      message: "Prescription created successfully",
      data: newPrescription,
    });
  } catch (error) {
    console.error("Error creating prescription:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create prescription",
      error: error.message,
    });
  }
};

// Get all prescriptions
exports.getAllPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ isActive: true })
      .populate("patient", "firstName lastName email phone")
      .populate("doctor", "firstName lastName specialization");

    return res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch prescriptions",
      error: error.message,
    });
  }
};

// Get prescriptions by patient ID
exports.getPatientPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID",
      });
    }

    const prescriptions = await Prescription.find({ patient: patientId, isActive: true })
      .populate("doctor", "name specialization")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (error) {
    console.error("Error fetching patient prescriptions:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch patient prescriptions",
      error: error.message,
    });
  }
};

// Get prescriptions by doctor ID
exports.getDoctorPrescriptions = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID",
      });
    }

    const prescriptions = await Prescription.find({ doctor: doctorId, isActive: true })
      .populate("patient", "personalDetails.name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: prescriptions.length,
      prescriptions: prescriptions,
    });
  } catch (error) {
    console.error("Error fetching doctor prescriptions:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctor prescriptions",
      error: error.message,
    });
  }
};

// Get prescription by ID
exports.getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid prescription ID",
      });
    }

    const prescription = await Prescription.findById(id)
      .populate("patient", "firstName lastName email phone")
      .populate("doctor", "firstName lastName specialization");

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    console.error("Error fetching prescription:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch prescription",
      error: error.message,
    });
  }
};

// Update prescription
exports.updatePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { diagnosis, medications, instructions } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid prescription ID",
      });
    }

    // Find the prescription
    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    // Update fields
    if (diagnosis) prescription.diagnosis = diagnosis;
    if (medications && medications.length > 0) prescription.medications = medications;
    if (instructions) prescription.instructions = instructions;
    
    prescription.updatedAt = Date.now();

    // Save the updated prescription
    await prescription.save();

    return res.status(200).json({
      success: true,
      message: "Prescription updated successfully",
      data: prescription,
    });
  } catch (error) {
    console.error("Error updating prescription:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update prescription",
      error: error.message,
    });
  }
};

// Delete prescription (soft delete)
exports.deletePrescription = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid prescription ID",
      });
    }

    // Find the prescription
    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    // Soft delete
    prescription.isActive = false;
    prescription.updatedAt = Date.now();
    await prescription.save();

    return res.status(200).json({
      success: true,
      message: "Prescription deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting prescription:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete prescription",
      error: error.message,
    });
  }
};
