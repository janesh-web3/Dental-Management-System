const Doctor = require("../model/Doctor.js");
const cloudinary = require("../config/cloudinary");
const { deleteFile } = require("../middleware/multer.js");

const addDoctor = async (req, res) => {
  try {
    console.log(req.body);
    let doctorData = {};

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

    const newDoctor = new Doctor(doctorData);

    await newDoctor.save();
    res.status(201).json(newDoctor);
  } catch (error) {
    console.error("Error saving doctor:", error);
    res.status(400).json({ error: error.message });
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

    res.status(200).json(doctor);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  addDoctor,
  getPaginatedDoctor,
  getDoctor,
  deleteDoctor,
  updateDoctor,
};
