const Appointment = require("../model/Appointment");
const Doctor = require("../model/Doctor");
const Patient = require("../model/Patient");
const mongoose = require("mongoose");
const { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, parseISO, subDays, subMonths } = require('date-fns');

/**
 * Get appointment analytics with various filters
 * @route GET /api/analytics/appointments
 * @access Private (Admin only)
 */
const getAppointmentAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, period = 'daily' } = req.query;
    
    // Parse dates or use defaults (last 30 days)
    const end = endDate ? endOfDay(new Date(endDate)) : endOfDay(new Date());
    const start = startDate ? startOfDay(new Date(startDate)) : startOfDay(subDays(end, 30));
    
    // Base match condition for date range and exclude soft deleted
    const dateMatchCondition = {
      createdAt: { $gte: start, $lte: end },
      isDeleted: { $ne: true }
    };
    
    // Get total appointments in the date range
    const totalAppointments = await Appointment.countDocuments(dateMatchCondition);
    
    // Get appointments by status
    const appointmentsByStatus = await Appointment.aggregate([
      { $match: dateMatchCondition },
      { $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get gender distribution
    const genderDistribution = await Appointment.aggregate([
      { $match: dateMatchCondition },
      { $group: {
          _id: "$gender",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get doctor-wise appointment count
    const doctorAppointments = await Appointment.aggregate([
      { $match: dateMatchCondition },
      { $lookup: {
          from: "doctors",
          localField: "doctor",
          foreignField: "_id",
          as: "doctorInfo"
        }
      },
      { $unwind: { path: "$doctorInfo", preserveNullAndEmptyArrays: true } },
      { $group: {
          _id: "$doctor",
          doctorName: { $first: "$doctorInfo.name" },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Calculate no-show rate
    const noShowStats = await Appointment.aggregate([
      { $match: dateMatchCondition },
      { $group: {
          _id: null,
          total: { $sum: 1 },
          noShows: { $sum: { $cond: [{ $eq: ["$hasVisited", false] }, 1, 0] } }
        }
      }
    ]);
    
    const noShowRate = noShowStats.length > 0 
      ? (noShowStats[0].noShows / noShowStats[0].total) * 100 
      : 0;
    
    // Get appointments over time (daily, weekly, monthly)
    let timeGrouping;
    let timeFormat;
    
    switch(period) {
      case 'weekly':
        timeGrouping = { $week: "$createdAt" };
        timeFormat = "%Y-W%U"; // Year-Week format
        break;
      case 'monthly':
        timeGrouping = { 
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" }
        };
        timeFormat = "%Y-%m"; // Year-Month format
        break;
      default: // daily
        timeGrouping = { 
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" }
        };
        timeFormat = "%Y-%m-%d"; // Year-Month-Day format
    }
    
    const appointmentsOverTime = await Appointment.aggregate([
      { $match: dateMatchCondition },
      { $group: {
          _id: timeGrouping,
          count: { $sum: 1 },
          date: { $first: "$createdAt" }
        }
      },
      { $sort: { date: 1 } },
      { $project: {
          _id: 0,
          date: { $dateToString: { format: timeFormat, date: "$date" } },
          count: 1
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalAppointments,
        appointmentsByStatus,
        genderDistribution,
        doctorAppointments,
        noShowRate,
        appointmentsOverTime
      }
    });
  } catch (error) {
    console.error("Error in getAppointmentAnalytics:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

/**
 * Get revenue analytics
 * @route GET /api/analytics/revenue
 * @access Private (Admin only)
 */
const getRevenueAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, period = 'monthly', ...filters } = req.query;
    
    // Parse dates or use defaults (last 12 months)
    const end = endDate ? endOfDay(new Date(endDate)) : endOfDay(new Date());
    const start = startDate ? startOfDay(new Date(startDate)) : startOfDay(subMonths(end, 12));
    
    // Aggregate revenue data from patient treatments using dailyTreatmentSchema (excluding soft deleted)
    const revenueData = await Patient.aggregate([
      // Exclude soft deleted patients
      { $match: { isDeleted: { $ne: true } } },
      // Unwind the medicalDetails array
      { $unwind: { path: "$medicalDetails", preserveNullAndEmptyArrays: false } },
      // Unwind the treatmentPlanning array
      { $unwind: { path: "$medicalDetails.treatmentPlanning", preserveNullAndEmptyArrays: false } },
      // Unwind the selectedTeethDetails array
      { $unwind: { path: "$medicalDetails.treatmentPlanning.selectedTeethDetails", preserveNullAndEmptyArrays: false } },
      // Unwind the dailyTreatments array
      { $unwind: { path: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments", preserveNullAndEmptyArrays: false } },
      // Filter by date range
      { $match: {
          "medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date": { $gte: start, $lte: end }
        }
      },
      // Group by time period based on dailyTreatments.date
      { $group: {
          _id: period === 'monthly' 
            ? { year: { $year: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date" }, month: { $month: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date" } }
            : period === 'weekly'
              ? { year: { $year: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date" }, week: { $week: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date" } }
              : { year: { $year: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date" }, month: { $month: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date" }, day: { $dayOfMonth: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date" } },
          totalAmount: { $sum: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.treatmentAmount" },
          paidAmount: { $sum: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.paidAmount" },
          remainingAmount: { $sum: { $subtract: ["$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.treatmentAmount", "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.paidAmount"] } },
          date: { $first: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date" }
        }
      },
      // Sort by date
      { $sort: { date: 1 } },
      // Format the output
      { $project: {
          _id: 0,
          date: { 
            $dateToString: { 
              format: period === 'monthly' ? "%Y-%m" : period === 'weekly' ? "%Y-W%U" : "%Y-%m-%d", 
              date: "$date" 
            } 
          },
          totalAmount: 1,
          paidAmount: 1,
          remainingAmount: 1
        }
      }
    ]);
    
    // Get doctor-wise revenue (excluding soft deleted)
    const doctorRevenue = await Patient.aggregate([
      // Exclude soft deleted patients
      { $match: { isDeleted: { $ne: true } } },
      // Unwind the medicalDetails array
      { $unwind: { path: "$medicalDetails", preserveNullAndEmptyArrays: false } },
      // Unwind the treatmentPlanning array
      { $unwind: { path: "$medicalDetails.treatmentPlanning", preserveNullAndEmptyArrays: false } },
      // Unwind the selectedTeethDetails array
      { $unwind: { path: "$medicalDetails.treatmentPlanning.selectedTeethDetails", preserveNullAndEmptyArrays: false } },
      // Unwind the dailyTreatments array
      { $unwind: { path: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments", preserveNullAndEmptyArrays: false } },
      // Filter by date range and only include treatments with a doctor
      { $match: {
          "medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date": { $gte: start, $lte: end },
          "medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.treatedByDoctor": { $ne: null }
        }
      },
      // Lookup doctor information
      { $lookup: {
          from: "doctors",
          localField: "medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.treatedByDoctor",
          foreignField: "_id",
          as: "doctorInfo"
        }
      },
      { $unwind: { path: "$doctorInfo", preserveNullAndEmptyArrays: true } },
      // Group by doctor
      { $group: {
          _id: "$doctorInfo._id",
          doctorName: { $first: "$doctorInfo.name" },
          totalAmount: { $sum: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.treatmentAmount" },
          paidAmount: { $sum: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.paidAmount" }
        }
      },
      // Sort by revenue (paid amount)
      { $sort: { paidAmount: -1 } },
      // Limit to top 10 doctors
      { $limit: 10 },
      // Format the output
      { $project: {
          _id: 0,
          doctorId: "$_id",
          doctorName: 1,
          totalAmount: 1,
          paidAmount: 1,
          remainingAmount: { $subtract: ["$totalAmount", "$paidAmount"] }
        }
      }
    ]);
    
    // Get top paying patients based on dailyTreatments (excluding soft deleted)
    const topPayingPatients = await Patient.aggregate([
      // Exclude soft deleted patients
      { $match: { isDeleted: { $ne: true } } },
      // Unwind the medicalDetails array
      { $unwind: { path: "$medicalDetails", preserveNullAndEmptyArrays: false } },
      // Unwind the treatmentPlanning array
      { $unwind: { path: "$medicalDetails.treatmentPlanning", preserveNullAndEmptyArrays: false } },
      // Unwind the selectedTeethDetails array
      { $unwind: { path: "$medicalDetails.treatmentPlanning.selectedTeethDetails", preserveNullAndEmptyArrays: false } },
      // Unwind the dailyTreatments array
      { $unwind: { path: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments", preserveNullAndEmptyArrays: false } },
      // Filter by date range
      { $match: {
          "medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date": { $gte: start, $lte: end }
        }
      },
      // Group by patient
      { $group: {
          _id: "$_id",
          patientName: { $first: "$personalDetails.name" },
          totalPaid: { $sum: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.paidAmount" },
          totalAmount: { $sum: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.treatmentAmount" }
        }
      },
      // Sort by total paid amount
      { $sort: { totalPaid: -1 } },
      // Limit to top 10 patients
      { $limit: 10 },
      // Format the output
      { $project: {
          _id: 0,
          patientId: "$_id",
          patientName: 1,
          totalPaid: 1,
          totalAmount: 1,
          remainingAmount: { $subtract: ["$totalAmount", "$totalPaid"] }
        }
      }
    ]);
    
    // Get outstanding amounts summary based on dailyTreatments (excluding soft deleted)
    const outstandingAmounts = await Patient.aggregate([
      // Exclude soft deleted patients
      { $match: { isDeleted: { $ne: true } } },
      // Unwind the medicalDetails array
      { $unwind: { path: "$medicalDetails", preserveNullAndEmptyArrays: false } },
      // Unwind the treatmentPlanning array
      { $unwind: { path: "$medicalDetails.treatmentPlanning", preserveNullAndEmptyArrays: false } },
      // Unwind the selectedTeethDetails array
      { $unwind: { path: "$medicalDetails.treatmentPlanning.selectedTeethDetails", preserveNullAndEmptyArrays: false } },
      // Unwind the dailyTreatments array
      { $unwind: { path: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments", preserveNullAndEmptyArrays: false } },
      // Filter by date range and calculate remaining amount
      { $match: {
          "medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date": { $gte: start, $lte: end }
        }
      },
      // Add a field for remaining amount
      { $addFields: {
          remainingAmount: { $subtract: ["$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.treatmentAmount", "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.paidAmount"] }
        }
      },
      // Filter to only include treatments with remaining amounts
      { $match: {
          remainingAmount: { $gt: 0 }
        }
      },
      // Group by patient
      { $group: {
          _id: "$_id",
          patientName: { $first: "$personalDetails.name" },
          contactNumber: { $first: "$personalDetails.contactNumber" },
          totalRemaining: { $sum: "$remainingAmount" }
        }
      },
      // Sort by total remaining amount
      { $sort: { totalRemaining: -1 } },
      // Format the output
      { $project: {
          _id: 0,
          patientId: "$_id",
          patientName: 1,
          contactNumber: 1,
          totalRemaining: 1
        }
      }
    ]);
    
    // Calculate overall revenue metrics based on dailyTreatments (excluding soft deleted)
    const overallRevenue = await Patient.aggregate([
      // Exclude soft deleted patients
      { $match: { isDeleted: { $ne: true } } },
      // Unwind the medicalDetails array
      { $unwind: { path: "$medicalDetails", preserveNullAndEmptyArrays: false } },
      // Unwind the treatmentPlanning array
      { $unwind: { path: "$medicalDetails.treatmentPlanning", preserveNullAndEmptyArrays: false } },
      // Unwind the selectedTeethDetails array
      { $unwind: { path: "$medicalDetails.treatmentPlanning.selectedTeethDetails", preserveNullAndEmptyArrays: false } },
      // Unwind the dailyTreatments array
      { $unwind: { path: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments", preserveNullAndEmptyArrays: false } },
      // Filter by date range
      { $match: {
          "medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date": { $gte: start, $lte: end }
        }
      },
      // Group all data
      { $group: {
          _id: null,
          totalAmount: { $sum: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.treatmentAmount" },
          paidAmount: { $sum: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.paidAmount" },
          remainingAmount: { $sum: { $subtract: ["$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.treatmentAmount", "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.paidAmount"] } }
        }
      }
    ]);
    
    // Add procedure filter if provided
    if (filters.procedure) {
      analyticsQuery['$or'] = [
        // Match procedure directly in dailyTreatments
        { 
          "medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.procedure": filters.procedure 
        },
        // Keep the fallback path
        { 
          "medicalDetails.treatmentPlanning.selectedTeethDetails.procedure": filters.procedure 
        }
      ];
    }
    
    res.status(200).json({
      success: true,
      data: {
        revenueData,
        doctorRevenue,
        topPayingPatients,
        outstandingAmounts,
        overallRevenue: overallRevenue.length > 0 ? overallRevenue[0] : {
          totalAmount: 0,
          paidAmount: 0,
          remainingAmount: 0
        }
      }
    });
  } catch (error) {
    console.error("Error in getRevenueAnalytics:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

/**
 * Get doctor performance analytics
 * @route GET /api/analytics/doctors
 * @access Private (Admin only)
 */
const getDoctorPerformanceAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Parse dates or use defaults (last 6 months)
    const end = endDate ? endOfDay(new Date(endDate)) : endOfDay(new Date());
    const start = startDate ? startOfDay(new Date(startDate)) : startOfDay(subMonths(end, 6));
    
    // Get number of patients treated per doctor (excluding soft deleted)
    const patientsPerDoctor = await Patient.aggregate([
      // Exclude soft deleted patients
      { $match: { isDeleted: { $ne: true } } },
      // Unwind the medicalDetails array
      { $unwind: { path: "$medicalDetails", preserveNullAndEmptyArrays: false } },
      // Unwind the treatmentPlanning array
      { $unwind: { path: "$medicalDetails.treatmentPlanning", preserveNullAndEmptyArrays: false } },
      // Unwind the selectedTeethDetails array
      { $unwind: { path: "$medicalDetails.treatmentPlanning.selectedTeethDetails", preserveNullAndEmptyArrays: false } },
      // Unwind the dailyTreatments array
      { $unwind: { path: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments", preserveNullAndEmptyArrays: false } },
      // Filter by date range and only include treatments with a doctor
      { $match: {
          "medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date": { $gte: start, $lte: end },
          "medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.treatedByDoctor": { $ne: null }
        }
      },
      // Lookup doctor information
      { $lookup: {
          from: "doctors",
          localField: "medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.treatedByDoctor",
          foreignField: "_id",
          as: "doctorInfo"
        }
      },
      { $unwind: { path: "$doctorInfo", preserveNullAndEmptyArrays: true } },
      // Group by doctor and patient to count unique patients
      { $group: {
          _id: {
            doctorId: "$doctorInfo._id",
            patientId: "$_id"
          },
          doctorName: { $first: "$doctorInfo.name" },
          patientName: { $first: "$personalDetails.name" }
        }
      },
      // Group by doctor to count patients
      { $group: {
          _id: "$_id.doctorId",
          doctorName: { $first: "$doctorName" },
          patientCount: { $sum: 1 }
        }
      },
      // Sort by patient count
      { $sort: { patientCount: -1 } },
      // Format the output
      { $project: {
          _id: 0,
          doctorId: "$_id",
          doctorName: 1,
          patientCount: 1
        }
      }
    ]);
    
    // Get average ratings per doctor
    const doctorRatings = await Doctor.aggregate([
      // Filter out doctors with no reviews and soft deleted
      { $match: { "reviews.0": { $exists: true }, isDeleted: { $ne: true } } },
      // Unwind the reviews array
      { $unwind: { path: "$reviews", preserveNullAndEmptyArrays: false } },
      // Filter by date range
      { $match: {
          "reviews.createdAt": { $gte: start, $lte: end }
        }
      },
      // Group by doctor
      { $group: {
          _id: "$_id",
          doctorName: { $first: "$name" },
          reviewCount: { $sum: 1 },
          averageRating: { $avg: "$reviews.rating" }
        }
      },
      // Sort by average rating
      { $sort: { averageRating: -1 } },
      // Format the output
      { $project: {
          _id: 0,
          doctorId: "$_id",
          doctorName: 1,
          reviewCount: 1,
          averageRating: { $round: ["$averageRating", 1] }
        }
      }
    ]);
    
    // Base match condition for date range and exclude soft deleted
    const appointmentMatchCondition = {
      createdAt: { $gte: start, $lte: end },
      doctor: { $ne: null },
      isDeleted: { $ne: true }
    };

    // Get most/least active doctors based on appointments
    const doctorActivity = await Appointment.aggregate([
      // Filter by date range and exclude soft deleted
      { $match: appointmentMatchCondition },
      // Lookup doctor information
      { $lookup: {
          from: "doctors",
          localField: "doctor",
          foreignField: "_id",
          as: "doctorInfo"
        }
      },
      { $unwind: { path: "$doctorInfo", preserveNullAndEmptyArrays: true } },
      // Group by doctor
      { $group: {
          _id: "$doctor",
          doctorName: { $first: "$doctorInfo.name" },
          appointmentCount: { $sum: 1 },
          completedCount: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
          cancelledCount: { $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] } },
          pendingCount: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          acceptedCount: { $sum: { $cond: [{ $eq: ["$status", "Accepted"] }, 1, 0] } },
          rejectedCount: { $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] } }
        }
      },
      // Sort by appointment count
      { $sort: { appointmentCount: -1 } },
      // Format the output
      { $project: {
          _id: 0,
          doctorId: "$_id",
          doctorName: 1,
          appointmentCount: 1,
          completedCount: 1,
          cancelledCount: 1,
          pendingCount: 1,
          acceptedCount: 1,
          rejectedCount: 1,
          completionRate: { 
            $cond: [
              { $eq: ["$appointmentCount", 0] },
              0,
              { $multiply: [{ $divide: ["$completedCount", "$appointmentCount"] }, 100] }
            ]
          }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        patientsPerDoctor,
        doctorRatings,
        doctorActivity
      }
    });
  } catch (error) {
    console.error("Error in getDoctorPerformanceAnalytics:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

/**
 * Get patient insights analytics
 * @route GET /api/analytics/patients
 * @access Private (Admin only)
 */
const getPatientInsightsAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, period = 'monthly' } = req.query;
    
    // Parse dates or use defaults (last 12 months)
    const end = endDate ? endOfDay(new Date(endDate)) : endOfDay(new Date());
    const start = startDate ? startOfDay(new Date(startDate)) : startOfDay(subMonths(end, 12));
    
    // Get new vs returning patients (excluding soft deleted)
    const patientVisits = await Patient.aggregate([
      // Filter by date range and exclude soft deleted
      { $match: {
          createdAt: { $gte: start, $lte: end },
          isDeleted: { $ne: true }
        }
      },
      // Group by time period to get new patients
      { $group: {
          _id: period === 'monthly' 
            ? { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }
            : period === 'weekly'
              ? { year: { $year: "$createdAt" }, week: { $week: "$createdAt" } }
              : { year: { $year: "$createdAt" }, month: { $month: "$createdAt" }, day: { $dayOfMonth: "$createdAt" } },
          newPatients: { $sum: 1 },
          date: { $first: "$createdAt" }
        }
      },
      // Sort by date
      { $sort: { date: 1 } },
      // Format the output
      { $project: {
          _id: 0,
          date: { 
            $dateToString: { 
              format: period === 'monthly' ? "%Y-%m" : period === 'weekly' ? "%Y-W%U" : "%Y-%m-%d", 
              date: "$date" 
            } 
          },
          newPatients: 1
        }
      }
    ]);
    
    // Get returning patients from appointments
    const returningPatients = await Appointment.aggregate([
      // Filter by date range
      { $match: {
          createdAt: { $gte: start, $lte: end },
          patientId: { $ne: null, $ne: "" },
          isDeleted: { $ne: true }
        }
      },
      // Group by patient and date to identify returning visits
      { $group: {
          _id: {
            patientId: "$patientId",
            period: period === 'monthly' 
              ? { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }
              : period === 'weekly'
                ? { year: { $year: "$createdAt" }, week: { $week: "$createdAt" } }
                : { year: { $year: "$createdAt" }, month: { $month: "$createdAt" }, day: { $dayOfMonth: "$createdAt" } }
          },
          date: { $first: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      // Filter to only include patients with more than one appointment
      { $match: { count: { $gt: 1 } } },
      // Group by time period to count returning patients
      { $group: {
          _id: "$_id.period",
          returningPatients: { $sum: 1 },
          date: { $first: "$date" }
        }
      },
      // Sort by date
      { $sort: { date: 1 } },
      // Format the output
      { $project: {
          _id: 0,
          date: { 
            $dateToString: { 
              format: period === 'monthly' ? "%Y-%m" : period === 'weekly' ? "%Y-W%U" : "%Y-%m-%d", 
              date: "$date" 
            } 
          },
          returningPatients: 1
        }
      }
    ]);
    
    // Combine new and returning patient data
    const patientTypeData = patientVisits.map(newData => {
      const returningData = returningPatients.find(r => r.date === newData.date);
      return {
        date: newData.date,
        newPatients: newData.newPatients,
        returningPatients: returningData ? returningData.returningPatients : 0
      };
    });
    
    // Get treatment completion rate (excluding soft deleted)
    const treatmentCompletionRate = await Patient.aggregate([
      // Exclude soft deleted patients
      { $match: { isDeleted: { $ne: true } } },
      // Unwind the medicalDetails array
      { $unwind: { path: "$medicalDetails", preserveNullAndEmptyArrays: false } },
      // Unwind the treatmentPlanning array
      { $unwind: { path: "$medicalDetails.treatmentPlanning", preserveNullAndEmptyArrays: false } },
      // Filter by date range
      { $match: {
          "medicalDetails.treatmentPlanning.treatmentDate": { $gte: start, $lte: end }
        }
      },
      // Group all data
      { $group: {
          _id: null,
          totalTreatments: { $sum: 1 },
          completedTreatments: { $sum: { $cond: [{ $eq: ["$medicalDetails.treatmentPlanning.isCompleted", true] }, 1, 0] } }
        }
      },
      // Calculate completion rate
      { $project: {
          _id: 0,
          totalTreatments: 1,
          completedTreatments: 1,
          completionRate: { 
            $cond: [
              { $eq: ["$totalTreatments", 0] },
              0,
              { $multiply: [{ $divide: ["$completedTreatments", "$totalTreatments"] }, 100] }
            ]
          }
        }
      }
    ]);
    
    // Get follow-up tracking and overdue follow-ups (excluding soft deleted)
    const today = new Date();
    const followUpData = await Patient.aggregate([
      // Exclude soft deleted patients
      { $match: { isDeleted: { $ne: true } } },
      // Unwind the medicalDetails array
      { $unwind: { path: "$medicalDetails", preserveNullAndEmptyArrays: false } },
      // Filter for records with follow-up dates
      { $match: {
          "medicalDetails.followUpDate": { $ne: null }
        }
      },
      // Group by patient
      { $group: {
          _id: "$_id",
          patientName: { $first: "$personalDetails.name" },
          contactNumber: { $first: "$personalDetails.contactNumber" },
          followUpDate: { $first: "$medicalDetails.followUpDate" },
          isOverdue: { $first: { $cond: [{ $lt: ["$medicalDetails.followUpDate", today] }, true, false] } }
        }
      },
      // Sort by follow-up date
      { $sort: { followUpDate: 1 } },
      // Format the output
      { $project: {
          _id: 0,
          patientId: "$_id",
          patientName: 1,
          contactNumber: 1,
          followUpDate: 1,
          isOverdue: 1
        }
      }
    ]);
    
    // Count overdue follow-ups
    const overdueFollowUps = followUpData.filter(f => f.isOverdue).length;
    const upcomingFollowUps = followUpData.filter(f => !f.isOverdue).length;
    
    res.status(200).json({
      success: true,
      data: {
        patientTypeData,
        treatmentCompletionRate: treatmentCompletionRate.length > 0 ? treatmentCompletionRate[0] : {
          totalTreatments: 0,
          completedTreatments: 0,
          completionRate: 0
        },
        followUpData: {
          overdueFollowUps,
          upcomingFollowUps,
          details: followUpData.slice(0, 20) // Limit to 20 records
        }
      }
    });
  } catch (error) {
    console.error("Error in getPatientInsightsAnalytics:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};

module.exports = {
  getAppointmentAnalytics,
  getRevenueAnalytics,
  getDoctorPerformanceAnalytics,
  getPatientInsightsAnalytics
};