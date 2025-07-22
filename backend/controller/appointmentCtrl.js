const Appointment = require("../model/Appointment.js");
const Doctor = require("../model/Doctor.js");
const Patient = require("../model/Patient.js");
const { createAndEmitNotification } = require("./notificationCtrl.js");
const { getIO, notifyUser, notifyRoles } = require("../socket.js");

const addAppointment = async (req, res) => {
  try {
    let appointmentData = { ...req.body };
    
    // If no patientId is provided, create a new patient
    if (!appointmentData.patientId) {
      const newPatient = new Patient({
        personalDetails: {
          name: `${appointmentData.firstName} ${appointmentData.lastName}`,
          age: appointmentData.age,
          gender: appointmentData.gender,
          contactNumber: appointmentData.phoneNumber,
          emailAddress: appointmentData.email || "",
          address: appointmentData.address || "",
        },
        emergencyContact: {
          name: "",
          relationship: "",
          contactNumber: "",
        },
        insuranceDetails: {
          provider: "",
          policyNumber: "",
          groupNumber: "",
        },
        medicalHistory: {
          allergies: [],
          medications: [],
          previousTreatments: [],
          chronicConditions: [],
        }
      });
      
      const savedPatient = await newPatient.save();
      appointmentData.patientId = savedPatient._id;
    }
    
    const newAppointment = new Appointment(appointmentData);
    const savedAppointment = await newAppointment.save();
    
    // If a doctor is specified, add the appointment to their list
    if (req.body.doctor) {
      const foundDoctor = await Doctor.findOne({ _id: req.body.doctor, isDeleted: { $ne: true } });
      if (foundDoctor) {
        foundDoctor.appointments.push(savedAppointment._id);
        await foundDoctor.save();
      }
    }

    // Prepare the doctor notification
    if (req.body.doctor) {
      // Create notification for the specific doctor
      await createAndEmitNotification({
        userId: req.body.doctor,
        userType: 'Doctor',
        title: 'New Appointment Scheduled',
        message: `New appointment with ${req.body.firstName} ${req.body.lastName} on ${req.body.appointmentDate} at ${req.body.appointmentTime}`,
        type: 'info',
        sourceId: savedAppointment._id,
        sourceType: 'Appointment',
        soundEnabled: true
      });
    }

    // Create notification for all admins
    await createAndEmitNotification({
      targetRoles: ['admin', 'superadmin'],
      title: 'New Appointment Created',
      message: `New appointment with ${req.body.firstName} ${req.body.lastName} on ${req.body.appointmentDate} at ${req.body.appointmentTime}`,
      type: 'info',
      sourceId: savedAppointment._id,
      sourceType: 'Appointment',
      soundEnabled: true
    });

    // Emit socket event for real-time updates
    const io = getIO();
    if (io) {
      const appointmentData = {
        id: savedAppointment._id,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        appointmentDate: req.body.appointmentDate,
        appointmentTime: req.body.appointmentTime,
        doctorId: req.body.doctor,
        subject: req.body.subject
      };

      io.emit('appointment:created', appointmentData);
      
      // Play notification sound
      io.to('admin').emit('notification:sound', { type: 'info' });
      if (req.body.doctor) {
        io.to(`Doctor:${req.body.doctor}`).emit('notification:sound', { type: 'info' });
      }
    }

    res.status(201).json({
      success: true,
      message: "Appointment created successfully!",
      appointment: savedAppointment,
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(400).json({
      success: false,
      message: "Failed to create appointment",
      error: error.message,
    });
  }
};

const getAllAppointment = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" , status="All", calendar = false} = req.query;
    const query = search
      ? { firstName: { $regex: search, $options: "i" }, isDeleted: { $ne: true } ,lastName: { $regex: search, $options: "i" } }
      : { isDeleted: { $ne: true } };

    // For calendar view, get all appointments without pagination
    if (calendar === 'true') {
      const allAppointment = await Appointment.find(query)
        .sort({ startDateTime: 1 })
        .populate({
          path: "doctor",
          model: "Doctor",
          select: "name specialization",
        })
        .populate({
          path: "patientId",
          model: "Patient",
          select: "firstName lastName contactNumber email age gender",
        });

      // Get patient follow-up dates
      const currentDate = new Date();
      const futureDate = new Date();
      futureDate.setMonth(currentDate.getMonth() + 12); // Get next 12 months of follow-ups

      const patientsWithFollowUps = await Patient.find({
        isDeleted: { $ne: true },
        $or: [
          {
            "medicalDetails.treatmentPlanning.followUpDate": {
              $gte: currentDate,
              $lte: futureDate
            }
          },
          {
            "medicalDetails.treatmentPlanning.groupTreatmentDetails.followUpDate": {
              $gte: currentDate,
              $lte: futureDate
            }
          }
        ]
      })
      .select("personalDetails.name medicalDetails.treatmentPlanning")
      .lean();

      // Transform follow-up dates into appointment-like objects
      const followUpEvents = [];
      
      patientsWithFollowUps.forEach(patient => {
        if (patient.medicalDetails && patient.medicalDetails.length > 0) {
          patient.medicalDetails.forEach(medical => {
            if (medical.treatmentPlanning && medical.treatmentPlanning.length > 0) {
              medical.treatmentPlanning.forEach(plan => {
                // Check treatment planning follow-up date
                if (plan.followUpDate && new Date(plan.followUpDate) >= currentDate) {
                  followUpEvents.push({
                    _id: `followup-tp-${patient._id}-${plan._id}`,
                    firstName: patient.personalDetails?.name?.split(' ')[0] || 'Patient',
                    lastName: patient.personalDetails?.name?.split(' ').slice(1).join(' ') || '',
                    appointmentDate: new Date(plan.followUpDate).toISOString().split('T')[0],
                    appointmentTime: '09:00',
                    startDateTime: new Date(plan.followUpDate),
                    endDateTime: new Date(new Date(plan.followUpDate).getTime() + 30 * 60000), // 30 minutes
                    treatmentType: 'Follow-up',
                    status: 'Follow-up',
                    priority: 'standard',
                    paymentStatus: 'N/A',
                    subject: 'Treatment Follow-up',
                    reason: 'Scheduled follow-up appointment',
                    isFollowUp: true,
                    patientId: patient._id,
                    doctor: null
                  });
                }

                // Check group treatment follow-up dates
                if (plan.groupTreatmentDetails && plan.groupTreatmentDetails.length > 0) {
                  plan.groupTreatmentDetails.forEach(group => {
                    if (group.followUpDate && new Date(group.followUpDate) >= currentDate) {
                      followUpEvents.push({
                        _id: `followup-gt-${patient._id}-${group._id}`,
                        firstName: patient.personalDetails?.name?.split(' ')[0] || 'Patient',
                        lastName: patient.personalDetails?.name?.split(' ').slice(1).join(' ') || '',
                        appointmentDate: new Date(group.followUpDate).toISOString().split('T')[0],
                        appointmentTime: '09:00',
                        startDateTime: new Date(group.followUpDate),
                        endDateTime: new Date(new Date(group.followUpDate).getTime() + 30 * 60000), // 30 minutes
                        treatmentType: `${group.groupName} Follow-up`,
                        status: 'Follow-up',
                        priority: 'standard',
                        paymentStatus: 'N/A',
                        subject: `${group.groupName} Follow-up`,
                        reason: `Scheduled ${group.groupName} follow-up appointment`,
                        isFollowUp: true,
                        patientId: patient._id,
                        doctor: group.treatedByDoctor || null
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });

      // Combine appointments and follow-ups
      const combinedEvents = [...allAppointment, ...followUpEvents];
      return res.status(200).json(combinedEvents);
    }

    // For table view, keep pagination
    const allAppointment = await Appointment.find(query).sort({ isCreated: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate({
      path: "doctor",
      model: "Doctor",
    })
    .populate({
      path: "patientId",
      model: "Patient",
      select: "firstName lastName contactNumber email age gender",
    })

    
    if (status && status !== "All") {
      query.status = status;
    }

    const totalAppointment = await Appointment.countDocuments(query);
    const totalPages = Math.ceil(totalAppointment / limit);

    res.status(200).json({
      result: allAppointment,
      totalPages,
      pageCount: allAppointment.length,
      totalUser: totalAppointment,
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to fetch appointments",
      error,
    });
  }
};

const updateAppointmentStatus = async (req, res) => {
  const { status } = req.body;

  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('doctor').populate({
      path: 'patientId',
      select: 'personalDetails'
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Get doctor and patient information
    const doctorId = appointment.doctor?._id || appointment.doctor;
    const patientId = appointment.patientId?._id || appointment.patientId;
    const patientName = appointment.patientId?.personalDetails?.name 
      ? appointment.patientId.personalDetails.name
      : `${appointment.firstName} ${appointment.lastName}` || 'Patient';
    
    // Send notification to the patient about status update
    if (patientId) {
      await sendNotification({
        title: 'Appointment Status Updated',
        message: `Your appointment on ${appointment.appointmentDate} at ${appointment.appointmentTime} has been ${status.toLowerCase()}`,
        type: status === 'Accepted' ? 'success' : status === 'Cancelled' ? 'error' : 'info',
        userId: patientId,
        userType: 'Patient',
        data: {
          appointmentId: appointment._id,
          status
        },
        eventType: 'appointment_notification'
      });
    }
    
    // Send notification to admin
    await sendNotification({
      title: 'Appointment Status Updated',
      message: `Appointment for ${patientName} on ${appointment.appointmentDate} at ${appointment.appointmentTime} has been ${status.toLowerCase()}`,
      type: status === 'Accepted' ? 'success' : status === 'Cancelled' ? 'error' : 'info',
      userId: process.env.ADMIN_ID || '000000000000000000000000',
      userType: 'User',
      data: {
        appointmentId: appointment._id,
        patientName,
        status
      },
      eventType: 'appointment_notification'
    });

    res.status(200).json({
      success: true,
      message: "Appointment status updated successfully",
      appointment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update appointment status",
      error,
    });
  }
};
const updateAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const updateData = req.body;
    
    // Find the appointment
    const appointment = await Appointment.findOne({ _id: appointmentId, isDeleted: { $ne: true } });
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }
    
    // If patient is authenticated, check if they own this appointment
    if (req.patient && appointment.patientId.toString() !== req.patient._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this appointment"
      });
    }
    
    // Check if appointment status allows editing (pending or approved)
    if (!['pending', 'approved'].includes(appointment.status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Only pending or approved appointments can be updated"
      });
    }
    
    // If doctor is changing, update the old and new doctor's appointment lists
    if (updateData.doctorId && updateData.doctorId !== appointment.doctor.toString()) {
      // Remove appointment from old doctor's list
      const oldDoctor = await Doctor.findOne({ _id: appointment.doctor, isDeleted: { $ne: true } });
      if (oldDoctor) {
        oldDoctor.appointments = oldDoctor.appointments.filter(
          appt => appt.toString() !== appointmentId
        );
        await oldDoctor.save();
      }
      
      // Add appointment to new doctor's list
      const newDoctor = await Doctor.findOne({ _id: updateData.doctorId, isDeleted: { $ne: true } });
      if (newDoctor) {
        newDoctor.appointments.push(appointmentId);
        await newDoctor.save();
      } else {
        return res.status(404).json({
          success: false,
          message: "New doctor not found"
        });
      }
    }
    
    // Update the appointment
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      updateData,
      { new: true, runValidators: true }
    ).populate('doctor', 'name specialization');
    
    res.status(200).json({
      success: true,
      message: "Appointment updated successfully",
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update appointment",
      error: error.message
    });
  }
};

const { sendNotification } = require('../utils/notificationHelper');

// Delete appointment with soft delete
const deleteAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    
    // Find the appointment
    const appointment = await Appointment.findOne({ _id: appointmentId, isDeleted: { $ne: true } });
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }
    
    // Soft delete the appointment
    appointment.isDeleted = true;
    appointment.deletedAt = new Date();
    appointment.deletedBy = req.user?._id; // If user middleware is available
    await appointment.save();
    
    // Remove from doctor's appointment list
    if (appointment.doctor) {
      await Doctor.findByIdAndUpdate(
        appointment.doctor,
        { $pull: { appointments: appointmentId } }
      );
    }
    
    // Send notifications
    await createAndEmitNotification({
      targetRoles: ['admin'],
      title: 'Appointment Deleted',
      message: `Appointment for ${appointment.firstName} ${appointment.lastName} has been deleted`,
      type: 'warning',
      sourceId: appointmentId,
      sourceType: 'Appointment'
    });

    res.status(200).json({
      success: true,
      message: "Appointment deleted successfully"
    });
    
  } catch (error) {
    console.error("Error deleting appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete appointment",
      error: error.message
    });
  }
};

// Get doctor availability for a specific date
const getDoctorAvailability = async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    
    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID and date are required"
      });
    }
    
    const appointments = await Appointment.getDoctorAvailability(doctorId, new Date(date));
    
    res.status(200).json({
      success: true,
      appointments
    });
    
  } catch (error) {
    console.error("Error getting doctor availability:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get doctor availability",
      error: error.message
    });
  }
};

// Check for appointment conflicts
const checkConflicts = async (req, res) => {
  try {
    const { doctorId, startDateTime, endDateTime, excludeId } = req.body;
    
    const query = {
      doctor: doctorId,
      startDateTime: { $lt: new Date(endDateTime) },
      endDateTime: { $gt: new Date(startDateTime) },
      status: { $nin: ['Cancelled', 'Rejected'] },
      isDeleted: false
    };
    
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const conflicts = await Appointment.find(query)
      .populate('doctor', 'name')
      .select('firstName lastName startDateTime endDateTime treatmentType');
    
    res.status(200).json({
      success: true,
      hasConflicts: conflicts.length > 0,
      conflicts
    });
    
  } catch (error) {
    console.error("Error checking conflicts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check conflicts",
      error: error.message
    });
  }
};

// Reschedule appointment (drag and drop)
const rescheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDateTime, endDateTime } = req.body;
    
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }
    
    // Check for conflicts
    const conflicts = await appointment.checkConflicts();
    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Time slot conflict detected",
        conflicts
      });
    }
    
    // Update appointment times
    appointment.startDateTime = new Date(startDateTime);
    appointment.endDateTime = new Date(endDateTime);
    appointment.appointmentDate = new Date(startDateTime).toISOString().split('T')[0];
    appointment.appointmentTime = new Date(startDateTime).toTimeString().slice(0, 5);
    
    await appointment.save();
    
    res.status(200).json({
      success: true,
      message: "Appointment rescheduled successfully",
      appointment
    });
    
  } catch (error) {
    console.error("Error rescheduling appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reschedule appointment",
      error: error.message
    });
  }
};

// Create follow-up appointment
const createFollowUp = async (req, res) => {
  try {
    const { parentId } = req.params;
    const followUpData = req.body;
    
    const parentAppointment = await Appointment.findById(parentId);
    if (!parentAppointment) {
      return res.status(404).json({
        success: false,
        message: "Parent appointment not found"
      });
    }
    
    const followUp = await parentAppointment.createFollowUp(followUpData);
    
    res.status(201).json({
      success: true,
      message: "Follow-up appointment created successfully",
      appointment: followUp
    });
    
  } catch (error) {
    console.error("Error creating follow-up:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create follow-up appointment",
      error: error.message
    });
  }
};

// Get patients for appointment autocomplete
const getPatientsForAppointment = async (req, res) => {
  try {
    const { search = "" } = req.query;
    
    const query = {
      isDeleted: { $ne: true }
    };
    
    if (search) {
      query.$or = [
        { "personalDetails.name": { $regex: search, $options: "i" } },
        { "personalDetails.contactNumber": { $regex: search, $options: "i" } },
        { "personalDetails.emailAddress": { $regex: search, $options: "i" } }
      ];
    }
    
    const patients = await Patient.find(query)
      .select("personalDetails.name personalDetails.contactNumber personalDetails.emailAddress personalDetails.age personalDetails.gender personalDetails.address")
      .limit(20)
      .sort({ "personalDetails.name": 1 });
    
    // Transform the data to split name into firstName and lastName for frontend compatibility
    const transformedPatients = patients.map(patient => {
      const nameParts = (patient.personalDetails?.name || "").split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      
      return {
        _id: patient._id,
        personalDetails: {
          firstName,
          lastName,
          contactNumber: patient.personalDetails?.contactNumber || "",
          emailAddress: patient.personalDetails?.emailAddress || "",
          age: patient.personalDetails?.age || "",
          gender: patient.personalDetails?.gender || "",
          address: patient.personalDetails?.address || ""
        }
      };
    });
    
    res.status(200).json({
      success: true,
      patients: transformedPatients
    });
  } catch (error) {
    console.error("Error fetching patients for appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patients",
      error: error.message
    });
  }
};

// Get doctors for appointment autocomplete
const getDoctorsForAppointment = async (req, res) => {
  try {
    const { search = "" } = req.query;
    
    const query = {
      isDeleted: { $ne: true },
      isActive: true
    };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } }
      ];
    }
    
    const doctors = await Doctor.find(query)
      .select("name specialization contactNumber")
      .limit(20)
      .sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      doctors
    });
  } catch (error) {
    console.error("Error fetching doctors for appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch doctors",
      error: error.message
    });
  }
};

module.exports = {
  addAppointment,
  getAllAppointment,
  updateAppointmentStatus,
  updateAppointment,
  deleteAppointment,
  getDoctorAvailability,
  checkConflicts,
  rescheduleAppointment,
  createFollowUp,
  getPatientsForAppointment,
  getDoctorsForAppointment
};
