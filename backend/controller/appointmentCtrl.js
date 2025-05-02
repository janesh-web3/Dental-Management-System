const Appointment = require("../model/Appointment.js");
const Doctor = require("../model/Doctor.js");

const addAppointment = async (req, res) => {
  try {
    const newAppointment = new Appointment(req.body);
    const { doctor } = req.body;

    const savedAppointment = await newAppointment.save();
    const foundDoctor = await Doctor.findById(doctor);
    if (!foundDoctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }
    foundDoctor.appointments.push(savedAppointment._id);
    await foundDoctor.save();

    res.status(201).json({
      success: true,
      message: "Appointment created successfully!",
      appointment: savedAppointment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to create appointment",
      error,
    });
  }
};

const getAllAppointment = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" , status="All"} = req.query;
    console.log(req.query)
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
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

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

module.exports = {
  addAppointment,
  getAllAppointment,
  updateAppointmentStatus,
};
