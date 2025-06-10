const express = require("express");
const router = express.Router();
const { upload, deleteFile } = require("../middleware/multer");
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
} = require("../controller/patientCtrl.js");
const cloudinary = require("../config/cloudinary");
const Patient = require("../model/Patient");
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

router.post("/add-patient", addPatient);
router.put("/update-patient/:id", updatePatient); // Update route
router.delete("/delete-patient/:id", deletePatient); // Update route
router.get("/get-patient", getPatient);
router.get("/get-pagination-patient", getPaginatedPatient);
router.get("/get-filtered-patients", getFilteredPatients);
router.get("/get-procedure-types", getProcedureTypes);
router.get("/get-patient/:id", getSinglePatient);
router.post(
  "/upload-files/:id",
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
      const { paidAmount } = req.body;

      if (paidAmount === undefined || isNaN(paidAmount) || paidAmount < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment amount"
        });
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
        
        treatmentAmount = dailyTreatment.treatmentAmount;
      } catch (err) {
        console.error("Error finding treatment amount:", err);
        return res.status(404).json({
          success: false,
          message: "Treatment details could not be found: " + err.message
        });
      }

      // Calculate remaining amount
      const remainingAmount = treatmentAmount - paidAmount;

      // Update payment information with pre-calculated remainingAmount
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
            "medicalDetails.$[med].treatmentPlanning.$[treat].selectedTeethDetails.$[tooth].dailyTreatments.$[daily].paidAmount": paidAmount,
            "medicalDetails.$[med].treatmentPlanning.$[treat].selectedTeethDetails.$[tooth].dailyTreatments.$[daily].remainingAmount": remainingAmount,
            "medicalDetails.$[med].treatmentPlanning.$[treat].selectedTeethDetails.$[tooth].dailyTreatments.$[daily].lastPaymentDate": new Date()
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
        const totalTreatmentAmount = treatments.reduce((sum, t) => sum + (Number(t.treatmentAmount) || 0), 0);
        const totalPaidAmount = treatments.reduce((sum, t) => sum + (Number(t.paidAmount) || 0), 0);
        const totalRemainingAmount = totalTreatmentAmount - totalPaidAmount;

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

      res.status(200).json({
        success: true,
        message: "Payment updated successfully",
        data: updatedPatient
      });
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
          let doctorName = 'Clinic Doctor';
          if (treatment.treatedByDoctor) {
            if (typeof treatment.treatedByDoctor === 'object' && treatment.treatedByDoctor.name) {
              doctorName = treatment.treatedByDoctor.name;
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

module.exports = router;
