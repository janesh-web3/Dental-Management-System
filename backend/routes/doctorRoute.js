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