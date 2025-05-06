const express = require("express");
const router = express.Router();
const {
  addDoctor,
  getPaginatedDoctor,
  getDoctor,
  deleteDoctor,
  updateDoctor,
} = require("../controller/doctorCtrl.js");
const { upload } = require("../middleware/multer.js");
const Doctor = require("../model/Doctor.js");

// Add a route to ensure at least one doctor exists in the system
router.get("/ensure-doctor-exists", async (req, res) => {
  try {
    // Count existing doctors
    const count = await Doctor.countDocuments();
    
    if (count === 0) {
      // No doctors exist, create a sample doctor
      const sampleDoctor = new Doctor({
        name: "Dr. John Smith",
        email: "dr.smith@example.com",
        contactNumber: "1234567890",
        specialization: "General Dentist",
        qualifications: ["BDS", "MDS"],
        experienceYears: "15",
        description: "Experienced general dentist with focus on preventive care",
      });
      
      await sampleDoctor.save();
      console.log("Created sample doctor:", sampleDoctor);
      
      return res.status(201).json({
        success: true,
        message: "Sample doctor created",
        data: sampleDoctor
      });
    }
    
    return res.status(200).json({
      success: true,
      message: `${count} doctors already exist in the system`,
      count
    });
  } catch (error) {
    console.error("Error ensuring doctor exists:", error);
    return res.status(500).json({
      success: false,
      message: "Error checking/creating sample doctor",
      error: error.message
    });
  }
});

router.post("/add-doctor", upload.single('image'), addDoctor);
router.get("/get-pagination-doctor", getPaginatedDoctor);
router.get("/get-doctor", getDoctor);
router.delete("/delete-doctor/:id", deleteDoctor);
router.put("/update-doctor/:id", upload.single('image'), updateDoctor);

router.post("/doctors/:id/reviews", async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    console.log(doctor);
    console.log(req.body);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const newReview = {
      user: req.body.user,
      rating: req.body.rating,
      feedback: req.body.feedback,
    };

    doctor.reviews.push(newReview);
    
    // Update total rating
    doctor.totalRating = doctor.calculateAverageRating();
    
    await doctor.save();
    res.status(201).json(newReview);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;