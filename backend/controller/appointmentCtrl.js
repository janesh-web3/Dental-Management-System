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
      const foundDoctor = await Doctor.findById(req.body.doctor);
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
    const { page = 1, limit = 10, search = "" , status="All"} = req.query;
    const query = search
      ? { firstName: { $regex: search, $options: "i" }, isDeleted: false ,lastName: { $regex: search, $options: "i" } }
      : {};

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
    const appointment = await Appointment.findById(appointmentId);
    
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
      const oldDoctor = await Doctor.findById(appointment.doctor);
      if (oldDoctor) {
        oldDoctor.appointments = oldDoctor.appointments.filter(
          appt => appt.toString() !== appointmentId
        );
        await oldDoctor.save();
      }
      
      // Add appointment to new doctor's list
      const newDoctor = await Doctor.findById(updateData.doctorId);
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

module.exports = {
  addAppointment,
  getAllAppointment,
  updateAppointmentStatus,
  updateAppointment
};
