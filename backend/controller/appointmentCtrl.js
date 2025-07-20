const Appointment = require("../model/Appointment.js");
const Doctor = require("../model/Doctor.js");
const { createAndEmitNotification } = require("./notificationCtrl.js");
const { getIO, notifyUser, notifyRoles } = require("../socket.js");

const addAppointment = async (req, res) => {
  try {
    const newAppointment = new Appointment(req.body);
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
        });

      return res.status(200).json(allAppointment);
    }

    // For table view, keep pagination
    const allAppointment = await Appointment.find(query).sort({ isCreated: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit)).populate({
      path: "doctor",
      model: "Doctor",
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
    ).populate('doctor').populate('patient');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Get doctor and patient information
    const doctorId = appointment.doctor?._id || appointment.doctor;
    const patientId = appointment.patient?._id || appointment.patient;
    const patientName = appointment.patient?.firstName 
      ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
      : appointment.patientName || 'Patient';
    
    // Send notification to the patient about status update
    if (patientId) {
      await sendNotification({
        title: 'Appointment Status Updated',
        message: `Your appointment on ${appointment.date} at ${appointment.time} has been ${status.toLowerCase()}`,
        type: status === 'Confirmed' ? 'success' : status === 'Cancelled' ? 'error' : 'info',
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
      message: `Appointment for ${patientName} on ${appointment.date} at ${appointment.time} has been ${status.toLowerCase()}`,
      type: status === 'Confirmed' ? 'success' : status === 'Cancelled' ? 'error' : 'info',
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

module.exports = {
  addAppointment,
  getAllAppointment,
  updateAppointmentStatus,
  updateAppointment,
  deleteAppointment,
  getDoctorAvailability,
  checkConflicts,
  rescheduleAppointment,
  createFollowUp
};
