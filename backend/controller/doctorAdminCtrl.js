const Doctor = require("../model/Doctor.js");
const Patient = require("../model/Patient.js");
const Appointment = require("../model/Appointment.js");
const Prescription = require("../model/Prescription.js");
const TreatmentPlan = require("../model/TreatmentPlan.js");
const Invoice = require("../model/Invoice.js");
const mongoose = require("mongoose");

// Dashboard Overview with Enhanced Metrics
const getDashboardOverview = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Validate doctorId
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID format"
      });
    }

    // Get doctor details
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    // Set up date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Week start (Monday)
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));

    // Month start
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Year start
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const todayDateStr = today.toISOString().split('T')[0];
    const tomorrowDateStr = tomorrow.toISOString().split('T')[0];
    const nextWeekDateStr = nextWeek.toISOString().split('T')[0];

    // Today's appointments
    const todayAppointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: todayDateStr
    }).sort({ appointmentTime: 1 });

    // Upcoming appointments (next 7 days, excluding today)
    const upcomingAppointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: {
        $gt: todayDateStr,
        $lte: nextWeekDateStr
      }
    }).sort({ appointmentDate: 1, appointmentTime: 1 });

    // Get patient summary
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

    // Enhanced Metrics: Treatments Done (Today, Week, Month, Year)
    const Patient = require("../model/Patient.js");

    // Helper function to count treatments by date range
    const countTreatmentsByDateRange = async (startDate) => {
      // Find patients with either general or ortho daily treatments by this doctor
      const patients = await Patient.find({
        $or: [
          {
            'medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments': {
              $elemMatch: {
                treatedByDoctor: new mongoose.Types.ObjectId(doctorId),
                date: { $gte: startDate }
              }
            }
          },
          {
            'medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments': {
              $elemMatch: {
                treatedByDoctor: new mongoose.Types.ObjectId(doctorId),
                date: { $gte: startDate }
              }
            }
          }
        ]
      });

      let count = 0;
      patients.forEach(patient => {
        patient.medicalDetails?.forEach(md => {
          md.treatmentPlanning?.forEach(tp => {
            // Count general/tooth-based treatments
            tp.selectedTeethDetails?.forEach(std => {
              std.dailyTreatments?.forEach(dt => {
                if (dt.treatedByDoctor?.toString() === doctorId.toString() &&
                    new Date(dt.date) >= startDate) {
                  count++;
                }
              });
            });

            // Count ortho/group treatments
            tp.groupTreatmentDetails?.forEach(gtd => {
              gtd.dailyTreatments?.forEach(dt => {
                if (dt.treatedByDoctor?.toString() === doctorId.toString() &&
                    new Date(dt.date) >= startDate) {
                  count++;
                }
              });
            });
          });
        });
      });

      return count;
    };

    // Count treatments for each period
    const treatmentsDoneToday = await countTreatmentsByDateRange(today);
    const treatmentsDoneWeek = await countTreatmentsByDateRange(weekStart);
    const treatmentsDoneMonth = await countTreatmentsByDateRange(monthStart);
    const treatmentsDoneYear = await countTreatmentsByDateRange(yearStart);

    // Enhanced Metrics: Revenue (Today, Week, Month, Year)
    const ServicePayment = require("../model/ServicePayment.js");

    // Helper function to calculate revenue by date range
    const calculateRevenueByDateRange = async (startDate) => {
      // Calculate revenue from ServicePayment
      const payments = await ServicePayment.find({
        treatedByDoctor: doctorId,
        createdAt: { $gte: startDate }
      });

      let servicePaymentRevenue = payments.reduce((total, payment) => total + (payment.paidAmount || 0), 0);

      // Calculate revenue from daily treatments (both general and ortho)
      const patients = await Patient.find({
        $or: [
          {
            'medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments': {
              $elemMatch: {
                treatedByDoctor: new mongoose.Types.ObjectId(doctorId),
                date: { $gte: startDate }
              }
            }
          },
          {
            'medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments': {
              $elemMatch: {
                treatedByDoctor: new mongoose.Types.ObjectId(doctorId),
                date: { $gte: startDate }
              }
            }
          }
        ]
      });

      let dailyTreatmentRevenue = 0;
      patients.forEach(patient => {
        patient.medicalDetails?.forEach(md => {
          md.treatmentPlanning?.forEach(tp => {
            // Revenue from general/tooth-based treatments
            tp.selectedTeethDetails?.forEach(std => {
              std.dailyTreatments?.forEach(dt => {
                if (dt.treatedByDoctor?.toString() === doctorId.toString() &&
                    new Date(dt.date) >= startDate) {
                  dailyTreatmentRevenue += parseFloat(dt.paidAmount || 0);
                }
              });
            });

            // Revenue from ortho/group treatments
            tp.groupTreatmentDetails?.forEach(gtd => {
              gtd.dailyTreatments?.forEach(dt => {
                if (dt.treatedByDoctor?.toString() === doctorId.toString() &&
                    new Date(dt.date) >= startDate) {
                  dailyTreatmentRevenue += parseFloat(dt.paidAmount || 0);
                }
              });
            });
          });
        });
      });

      return servicePaymentRevenue + dailyTreatmentRevenue;
    };

    const revenueToday = await calculateRevenueByDateRange(today);
    const revenueWeek = await calculateRevenueByDateRange(weekStart);
    const revenueMonth = await calculateRevenueByDateRange(monthStart);
    const revenueYear = await calculateRevenueByDateRange(yearStart);

    // Revenue trend data for charts (last 12 months)
    const revenueTrend = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      // Revenue from ServicePayment
      const monthRevenue = await ServicePayment.aggregate([
        {
          $match: {
            treatedByDoctor: new mongoose.Types.ObjectId(doctorId),
            createdAt: { $gte: monthDate, $lt: nextMonthDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$paidAmount" }
          }
        }
      ]);

      let servicePaymentRevenue = monthRevenue[0]?.total || 0;

      // Revenue from daily treatments (both general and ortho)
      const patients = await Patient.find({
        $or: [
          {
            'medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments': {
              $elemMatch: {
                treatedByDoctor: new mongoose.Types.ObjectId(doctorId),
                date: { $gte: monthDate, $lt: nextMonthDate }
              }
            }
          },
          {
            'medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments': {
              $elemMatch: {
                treatedByDoctor: new mongoose.Types.ObjectId(doctorId),
                date: { $gte: monthDate, $lt: nextMonthDate }
              }
            }
          }
        ]
      });

      let dailyTreatmentRevenue = 0;
      patients.forEach(patient => {
        patient.medicalDetails?.forEach(md => {
          md.treatmentPlanning?.forEach(tp => {
            // Revenue from general/tooth-based treatments
            tp.selectedTeethDetails?.forEach(std => {
              std.dailyTreatments?.forEach(dt => {
                if (dt.treatedByDoctor?.toString() === doctorId.toString() &&
                    new Date(dt.date) >= monthDate &&
                    new Date(dt.date) < nextMonthDate) {
                  dailyTreatmentRevenue += parseFloat(dt.paidAmount || 0);
                }
              });
            });

            // Revenue from ortho/group treatments
            tp.groupTreatmentDetails?.forEach(gtd => {
              gtd.dailyTreatments?.forEach(dt => {
                if (dt.treatedByDoctor?.toString() === doctorId.toString() &&
                    new Date(dt.date) >= monthDate &&
                    new Date(dt.date) < nextMonthDate) {
                  dailyTreatmentRevenue += parseFloat(dt.paidAmount || 0);
                }
              });
            });
          });
        });
      });

      revenueTrend.push({
        month: monthDate.toLocaleString('default', { month: 'short' }),
        revenue: servicePaymentRevenue + dailyTreatmentRevenue
      });
    }

    // Treatment trend data for charts (last 12 months)
    const treatmentTrend = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const patients = await Patient.find({
        $or: [
          {
            'medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments': {
              $elemMatch: {
                treatedByDoctor: new mongoose.Types.ObjectId(doctorId),
                date: { $gte: monthDate, $lt: nextMonthDate }
              }
            }
          },
          {
            'medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments': {
              $elemMatch: {
                treatedByDoctor: new mongoose.Types.ObjectId(doctorId),
                date: { $gte: monthDate, $lt: nextMonthDate }
              }
            }
          }
        ]
      });

      let monthCount = 0;
      patients.forEach(patient => {
        patient.medicalDetails?.forEach(md => {
          md.treatmentPlanning?.forEach(tp => {
            // Count general/tooth-based treatments
            tp.selectedTeethDetails?.forEach(std => {
              std.dailyTreatments?.forEach(dt => {
                if (dt.treatedByDoctor?.toString() === doctorId.toString() &&
                    new Date(dt.date) >= monthDate &&
                    new Date(dt.date) < nextMonthDate) {
                  monthCount++;
                }
              });
            });

            // Count ortho/group treatments
            tp.groupTreatmentDetails?.forEach(gtd => {
              gtd.dailyTreatments?.forEach(dt => {
                if (dt.treatedByDoctor?.toString() === doctorId.toString() &&
                    new Date(dt.date) >= monthDate &&
                    new Date(dt.date) < nextMonthDate) {
                  monthCount++;
                }
              });
            });
          });
        });
      });

      treatmentTrend.push({
        month: monthDate.toLocaleString('default', { month: 'short' }),
        treatments: monthCount
      });
    }

    // Format the appointment data to match frontend expectations
    const formattedTodayAppointments = todayAppointments.map(appointment => ({
      _id: appointment._id,
      firstName: appointment.firstName,
      lastName: appointment.lastName,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      subject: appointment.subject,
      status: appointment.status
    }));

    const formattedUpcomingAppointments = upcomingAppointments.map(appointment => ({
      _id: appointment._id,
      firstName: appointment.firstName,
      lastName: appointment.lastName,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      subject: appointment.subject,
      status: appointment.status
    }));

    // Use actual data from the database
    const totalPatients = patientCount || 0;
    const checkedPatients = doctor.totalPatientChecked || 0;

    res.status(200).json({
      success: true,
      data: {
        todayAppointments: formattedTodayAppointments,
        upcomingAppointments: formattedUpcomingAppointments,
        patientSummary: {
          totalPatients: totalPatients,
          checkedPatients: checkedPatients
        },
        treatmentsInProgress: treatmentsInProgress,
        statistics: {
          totalAppointments: totalAppointments,
          completedTreatments: completedTreatments,
          appointmentsToday: formattedTodayAppointments.length,
          upcomingAppointmentsCount: formattedUpcomingAppointments.length
        },
        // Enhanced metrics
        treatmentMetrics: {
          today: treatmentsDoneToday,
          week: treatmentsDoneWeek,
          month: treatmentsDoneMonth,
          year: treatmentsDoneYear
        },
        revenueMetrics: {
          today: revenueToday,
          week: revenueWeek,
          month: revenueMonth,
          year: revenueYear
        },
        charts: {
          revenueTrend,
          treatmentTrend
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
    const { page = 1, limit = 10, search = "", status = "all", procedure } = req.query;
    
    // Get doctor to access their patients
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }
    
    // Base query
    let query = {};
    
    // Add name search if provided
    if (search) {
      query["personalDetails.name"] = { $regex: search, $options: "i" };
    }
    
    // Find patients that have been treated by this doctor
    // This looks for patients where this doctor is listed in any dailyTreatment
    const patientsQuery = {
      'medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.treatedByDoctor': new mongoose.Types.ObjectId(doctorId)
    };
    
    // If we're filtering by treatment status
    if (status !== 'all') {
      const isCompleted = status === 'completed';
      patientsQuery['medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.isCompleted'] = isCompleted;
    }
    
    // If we're filtering by procedure, add this new section
    if (procedure) {
      patientsQuery['$or'] = [
        // Match procedure in dailyTreatments array
        {
          'medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.procedure': procedure
        },
        // Keep the existing path as fallback
        {
          'medicalDetails.treatmentPlanning.selectedTeethDetails.procedure': procedure
        }
      ];
    }
    
    // Get all patients treated by this doctor
    const patientsWithTreatments = await Patient.find(patientsQuery).distinct('_id');
    
    // Also include patients from appointments
    const patientsWithAppointments = await Appointment.find({ doctor: doctorId }).distinct('patientId');
    
    // Combine both lists of patient IDs
    const allPatientIds = [...new Set([...patientsWithTreatments, ...patientsWithAppointments])];
    const validPatientIds = allPatientIds.filter(id => id); // Filter out null/undefined
    
    // Add patient IDs to the query
    if (validPatientIds.length > 0) {
      query._id = { $in: validPatientIds };
    } else {
      // If no patients found, return empty result
      return res.status(200).json({
        success: true,
        data: {
          patients: [],
          totalPages: 0,
          currentPage: parseInt(page),
          totalPatients: 0
        }
      });
    }
    
    // Get paginated patients
    const patients = await Patient.find(query)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ "personalDetails.name": 1 });
    
    // Process patients to include only treatments by this doctor
    const processedPatients = patients.map(patient => {
      const patientObj = patient.toObject();
      
      // Filter medical details to only include treatments by this doctor
      if (patientObj.medicalDetails && patientObj.medicalDetails.length > 0) {
        patientObj.medicalDetails = patientObj.medicalDetails.map(medicalDetail => {
          if (medicalDetail.treatmentPlanning && medicalDetail.treatmentPlanning.length > 0) {
            medicalDetail.treatmentPlanning = medicalDetail.treatmentPlanning.map(treatment => {
              if (treatment.selectedTeethDetails && treatment.selectedTeethDetails.length > 0) {
                treatment.selectedTeethDetails = treatment.selectedTeethDetails.map(tooth => {
                  if (tooth.dailyTreatments && tooth.dailyTreatments.length > 0) {
                    // Only include daily treatments performed by this doctor
                    tooth.dailyTreatments = tooth.dailyTreatments.filter(dt => 
                      dt.treatedByDoctor && dt.treatedByDoctor.toString() === doctorId.toString()
                    );
                  }
                  return tooth;
                });
              }
              return treatment;
            });
          }
          return medicalDetail;
        });
      }
      
      return patientObj;
    });
    
    const totalPatients = await Patient.countDocuments(query);
    const totalPages = Math.ceil(totalPatients / parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: {
        patients: processedPatients,
        totalPages,
        currentPage: parseInt(page),
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

// Get Patient Treatment History for Doctor Dashboard
const getDoctorPatientHistory = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { page = 1, limit = 10, search = "", sortBy = "date", sortOrder = "desc" } = req.query;

    // Validate doctorId
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID format"
      });
    }

    // Find all patients with treatments by this doctor
    const Patient = require("../model/Patient.js");
    const ServicePayment = require("../model/ServicePayment.js");

    let searchQuery = {};
    if (search) {
      searchQuery = {
        'personalDetails.name': { $regex: search, $options: 'i' }
      };
    }

    // Find patients with either general or ortho treatments by this doctor
    const patients = await Patient.find({
      ...searchQuery,
      $or: [
        {
          'medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.treatedByDoctor': new mongoose.Types.ObjectId(doctorId)
        },
        {
          'medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments.treatedByDoctor': new mongoose.Types.ObjectId(doctorId)
        }
      ]
    });

    // Build patient history array
    const patientHistory = [];

    // Helper function to get next follow-up date
    const getNextFollowUp = (treatmentPlanning) => {
      if (!treatmentPlanning || !treatmentPlanning.followUps || treatmentPlanning.followUps.length === 0) {
        return null;
      }

      // Filter for incomplete follow-ups and sort by date
      const upcomingFollowUps = treatmentPlanning.followUps
        .filter(fu => !fu.completed && fu.date)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      return upcomingFollowUps.length > 0 ? upcomingFollowUps[0].date : null;
    };

    for (const patient of patients) {
      patient.medicalDetails?.forEach(md => {
        md.treatmentPlanning?.forEach(tp => {
          // Get next follow-up for this treatment plan
          const nextFollowUpDate = getNextFollowUp(tp);

          // General/Tooth-based treatments
          tp.selectedTeethDetails?.forEach(std => {
            std.dailyTreatments?.forEach(dt => {
              if (dt.treatedByDoctor?.toString() === doctorId.toString()) {
                patientHistory.push({
                  patientId: patient._id,
                  patientName: patient.personalDetails?.name || "N/A",
                  treatmentName: dt.procedure || std.procedure || "N/A",
                  treatmentDate: dt.date || dt.createdAt || new Date().toISOString(),
                  status: dt.isCompleted ? "Completed" : "In Progress",
                  toothNumber: std.number || std.toothNumber || "N/A",
                  notes: dt.notes || "",
                  amountPaid: parseFloat(dt.paidAmount || 0),
                  remainingAmount: parseFloat(dt.remainingAmount || 0),
                  nextFollowUp: nextFollowUpDate,
                  nextAppointment: null, // Will be populated from appointments if needed
                  patient: patient // Include full patient object for drawer
                });
              }
            });
          });

          // Ortho/Group treatments
          tp.groupTreatmentDetails?.forEach(gtd => {
            gtd.dailyTreatments?.forEach(dt => {
              if (dt.treatedByDoctor?.toString() === doctorId.toString()) {
                patientHistory.push({
                  patientId: patient._id,
                  patientName: patient.personalDetails?.name || "N/A",
                  treatmentName: dt.procedure || gtd.procedure || gtd.groupName || "N/A",
                  treatmentDate: dt.date || dt.createdAt || new Date().toISOString(),
                  status: dt.isCompleted ? "Completed" : "In Progress",
                  toothNumber: gtd.groupName || "Group Treatment",
                  notes: dt.notes || "",
                  amountPaid: parseFloat(dt.paidAmount || 0),
                  remainingAmount: parseFloat(dt.remainingAmount || 0),
                  nextFollowUp: nextFollowUpDate,
                  nextAppointment: null,
                  patient: patient
                });
              }
            });
          });
        });
      });
    }

    // Sort patient history
    patientHistory.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          const dateA = a.treatmentDate ? new Date(a.treatmentDate).getTime() : 0;
          const dateB = b.treatmentDate ? new Date(b.treatmentDate).getTime() : 0;
          comparison = dateB - dateA;
          break;
        case 'name':
          comparison = a.patientName.localeCompare(b.patientName);
          break;
        case 'amount':
          comparison = b.amountPaid - a.amountPaid;
          break;
        default:
          const defaultDateA = a.treatmentDate ? new Date(a.treatmentDate).getTime() : 0;
          const defaultDateB = b.treatmentDate ? new Date(b.treatmentDate).getTime() : 0;
          comparison = defaultDateB - defaultDateA;
      }
      return sortOrder === 'asc' ? -comparison : comparison;
    });

    // Paginate results
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedHistory = patientHistory.slice(startIndex, endIndex);

    const totalPages = Math.ceil(patientHistory.length / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        patientHistory: paginatedHistory,
        totalPages,
        currentPage: parseInt(page),
        totalRecords: patientHistory.length
      }
    });
  } catch (error) {
    console.error("Error fetching doctor patient history:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching doctor patient history",
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

// Import doctor utilities
const { updateDoctorPatientCounts } = require('../utils/doctorUtils');

/**
 * Manually trigger an update of doctor patient counts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateDoctorPatients = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    // If doctorId is provided, update only that doctor
    // Otherwise, update all doctors
    await updateDoctorPatientCounts(doctorId !== 'all' ? doctorId : null);
    
    res.status(200).json({
      success: true,
      message: doctorId !== 'all' 
        ? `Patient counts updated for doctor ${doctorId}` 
        : 'Patient counts updated for all doctors'
    });
  } catch (error) {
    console.error('Error in manual doctor patient count update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update doctor patient counts',
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
  getDoctorPatientHistory,
  createTreatmentPlan,
  updateTreatmentPlan,
  updateTreatmentStep,
  createPrescription,
  getDoctorPrescriptions,
  getDoctorInvoices,
  getDoctorAnalytics,
  updateDoctorProfile,
  updateDoctorAvailability,
  getDoctorNotifications,
  updateDoctorPatients
};
