const express = require("express");
const router = express.Router();
const { upload, deleteFile } = require("../middleware/multer");
const { protectAdminRoute } = require("../middleware/adminAuthMiddleware");
const { 
  authenticateUser, 
  authorizePermission, 
  staffOrAdmin 
} = require("../middleware/rbacMiddleware");
const {
  addPatient,
  deletePatient,
  getPatient,
  updatePatient,
  getSinglePatient,
  getPaginatedPatient,
  uploadPatientFiles,
  updateTreatmentStatus,
  getRecentTransactions,
  getNextSerialNumber,
  getFinancialInsights,
  getDashboardMetrics,
  getPatientDemographics,
  getFilteredPatients,
  getProcedureTypes,
  getTreatmentPlans,
  addTreatmentPlan,
  updateTreatmentPlan,
  getSimplifiedDashboardMetrics,
  searchPatients,
  getPatientsCount,
} = require("../controller/patientCtrl.js");
const cloudinary = require("../config/cloudinary");
const Patient = require("../model/Patient");
const Invoice = require("../model/Invoice");
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

// Helper function to create invoice via centralized system
const createTreatmentInvoice = async (patientId, treatmentId, paidAmount, paymentMethod) => {
  try {
    // Normalize payment method to match enum values
    const normalizePaymentMethod = (method) => {
      if (!method) return "cash";
      const methodLower = method.toLowerCase();
      
      // Handle specific payment methods
      if (methodLower.includes("khalti") || methodLower.includes("esewa") || methodLower.includes("e-sewa") || methodLower.includes("upi")) return "upi";
      if (methodLower.includes("bank") || methodLower.includes("transfer")) return "bank";
      if (methodLower.includes("card") || methodLower.includes("credit") || methodLower.includes("debit")) return "card";
      if (methodLower.includes("cash")) return "cash";
      
      // Default fallback
      return "cash";
    };

    const invoice = new Invoice({
      paidAmount,
      paymentMethod: normalizePaymentMethod(paymentMethod),
      sourceType: "Patients",
      sourceId: treatmentId,
      patientId,
      date: new Date()
    });

    await invoice.save();
    return invoice;
  } catch (error) {
    console.error("Error creating treatment invoice:", error);
    return null;
  }
};

// Patient management routes with RBAC
router.post("/add-patient", authenticateUser, authorizePermission('patients', 'create'), addPatient);
router.put("/update-patient/:id", authenticateUser, authorizePermission('patients', 'update'), updatePatient);
router.delete("/delete-patient/:id", authenticateUser, authorizePermission('patients', 'delete'), deletePatient);
router.get("/get-patient", authenticateUser, authorizePermission('patients', 'read'), getPatient);
router.post("/search", authenticateUser, authorizePermission('patients', 'read'), searchPatients);
router.post("/count", authenticateUser, authorizePermission('patients', 'read'), getPatientsCount);
router.get("/get-pagination-patient", authenticateUser, authorizePermission('patients', 'read'), getPaginatedPatient);
router.get("/get-filtered-patients", authenticateUser, authorizePermission('patients', 'read'), getFilteredPatients);
router.post("/get-filtered-patients", authenticateUser, authorizePermission('patients', 'read'), getFilteredPatients);
router.get("/get-procedure-types", authenticateUser, authorizePermission('patients', 'read'), getProcedureTypes);
router.get("/get-patient/:id", authenticateUser, authorizePermission('patients', 'read'), getSinglePatient);
router.post(
  "/upload-files/:id",
  authenticateUser,
  authorizePermission('patients', 'update'),
  upload.array("files", 10), // Allow up to 10 files
  uploadPatientFiles
);
router.patch(
  "/treatment-status/:patientId/:medicalDetailId/:treatmentId",
  updateTreatmentStatus
);

router.post(
  "/treatment-files/:patientId/:medicalDetailId/:treatmentId",
  upload.array("files", 10),
  async (req, res) => {
    try {
      const { patientId, medicalDetailId, treatmentId } = req.params;
      const files = req.files;
      
      // Fix: Handle descriptions properly when submitted from FormData
      let descriptions = req.body.descriptions;
      if (!Array.isArray(descriptions) && descriptions) {
        descriptions = [descriptions];
      } else if (!descriptions) {
        descriptions = [];
      }

      const uploadDates = req.body.uploadDates || [];

      // Validate files
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
      }

      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      // Upload files to cloudinary and get results
      const uploadPromises = files.map(async (file, index) => {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "treatment-files",
          resource_type: "auto",
        });

        // Clean up local file
        deleteFile(file.path);

        return {
          fileName: file.originalname,
          fileUrl: result.secure_url,
          description: descriptions[index] || "",
          uploadDate: new Date().toISOString(),
          publicId: result.public_id,
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      // Add the files to the treatment documents array
      const updatedPatient = await Patient.findOneAndUpdate(
        {
          _id: patientId,
          "medicalDetails._id": medicalDetailId,
          "medicalDetails.treatmentPlanning._id": treatmentId,
        },
        {
          $push: {
            "medicalDetails.$[med].treatmentPlanning.$[treat].treatmentDocuments": {
              $each: uploadedFiles,
            },
          },
        },
        {
          arrayFilters: [
            { "med._id": medicalDetailId },
            { "treat._id": treatmentId },
          ],
          new: true,
        }
      );

      if (!updatedPatient) {
        console.error("Update failed, could not find matching patient or treatment");
        return res.status(404).json({
          success: false,
          message: "Patient or treatment not found",
          detail: "Could not find a match for the provided IDs"
        });
      }

      // Log the update result to help debug
      console.log("Updated patient:", updatedPatient._id, "Treatment:", treatmentId);

      res.status(200).json({
        success: true,
        data: updatedPatient,
        message: "Files uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload files",
        details: error.message,
      });
    }
  }
);

router.patch(
  "/tooth-status/:patientId/:medicalDetailId/:treatmentId/:toothNumber/:dailyTreatmentId",
  async (req, res) => {
    try {
      const { patientId, medicalDetailId, treatmentId, toothNumber, dailyTreatmentId } = req.params;
      const { isCompleted } = req.body;
      
      // First update the daily treatment status
      const updatedPatient = await Patient.findOneAndUpdate(
        {
          _id: patientId,
          "medicalDetails._id": medicalDetailId,
          "medicalDetails.treatmentPlanning._id": treatmentId,
          "medicalDetails.treatmentPlanning.selectedTeethDetails.number": toothNumber,
          "medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments._id": dailyTreatmentId
        },
        {
          $set: {
            "medicalDetails.$[med].treatmentPlanning.$[treat].selectedTeethDetails.$[tooth].dailyTreatments.$[daily].isCompleted": isCompleted
          }
        },
        {
          arrayFilters: [
            { "med._id": medicalDetailId },
            { "treat._id": treatmentId },
            { "tooth.number": toothNumber },
            { "daily._id": dailyTreatmentId }
          ],
          new: true
        }
      );

      if (!updatedPatient) {
        return res.status(404).json({
          success: false,
          message: "Could not find the specified treatment to update"
        });
      }
      
      // IMPORTANT: Check if all daily treatments for this tooth are completed
      const treatment = updatedPatient.medicalDetails.find(
        med => med._id.toString() === medicalDetailId
      )?.treatmentPlanning.find(
        plan => plan._id.toString() === treatmentId
      );
      
      if (treatment) {
        // Check if all teeth have all their treatments completed
        const allTeethTreatmentsCompleted = treatment.selectedTeethDetails.every(tooth => {
          // Check if the tooth has daily treatments and all of them are completed
          return tooth.dailyTreatments.length > 0 && 
                 tooth.dailyTreatments.every(dt => dt.isCompleted);
        });
        
        // If all treatments are complete, update the parent treatment plan status
        if (allTeethTreatmentsCompleted && !treatment.isCompleted) {
          await Patient.findOneAndUpdate(
            {
              _id: patientId,
              "medicalDetails._id": medicalDetailId,
              "medicalDetails.treatmentPlanning._id": treatmentId
            },
            {
              $set: {
                "medicalDetails.$[med].treatmentPlanning.$[treat].isCompleted": true,
                "medicalDetails.$[med].treatmentPlanning.$[treat].completionDate": new Date()
              }
            },
            {
              arrayFilters: [
                { "med._id": medicalDetailId },
                { "treat._id": treatmentId }
              ]
            }
          );
        }
      }
      
      // CHANGE THIS PART: Return updated patient WITHOUT populate
      // Just fetch the updated patient directly instead of trying to populate
      const finalPatient = await Patient.findById(patientId);
        
      res.status(200).json({
        success: true,
        data: finalPatient,
        message: `Treatment ${isCompleted ? 'completed' : 'marked as pending'} successfully`
      });
    } catch (error) {
      console.error("Error updating treatment status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update treatment status",
        error: error.message
      });
    }
  }
);

router.get("/recent-transactions", getRecentTransactions);

// Add this route
router.get("/next-serial-number", getNextSerialNumber);

// Add this new route
router.patch(
  "/update-payment/:patientId/:medicalDetailId/:treatmentId/:toothNumber/:dailyTreatmentId",
  async (req, res) => {
    try {
      const { patientId, medicalDetailId, treatmentId, toothNumber, dailyTreatmentId } = req.params;
      let { paidAmount, paymentDate, paymentMethod } = req.body;

      // Ensure paidAmount is a proper number with 2 decimal places for precision
      paidAmount = parseFloat(paidAmount);
      if (paidAmount === undefined || isNaN(paidAmount) || paidAmount < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment amount"
        });
      }
      
      // Round to 2 decimal places to avoid floating point precision issues
      paidAmount = Math.round(paidAmount * 100) / 100;

      // Get the original paid amount BEFORE any updates for correct invoice calculation
      let originalPaidAmount = 0;
      try {
        const originalPatient = await Patient.findById(patientId);
        const originalMedicalDetail = originalPatient.medicalDetails.find(md => md._id.toString() === medicalDetailId);
        const originalTreatment = originalMedicalDetail.treatmentPlanning.find(t => t._id.toString() === treatmentId);
        const originalTooth = originalTreatment.selectedTeethDetails.find(t => t.number === toothNumber);
        const originalDailyTreatment = originalTooth.dailyTreatments.find(d => d._id.toString() === dailyTreatmentId);
        originalPaidAmount = parseFloat(originalDailyTreatment.paidAmount) || 0;
        console.log(`Payment update - Original: ${originalPaidAmount}, New: ${paidAmount}, Additional: ${paidAmount - originalPaidAmount}`);
      } catch (err) {
        console.error("Error getting original paid amount:", err);
        originalPaidAmount = 0;
      }

      // First, get the patient document with only one positional operator
      const patient = await Patient.findOne(
        { 
          _id: patientId,
          "medicalDetails._id": medicalDetailId 
        },
        { "medicalDetails.$": 1 } // Only one positional operator is allowed
      );

      if (!patient || !patient.medicalDetails[0]) {
        return res.status(404).json({
          success: false,
          message: "Patient or treatment not found"
        });
      }

      // Find the treatment amount manually in JavaScript
      let treatmentAmount = 0;
      try {
        const medicalDetail = patient.medicalDetails[0];
        const treatment = medicalDetail.treatmentPlanning.find(t => 
          t._id.toString() === treatmentId
        );
        if (!treatment) throw new Error("Treatment not found");
        
        const tooth = treatment.selectedTeethDetails.find(t => 
          t.number === toothNumber
        );
        if (!tooth) throw new Error("Tooth not found");
        
        const dailyTreatment = tooth.dailyTreatments.find(d => 
          d._id.toString() === dailyTreatmentId
        );
        if (!dailyTreatment) throw new Error("Daily treatment not found");
        
        treatmentAmount = parseFloat(dailyTreatment.treatmentAmount);
      } catch (err) {
        console.error("Error finding treatment amount:", err);
        return res.status(404).json({
          success: false,
          message: "Treatment details could not be found: " + err.message
        });
      }

      // Calculate remaining amount
      const remainingAmount = Math.round((treatmentAmount - paidAmount) * 100) / 100;

      // Prepare update fields
      const updateFields = {
        "medicalDetails.$[med].treatmentPlanning.$[treat].selectedTeethDetails.$[tooth].dailyTreatments.$[daily].paidAmount": paidAmount,
        "medicalDetails.$[med].treatmentPlanning.$[treat].selectedTeethDetails.$[tooth].dailyTreatments.$[daily].remainingAmount": remainingAmount,
      };
      
      // Add payment method if provided
      if (paymentMethod) {
        updateFields["medicalDetails.$[med].treatmentPlanning.$[treat].selectedTeethDetails.$[tooth].dailyTreatments.$[daily].paymentMethod"] = paymentMethod;
      }

      // Add payment date if provided, otherwise use current date if payment amount is greater than 0
      if (paymentDate) {
        updateFields["medicalDetails.$[med].treatmentPlanning.$[treat].selectedTeethDetails.$[tooth].dailyTreatments.$[daily].paymentDate"] = new Date(paymentDate);
      } else if (paidAmount > 0) {
        updateFields["medicalDetails.$[med].treatmentPlanning.$[treat].selectedTeethDetails.$[tooth].dailyTreatments.$[daily].paymentDate"] = new Date();
      }

      // Update payment information
      const updatedPatient = await Patient.findOneAndUpdate(
        {
          _id: patientId,
          "medicalDetails._id": medicalDetailId,
          "medicalDetails.treatmentPlanning._id": treatmentId,
          "medicalDetails.treatmentPlanning.selectedTeethDetails.number": toothNumber,
          "medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments._id": dailyTreatmentId
        },
        {
          $set: updateFields
        },
        {
          arrayFilters: [
            { "med._id": medicalDetailId },
            { "treat._id": treatmentId },
            { "tooth.number": toothNumber },
            { "daily._id": dailyTreatmentId }
          ],
          new: true
        }
      );

      if (!updatedPatient) {
        return res.status(404).json({
          success: false,
          message: "Failed to update payment information"
        });
      }

      // Recalculate totals for the tooth
      const toothData = await Patient.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(patientId) } },
        { $unwind: "$medicalDetails" },
        { $match: { "medicalDetails._id": new mongoose.Types.ObjectId(medicalDetailId) } },
        { $unwind: "$medicalDetails.treatmentPlanning" },
        { $match: { "medicalDetails.treatmentPlanning._id": new mongoose.Types.ObjectId(treatmentId) } },
        {
          $project: {
            dailyTreatments: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments"
          }
        }
      ]);

      if (toothData.length > 0) {
        const treatments = toothData[0].dailyTreatments || [];
        const totalTreatmentAmount = Math.round(treatments.reduce((sum, t) => sum + (Number(t.treatmentAmount) || 0), 0) * 100) / 100;
        const totalPaidAmount = Math.round(treatments.reduce((sum, t) => sum + (Number(t.paidAmount) || 0), 0) * 100) / 100;
        const totalRemainingAmount = Math.round((totalTreatmentAmount - totalPaidAmount) * 100) / 100;

        // Update the tooth totals
        await Patient.updateOne(
          {
            _id: patientId,
            "medicalDetails._id": medicalDetailId,
            "medicalDetails.treatmentPlanning._id": treatmentId,
            "medicalDetails.treatmentPlanning.selectedTeethDetails.number": toothNumber
          },
          {
            $set: {
              "medicalDetails.$[med].treatmentPlanning.$[treat].selectedTeethDetails.$[tooth].totalTreatmentAmount": totalTreatmentAmount,
              "medicalDetails.$[med].treatmentPlanning.$[treat].selectedTeethDetails.$[tooth].totalPaidAmount": totalPaidAmount,
              "medicalDetails.$[med].treatmentPlanning.$[treat].selectedTeethDetails.$[tooth].totalRemainingAmount": totalRemainingAmount
            }
          },
          {
            arrayFilters: [
              { "med._id": medicalDetailId },
              { "treat._id": treatmentId },
              { "tooth.number": toothNumber }
            ]
          }
        );
      }

      // Update treatment-level totals as well
      try {
        const treatmentData = await Patient.aggregate([
          { $match: { _id: new mongoose.Types.ObjectId(patientId) } },
          { $unwind: "$medicalDetails" },
          { $match: { "medicalDetails._id": new mongoose.Types.ObjectId(medicalDetailId) } },
          { $unwind: "$medicalDetails.treatmentPlanning" },
          { $match: { "medicalDetails.treatmentPlanning._id": new mongoose.Types.ObjectId(treatmentId) } },
          { $unwind: "$medicalDetails.treatmentPlanning.selectedTeethDetails" },
          { $unwind: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments" },
          {
            $group: {
              _id: "$medicalDetails.treatmentPlanning._id",
              totalTreatmentAmount: { $sum: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.treatmentAmount" },
              totalPaidAmount: { $sum: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.paidAmount" }
            }
          }
        ]);

        if (treatmentData.length > 0) {
          const treatmentTotals = treatmentData[0];
          const totalRemainingAmount = Math.round((treatmentTotals.totalTreatmentAmount - treatmentTotals.totalPaidAmount) * 100) / 100;

          await Patient.updateOne(
            { 
              _id: patientId,
              "medicalDetails._id": medicalDetailId
            },
            {
              $set: {
                "medicalDetails.$[med].treatmentPlanning.$[treat].totalPlanAmount": Math.round(treatmentTotals.totalTreatmentAmount * 100) / 100,
                "medicalDetails.$[med].treatmentPlanning.$[treat].totalPaidAmount": Math.round(treatmentTotals.totalPaidAmount * 100) / 100,
                "medicalDetails.$[med].treatmentPlanning.$[treat].totalRemainingAmount": totalRemainingAmount
              }
            },
            {
              arrayFilters: [
                { "med._id": medicalDetailId },
                { "treat._id": treatmentId }
              ]
            }
          );
        }
      } catch (treatmentTotalError) {
        console.error("Error updating treatment totals:", treatmentTotalError);
      }

      // Generate invoice for the payment update
      try {
        // Calculate the actual new payment amount (the additional payment made)
        const newPaymentAmount = paidAmount - originalPaidAmount;
        
        console.log(`Invoice generation - Original: ${originalPaidAmount}, New Total: ${paidAmount}, Additional Payment: ${newPaymentAmount}`);
        
        // Only generate invoice if there's an actual additional payment
        if (newPaymentAmount <= 0) {
          console.log("No additional payment made, skipping invoice generation");
          return res.status(200).json({
            success: true,
            message: "Payment updated successfully",
            data: updatedPatient
          });
        }
        
        const fullPatientData = await Patient.findById(patientId).populate("medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.treatedByDoctor", "name");
        const medicalDetail = fullPatientData.medicalDetails.find(md => md._id.toString() === medicalDetailId);
        const treatment = medicalDetail.treatmentPlanning.find(t => t._id.toString() === treatmentId);
        const tooth = treatment.selectedTeethDetails.find(t => t.number === toothNumber);
        const dailyTreatment = tooth.dailyTreatments.find(d => d._id.toString() === dailyTreatmentId);
        
        const treatmentDetails = {
          procedure: tooth.procedure || dailyTreatment.procedure || "Treatment",
          treatmentAmount: dailyTreatment.treatmentAmount,
          discount: 0,
          treatmentType: 'general',
          teethNumbers: [toothNumber],
          notes: dailyTreatment.notes || `Payment update for tooth ${toothNumber}`
        };
        
        const paymentDetails = {
          paidAmount: newPaymentAmount,  // Use only the new payment amount
          amount: newPaymentAmount,
          paymentMethod: paymentMethod || "Cash",
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          notes: `Payment update for tooth ${toothNumber} treatment`
        };
        
        // Create invoice via centralized system
        const invoice = await createTreatmentInvoice(
          patientId,
          dailyTreatmentId,
          newPaymentAmount,
          paymentMethod || "cash"
        );
        
        // Add invoice information to the response
        const response = {
          success: true,
          message: "Payment updated successfully",
          data: updatedPatient
        };

        if (invoice) {
          response.data = {
            ...response.data,
            invoice: {
              invoiceNumber: invoice.invoiceNumber
            }
          };
        } else {
          response.data = {
            ...response.data,
            invoiceError: "Failed to generate invoice"
          };
        }

        res.status(200).json(response);
      } catch (invoiceError) {
        console.error("Error generating invoice for payment update:", invoiceError);
        // Log more detailed error information
        if (invoiceError.stack) {
          console.error("Error stack:", invoiceError.stack);
        }
        // Still return success but with invoice generation error info
        res.status(200).json({
          success: true,
          message: "Payment updated successfully, but invoice generation failed",
          data: updatedPatient,
          invoiceError: invoiceError.message
        });
      }

    } catch (error) {
      console.error("Error updating payment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update payment",
        error: error.message
      });
    }
  }
);

// Add this new route for updating group treatment payments
router.patch(
  "/update-group-payment/:patientId/:medicalDetailId/:treatmentId/:groupIndex/:dailyTreatmentId",
  async (req, res) => {
    try {
      const { patientId, medicalDetailId, treatmentId, groupIndex, dailyTreatmentId } = req.params;
      let { paidAmount, paymentDate, paymentMethod } = req.body;

      // Ensure paidAmount is a proper number with 2 decimal places for precision
      paidAmount = parseFloat(paidAmount);
      if (paidAmount === undefined || isNaN(paidAmount) || paidAmount < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment amount"
        });
      }
      
      // Round to 2 decimal places to avoid floating point precision issues
      paidAmount = Math.round(paidAmount * 100) / 100;

      // Get the original paid amount BEFORE any updates for correct invoice calculation
      let originalPaidAmount = 0;
      try {
        const originalPatient = await Patient.findById(patientId);
        const originalMedicalDetail = originalPatient.medicalDetails.find(md => md._id.toString() === medicalDetailId);
        const originalTreatment = originalMedicalDetail.treatmentPlanning.find(t => t._id.toString() === treatmentId);
        const originalGroup = originalTreatment.groupTreatmentDetails[parseInt(groupIndex)];
        const originalDailyTreatment = originalGroup.dailyTreatments.find(d => d._id.toString() === dailyTreatmentId);
        originalPaidAmount = parseFloat(originalDailyTreatment.paidAmount) || 0;
        console.log(`Group payment update - Original: ${originalPaidAmount}, New: ${paidAmount}, Additional: ${paidAmount - originalPaidAmount}`);
      } catch (err) {
        console.error("Error getting original group paid amount:", err);
        originalPaidAmount = 0;
      }

      // First, get the patient document
      const patient = await Patient.findOne(
        { 
          _id: patientId,
          "medicalDetails._id": medicalDetailId 
        },
        { "medicalDetails.$": 1 }
      );

      if (!patient || !patient.medicalDetails[0]) {
        return res.status(404).json({
          success: false,
          message: "Patient or treatment not found"
        });
      }

      // Find the treatment amount manually in JavaScript
      let treatmentAmount = 0;
      try {
        const medicalDetail = patient.medicalDetails[0];
        const treatment = medicalDetail.treatmentPlanning.find(t => 
          t._id.toString() === treatmentId
        );
        if (!treatment) throw new Error("Treatment not found");
        
        const groupTreatment = treatment.groupTreatmentDetails[parseInt(groupIndex)];
        if (!groupTreatment) throw new Error("Group treatment not found");
        
        const dailyTreatment = groupTreatment.dailyTreatments.find(d => 
          d._id.toString() === dailyTreatmentId
        );
        if (!dailyTreatment) throw new Error("Daily treatment not found");
        
        treatmentAmount = dailyTreatment.treatmentAmount;
      } catch (err) {
        console.error("Error finding group treatment amount:", err);
        return res.status(404).json({
          success: false,
          message: "Group treatment details could not be found: " + err.message
        });
      }

      // Calculate remaining amount
      const remainingAmount = Math.round((treatmentAmount - paidAmount) * 100) / 100;

      // Prepare update fields
      const updateFields = {
        "medicalDetails.$[med].treatmentPlanning.$[treat].groupTreatmentDetails.$[group].dailyTreatments.$[daily].paidAmount": paidAmount,
        "medicalDetails.$[med].treatmentPlanning.$[treat].groupTreatmentDetails.$[group].dailyTreatments.$[daily].remainingAmount": remainingAmount,
      };
      
      // Add payment method if provided
      if (paymentMethod) {
        updateFields["medicalDetails.$[med].treatmentPlanning.$[treat].groupTreatmentDetails.$[group].dailyTreatments.$[daily].paymentMethod"] = paymentMethod;
      }

      // Add payment date if provided, otherwise use current date if payment amount is greater than 0
      if (paymentDate) {
        updateFields["medicalDetails.$[med].treatmentPlanning.$[treat].groupTreatmentDetails.$[group].dailyTreatments.$[daily].paymentDate"] = new Date(paymentDate);
      } else if (paidAmount > 0) {
        updateFields["medicalDetails.$[med].treatmentPlanning.$[treat].groupTreatmentDetails.$[group].dailyTreatments.$[daily].paymentDate"] = new Date();
      }

      // Update payment information
      const updatedPatient = await Patient.findOneAndUpdate(
        {
          _id: patientId,
          "medicalDetails._id": medicalDetailId,
          "medicalDetails.treatmentPlanning._id": treatmentId
        },
        {
          $set: updateFields
        },
        {
          arrayFilters: [
            { "med._id": medicalDetailId },
            { "treat._id": treatmentId },
            { "group": parseInt(groupIndex) }, // Fix: Use the actual group index instead of just checking if it exists
            { "daily._id": dailyTreatmentId }
          ],
          new: true
        }
      );

      if (!updatedPatient) {
        return res.status(404).json({
          success: false,
          message: "Failed to update group payment information"
        });
      }

      // Recalculate totals for the group treatment
      const groupTreatmentData = await Patient.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(patientId) } },
        { $unwind: "$medicalDetails" },
        { $match: { "medicalDetails._id": new mongoose.Types.ObjectId(medicalDetailId) } },
        { $unwind: "$medicalDetails.treatmentPlanning" },
        { $match: { "medicalDetails.treatmentPlanning._id": new mongoose.Types.ObjectId(treatmentId) } },
        {
          $project: {
            groupTreatment: { 
              $arrayElemAt: ["$medicalDetails.treatmentPlanning.groupTreatmentDetails", parseInt(groupIndex)]
            }
          }
        }
      ]);

      if (groupTreatmentData.length > 0 && groupTreatmentData[0].groupTreatment) {
        const treatments = groupTreatmentData[0].groupTreatment.dailyTreatments || [];
        const totalTreatmentAmount = Math.round(treatments.reduce((sum, t) => sum + (Number(t.treatmentAmount) || 0), 0) * 100) / 100;
        const totalPaidAmount = Math.round(treatments.reduce((sum, t) => sum + (Number(t.paidAmount) || 0), 0) * 100) / 100;
        const totalRemainingAmount = Math.round((totalTreatmentAmount - totalPaidAmount) * 100) / 100;

        // Update the group treatment totals
        await Patient.updateOne(
          {
            _id: patientId,
            "medicalDetails._id": medicalDetailId,
            "medicalDetails.treatmentPlanning._id": treatmentId
          },
          {
            $set: {
              [`medicalDetails.$[med].treatmentPlanning.$[treat].groupTreatmentDetails.${groupIndex}.totalTreatmentAmount`]: totalTreatmentAmount,
              [`medicalDetails.$[med].treatmentPlanning.$[treat].groupTreatmentDetails.${groupIndex}.totalPaidAmount`]: totalPaidAmount,
              [`medicalDetails.$[med].treatmentPlanning.$[treat].groupTreatmentDetails.${groupIndex}.totalRemainingAmount`]: totalRemainingAmount
            }
          },
          {
            arrayFilters: [
              { "med._id": medicalDetailId },
              { "treat._id": treatmentId }
            ]
          }
        );
      }

      // Update treatment-level totals as well
      try {
        // Calculate treatment totals from both selected teeth and group treatments
        const treatmentData = await Patient.aggregate([
          { $match: { _id: new mongoose.Types.ObjectId(patientId) } },
          { $unwind: "$medicalDetails" },
          { $match: { "medicalDetails._id": new mongoose.Types.ObjectId(medicalDetailId) } },
          { $unwind: "$medicalDetails.treatmentPlanning" },
          { $match: { "medicalDetails.treatmentPlanning._id": new mongoose.Types.ObjectId(treatmentId) } },
          {
            $facet: {
              teethTotals: [
                { $unwind: "$medicalDetails.treatmentPlanning.selectedTeethDetails" },
                { $unwind: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments" },
                {
                  $group: {
                    _id: null,
                    totalTreatmentAmount: { $sum: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.treatmentAmount" },
                    totalPaidAmount: { $sum: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.paidAmount" }
                  }
                }
              ],
              groupTotals: [
                { $unwind: "$medicalDetails.treatmentPlanning.groupTreatmentDetails" },
                { $unwind: "$medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments" },
                {
                  $group: {
                    _id: null,
                    totalTreatmentAmount: { $sum: "$medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments.treatmentAmount" },
                    totalPaidAmount: { $sum: "$medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments.paidAmount" }
                  }
                }
              ]
            }
          }
        ]);

        if (treatmentData.length > 0) {
          const teethTotals = treatmentData[0].teethTotals[0] || { totalTreatmentAmount: 0, totalPaidAmount: 0 };
          const groupTotals = treatmentData[0].groupTotals[0] || { totalTreatmentAmount: 0, totalPaidAmount: 0 };
          
          const totalTreatmentAmount = teethTotals.totalTreatmentAmount + groupTotals.totalTreatmentAmount;
          const totalPaidAmount = teethTotals.totalPaidAmount + groupTotals.totalPaidAmount;
          const totalRemainingAmount = Math.round((totalTreatmentAmount - totalPaidAmount) * 100) / 100;

          await Patient.updateOne(
            { 
              _id: patientId,
              "medicalDetails._id": medicalDetailId
            },
            {
              $set: {
                "medicalDetails.$[med].treatmentPlanning.$[treat].totalPlanAmount": Math.round(totalTreatmentAmount * 100) / 100,
                "medicalDetails.$[med].treatmentPlanning.$[treat].totalPaidAmount": Math.round(totalPaidAmount * 100) / 100,
                "medicalDetails.$[med].treatmentPlanning.$[treat].totalRemainingAmount": totalRemainingAmount
              }
            },
            {
              arrayFilters: [
                { "med._id": medicalDetailId },
                { "treat._id": treatmentId }
              ]
            }
          );
        }
      } catch (treatmentTotalError) {
        console.error("Error updating treatment totals for group payment:", treatmentTotalError);
      }

      // Generate invoice for the group payment update
      try {
        const fullPatientData = await Patient.findById(patientId).populate("medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments.treatedByDoctor", "name");
        const medicalDetail = fullPatientData.medicalDetails.find(md => md._id.toString() === medicalDetailId);
        const treatment = medicalDetail.treatmentPlanning.find(t => t._id.toString() === treatmentId);
        const groupTreatment = treatment.groupTreatmentDetails[parseInt(groupIndex)];
        const dailyTreatment = groupTreatment.dailyTreatments.find(d => d._id.toString() === dailyTreatmentId);
        
        const treatmentDetails = {
          procedure: groupTreatment.procedure || dailyTreatment.procedure || `${groupTreatment.groupName} Treatment`,
          treatmentAmount: dailyTreatment.treatmentAmount,
          discount: 0,
          treatmentType: 'general',
          teethNumbers: groupTreatment.teethNumbers || [],
          notes: dailyTreatment.notes || `Payment update for ${groupTreatment.groupName} group treatment`
        };
        
        // Calculate the actual new payment amount (the additional payment made)
        const newPaymentAmount = paidAmount - originalPaidAmount;
        
        console.log(`Group invoice generation - Original: ${originalPaidAmount}, New Total: ${paidAmount}, Additional Payment: ${newPaymentAmount}`);
        
        // Only generate invoice if there's an actual additional payment
        if (newPaymentAmount <= 0) {
          console.log("No additional group payment made, skipping invoice generation");
          return res.status(200).json({
            success: true,
            message: "Group payment updated successfully",
            data: updatedPatient
          });
        }
        
        const paymentDetails = {
          paidAmount: newPaymentAmount,  // Use only the new payment amount
          amount: newPaymentAmount,
          paymentMethod: paymentMethod || "Cash",
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          notes: `Payment update for ${groupTreatment.groupName} group treatment`
        };
        
        // Create invoice via centralized system
        const invoice = await createTreatmentInvoice(
          patientId,
          dailyTreatmentId,
          newPaymentAmount,
          paymentMethod || "cash"
        );
        
        // Add invoice information to the response
        const response = {
          success: true,
          message: "Group payment updated successfully",
          data: updatedPatient
        };

        if (invoice) {
          response.data = {
            ...response.data,
            invoice: {
              invoiceNumber: invoice.invoiceNumber
            }
          };
        } else {
          response.data = {
            ...response.data,
            invoiceError: "Failed to generate invoice"
          };
        }

        res.status(200).json(response);
      } catch (invoiceError) {
        console.error("Error generating invoice for group payment update:", invoiceError);
        // Log more detailed error information
        if (invoiceError.stack) {
          console.error("Error stack:", invoiceError.stack);
        }
        // Still return success but with invoice generation error info
        res.status(200).json({
          success: true,
          message: "Group payment updated successfully, but invoice generation failed",
          data: updatedPatient,
          invoiceError: invoiceError.message
        });
      }

    } catch (error) {
      console.error("Error updating group payment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update group payment",
        error: error.message
      });
    }
  }
);

// Add this new route before the existing send-email route
router.get("/get-patient-email-details/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID format"
      });
    }
    
    // Find patient WITHOUT trying to populate the problematic field
    const patient = await Patient.findById(patientId);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }
    
    // Format data for email without relying on populated fields
    const patientEmailData = {
      personalDetails: patient.personalDetails,
      medicalDetails: patient.medicalDetails,
      
      // Extract treatment plans for easier access
      treatments: patient.medicalDetails.flatMap(medDetail => 
        medDetail.treatmentPlanning.map(treatment => {
          // Get doctor name if available (handle both populated and unpopulated cases)
          // NOTE: treatedByDoctor field doesn't exist at treatment planning level in schema
          // We'll get doctor info from daily treatments instead
          let doctorName = 'Clinic Doctor';
          
          // Try to get doctor from selected teeth details
          if (treatment.selectedTeethDetails && treatment.selectedTeethDetails.length > 0) {
            const firstTooth = treatment.selectedTeethDetails[0];
            if (firstTooth.dailyTreatments && firstTooth.dailyTreatments.length > 0) {
              const firstTreatment = firstTooth.dailyTreatments[0];
              if (firstTreatment.treatedByDoctor) {
                if (typeof firstTreatment.treatedByDoctor === 'object' && firstTreatment.treatedByDoctor.name) {
                  doctorName = firstTreatment.treatedByDoctor.name;
                }
              }
            }
          }
          // If no doctor found in teeth details, try group treatments
          else if (treatment.groupTreatmentDetails && treatment.groupTreatmentDetails.length > 0) {
            const firstGroup = treatment.groupTreatmentDetails[0];
            if (firstGroup.dailyTreatments && firstGroup.dailyTreatments.length > 0) {
              const firstTreatment = firstGroup.dailyTreatments[0];
              if (firstTreatment.treatedByDoctor) {
                if (typeof firstTreatment.treatedByDoctor === 'object' && firstTreatment.treatedByDoctor.name) {
                  doctorName = firstTreatment.treatedByDoctor.name;
                }
              }
            }
          }
          
          return {
            treatmentDate: treatment.treatmentDate,
            diagnosis: treatment.diagnosis,
            treatmentDetails: treatment.treatmentDetails,
            teethNumber: treatment.teethNumbers?.join(', ') || '',
            isCompleted: treatment.isCompleted,
            completionDate: treatment.completionDate,
            treatmentAmount: treatment.treatmentAmount,
            advancedAmount: treatment.advancePaid,
            balanceAmount: treatment.treatmentAmount - (treatment.advancePaid || 0),
            doctorName: doctorName,
            
            // Include teeth-specific treatment details
            teethDetails: treatment.selectedTeethDetails?.map(tooth => {
              return {
                toothNumber: tooth.number,
                treatmentName: tooth.procedure || 'Treatment', // Use procedure as treatment name
                totalAmount: tooth.totalTreatmentAmount || 0,
                paidAmount: tooth.totalPaidAmount || 0,
                remainingAmount: tooth.totalRemainingAmount || 0,
                sessions: tooth.dailyTreatments?.map(session => {
                  // Get session doctor name if available
                  let sessionDoctorName = 'Clinic Doctor';
                  if (session.treatedByDoctor) {
                    if (typeof session.treatedByDoctor === 'object' && session.treatedByDoctor.name) {
                      sessionDoctorName = session.treatedByDoctor.name;
                    }
                  }
                  
                  return {
                    date: session.date,
                    details: session.notes || 'Treatment session',
                    amount: session.treatmentAmount,
                    paid: session.paidAmount,
                    doctor: sessionDoctorName,
                    completed: session.isCompleted
                  };
                }) || []
              };
            }) || []
          };
        })
      )
    };
    
    res.status(200).json({
      success: true,
      data: patientEmailData,
      message: "Patient email data fetched successfully"
    });
  } catch (error) {
    console.error("Error fetching patient email details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patient email details",
      error: error.message
    });
  }
});

// Replace the existing send-email route with this fixed version
router.post("/send-email", async (req, res) => {
  try {
    const { patientId, subject, body } = req.body;
    
    // Validate input
    if (!patientId || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: "Patient ID, subject and body are required"
      });
    }
    
    // Find patient WITHOUT trying to populate - similar to get-patient-email-details route
    const patient = await Patient.findById(patientId);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }
    
    if (!patient.personalDetails.emailAddress) {
      return res.status(400).json({
        success: false,
        message: "Patient doesn't have an email address"
      });
    }
    
    // Create reusable transporter
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE, // e.g., 'gmail'
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    // Mail options with better HTML formatting
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: patient.personalDetails.emailAddress,
      subject: subject,
      text: body, // Plain text version as fallback
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              line-height: 1.6;
              color: #333333;
              margin: 0;
              padding: 0;
              background-color: #f9f9f9;
            }
            .container {
              max-width: 650px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 3px 10px rgba(0,0,0,0.1);
            }
            .header {
              background-color: #0070d1;
              color: white;
              padding: 20px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              padding: 30px;
            }
            .section {
              margin-bottom: 25px;
              border-bottom: 1px solid #f0f0f0;
              padding-bottom: 15px;
            }
            .section:last-child {
              border-bottom: none;
              margin-bottom: 0;
            }
            h2 {
              color: #0070d1;
              font-size: 18px;
              margin-top: 0;
              margin-bottom: 15px;
              padding-bottom: 8px;
              border-bottom: 2px solid #e6f0fa;
            }
            .detail-row {
              margin-bottom: 8px;
            }
            .detail-label {
              font-weight: 600;
              color: #555555;
            }
            .treatment {
              background-color: #f7fbff;
              border-left: 3px solid #0070d1;
              padding: 15px;
              margin-bottom: 15px;
              border-radius: 4px;
            }
            .treatment-title {
              font-weight: bold;
              color: #0070d1;
              margin-bottom: 8px;
            }
            .treatment-detail {
              padding-left: 15px;
              margin-bottom: 5px;
            }
            .tooth-detail {
              background-color: #f0f7ff;
              padding: 12px;
              margin-top: 10px;
              margin-bottom: 10px;
              border-radius: 4px;
            }
            .session {
              background-color: rgba(255, 255, 255, 0.7);
              padding: 8px;
              margin: 5px 0 10px 15px;
              border-left: 2px solid #90caf9;
            }
            .price {
              color: #2e7d32;
              font-weight: 600;
            }
            .status-completed {
              color: #2e7d32;
              font-weight: 600;
            }
            .status-pending {
              color: #f57c00;
              font-weight: 600;
            }
            .footer {
              background-color: #f5f5f5;
              padding: 20px 30px;
              text-align: center;
              color: #666666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Shree Nagar Dental Clinic</h1>
            </div>
            <div class="content">
              ${convertTextToHtml(body)}
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Shree Nagar Dental Clinic. All rights reserved.</p>
              <p>For any questions, please contact us at ${process.env.EMAIL_USER}</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // Helper function to convert text format to HTML
    function convertTextToHtml(text) {
      // Check if the input is a multiline string
      if (!text || typeof text !== 'string') return '';

      // Replace section headers with styled headers
      let html = text
        .replace(/===== (.*?) =====/g, '<h2>$1</h2><div class="section">')
        .replace(/\n\n(?=====)/g, '</div>\n\n') // Close section divs before new sections
        .replace(/\n\n(?!.*?=====)/g, '</div>\n\n'); // Close the last section

      // Process treatment entries
      html = html.replace(/Treatment #(\d+): (.*?)(?:\n|$)/g, 
        '<div class="treatment"><div class="treatment-title">Treatment #$1: $2</div>');

      // Process tooth details
      html = html.replace(/\s\s- Tooth #(.*?): (.*?)(?:\n|$)/g,
        '<div class="tooth-detail"><strong>Tooth #$1:</strong> $2');

      // Process sessions
      html = html.replace(/\s\s\s\s(\d+)\. (.*?)(?:\n|$)/g,
        '<div class="session"><strong>Session $1:</strong> $2');

      // Style various data points
      html = html
        // Format status
        .replace(/(Status: Completed)/g, '<span class="status-completed">$1</span>')
        .replace(/(Status: In Progress|Status: Pending)/g, '<span class="status-pending">$1</span>')
        // Format money amounts
        .replace(/(Amount: ₹|Total Amount: ₹|Advance Paid: ₹|Balance: ₹|Remaining: ₹|Paid: ₹)(\d+)/g, 
          '$1<span class="price">$2</span>')
        // Add proper detail formatting
        .replace(/([A-Za-z\s]+): ([^\n]+)(?:\n|$)/g, 
          '<div class="detail-row"><span class="detail-label">$1:</span> $2</div>');

      // Additional cleanup - close divs
      html = html
        .replace(/(?=\s\s- Tooth #)/g, '</div>') // Close treatment before new tooth
        .replace(/(?=<\/div>\n\n)/g, '</div>') // Close treatments before section end
        .replace(/\n\n/g, '\n') // Remove double line breaks
        .replace(/\n/g, '<br>'); // Convert line breaks to HTML

      // Final wrapping paragraph
      return `<p>${html}</p>`;
    }
    
    // Send email
    await transporter.sendMail(mailOptions);
    
    res.status(200).json({
      success: true,
      message: "Email sent successfully"
    });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send email",
      error: error.message
    });
  }
});

router.get("/financial-insights", getFinancialInsights);

router.get("/dashboard-metrics", getDashboardMetrics);

// Add simplified dashboard metrics route for troubleshooting
router.get("/simplified-dashboard-metrics", getSimplifiedDashboardMetrics);

// Test route for demographics
router.get("/demographics-test", getPatientDemographics);

// Add new route for general patient document uploads
router.post(
  "/documents/:patientId",
  upload.array("files", 10),
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const files = req.files;
      
      // Handle descriptions properly when submitted from FormData
      let descriptions = req.body.descriptions;
      if (!Array.isArray(descriptions) && descriptions) {
        descriptions = [descriptions];
      } else if (!descriptions) {
        descriptions = [];
      }

      // Validate files
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
      }

      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      // Upload files to cloudinary and get results
      const uploadPromises = files.map(async (file, index) => {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "patient-documents",
          resource_type: "auto",
        });

        // Clean up local file
        deleteFile(file.path);

        return {
          fileName: file.originalname,
          fileUrl: result.secure_url,
          description: descriptions[index] || "",
          uploadDate: new Date().toISOString(),
          publicId: result.public_id,
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      // Add the files directly to the patient documents array
      const updatedPatient = await Patient.findByIdAndUpdate(
        patientId,
        {
          $push: {
            "documents": {
              $each: uploadedFiles,
            },
          },
        },
        { new: true }
      );

      if (!updatedPatient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      res.status(200).json({
        success: true,
        data: updatedPatient,
        message: "Files uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading patient documents:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload documents",
        details: error.message,
      });
    }
  }
);

// After other routes, add this new route
router.get("/get-treatment-plans/:patientId/:medicalDetailId", getTreatmentPlans);

// After the get-treatment-plans route, add this new route for adding treatment plans
router.post("/add-treatment-plan/:patientId/:medicalDetailId", addTreatmentPlan);

// Add the new route for updating treatment plans
router.put("/update-treatment-plan/:patientId/:medicalDetailId/:treatmentPlanId", updateTreatmentPlan);

// Add this new endpoint for uploading profile photos with improved error handling
router.post(
  "/upload-profile-photo/:id",
  upload.single("profilePhoto"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const file = req.file;

      // Validate file
      if (!file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      // Find the patient
      const patient = await Patient.findById(id);
      if (!patient) {
        // Clean up local file if patient not found
        deleteFile(file.path);
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      // If patient already has a profile photo, delete the old one from Cloudinary
      if (patient.personalDetails.profilePhoto && patient.personalDetails.profilePhoto.publicId) {
        try {
          await cloudinary.uploader.destroy(patient.personalDetails.profilePhoto.publicId);
        } catch (deleteError) {
          console.error("Error deleting old profile photo:", deleteError);
          // Continue with the upload even if deletion fails
        }
      }

      // Set timeout for Cloudinary upload to 60 seconds
      const uploadOptions = {
        folder: "patient-profile-photos",
        resource_type: "image",
        timeout: 60000, // 60 seconds timeout
        transformation: [
          { width: 400, height: 400, crop: "fill", gravity: "face" }
        ]
      };

      // Upload file to cloudinary with better error handling
      let result;
      try {
        result = await cloudinary.uploader.upload(file.path, uploadOptions);
      } catch (cloudinaryError) {
        // Clean up local file
        deleteFile(file.path);
        console.error("Cloudinary upload error:", cloudinaryError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload to Cloudinary",
          details: cloudinaryError.message
        });
      }

      // Clean up local file after successful upload
      deleteFile(file.path);

      // Update patient with new profile photo
      const updatedPatient = await Patient.findByIdAndUpdate(
        id,
        {
          $set: {
            "personalDetails.profilePhoto": {
              url: result.secure_url,
              publicId: result.public_id,
            },
          },
        },
        { new: true }
      );

      res.status(200).json({
        success: true,
        data: updatedPatient,
        message: "Profile photo uploaded successfully",
      });
    } catch (error) {
      // Clean up local file if exists
      if (req.file) {
        deleteFile(req.file.path);
      }
      console.error("Error uploading profile photo:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload profile photo",
        details: error.message,
      });
    }
  }
);

// Get next follow-up date for a patient
router.get("/:patientId/next-followup", protectAdminRoute, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Validate patient ID
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID format"
      });
    }

    // Find the patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    // Find the earliest upcoming follow-up date
    let nextFollowUpDate = null;
    let hasFollowUp = false;
    
    if (patient.medicalDetails && patient.medicalDetails.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (const medicalDetail of patient.medicalDetails) {
        if (medicalDetail.treatmentPlanning && medicalDetail.treatmentPlanning.length > 0) {
          for (const treatment of medicalDetail.treatmentPlanning) {
            if (treatment.followUpDate) {
              hasFollowUp = true;
              const followUpDate = new Date(treatment.followUpDate);
              
              // Only consider dates that are today or in the future
              if (followUpDate >= today) {
                // If we haven't found a date yet or this one is earlier than what we've found
                if (!nextFollowUpDate || followUpDate < nextFollowUpDate) {
                  nextFollowUpDate = followUpDate;
                }
              }
            }
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        nextFollowUpDate: nextFollowUpDate ? nextFollowUpDate.toISOString() : null,
        hasFollowUpDate: hasFollowUp
      }
    });
  } catch (error) {
    console.error("Error fetching patient follow-up date:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch follow-up date",
      error: error.message
    });
  }
});

// Get patient payment information
router.get("/:patientId/payment-info", protectAdminRoute, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Validate patient ID
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID format"
      });
    }

    // Find the patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    // Calculate total remaining amount
    let totalRemainingAmount = 0;
    let hasPendingPayment = false;
    
    if (patient.medicalDetails && patient.medicalDetails.length > 0) {
      for (const medicalDetail of patient.medicalDetails) {
        if (medicalDetail.treatmentPlanning && medicalDetail.treatmentPlanning.length > 0) {
          for (const treatment of medicalDetail.treatmentPlanning) {
            if (treatment.selectedTeethDetails && treatment.selectedTeethDetails.length > 0) {
              for (const tooth of treatment.selectedTeethDetails) {
                const remaining = (tooth.totalTreatmentAmount || 0) - (tooth.totalPaidAmount || 0);
                totalRemainingAmount += remaining;
                
                // Set hasPendingPayment to true if any tooth has a remaining amount
                if (remaining > 0) {
                  hasPendingPayment = true;
                }
              }
            }
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalRemainingAmount,
        hasPendingPayment
      }
    });
  } catch (error) {
    console.error("Error fetching patient payment info:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment information",
      error: error.message
    });
  }
});

module.exports = router;