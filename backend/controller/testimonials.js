const cloudinary = require('../config/cloudinary');
const { deleteFile } = require("../middleware/multer.js");
const Testimonial = require('../model/testimonial.js');

const addTestimonial = async (req, res) => {
    try {

        let testimonialData = {};
        if(req.file){
            const cloudinaryResponse = await cloudinary.uploader.upload(req.file.path);
            if(cloudinaryResponse){
                testimonialData = req.body;
                testimonialData.image = cloudinaryResponse.url;
                deleteFile(req.file.path);
            }
        }else{
            res.status(400).json({message : "No image provided"});
        }

        const newTestimonial = new Testimonial(testimonialData);
        await newTestimonial.save();
        res.status(201).json(newTestimonial);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
}

const getAllTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.find().sort({ createdAt: -1 });
        res.json(testimonials);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
}

const updateTestimonial = async (req, res) => {
    try {
        const testimonial = await Testimonial.findById(req.params.id);
        if (!testimonial) {
          return res.status(404).json({ message: 'Testimonial not found' });
        }
    
        const updateData = {
          name: req.body.name,
          feedback: req.body.feedback,
          location: req.body.location,
        };
    
        if (req.file) {
          const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'testimonials',
          });
          updateData.image = result.secure_url;
        }
    
        const updatedTestimonial = await Testimonial.findByIdAndUpdate(
          req.params.id,
          updateData,
          { new: true }
        );
    
        res.json(updatedTestimonial);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
}

const deleteTestimonial = async (req, res) => {
    try {
        await Testimonial.findByIdAndDelete(req.params.id);
        res.json({ message: 'Testimonial deleted' });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
}

module.exports = {
    addTestimonial,
    getAllTestimonials,
    updateTestimonial,
    deleteTestimonial
}
