const express = require("express");
const router = express.Router();
const cloudinary = require("../config/cloudinary");
const Testimonial = require("../model/testimonial");
const { upload } = require("../middleware/multer");
const {
  getAllTestimonials,
  addTestimonial,
  updateTestimonial,
  deleteTestimonial,
} = require("../controller/testimonials");

// Get all testimonials
router.get("/get-all", getAllTestimonials);

// Create testimonial
router.post("/create", upload.single("image"), addTestimonial);

// Update testimonial
router.put("/edit/:id", upload.single("image"), updateTestimonial);

// Delete testimonial
router.delete("/:id", deleteTestimonial);

module.exports = router;
