const express = require("express");
const router = express.Router();
const {
  addDoctor,
  getPaginatedDoctor,
  getDoctor,
  deleteDoctor,
  updateDoctor,
  updateDoctorPassword,
} = require("../controller/doctorCtrl.js");
const { doctorLogin, getCurrentDoctor } = require("../controller/doctorAuthCtrl.js");
const { protectDoctorRoute } = require("../middleware/doctorAuthMiddleware.js");
const { upload } = require("../middleware/multer.js");
const { 
  authenticateUser, 
  authorizePermission, 
  staffOrAdmin 
} = require("../middleware/rbacMiddleware");
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

// Doctor authentication routes
router.post("/login", doctorLogin);
router.get("/get-current-doctor", protectDoctorRoute, getCurrentDoctor);

// Doctor CRUD routes with RBAC
router.post("/add-doctor", authenticateUser, authorizePermission('doctors', 'create'), upload.single('image'), addDoctor);
router.get("/get-pagination-doctor", authenticateUser, authorizePermission('doctors', 'read'), getPaginatedDoctor);
router.get("/get-doctor", authenticateUser, authorizePermission('doctors', 'read'), getDoctor);
router.delete("/delete-doctor/:id", authenticateUser, authorizePermission('doctors', 'delete'), deleteDoctor);
router.put("/update-doctor/:id", authenticateUser, authorizePermission('doctors', 'update'), upload.single('image'), updateDoctor);
// Allow both doctors (updating their own password) and admins (updating any doctor's password)
router.put("/update-password/:id", async (req, res, next) => {
  // Try to authenticate as doctor first
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");

      // If it's a doctor token and they're updating their own password
      if (decoded.role === 'doctor' && decoded.id === req.params.id) {
        return protectDoctorRoute(req, res, () => {
          updateDoctorPassword(req, res);
        });
      }
    } catch (err) {
      // Token verification failed, fall through to admin auth
    }
  }

  // Otherwise, require admin authentication
  authenticateUser(req, res, () => {
    authorizePermission('doctors', 'update')(req, res, () => {
      updateDoctorPassword(req, res);
    });
  });
});

router.post("/doctors/:id/reviews", authenticateUser, authorizePermission('doctors', 'update'), async (req, res) => {
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