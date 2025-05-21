const Doctor = require("../model/Doctor.js");
const cloudinary = require("../config/cloudinary");
const { deleteFile } = require("../middleware/multer.js");

const addDoctor = async (req, res) => {
  try {
    let doctorData = {};
    console.log(req.body);

    // Validate required fields
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({ 
        success: false,
        message: "Email and password are required fields" 
      });
    }

    if (req.file) {
      const cloudinaryResponse = await cloudinary.uploader.upload(
        req.file.path
      );

      if (cloudinaryResponse) {
        doctorData = req.body;
        doctorData.image = cloudinaryResponse.url;
        deleteFile(req.file.path);
      }
    } else {
      doctorData = req.body;
    }

    // Check if doctor with this email already exists
    const existingDoctor = await Doctor.findOne({ email: doctorData.email });
    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: "A doctor with this email already exists"
      });
    }

    // Create new doctor with password
    const newDoctor = new Doctor(doctorData);

    await newDoctor.save();
    
    // Remove password from response for security
    const doctorResponse = newDoctor.toObject();
    delete doctorResponse.password;
    
    res.status(201).json({
      success: true,
      message: "Doctor created successfully",
      data: doctorResponse
    });
  } catch (error) {
    console.error("Error saving doctor:", error);
    res.status(400).json({ 
      success: false,
      message: "Error creating doctor",
      error: error.message 
    });
  }
};

const getPaginatedDoctor = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const query = search ? { name: { $regex: search, $options: "i" } } : {};

    const doctor = await Doctor.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: "appointments",
        model: "Appointment",
      });

    const totalDoctor = await Doctor.countDocuments(query);
    const totalPages = Math.ceil(totalDoctor / limit);

    res.status(200).json({
      doctor,
      totalPages,
      patientsOnPage: doctor.length,
      totalDoctor,
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching patients", error });
  }
};

const getDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.find().sort({ createdAt: -1 });
    res.json(doctor);
  } catch (error) {
    console.error("Error fetching doctor:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching doctor", error });
  }
};

const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    await Doctor.findByIdAndDelete(id);
    res.status(200).json({ message: "Doctor deleted successfully" });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    res
      .status(500)
      .json({ success: false, message: "Error deleting doctor", error });
  }
};

const updateDoctor = async (req, res) => {
  try {
    console.log(req.body);
    const { id } = req.params;
    const doctorData = req.body;
    let updateData = { ...doctorData };
    console.log(req.file);
    if (req.file) {
      // Delete old image if exists
      if (updateData.image) {
        await cloudinary.uploader.destroy(updateData.image);
      }

      const result = await cloudinary.uploader.upload(req.file.path);
      updateData.image = result.url;
      deleteFile(req.file.path);
    }

    const doctor = await Doctor.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    // Remove password from response for security
    const doctorResponse = doctor.toObject();
    delete doctorResponse.password;

    res.status(200).json(doctorResponse);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update doctor password
const updateDoctorPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ 
        success: false,
        message: "New password is required" 
      });
    }

    // Password strength validation
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ 
        success: false,
        message: "Doctor not found" 
      });
    }

    // Update password (will be hashed by pre-save hook)
    doctor.password = newPassword;
    await doctor.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully"
    });
  } catch (error) {
    console.error("Error updating doctor password:", error);
    res.status(400).json({ 
      success: false,
      message: "Error updating password",
      error: error.message 
    });
  }
};

module.exports = {
  addDoctor,
  getPaginatedDoctor,
  getDoctor,
  deleteDoctor,
  updateDoctor,
  updateDoctorPassword,
};
