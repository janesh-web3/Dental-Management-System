const Doctor = require("../model/Doctor.js");
const Patient = require("../model/Patient.js");
const Appointment = require("../model/Appointment.js");
const Prescription = require("../model/Prescription.js");
const TreatmentPlan = require("../model/TreatmentPlan.js");
const Invoice = require("../model/Invoice.js");
const mongoose = require("mongoose");

// Dashboard Overview
const getDashboardOverview = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's appointments
    const todayAppointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: {
        $gte: today.toISOString().split('T')[0],
        $lt: tomorrow.toISOString().split('T')[0]
      }
    }).populate('doctor');

    // Upcoming appointments (next 7 days)
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const upcomingAppointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: {
        $gt: tomorrow.toISOString().split('T')[0],
        $lte: nextWeek.toISOString().split('T')[0]
      }
    }).populate('doctor');

    // Get patient summary
    const doctor = await Doctor.findById(doctorId);
    const patientCount = doctor.totalPatients ? doctor.totalPatients.length : 0;
    
    // Treatments in progress
    const treatmentsInProgress = await TreatmentPlan.find({
      doctor: doctorId,
      status: "Active"
    }).countDocuments();

    // Quick statistics
    const completedTreatments = await TreatmentPlan.find({
      doctor: doctorId,
      status: "Completed"
    }).countDocuments();

    const totalAppointments = await Appointment.find({
      doctor: doctorId
    }).countDocuments();

    res.status(200).json({
      success: true,
      data: {
        todayAppointments,
        upcomingAppointments,
        patientSummary: {
          totalPatients: patientCount,
          checkedPatients: doctor.totalPatientChecked || 0
        },
        treatmentsInProgress,
        statistics: {
          totalAppointments,
          completedTreatments,
          appointmentsToday: todayAppointments.length,
          upcomingAppointmentsCount: upcomingAppointments.length
        }
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard overview:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard overview",
      error: error.message
    });
  }
};

// Appointments Module
const getDoctorAppointments = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { page = 1, limit = 10, search = "", status = "All", startDate, endDate } = req.query;
    
    let query = { doctor: doctorId };
    
    // Add search filter
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } }
      ];
    }
    
    // Add status filter
    if (status && status !== "All") {
      query.status = status;
    }
    
    // Add date range filter
    if (startDate && endDate) {
      query.appointmentDate = {
        $gte: startDate,
        $lte: endDate
      };
    }
    
    const appointments = await Appointment.find(query)
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('doctor');
    
    const totalAppointments = await Appointment.countDocuments(query);
    const totalPages = Math.ceil(totalAppointments / limit);
    
    res.status(200).json({
      success: true,
      data: {
        appointments,
        totalPages,
        currentPage: page,
        totalAppointments
      }
    });
  } catch (error) {
    console.error("Error fetching doctor appointments:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching doctor appointments",
      error: error.message
    });
  }
};

const createDoctorAppointment = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const appointmentData = { ...req.body, doctor: doctorId };
    
    const newAppointment = new Appointment(appointmentData);
    const savedAppointment = await newAppointment.save();
    
    // Update doctor's appointments array
    await Doctor.findByIdAndUpdate(
      doctorId,
      { $push: { appointments: savedAppointment._id } }
    );
    
    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      data: savedAppointment
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(400).json({
      success: false,
      message: "Error creating appointment",
      error: error.message
    });
  }
};

const updateDoctorAppointment = async (req, res) => {
  try {
    const { appointmentId, doctorId } = req.params;
    
    // Verify the appointment belongs to this doctor
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctor: doctorId
    });
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found or not authorized to update"
      });
    }
    
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: "Appointment updated successfully",
      data: updatedAppointment
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(400).json({
      success: false,
      message: "Error updating appointment",
      error: error.message
    });
  }
};

const cancelDoctorAppointment = async (req, res) => {
  try {
    const { appointmentId, doctorId } = req.params;
    
    // Verify the appointment belongs to this doctor
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctor: doctorId
    });
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found or not authorized to cancel"
      });
    }
    
    // Update status to Rejected (cancelled)
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { $set: { status: "Rejected" } },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      data: updatedAppointment
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(400).json({
      success: false,
      message: "Error cancelling appointment",
      error: error.message
    });
  }
};

// Patients Management
const getDoctorPatients = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { page = 1, limit = 10, search = "" } = req.query;
    
    // Get doctor to access their patients
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }
    
    // Get patients assigned to this doctor
    let query = {};
    
    if (search) {
      query = {
        "personalDetails.name": { $regex: search, $options: "i" }
      };
    }
    
    // Find patients that have appointments with this doctor
    const patientsWithAppointments = await Appointment.find({ doctor: doctorId })
      .distinct('patientId');
    
    // Add patientId filter if there are any
    if (patientsWithAppointments.length > 0) {
      const validPatientIds = patientsWithAppointments.filter(id => id); // Filter out null/undefined
      if (validPatientIds.length > 0) {
        query._id = { $in: validPatientIds };
      }
    }
    
    const patients = await Patient.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ "personalDetails.name": 1 });
    
    const totalPatients = await Patient.countDocuments(query);
    const totalPages = Math.ceil(totalPatients / limit);
    
    res.status(200).json({
      success: true,
      data: {
        patients,
        totalPages,
        currentPage: page,
        totalPatients
      }
    });
  } catch (error) {
    console.error("Error fetching doctor patients:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching doctor patients",
      error: error.message
    });
  }
};

const getPatientDetails = async (req, res) => {
  try {
    const { patientId, doctorId } = req.params;
    
    // Verify this doctor has access to this patient
    const hasAccess = await Appointment.exists({
      doctor: doctorId,
      patientId: patientId
    });
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this patient's information"
      });
    }
    
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }
    
    // Get patient's appointments with this doctor
    const appointments = await Appointment.find({
      doctor: doctorId,
      patientId: patientId
    }).sort({ appointmentDate: -1 });
    
    // Get patient's treatment plans with this doctor
    const treatmentPlans = await TreatmentPlan.find({
      doctor: doctorId,
      patient: patientId
    }).sort({ createdAt: -1 });
    
    // Get patient's prescriptions from this doctor
    const prescriptions = await Prescription.find({
      doctor: doctorId,
      patient: patientId
    }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: {
        patient,
        appointments,
        treatmentPlans,
        prescriptions
      }
    });
  } catch (error) {
    console.error("Error fetching patient details:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching patient details",
      error: error.message
    });
  }
};

// Treatment Management
const createTreatmentPlan = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const treatmentData = { ...req.body, doctor: doctorId };
    
    const newTreatment = new TreatmentPlan(treatmentData);
    const savedTreatment = await newTreatment.save();
    
    res.status(201).json({
      success: true,
      message: "Treatment plan created successfully",
      data: savedTreatment
    });
  } catch (error) {
    console.error("Error creating treatment plan:", error);
    res.status(400).json({
      success: false,
      message: "Error creating treatment plan",
      error: error.message
    });
  }
};

const updateTreatmentPlan = async (req, res) => {
  try {
    const { treatmentId, doctorId } = req.params;
    
    // Verify the treatment belongs to this doctor
    const treatment = await TreatmentPlan.findOne({
      _id: treatmentId,
      doctor: doctorId
    });
    
    if (!treatment) {
      return res.status(404).json({
        success: false,
        message: "Treatment plan not found or not authorized to update"
      });
    }
    
    const updatedTreatment = await TreatmentPlan.findByIdAndUpdate(
      treatmentId,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: "Treatment plan updated successfully",
      data: updatedTreatment
    });
  } catch (error) {
    console.error("Error updating treatment plan:", error);
    res.status(400).json({
      success: false,
      message: "Error updating treatment plan",
      error: error.message
    });
  }
};

const updateTreatmentStep = async (req, res) => {
  try {
    const { treatmentId, stepId, doctorId } = req.params;
    
    // Verify the treatment belongs to this doctor
    const treatment = await TreatmentPlan.findOne({
      _id: treatmentId,
      doctor: doctorId
    });
    
    if (!treatment) {
      return res.status(404).json({
        success: false,
        message: "Treatment plan not found or not authorized to update"
      });
    }
    
    // Find and update the specific treatment step
    const stepIndex = treatment.treatmentSteps.findIndex(
      step => step._id.toString() === stepId
    );
    
    if (stepIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Treatment step not found"
      });
    }
    
    // Update the specific step
    for (const [key, value] of Object.entries(req.body)) {
      treatment.treatmentSteps[stepIndex][key] = value;
    }
    
    // If status is being updated to "Completed", set the completedDate
    if (req.body.status === "Completed") {
      treatment.treatmentSteps[stepIndex].completedDate = new Date();
    }
    
    await treatment.save();
    
    res.status(200).json({
      success: true,
      message: "Treatment step updated successfully",
      data: treatment
    });
  } catch (error) {
    console.error("Error updating treatment step:", error);
    res.status(400).json({
      success: false,
      message: "Error updating treatment step",
      error: error.message
    });
  }
};

// Prescription Management
const createPrescription = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const prescriptionData = { ...req.body, doctor: doctorId };
    
    const newPrescription = new Prescription(prescriptionData);
    const savedPrescription = await newPrescription.save();
    
    res.status(201).json({
      success: true,
      message: "Prescription created successfully",
      data: savedPrescription
    });
  } catch (error) {
    console.error("Error creating prescription:", error);
    res.status(400).json({
      success: false,
      message: "Error creating prescription",
      error: error.message
    });
  }
};

const getDoctorPrescriptions = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { patientId, page = 1, limit = 10 } = req.query;
    
    let query = { doctor: doctorId };
    
    // Add patient filter if provided
    if (patientId) {
      query.patient = patientId;
    }
    
    const prescriptions = await Prescription.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('patient', 'personalDetails.name')
      .populate('doctor', 'name');
    
    const totalPrescriptions = await Prescription.countDocuments(query);
    const totalPages = Math.ceil(totalPrescriptions / limit);
    
    res.status(200).json({
      success: true,
      data: {
        prescriptions,
        totalPages,
        currentPage: page,
        totalPrescriptions
      }
    });
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching prescriptions",
      error: error.message
    });
  }
};

// Billing Overview
const getDoctorInvoices = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { status, patientId, page = 1, limit = 10 } = req.query;
    
    let query = { doctor: doctorId };
    
    // Add status filter
    if (status && status !== "All") {
      query.status = status;
    }
    
    // Add patient filter
    if (patientId) {
      query.patient = patientId;
    }
    
    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('patient', 'personalDetails.name')
      .populate('doctor', 'name');
    
    const totalInvoices = await Invoice.countDocuments(query);
    const totalPages = Math.ceil(totalInvoices / limit);
    
    res.status(200).json({
      success: true,
      data: {
        invoices,
        totalPages,
        currentPage: page,
        totalInvoices
      }
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching invoices",
      error: error.message
    });
  }
};

// Reports & Analytics
const getDoctorAnalytics = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Set default date range to last 30 days if not provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end);
    if (!startDate) {
      start.setDate(start.getDate() - 30);
    }
    
    // Patient count over time
    const patientCountByMonth = await Appointment.aggregate([
      { $match: { doctor: mongoose.Types.ObjectId(doctorId) } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $addToSet: "$patientId" }
        }
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          count: { $size: "$count" }
        }
      },
      { $sort: { year: 1, month: 1 } }
    ]);
    
    // Common procedures
    const commonProcedures = await TreatmentPlan.aggregate([
      { $match: { doctor: mongoose.Types.ObjectId(doctorId) } },
      { $unwind: "$treatmentSteps" },
      {
        $group: {
          _id: "$treatmentSteps.procedure",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Treatment outcomes
    const treatmentOutcomes = await TreatmentPlan.aggregate([
      { $match: { doctor: mongoose.Types.ObjectId(doctorId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Revenue per month
    const revenueByMonth = await Invoice.aggregate([
      { 
        $match: { 
          doctor: mongoose.Types.ObjectId(doctorId),
          createdAt: { $gte: start, $lte: end }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          revenue: { $sum: "$amountPaid" }
        }
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          revenue: 1
        }
      },
      { $sort: { year: 1, month: 1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        patientCountByMonth,
        commonProcedures,
        treatmentOutcomes,
        revenueByMonth
      }
    });
  } catch (error) {
    console.error("Error generating analytics:", error);
    res.status(500).json({
      success: false,
      message: "Error generating analytics",
      error: error.message
    });
  }
};

// Doctor Profile and Availability
const updateDoctorProfile = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const updatedDoctor = await Doctor.findByIdAndUpdate(
      doctorId,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!updatedDoctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Doctor profile updated successfully",
      data: updatedDoctor
    });
  } catch (error) {
    console.error("Error updating doctor profile:", error);
    res.status(400).json({
      success: false,
      message: "Error updating doctor profile",
      error: error.message
    });
  }
};

const updateDoctorAvailability = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { availability } = req.body;
    
    if (!availability || !Array.isArray(availability)) {
      return res.status(400).json({
        success: false,
        message: "Invalid availability data"
      });
    }
    
    const updatedDoctor = await Doctor.findByIdAndUpdate(
      doctorId,
      { $set: { availability } },
      { new: true, runValidators: true }
    );
    
    if (!updatedDoctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Doctor availability updated successfully",
      data: updatedDoctor
    });
  } catch (error) {
    console.error("Error updating doctor availability:", error);
    res.status(400).json({
      success: false,
      message: "Error updating doctor availability",
      error: error.message
    });
  }
};

// Notifications & Reminders
const getDoctorNotifications = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const today = new Date();
    
    // Upcoming appointments (next 24 hours)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const upcomingAppointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: {
        $gte: today.toISOString().split('T')[0],
        $lt: tomorrow.toISOString().split('T')[0]
      },
      status: "Accepted"
    }).populate('doctor');
    
    // Pending treatments that need attention
    const pendingTreatments = await TreatmentPlan.find({
      doctor: doctorId,
      status: "Active",
      "treatmentSteps.status": "In Progress"
    }).populate('patient', 'personalDetails.name');
    
    // Patient follow-ups due
    const followUpsDue = await Patient.aggregate([
      { $unwind: "$medicalDetails" },
      {
        $match: {
          "medicalDetails.followUpDate": {
            $gte: today,
            $lt: tomorrow
          }
        }
      },
      {
        $project: {
          _id: 1,
          patientName: "$personalDetails.name",
          followUpDate: "$medicalDetails.followUpDate"
        }
      }
    ]);
    
    // Check for patients with appointments but no treatment plans
    const patientsNeedingTreatment = await Appointment.aggregate([
      {
        $match: {
          doctor: mongoose.Types.ObjectId(doctorId),
          status: "Accepted",
          hasVisited: true
        }
      },
      {
        $lookup: {
          from: "treatmentplans",
          let: { patientId: "$patientId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$patient", "$$patientId"] },
                    { $eq: ["$doctor", mongoose.Types.ObjectId(doctorId)] }
                  ]
                }
              }
            }
          ],
          as: "treatments"
        }
      },
      {
        $match: {
          "treatments": { $size: 0 }
        }
      },
      {
        $project: {
          _id: 1,
          patientId: 1,
          firstName: 1,
          lastName: 1,
          appointmentDate: 1
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        upcomingAppointments,
        pendingTreatments,
        followUpsDue,
        patientsNeedingTreatment
      }
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching notifications",
      error: error.message
    });
  }
};

module.exports = {
  getDashboardOverview,
  getDoctorAppointments,
  createDoctorAppointment,
  updateDoctorAppointment,
  cancelDoctorAppointment,
  getDoctorPatients,
  getPatientDetails,
  createTreatmentPlan,
  updateTreatmentPlan,
  updateTreatmentStep,
  createPrescription,
  getDoctorPrescriptions,
  getDoctorInvoices,
  getDoctorAnalytics,
  updateDoctorProfile,
  updateDoctorAvailability,
  getDoctorNotifications
};
