const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Add JWT authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      return next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected with ID:', socket.id);
    
    // Handle joining role-based rooms
    socket.on('joinRoleRoom', (role) => {
      if (['admin', 'superadmin', 'doctor', 'patient'].includes(role)) {
        // Join the role-specific room
        socket.join(role);
        console.log(`User joined ${role} room`);
      }
    });
    
    // Handle joining user-specific channel
    socket.on('joinUserChannel', ({ userId, userType }) => {
      if (userId) {
        const channel = `${userType}:${userId}`;
        socket.join(channel);
        console.log(`User joined personal channel: ${channel}`);
      }
    });
    
    // Handle send notification
    socket.on('send_notification', (notificationData) => {
      console.log('Sending notification:', notificationData);
      
      if (notificationData.targetRoles && notificationData.targetRoles.length > 0) {
        // Send to specific roles
        notificationData.targetRoles.forEach(role => {
          io.to(role).emit('notification', notificationData);
        });
      } else if (notificationData.receiver && notificationData.receiverModel) {
        // Send to specific user
        const channel = `${notificationData.receiverModel}:${notificationData.receiver}`;
        io.to(channel).emit('notification', notificationData);
      }
    });

    // New patient registered
    socket.on('patient:registered', (data) => {
      broadcastNotification('patient:added', data);
      notifyRoles(['admin', 'doctor'], 'New Patient Registered', 
        `Patient ${data.name} was registered`, 'success', {
          sourceType: 'Patient',
          sourceId: data.id
        });
    });

    // Appointment events
    socket.on('appointment:created', (data) => {
      broadcastNotification('appointment:added', data);
      
      // Notify doctor
      if (data.doctorId) {
        notifyUser(data.doctorId, 'Doctor', 'appointment:added', {
          title: 'New Appointment Scheduled',
          description: `Appointment scheduled for ${data.patientName} on ${new Date(data.date).toLocaleDateString()}`,
          type: 'info',
          sourceType: 'Appointment',
          sourceId: data.id
        });
      }
      
      // Notify patient
      if (data.patientId) {
        notifyUser(data.patientId, 'Patient', 'appointment:added', {
          title: 'Appointment Confirmed',
          description: `Your appointment with Dr. ${data.doctorName} on ${new Date(data.date).toLocaleDateString()} is confirmed`,
          type: 'success',
          sourceType: 'Appointment',
          sourceId: data.id
        });
      }
    });

    socket.on('appointment:cancelled', (data) => {
      broadcastNotification('appointment:cancelled', data);
      
      // Notify doctor
      if (data.doctorId) {
        notifyUser(data.doctorId, 'Doctor', 'appointment:cancelled', {
          title: 'Appointment Cancelled',
          description: `Appointment with ${data.patientName} on ${new Date(data.date).toLocaleDateString()} was cancelled`,
          type: 'warning',
          sourceType: 'Appointment',
          sourceId: data.id
        });
      }
      
      // Notify patient
      if (data.patientId) {
        notifyUser(data.patientId, 'Patient', 'appointment:cancelled', {
          title: 'Appointment Cancelled',
          description: `Your appointment with Dr. ${data.doctorName} on ${new Date(data.date).toLocaleDateString()} has been cancelled`,
          type: 'warning',
          sourceType: 'Appointment',
          sourceId: data.id
        });
      }
    });

    // Treatment events
    socket.on('treatment:updated', (data) => {
      if (data.patientId) {
        notifyUser(data.patientId, 'Patient', 'treatment:updated', {
          title: 'Treatment Plan Updated',
          description: `Your treatment plan has been updated by Dr. ${data.doctorName}`,
          type: 'info',
          sourceType: 'Treatment',
          sourceId: data.id
        });
      }
    });

    // Payment events
    socket.on('payment:received', (data) => {
      notifyRoles(['admin'], 'Payment Received', 
        `Payment of ${data.amount} received from ${data.patientName}`, 'success', {
          sourceType: 'Payment',
          sourceId: data.id
        });
        
      if (data.patientId) {
        notifyUser(data.patientId, 'Patient', 'payment:received', {
          title: 'Payment Confirmed',
          description: `Your payment of ${data.amount} has been received`,
          type: 'success',
          sourceType: 'Payment',
          sourceId: data.id
        });
      }
    });

    // X-ray events
    socket.on('xray:uploaded', (data) => {
      if (data.doctorId) {
        notifyUser(data.doctorId, 'Doctor', 'xray:uploaded', {
          title: 'New X-Ray Available',
          description: `X-Ray for patient ${data.patientName} has been uploaded`,
          type: 'info',
          sourceType: 'XRay',
          sourceId: data.id
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

// Helper function to emit events to both admin and superadmin
const notifyAdmins = (event, data) => {
  if (!io) return;
  
  // Emit to admin room (includes both admin and superadmin)
  io.to('admin').emit(event, data);
  io.to('superadmin').emit(event, data);
};

// Helper function to broadcast notifications by type
const broadcastNotification = (type, data) => {
  if (!io) return;
  
  // Emit to all connected clients under the specific event type
  io.emit(type, data);
  
  // Also emit as generic notification for listeners that subscribe to all notifications
  io.emit('notification', {
    ...data,
    notificationType: type
  });
};

// Helper function to notify specific roles
const notifyRoles = (roles, title, message, type = 'info', additionalData = {}) => {
  if (!io) return;
  
  const notificationData = {
    title,
    description: message,
    type,
    createdAt: new Date(),
    ...additionalData
  };
  
  roles.forEach(role => {
    io.to(role).emit('notification', notificationData);
  });
  
  // Save to database if needed
  const { createAndEmitNotification } = require('./controller/notificationCtrl');
  
  // For each role, we need to emit to all users of that role
  // This requires saving the notification in the database multiple times
  // We'll leave this to be handled by specific controllers
};

// Helper function to notify a specific user
const notifyUser = (userId, userType, event, data) => {
  if (!io) return;
  
  const channel = `${userType}:${userId}`;
  io.to(channel).emit(event, data);
  
  // Also send as a general notification
  io.to(channel).emit('notification', {
    ...data,
    notificationType: event
  });
  
  // Save to database if needed
  const { createNotification } = require('./controller/notificationCtrl');
  createNotification(userId, userType, {
    title: data.title,
    message: data.description || data.message,
    type: data.type || 'info',
    sourceId: data.sourceId,
    sourceType: data.sourceType,
    link: data.link
  });
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = {
  initSocket,
  getIO,
  notifyAdmins,
  broadcastNotification,
  notifyUser,
  notifyRoles
};
