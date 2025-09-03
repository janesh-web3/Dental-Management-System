const Patient = require("../model/Patient");

// Add a new follow-up to a patient's treatment plan
const addFollowUp = async (req, res) => {
  try {
    const { id } = req.params; // patient ID
    const { 
      treatmentPlanId, 
      date, 
      reason, 
      type, 
      linkedTo, 
      entityId,
      notes 
    } = req.body;

    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ 
        success: false, 
        message: "Patient not found" 
      });
    }

    // Find the treatment plan
    const medicalRecord = patient.medicalDetails[0];
    if (!medicalRecord) {
      return res.status(404).json({ 
        success: false, 
        message: "No medical records found" 
      });
    }

    const treatmentPlan = medicalRecord.treatmentPlanning.find(
      (plan) => plan._id.toString() === treatmentPlanId
    );

    if (!treatmentPlan) {
      return res.status(404).json({ 
        success: false, 
        message: "Treatment plan not found" 
      });
    }

    // Create new follow-up
    const newFollowUp = {
      date: new Date(date),
      reason: reason || "",
      type: type || "Routine Check",
      linkedTo: {
        type: linkedTo || "treatment",
        entityId: entityId || treatmentPlanId
      },
      notes: notes || "",
      createdBy: req.user?.id, // Assuming user is available in req
      createdAt: new Date()
    };

    // Add to follow-ups array
    treatmentPlan.followUps.push(newFollowUp);

    await patient.save();

    res.status(201).json({
      success: true,
      message: "Follow-up added successfully",
      data: newFollowUp
    });
  } catch (error) {
    console.error("Error adding follow-up:", error);
    res.status(500).json({
      success: false,
      message: "Error adding follow-up",
      error: error.message
    });
  }
};

// Get all follow-ups for a patient
const getPatientFollowUps = async (req, res) => {
  try {
    const { id } = req.params; // patient ID
    const { type, upcoming, completed } = req.query;

    const patient = await Patient.findById(id).populate('medicalDetails.treatmentPlanning.followUps.createdBy', 'name');
    if (!patient) {
      return res.status(404).json({ 
        success: false, 
        message: "Patient not found" 
      });
    }

    // Collect all follow-ups from all treatment plans
    const allFollowUps = [];
    patient.medicalDetails.forEach((record) => {
      record.treatmentPlanning.forEach((plan, planIndex) => {
        if (plan.followUps && plan.followUps.length > 0) {
          plan.followUps.forEach((followUp) => {
            allFollowUps.push({
              ...followUp.toObject(),
              treatmentPlanId: plan._id,
              treatmentPlanIndex: planIndex,
              patientId: id,
              patientName: patient.personalDetails.name
            });
          });
        }
      });
    });

    // Filter follow-ups based on query parameters
    let filteredFollowUps = allFollowUps;

    if (type) {
      filteredFollowUps = filteredFollowUps.filter(
        (followUp) => followUp.linkedTo.type === type
      );
    }

    if (upcoming === 'true') {
      filteredFollowUps = filteredFollowUps.filter(
        (followUp) => new Date(followUp.date) > new Date() && !followUp.completed
      );
    }

    if (completed === 'true') {
      filteredFollowUps = filteredFollowUps.filter(
        (followUp) => followUp.completed === true
      );
    }

    // Sort by date (ascending)
    filteredFollowUps.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json({
      success: true,
      data: filteredFollowUps,
      count: filteredFollowUps.length
    });
  } catch (error) {
    console.error("Error getting follow-ups:", error);
    res.status(500).json({
      success: false,
      message: "Error getting follow-ups",
      error: error.message
    });
  }
};

// Get follow-ups by type
const getFollowUpsByType = async (req, res) => {
  try {
    const { id } = req.params; // patient ID
    const { type } = req.params; // linked type

    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ 
        success: false, 
        message: "Patient not found" 
      });
    }

    const followUps = [];
    patient.medicalDetails.forEach((record) => {
      record.treatmentPlanning.forEach((plan) => {
        if (plan.followUps && plan.followUps.length > 0) {
          const filteredFollowUps = plan.followUps.filter(
            (followUp) => followUp.linkedTo.type === type
          );
          followUps.push(...filteredFollowUps);
        }
      });
    });

    res.status(200).json({
      success: true,
      data: followUps,
      count: followUps.length
    });
  } catch (error) {
    console.error("Error getting follow-ups by type:", error);
    res.status(500).json({
      success: false,
      message: "Error getting follow-ups by type",
      error: error.message
    });
  }
};

// Update a follow-up
const updateFollowUp = async (req, res) => {
  try {
    const { id, fid } = req.params; // patient ID and follow-up ID
    const updates = req.body;

    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ 
        success: false, 
        message: "Patient not found" 
      });
    }

    let followUpFound = false;
    patient.medicalDetails.forEach((record) => {
      record.treatmentPlanning.forEach((plan) => {
        if (plan.followUps && plan.followUps.length > 0) {
          const followUpIndex = plan.followUps.findIndex(
            (followUp) => followUp._id.toString() === fid
          );
          if (followUpIndex !== -1) {
            // Update the follow-up
            Object.assign(plan.followUps[followUpIndex], updates);
            if (updates.completed && !plan.followUps[followUpIndex].completedDate) {
              plan.followUps[followUpIndex].completedDate = new Date();
            }
            followUpFound = true;
          }
        }
      });
    });

    if (!followUpFound) {
      return res.status(404).json({ 
        success: false, 
        message: "Follow-up not found" 
      });
    }

    await patient.save();

    res.status(200).json({
      success: true,
      message: "Follow-up updated successfully"
    });
  } catch (error) {
    console.error("Error updating follow-up:", error);
    res.status(500).json({
      success: false,
      message: "Error updating follow-up",
      error: error.message
    });
  }
};

// Delete a follow-up
const deleteFollowUp = async (req, res) => {
  try {
    const { id, fid } = req.params; // patient ID and follow-up ID

    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ 
        success: false, 
        message: "Patient not found" 
      });
    }

    let followUpFound = false;
    patient.medicalDetails.forEach((record) => {
      record.treatmentPlanning.forEach((plan) => {
        if (plan.followUps && plan.followUps.length > 0) {
          const followUpIndex = plan.followUps.findIndex(
            (followUp) => followUp._id.toString() === fid
          );
          if (followUpIndex !== -1) {
            plan.followUps.splice(followUpIndex, 1);
            followUpFound = true;
          }
        }
      });
    });

    if (!followUpFound) {
      return res.status(404).json({ 
        success: false, 
        message: "Follow-up not found" 
      });
    }

    await patient.save();

    res.status(200).json({
      success: true,
      message: "Follow-up deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting follow-up:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting follow-up",
      error: error.message
    });
  }
};

// Get upcoming follow-ups for all patients (for dashboard/calendar view)
const getUpcomingFollowUps = async (req, res) => {
  try {
    const { days = 30, completed = false } = req.query;
    const fromDate = new Date();
    const toDate = new Date();
    toDate.setDate(toDate.getDate() + parseInt(days));

    const patients = await Patient.find({
      isDeleted: { $ne: true }
    }).select('personalDetails medicalDetails');

    const upcomingFollowUps = [];

    patients.forEach((patient) => {
      patient.medicalDetails.forEach((record) => {
        record.treatmentPlanning.forEach((plan, planIndex) => {
          if (plan.followUps && plan.followUps.length > 0) {
            plan.followUps.forEach((followUp) => {
              const followUpDate = new Date(followUp.date);
              const isUpcoming = followUpDate >= fromDate && followUpDate <= toDate;
              const matchesCompletedFilter = completed === 'true' ? followUp.completed : !followUp.completed;
              
              if (isUpcoming && matchesCompletedFilter) {
                upcomingFollowUps.push({
                  ...followUp.toObject(),
                  treatmentPlanId: plan._id,
                  treatmentPlanIndex: planIndex,
                  patientId: patient._id,
                  patientName: patient.personalDetails.name,
                  patientContact: patient.personalDetails.contactNumber,
                  patientAge: patient.personalDetails.age,
                  patientGender: patient.personalDetails.gender
                });
              }
            });
          }
        });
      });
    });

    // Sort by date
    upcomingFollowUps.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json({
      success: true,
      data: upcomingFollowUps,
      count: upcomingFollowUps.length
    });
  } catch (error) {
    console.error("Error getting upcoming follow-ups:", error);
    res.status(500).json({
      success: false,
      message: "Error getting upcoming follow-ups",
      error: error.message
    });
  }
};

module.exports = {
  addFollowUp,
  getPatientFollowUps,
  getFollowUpsByType,
  updateFollowUp,
  deleteFollowUp,
  getUpcomingFollowUps
};