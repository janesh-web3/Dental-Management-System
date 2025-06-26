const mongoose = require("mongoose");
const http = require('http');
const express = require("express");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const bodyParser = require("body-parser");
const cors = require("cors");
const { initSocket } = require('./socket');

// Import routes
const userRouter = require("./routes/userRoute.js");
const patientRouter = require("./routes/patientRoute.js");
const patientAuthRouter = require("./routes/patientAuthRoutes.js");
const publicPatientRouter = require("./routes/publicPatientRoute.js");
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
const notificationRouter = require("./routes/notificationRoutes.js");

// Import utilities
const { scheduleDoctorPatientCountUpdates } = require("./utils/doctorUtils.js");

// Import multer error handling middleware
const { handleMulterError } = require('./middleware/multer');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocket(server);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Add response logging middleware
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(body) {
    console.log(`Response ${res.statusCode} for ${req.method} ${req.url}`);
    return originalSend.call(this, body);
  };
  next();
});

// CORS configuration with more permissive settings
app.use(
  cors({
    origin: function(origin, callback) {
      // Allow any origin in development
      callback(null, true);
    },
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);

// Apply multer error handling middleware
app.use(handleMulterError);

mongoose
  .connect(process.env.DB_URL)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Basic health check endpoint
app.get("/", (req, res) => {
  res.json("Server is running!");
});

// Test endpoint that doesn't contain words that might be blocked
app.get("/api/health-check", (req, res) => {
  res.json({
    status: "ok",
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test auth endpoint that avoids words that might trigger ad blockers
app.post("/api/verify-credentials", (req, res) => {
  const { data } = req.body;
  res.json({
    received: true,
    status: "ok",
    data: data ? "Data received" : "No data"
  });
});

app.use("/api/user", userRouter);
app.use("/api/patient", patientRouter);
app.use("/api/patient", patientAuthRouter); // Patient authentication routes
app.use("/api/patients", publicPatientRouter); // Public patient routes (for QR code)
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
app.use("/api/notifications", notificationRouter);

const port = process.env.PORT || 8080;

server.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
  
  // Make io accessible in other files
  app.set('io', io);  
  // Schedule automatic updates of doctor patient counts
  // Update every 30 minutes by default
  scheduleDoctorPatientCountUpdates(30);
  console.log('Scheduled automatic doctor patient count updates');
});
