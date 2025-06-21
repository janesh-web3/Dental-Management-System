const addPatient = async (req, res) => {
  const io = req.app.get('io'); // Get Socket.IO instance
  try {
    // Validate required fields
    const { personalDetails } = req.body;
    
    // Create patient
    const patient = await Patient.create(req.body);
    
    // Prepare notification data (will be sent after response)
    const patientNotificationData = {
      patientId: patient._id,
      patientName: patient.personalDetails.name,
      contactNumber: patient.personalDetails.contactNumber || '',
      email: patient.personalDetails.emailAddress || ''
    };
    
    // Send HTTP response first
    res.status(201).json({
      success: true,
      data: patient,
    });
    
    // After sending response, handle notifications asynchronously
    // This prevents the ERR_HTTP_HEADERS_SENT error
    process.nextTick(() => {
      try {
        console.log('Sending notification for new patient:', patientNotificationData.patientName);
        
        // Use the socket instance to emit notifications
        if (io) {
          console.log('Socket IO instance found, sending direct notification');
          
          // Emit to the admin room
          io.to('admin').emit('notification', {
            title: 'New Patient Added',
            description: `${patientNotificationData.patientName} has been registered as a new patient`,
            type: 'success',
            isRead: false,
            createdAt: new Date().toISOString()
          });
          
          // Emit patient:added event for specific listeners
          io.emit('patient:added', {
            id: patientNotificationData.patientId,
            name: patientNotificationData.patientName,
            phone: patientNotificationData.contactNumber,
            email: patientNotificationData.email,
            timestamp: new Date()
          });
        }
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
      }
    });
  } catch (error) {
    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create patient",
      details: error.message,
    });
  }
};
