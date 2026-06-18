const mongoose = require("mongoose");
const http = require("http");
const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const dns = require("dns");

// Force Google DNS to resolve MongoDB Atlas SRV records
// (required when local/ISP DNS does not support SRV lookups)
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require('dotenv').config();
const bodyParser = require("body-parser");
const cors = require("cors");
const { initSocket } = require("./socket"); 

// Import routes
const userRouter = require("./routes/userRoute.js");
const patientRouter = require("./routes/patientRoute.js");
const patientAuthRouter = require("./routes/patientAuthRoutes.js");
const publicPatientRouter = require("./routes/publicPatientRoute.js");
const appointmentRouter = require("./routes/appointmentRoute.js");
const doctorRouter = require("./routes/doctorRoute.js");
const doctorAdminRouter = require("./routes/doctorAdminRoute.js");

const contactRouter = require("./routes/contactRoute.js");
const prescriptionRouter = require("./routes/prescriptionRoutes.js");
const analyticsRouter = require("./routes/analyticsRoutes.js");
const smsRouter = require("./routes/smsRoutes.js");
const smsDeliveryRouter = require("./routes/smsDeliveryRoutes.js");
const financeRouter = require("./routes/financeRoutes.js");
const servicePaymentRouter = require("./routes/servicePaymentRoutes.js");
const geminiRouter = require("./routes/geminiRoute.js");
const notificationRouter = require("./routes/notificationRoutes.js");
const invoiceRouter = require("./routes/invoiceRoutes.js");
const recycleBinRouter = require("./routes/recycleBinRoutes.js");
const userPreferencesRouter = require("./routes/userPreferencesRoutes.js");
const followUpRouter = require("./routes/followUpRoutes.js");
const popupRouter = require("./routes/popupRoutes.js");
const paymentReminderRouter = require("./routes/paymentReminderRoutes.js");
const patientGroupRouter = require("./routes/patientGroupRoutes.js");
const smsDashboardRouter = require("./routes/smsDashboardRoutes.js");
const smsScheduleRouter = require("./routes/smsScheduleRoutes.js");

// Import utilities
const { scheduleDoctorPatientCountUpdates } = require("./utils/doctorUtils.js");
const { initializePaymentReminderService } = require("./controller/paymentReminderController.js");
const { createIndexes } = require("./config/database-indexes.js");

// Import multer error handling middleware
const { handleMulterError } = require("./middleware/multer");

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocket(server);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      // "https://dms.crownagi.com",
      // "https://order.crownagi.com",
      // "https://admin.om-shreenagar-dental-clinic.com",
      // "https://om-shreenagar-dental-clinic.com",
      "https://muskan.crownagi.com",
    ],
  })
);

// Apply multer error handling middleware
app.use(handleMulterError);

app.get("/", (req, res) => {
  res.json("Server is running !");
});

app.use("/api/user", userRouter);
app.use("/api/patient", patientRouter);
app.use("/api/patient", patientAuthRouter); // Patient authentication routes
app.use("/api/patients", publicPatientRouter); // Public patient routes (for QR code)
app.use("/api/appointment", appointmentRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/doctor-admin", doctorAdminRouter);

app.use("/api/contact", contactRouter);
app.use("/api/prescription", prescriptionRouter);
app.use("/api/analytics", analyticsRouter); // Advanced analytics routes
app.use("/api/sms", smsRouter);
app.use("/api/sms-delivery", smsDeliveryRouter);
app.use("/api/finance", financeRouter); // Finance management routes
app.use("/api/service-payment", servicePaymentRouter); // Service payment routes
app.use("/api/gemini", geminiRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/invoices", invoiceRouter);
app.use("/api/recycle-bin", recycleBinRouter);
app.use("/api/user-preferences", userPreferencesRouter);
app.use("/api/follow-ups", followUpRouter);
app.use("/api/popups", popupRouter);
app.use("/api/payment-reminders", paymentReminderRouter);
app.use("/api/patient-groups", patientGroupRouter);
app.use("/api/sms-dashboard", smsDashboardRouter);
app.use("/api/sms-schedule", smsScheduleRouter);

const port = process.env.PORT || 5000;

// Connect to MongoDB and start server only after connection is successful
mongoose
  .connect(process.env.DB_URL, {
    serverSelectionTimeoutMS: 30000,
    family: 4, // Force IPv4
  })
  .then(async () => {
    console.log("MongoDB connected successfully");
    
    // Create database indexes for performance optimization
    try {
      await createIndexes();
      console.log("✅ Database indexes initialized successfully");
    } catch (error) {
      console.error("❌ Error creating database indexes:", error);
      // Don't fail startup if index creation fails
    }

    // Start server only after MongoDB connection is established
    server.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);

      // Make io accessible in other files
      app.set("io", io);
      // Schedule automatic updates of doctor patient counts
      // Update every 30 minutes by default
      scheduleDoctorPatientCountUpdates(30);
      console.log("Scheduled automatic doctor patient count updates");

      // Initialize payment reminder service
      initializePaymentReminderService();
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    console.error("Server not started due to database connection failure");
    process.exit(1);
  });