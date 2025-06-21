const mongoose = require("mongoose");

const express = require("express");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const bodyParser = require("body-parser");
const cors = require("cors");

// Import routes
const userRouter = require("./routes/userRoute.js");
const patientRouter = require("./routes/patientRoute.js");
const patientAuthRouter = require("./routes/patientAuthRoutes.js");
const appointmentRouter = require("./routes/appointmentRoute.js");
const doctorRouter = require("./routes/doctorRoute.js");
const doctorAdminRouter = require("./routes/doctorAdminRoute.js");
const testimonialRouter = require("./routes/testimonials.js");
const contactRouter = require("./routes/contactRoute.js");
const prescriptionRouter = require("./routes/prescriptionRoutes.js");
const analyticsRouter = require("./routes/analyticsRoutes.js");
const smsRouter = require("./routes/smsRoutes.js");
const financeRouter = require("./routes/financeRoutes.js");
const servicePaymentRouter = require("./routes/servicePaymentRoutes.js");
const geminiRouter = require("./routes/geminiRoute.js");

// Import utilities
const { scheduleDoctorPatientCountUpdates } = require("./utils/doctorUtils.js");

// Import multer error handling middleware
const { handleMulterError } = require('./middleware/multer');

const app = express();  

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://dms.crownagi.com",
      "https://admin.om-shreenagar-dental-clinic.com",
      "https://om-shreenagar-dental-clinic.com"
    ],
  })
);

// Apply multer error handling middleware
app.use(handleMulterError);

mongoose
  .connect(process.env.DB_URL)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.get("/", (req, res) => {
  res.json("Server is running !");
});

app.use("/api/user", userRouter);
app.use("/api/patient", patientRouter);
app.use("/api/patient", patientAuthRouter); // Patient authentication routes
app.use("/api/appointment", appointmentRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/doctor-admin", doctorAdminRouter);
app.use("/api/testimonials", testimonialRouter);
app.use("/api/contact", contactRouter);
app.use("/api/prescription", prescriptionRouter);
app.use("/api/analytics", analyticsRouter); // Advanced analytics routes
app.use("/api/sms", smsRouter);
app.use("/api/finance", financeRouter); // Finance management routes
app.use("/api/service-payment", servicePaymentRouter); // Service payment routes
app.use("/api/gemini", geminiRouter);

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  
  // Schedule automatic updates of doctor patient counts
  // Update every 30 minutes by default
  scheduleDoctorPatientCountUpdates(30);
  console.log('Scheduled automatic doctor patient count updates');
});
