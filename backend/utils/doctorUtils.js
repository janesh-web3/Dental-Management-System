const Doctor = require('../model/Doctor');
const Patient = require('../model/Patient');
const mongoose = require('mongoose');

/**
 * Updates the totalPatients count and list for all doctors or a specific doctor
 * @param {string} doctorId - Optional specific doctor ID to update
 * @returns {Promise<void>}
 */
const updateDoctorPatientCounts = async (doctorId = null) => {
  try {
    // If doctorId is provided, update only that doctor
    // Otherwise, update all doctors
    const doctorQuery = doctorId ? { _id: doctorId } : {};
    
    // Get all doctors that need to be updated
    const doctors = await Doctor.find(doctorQuery);
    
    for (const doctor of doctors) {
      // Find all patients who have been treated by this doctor
      const patients = await Patient.find({
        'medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.treatedByDoctor': doctor._id
      });
      
      // Extract unique patient IDs
      const uniquePatientIds = [...new Set(patients.map(patient => patient._id))];
      
      // Count total treatments performed by this doctor
      let totalTreatmentsCount = 0;
      
      for (const patient of patients) {
        if (patient.medicalDetails && patient.medicalDetails.length > 0) {
          for (const medicalDetail of patient.medicalDetails) {
            if (medicalDetail.treatmentPlanning && medicalDetail.treatmentPlanning.length > 0) {
              for (const treatment of medicalDetail.treatmentPlanning) {
                if (treatment.selectedTeethDetails && treatment.selectedTeethDetails.length > 0) {
                  for (const tooth of treatment.selectedTeethDetails) {
                    if (tooth.dailyTreatments && tooth.dailyTreatments.length > 0) {
                      // Count treatments performed by this doctor
                      const doctorTreatments = tooth.dailyTreatments.filter(
                        dt => dt.treatedByDoctor && dt.treatedByDoctor.toString() === doctor._id.toString() && dt.isCompleted
                      );
                      
                      totalTreatmentsCount += doctorTreatments.length;
                    }
                  }
                }
              }
            }
          }
        }
      }
      
      // Update the doctor's record with the new patient list and treatment count
      await Doctor.findByIdAndUpdate(
        doctor._id,
        {
          totalPatients: uniquePatientIds,
          totalPatientChecked: totalTreatmentsCount
        },
        { new: true }
      );
      
      console.log(`Updated doctor ${doctor._id}: ${uniquePatientIds.length} patients, ${totalTreatmentsCount} treatments`);
    }
    
    console.log('Doctor patient counts updated successfully');
  } catch (error) {
    console.error('Error updating doctor patient counts:', error);
  }
};

/**
 * Schedules regular updates of doctor patient counts
 * @param {number} intervalMinutes - How often to update (in minutes)
 */
const scheduleDoctorPatientCountUpdates = (intervalMinutes = 60) => {
  // Initial update when server starts
  updateDoctorPatientCounts();
  
  // Schedule regular updates
  setInterval(() => {
    console.log(`Running scheduled doctor patient count update (every ${intervalMinutes} minutes)`);
    updateDoctorPatientCounts();
  }, intervalMinutes * 60 * 1000);
  
  console.log(`Scheduled doctor patient count updates every ${intervalMinutes} minutes`);
};

module.exports = {
  updateDoctorPatientCounts,
  scheduleDoctorPatientCountUpdates
};
