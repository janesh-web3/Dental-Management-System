const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter your name"],
        trim: true
    },
    email: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        required: [true, "Please enter your phone number"],
        trim: true
    },
    subject: {
        type: String,
        trim: true
    },
    service: {
        type: String,
        trim: true
    },
    message: {
        type: String,
        required: [true, "Please enter your message"],
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Contact', contactSchema);