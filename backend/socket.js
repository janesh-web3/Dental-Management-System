const socketIO = require("socket.io");
const jwt = require("jsonwebtoken");

let io;

const initSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: [
        // "http://localhost:5173",
        // "http://localhost:5174",
        // "https://order.crownagi.com",
        // "https://dms.crownagi.com",
        "https://admin.om-shreenagar-dental-clinic.com",
        "https://om-shreenagar-dental-clinic.com",
        // "https://muskan.crownagi.com",
      ],
      methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
      credentials: true,
    },
  });

  // Add JWT authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication token required"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      return next(new Error("Invalid authentication token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("New client connected with ID:", socket.id);

    // Handle joining role-based rooms
    socket.on("joinRoleRoom", (role) => {
      if (["admin", "superadmin", "doctor", "patient"].includes(role)) {
        // Join the role-specific room
        socket.join(role);
        console.log(`User joined ${role} room`);
      }
    });

    // Handle joining user-specific channel
    socket.on("joinUserChannel", ({ userId, userType }) => {
      if (userId) {
        const channel = `${userType}:${userId}`;
        socket.join(channel);
        console.log(`User joined personal channel: ${channel}`);
      }
    });

    // Handle send notification
    socket.on("send_notification", (notificationData) => {
      console.log("Sending notification:", notificationData);

      if (
        notificationData.targetRoles &&
        notificationData.targetRoles.length > 0
      ) {
        // Send to specific roles
        notificationData.targetRoles.forEach((role) => {
          io.to(role).emit("notification", notificationData);
        });
      } else if (notificationData.receiver && notificationData.receiverModel) {
        // Send to specific user
        const channel = `${notificationData.receiverModel}:${notificationData.receiver}`;
        io.to(channel).emit("notification", notificationData);
      }
    });

    // New patient registered - Just broadcast the event, notifications are handled in the controller
    socket.on("patient:registered", (data) => {
      console.log("Patient registered event received:", data);
      broadcastNotification("patient:added", data);

      // No need to create notifications here as they are already handled in the patient controller
      console.log(
        "Patient registered event received, notifications handled by controller"
      );

      // Play notification sound for admins and doctors
      if (data.soundEnabled !== false) {
        io.to("admin").emit("notification:sound", { type: "success" });
        io.to("doctor").emit("notification:sound", { type: "info" });
      }
    });

    // Direct handler for patient:added event
    socket.on("patient:added", (data) => {
      broadcastNotification("patient:added", data);
    });

    // Direct handler for patient:deleted event
    socket.on("patient:deleted", (data) => {
      console.log("Patient deleted event received:", data);
      broadcastNotification("patient:deleted", data);

      // Play notification sound for admins
      if (data.soundEnabled !== false) {
        io.to("admin").emit("notification:sound", { type: "warning" });

        // If the patient had an assigned doctor, notify them too
        if (data.assignedDoctor) {
          io.to("doctor").emit("notification:sound", { type: "warning" });
        }
      }
    });

    // Appointment events
    socket.on("appointment:created", (data) => {
      console.log("Appointment created event received:", data);
      broadcastNotification("appointment:added", data);

      // Play notification sound for admins and doctors
      if (data.soundEnabled !== false) {
        io.to("admin").emit("notification:sound", { type: "info" });

        // If a doctor is assigned, play notification sound for them too
        if (data.doctorId) {
          io.to(`Doctor:${data.doctorId}`).emit("notification:sound", {
            type: "info",
          });
        }
      }

      // Notify doctor (notification object is created in the controller)
      if (data.doctorId) {
        notifyUser(data.doctorId, "Doctor", "appointment:added", {
          title: "New Appointment Scheduled",
          description: `Appointment scheduled for ${data.firstName} ${data.lastName} on ${data.appointmentDate}`,
          type: "info",
          sourceType: "Appointment",
          sourceId: data.id,
        });
      }
    });

    socket.on("appointment:cancelled", (data) => {
      broadcastNotification("appointment:cancelled", data);

      // Notify doctor
      if (data.doctorId) {
        notifyUser(data.doctorId, "Doctor", "appointment:cancelled", {
          title: "Appointment Cancelled",
          description: `Appointment with ${data.patientName} on ${new Date(
            data.date
          ).toLocaleDateString()} was cancelled`,
          type: "warning",
          sourceType: "Appointment",
          sourceId: data.id,
        });
      }

      // Notify patient
      if (data.patientId) {
        notifyUser(data.patientId, "Patient", "appointment:cancelled", {
          title: "Appointment Cancelled",
          description: `Your appointment with Dr. ${
            data.doctorName
          } on ${new Date(data.date).toLocaleDateString()} has been cancelled`,
          type: "warning",
          sourceType: "Appointment",
          sourceId: data.id,
        });
      }
    });

    // Treatment events
    socket.on("treatment:updated", (data) => {
      if (data.patientId) {
        notifyUser(data.patientId, "Patient", "treatment:updated", {
          title: "Treatment Plan Updated",
          description: `Your treatment plan has been updated by Dr. ${data.doctorName}`,
          type: "info",
          sourceType: "Treatment",
          sourceId: data.id,
        });
      }
    });

    // Payment events
    socket.on("payment:received", (data) => {
      notifyRoles(
        ["admin"],
        "Payment Received",
        `Payment of ${data.amount} received from ${data.patientName}`,
        "success",
        {
          sourceType: "Payment",
          sourceId: data.id,
        }
      );

      if (data.patientId) {
        notifyUser(data.patientId, "Patient", "payment:received", {
          title: "Payment Confirmed",
          description: `Your payment of ${data.amount} has been received`,
          type: "success",
          sourceType: "Payment",
          sourceId: data.id,
        });
      }
    });

    // X-ray events
    socket.on("xray:uploaded", (data) => {
      if (data.doctorId) {
        notifyUser(data.doctorId, "Doctor", "xray:uploaded", {
          title: "New X-Ray Available",
          description: `X-Ray for patient ${data.patientName} has been uploaded`,
          type: "info",
          sourceType: "XRay",
          sourceId: data.id,
        });
      }
    });

    // Finance events
    socket.on("income:added", (data) => {
      console.log("Income added event received:", data);

      // Play notification sound for admins
      if (data.soundEnabled !== false) {
        io.to("admin").emit("notification:sound", { type: "success" });
      }
    });

    socket.on("expense:added", (data) => {
      console.log("Expense added event received:", data);

      // Play notification sound for admins
      if (data.soundEnabled !== false) {
        io.to("admin").emit("notification:sound", { type: "info" });
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

// Helper function to emit events to both admin and superadmin
const notifyAdmins = (event, data) => {
  if (!io) return;

  // Emit to admin room (includes both admin and superadmin)
  io.to("admin").emit(event, data);
  io.to("superadmin").emit(event, data);
};

// Helper function to broadcast notifications by type
const broadcastNotification = (type, data) => {
  if (!io) {
    console.error("IO instance not available for broadcast:", type);
    return;
  }

  // Emit to all connected clients under the specific event type
  io.emit(type, data);

  // Also emit as generic notification for listeners that subscribe to all notifications
  io.emit("notification", {
    ...data,
    notificationType: type,
  });
};

// Helper function to notify specific roles
const notifyRoles = (
  roles,
  title,
  message,
  type = "info",
  additionalData = {}
) => {
  if (!io) return;

  try {
    // Validate inputs
    if (!roles || !Array.isArray(roles) || !title || !message) {
      console.error("Invalid parameters for notifyRoles:", {
        roles,
        title,
        message,
        type,
      });
      return;
    }

    const notificationData = {
      title,
      description: message,
      type,
      createdAt: new Date().toISOString(),
      isRead: false,
      ...additionalData,
    };

    // Emit to each role
    roles.forEach((role) => {
      io.to(role).emit("notification", notificationData);
    });

    // Save to database for each role's users
    const {
      createAndEmitNotification,
    } = require("./controller/notificationCtrl");
    const User = require("./model/User");
    const Doctor = require("./model/Doctor");

    // Process each role
    roles.forEach((role) => {
      if (role === "admin" || role === "superadmin") {
        // Find all admin users
        User.find({ role: { $in: ["admin", "superadmin"] } })
          .select("_id")
          .then((admins) => {
            admins.forEach((admin) => {
              createAndEmitNotification({
                userId: admin._id,
                userType: "User",
                title,
                message,
                type,
                ...additionalData,
                targetRoles: [role],
              }).catch((err) =>
                console.error(
                  `Error creating notification for admin ${admin._id}:`,
                  err
                )
              );
            });
          })
          .catch((err) =>
            console.error("Error finding admins for role notifications:", err)
          );
      } else if (role === "doctor") {
        // Find all doctors
        Doctor.find({})
          .select("_id")
          .then((doctors) => {
            doctors.forEach((doctor) => {
              createAndEmitNotification({
                userId: doctor._id,
                userType: "Doctor",
                title,
                message,
                type,
                ...additionalData,
                targetRoles: [role],
              }).catch((err) =>
                console.error(
                  `Error creating notification for doctor ${doctor._id}:`,
                  err
                )
              );
            });
          })
          .catch((err) =>
            console.error("Error finding doctors for role notifications:", err)
          );
      } else if (role === "patient") {
        // For patient role notifications, we typically need specific patient IDs
        // This would be handled by direct patient notifications in most cases
        console.log("Sending notification to all patients is not implemented.");
      }
    });

    // Play notification sound based on type
    if (additionalData.soundEnabled !== false) {
      roles.forEach((role) => {
        io.to(role).emit("notification:sound", { type });
      });
    }
  } catch (error) {
    console.error("Error in notifyRoles:", error);
  }
};

// Helper function to notify a specific user
const notifyUser = (userId, userType, event, data) => {
  if (!io) return;

  try {
    // Validate inputs
    if (!userId || !userType || !event || !data) {
      console.error("Invalid parameters for notifyUser:", {
        userId,
        userType,
        event,
        data,
      });
      return;
    }

    const channel = `${userType}:${userId}`;
    io.to(channel).emit(event, data);

    // Also send as a general notification
    io.to(channel).emit("notification", {
      ...data,
      notificationType: event,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    // Save to database
    const { createNotification } = require("./controller/notificationCtrl");
    createNotification(userId, userType, {
      title: data.title,
      message: data.description || data.message,
      type: data.type || "info",
      sourceId: data.sourceId,
      sourceType: data.sourceType,
      link: data.link,
      read: false,
      soundEnabled: data.soundEnabled !== false,
    })
      .then((notification) => {
        if (notification) {
          console.log(
            `Notification saved to database for ${userType} ${userId}`
          );
        }
      })
      .catch((err) => {
        console.error(
          `Error saving notification to database for ${userType} ${userId}:`,
          err
        );
      });
  } catch (error) {
    console.error("Error in notifyUser:", error);
  }
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = {
  initSocket,
  getIO,
  notifyAdmins,
  broadcastNotification,
  notifyUser,
  notifyRoles,
};
