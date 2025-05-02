const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name Is Required!"],
    minLength: [3, "Name Must Contain At Least 5 Characters!"],
  },
  email: {
    type: String,
    required: [true, "Email Is Required!"],
    validate: [validator.isEmail, "Provide A Valid Email!"],
  },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["admin", "dentist", "reception"],
    default : "admin",
    required: true,
  },
  contact: { type: String },
});

module.exports = mongoose.model("User", userSchema);
