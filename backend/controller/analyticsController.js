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
    
    // Get revenue from daily treatments (selectedTeethDetails)
    const dailyTreatmentRevenue = await Patient.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $unwind: { path: "$medicalDetails", preserveNullAndEmptyArrays: false } },
      { $unwind: { path: "$medicalDetails.treatmentPlanning", preserveNullAndEmptyArrays: false } },
      { $unwind: { path: "$medicalDetails.treatmentPlanning.selectedTeethDetails", preserveNullAndEmptyArrays: false } },
      { $unwind: { path: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments", preserveNullAndEmptyArrays: false } },
      { $match: {
          "medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date": { $gte: start, $lte: end }
        }
      },
      { $group: {
          _id: period === 'monthly' 
            ? { year: { $year: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date" }, month: { $month: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date" } }
            : period === 'weekly'
              ? { year: { $year: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date" }, week: { $week: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date" } }
              : { year: { $year: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date" }, month: { $month: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date" }, day: { $dayOfMonth: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date" } },
          totalAmount: { $sum: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.treatmentAmount" },
          paidAmount: { $sum: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.paidAmount" },
          date: { $first: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date" }
        }
      }
    ]);

    // Get revenue from group treatments
    const groupTreatmentRevenue = await Patient.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $unwind: { path: "$medicalDetails", preserveNullAndEmptyArrays: false } },
      { $unwind: { path: "$medicalDetails.treatmentPlanning", preserveNullAndEmptyArrays: false } },
      { $unwind: { path: "$medicalDetails.treatmentPlanning.groupTreatmentDetails", preserveNullAndEmptyArrays: false } },
      { $unwind: { path: "$medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments", preserveNullAndEmptyArrays: false } },
      { $match: {
          "medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments.date": { $gte: start, $lte: end }
        }
      },
      { $group: {
          _id: period === 'monthly' 
            ? { year: { $year: "$medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments.date" }, month: { $month: "$medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments.date" } }
            : period === 'weekly'
              ? { year: { $year: "$medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments.date" }, week: { $week: "$medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments.date" } }
              : { year: { $year: "$medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments.date" }, month: { $month: "$medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments.date" }, day: { $dayOfMonth: "$medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments.date" } },
          totalAmount: { $sum: "$medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments.treatmentAmount" },
          paidAmount: { $sum: "$medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments.paidAmount" },
          date: { $first: "$medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments.date" }
        }
      }
    ]);

    // Get revenue from service payments
    const ServicePayment = require("../model/ServicePayment");
    const servicePaymentRevenue = await ServicePayment.aggregate([
      { $match: { isDeleted: { $ne: true }, date: { $gte: start, $lte: end } } },
      { $group: {
          _id: period === 'monthly' 
            ? { year: { $year: "$date" }, month: { $month: "$date" } }
            : period === 'weekly'
              ? { year: { $year: "$date" }, week: { $week: "$date" } }
              : { year: { $year: "$date" }, month: { $month: "$date" }, day: { $dayOfMonth: "$date" } },
          totalAmount: { $sum: "$amount" },
          paidAmount: { $sum: "$amount" }, // Service payments are always paid
          date: { $first: "$date" }
        }
      }
    ]);

    // Get revenue from income transactions
    const Income = require("../model/Income");
    const incomeRevenue = await Income.aggregate([
      { $match: { isDeleted: { $ne: true }, date: { $gte: start, $lte: end } } },
      { $group: {
          _id: period === 'monthly' 
            ? { year: { $year: "$date" }, month: { $month: "$date" } }
            : period === 'weekly'
              ? { year: { $year: "$date" }, week: { $week: "$date" } }
              : { year: { $year: "$date" }, month: { $month: "$date" }, day: { $dayOfMonth: "$date" } },
          totalAmount: { $sum: "$amount" },
          paidAmount: { $sum: "$amount" }, // Income is always paid
          date: { $first: "$date" }
        }
      }
    ]);

    // Combine all revenue sources by date
    const revenueMap = new Map();
    const addToRevenueMap = (revenueArray) => {
      revenueArray.forEach(item => {
        const dateKey = period === 'monthly' 
          ? `${item._id.year}-${String(item._id.month).padStart(2, '0')}`
          : period === 'weekly'
            ? `${item._id.year}-W${String(item._id.week).padStart(2, '0')}`
            : `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
        
        if (revenueMap.has(dateKey)) {
          const existing = revenueMap.get(dateKey);
          existing.totalAmount += item.totalAmount || 0;
          existing.paidAmount += item.paidAmount || 0;
          existing.remainingAmount = existing.totalAmount - existing.paidAmount;
        } else {
          revenueMap.set(dateKey, {
            date: dateKey,
            totalAmount: item.totalAmount || 0,
            paidAmount: item.paidAmount || 0,
            remainingAmount: (item.totalAmount || 0) - (item.paidAmount || 0)
          });
        }
      });
    };

    addToRevenueMap(dailyTreatmentRevenue);
    addToRevenueMap(groupTreatmentRevenue);
    addToRevenueMap(servicePaymentRevenue);
    addToRevenueMap(incomeRevenue);

    // Convert map to sorted array
    const revenueData = Array.from(revenueMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    
    // Get doctor-wise revenue from all sources (excluding soft deleted)
    const dailyTreatmentDoctorRevenue = await Patient.aggregate([
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
      }
    ]);

    // Get doctor-wise revenue from group treatments
    const groupTreatmentDoctorRevenue = await Patient.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $unwind: { path: "$medicalDetails", preserveNullAndEmptyArrays: false } },
      { $unwind: { path: "$medicalDetails.treatmentPlanning", preserveNullAndEmptyArrays: false } },
      { $unwind: { path: "$medicalDetails.treatmentPlanning.groupTreatmentDetails", preserveNullAndEmptyArrays: false } },
      { $unwind: { path: "$medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments", preserveNullAndEmptyArrays: false } },
      { $match: {
          "medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments.date": { $gte: start, $lte: end },
          "medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments.treatedByDoctor": { $ne: null }
        }
      },
      { $lookup: {
          from: "doctors",
          localField: "medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments.treatedByDoctor",
          foreignField: "_id",
          as: "doctorInfo"
        }
      },
      { $unwind: { path: "$doctorInfo", preserveNullAndEmptyArrays: true } },
      { $group: {
          _id: "$doctorInfo._id",
          doctorName: { $first: "$doctorInfo.name" },
          totalAmount: { $sum: "$medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments.treatmentAmount" },
          paidAmount: { $sum: "$medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments.paidAmount" }
        }
      }
    ]);

    // Get doctor-wise revenue from service payments
    const servicePaymentDoctorRevenue = await ServicePayment.aggregate([
      { $match: { isDeleted: { $ne: true }, date: { $gte: start, $lte: end }, treatedByDoctor: { $ne: null } } },
      { $lookup: {
          from: "doctors",
          localField: "treatedByDoctor",
          foreignField: "_id",
          as: "doctorInfo"
        }
      },
      { $unwind: { path: "$doctorInfo", preserveNullAndEmptyArrays: true } },
      { $group: {
          _id: "$doctorInfo._id",
          doctorName: { $first: "$doctorInfo.name" },
          totalAmount: { $sum: "$amount" },
          paidAmount: { $sum: "$amount" }
        }
      }
    ]);

    // Combine all doctor revenue sources
    const doctorRevenueMap = new Map();
    const addToDoctorRevenueMap = (revenueArray) => {
      revenueArray.forEach(item => {
        if (item._id && item.doctorName) {
          const doctorKey = item._id.toString();
          if (doctorRevenueMap.has(doctorKey)) {
            const existing = doctorRevenueMap.get(doctorKey);
            existing.totalAmount += item.totalAmount || 0;
            existing.paidAmount += item.paidAmount || 0;
          } else {
            doctorRevenueMap.set(doctorKey, {
              doctorId: item._id,
              doctorName: item.doctorName,
              totalAmount: item.totalAmount || 0,
              paidAmount: item.paidAmount || 0
            });
          }
        }
      });
    };

    addToDoctorRevenueMap(dailyTreatmentDoctorRevenue);
    addToDoctorRevenueMap(groupTreatmentDoctorRevenue);
    addToDoctorRevenueMap(servicePaymentDoctorRevenue);

    // Convert to array and add remaining amount
    const doctorRevenue = Array.from(doctorRevenueMap.values())
      .map(doctor => ({
        ...doctor,
        remainingAmount: doctor.totalAmount - doctor.paidAmount
      }))
      .sort((a, b) => b.paidAmount - a.paidAmount)
      .slice(0, 10);
    
    // Get top paying patients from all sources (excluding soft deleted)
    const dailyTreatmentPatients = await Patient.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $unwind: { path: "$medicalDetails", preserveNullAndEmptyArrays: false } },
      { $unwind: { path: "$medicalDetails.treatmentPlanning", preserveNullAndEmptyArrays: false } },
      { $unwind: { path: "$medicalDetails.treatmentPlanning.selectedTeethDetails", preserveNullAndEmptyArrays: false } },
      { $unwind: { path: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments", preserveNullAndEmptyArrays: false } },
      { $match: {
          "medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.date": { $gte: start, $lte: end }
        }
      },
      { $group: {
          _id: "$_id",
          patientName: { $first: "$personalDetails.name" },
          totalPaid: { $sum: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.paidAmount" },
          totalAmount: { $sum: "$medicalDetails.treatmentPlanning.selectedTeethDetails.dailyTreatments.treatmentAmount" }
        }
      }
    ]);

    // Get patient revenue from group treatments
    const groupTreatmentPatients = await Patient.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $unwind: { path: "$medicalDetails", preserveNullAndEmptyArrays: false } },
      { $unwind: { path: "$medicalDetails.treatmentPlanning", preserveNullAndEmptyArrays: false } },
      { $unwind: { path: "$medicalDetails.treatmentPlanning.groupTreatmentDetails", preserveNullAndEmptyArrays: false } },
      { $unwind: { path: "$medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments", preserveNullAndEmptyArrays: false } },
      { $match: {
          "medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments.date": { $gte: start, $lte: end }
        }
      },
      { $group: {
          _id: "$_id",
          patientName: { $first: "$personalDetails.name" },
          totalPaid: { $sum: "$medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments.paidAmount" },
          totalAmount: { $sum: "$medicalDetails.treatmentPlanning.groupTreatmentDetails.dailyTreatments.treatmentAmount" }
        }
      }
    ]);

    // Get patient revenue from service payments
    const servicePaymentPatients = await ServicePayment.aggregate([
      { $match: { isDeleted: { $ne: true }, date: { $gte: start, $lte: end } } },
      { $group: {
          _id: "$patientId",
          totalPaid: { $sum: "$amount" },
          totalAmount: { $sum: "$amount" }
        }
      },
      { $lookup: {
          from: "patients",
          localField: "_id",
          foreignField: "_id",
          as: "patientInfo"
        }
      },
      { $unwind: { path: "$patientInfo", preserveNullAndEmptyArrays: true } },
      { $project: {
          _id: 1,
          patientName: "$patientInfo.personalDetails.name",
          totalPaid: 1,
          totalAmount: 1
        }
      }
    ]);

    // Combine all patient revenue sources
    const patientRevenueMap = new Map();
    const addToPatientRevenueMap = (revenueArray) => {
      revenueArray.forEach(item => {
        if (item._id && item.patientName) {
          const patientKey = item._id.toString();
          if (patientRevenueMap.has(patientKey)) {
            const existing = patientRevenueMap.get(patientKey);
            existing.totalAmount += item.totalAmount || 0;
            existing.totalPaid += item.totalPaid || 0;
          } else {
            patientRevenueMap.set(patientKey, {
              patientId: item._id,
              patientName: item.patientName,
              totalAmount: item.totalAmount || 0,
              totalPaid: item.totalPaid || 0
            });
          }
        }
      });
    };

    addToPatientRevenueMap(dailyTreatmentPatients);
    addToPatientRevenueMap(groupTreatmentPatients);
    addToPatientRevenueMap(servicePaymentPatients);

    // Convert to array and add remaining amount
    const topPayingPatients = Array.from(patientRevenueMap.values())
      .map(patient => ({
        ...patient,
        remainingAmount: patient.totalAmount - patient.totalPaid
      }))
      .sort((a, b) => b.totalPaid - a.totalPaid)
      .slice(0, 10);
    
    // Get outstanding amounts from treatment revenue only (not service payments or income)
    const treatmentPatientMap = new Map();
    [...dailyTreatmentPatients, ...groupTreatmentPatients].forEach(patient => {
      if (patient._id && patient.patientName) {
        const patientKey = patient._id.toString();
        if (treatmentPatientMap.has(patientKey)) {
          const existing = treatmentPatientMap.get(patientKey);
          existing.totalAmount += patient.totalAmount || 0;
          existing.totalPaid += patient.totalPaid || 0;
        } else {
          treatmentPatientMap.set(patientKey, {
            patientId: patient._id,
            patientName: patient.patientName,
            totalAmount: patient.totalAmount || 0,
            totalPaid: patient.totalPaid || 0
          });
        }
      }
    });

    const outstandingAmounts = Array.from(treatmentPatientMap.values())
      .map(patient => ({
        ...patient,
        remainingAmount: patient.totalAmount - patient.totalPaid
      }))
      .filter(patient => patient.remainingAmount > 0)
      .map(patient => ({
        patientId: patient.patientId,
        patientName: patient.patientName,
        totalRemaining: patient.remainingAmount
      }))
      .sort((a, b) => b.totalRemaining - a.totalRemaining);

    // Get contact numbers for outstanding patients
    const patientIds = outstandingAmounts.map(p => p.patientId);
    const patientContacts = await Patient.find(
      { _id: { $in: patientIds }, isDeleted: { $ne: true } },
      { _id: 1, "personalDetails.contactNumber": 1 }
    );

    // Add contact numbers to outstanding amounts
    const contactMap = new Map(
      patientContacts.map(p => [p._id.toString(), p.personalDetails?.contactNumber])
    );

    outstandingAmounts.forEach(patient => {
      patient.contactNumber = contactMap.get(patient.patientId.toString()) || "N/A";
    });
    
    // Calculate service payment and income totals separately
    const servicePaymentTotal = await ServicePayment.aggregate([
      { $match: { isDeleted: { $ne: true }, date: { $gte: start, $lte: end } } },
      { $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    const incomeTotal = await Income.aggregate([
      { $match: { isDeleted: { $ne: true }, date: { $gte: start, $lte: end } } },
      { $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate treatment revenue totals from the raw treatment data (not patient aggregated data)
    const dailyTreatmentTotals = dailyTreatmentRevenue.reduce((acc, item) => {
      acc.totalAmount += item.totalAmount || 0;
      acc.paidAmount += item.paidAmount || 0;
      return acc;
    }, { totalAmount: 0, paidAmount: 0 });

    const groupTreatmentTotals = groupTreatmentRevenue.reduce((acc, item) => {
      acc.totalAmount += item.totalAmount || 0;
      acc.paidAmount += item.paidAmount || 0;
      return acc;
    }, { totalAmount: 0, paidAmount: 0 });

    const treatmentRevenueTotals = {
      totalAmount: dailyTreatmentTotals.totalAmount + groupTreatmentTotals.totalAmount,
      paidAmount: dailyTreatmentTotals.paidAmount + groupTreatmentTotals.paidAmount,
      remainingAmount: (dailyTreatmentTotals.totalAmount + groupTreatmentTotals.totalAmount) - (dailyTreatmentTotals.paidAmount + groupTreatmentTotals.paidAmount)
    };

    // Calculate overall revenue metrics from all sources (treatments + services + income)
    const servicePaymentAmount = servicePaymentTotal.length > 0 ? servicePaymentTotal[0].totalAmount : 0;
    const incomeAmount = incomeTotal.length > 0 ? incomeTotal[0].totalAmount : 0;

    const overallRevenue = {
      totalAmount: treatmentRevenueTotals.totalAmount + servicePaymentAmount + incomeAmount,
      paidAmount: treatmentRevenueTotals.paidAmount + servicePaymentAmount + incomeAmount, // Services and income are always paid
      remainingAmount: treatmentRevenueTotals.remainingAmount // Only treatments have remaining amounts
    };

    res.status(200).json({
      success: true,
      data: {
        revenueData,
        doctorRevenue,
        topPayingPatients,
        outstandingAmounts,
        overallRevenue,
        revenueBreakdown: {
          treatmentRevenue: treatmentRevenueTotals,
          servicePayments: servicePaymentTotal.length > 0 ? servicePaymentTotal[0] : { totalAmount: 0, count: 0 },
          income: incomeTotal.length > 0 ? incomeTotal[0] : { totalAmount: 0, count: 0 }
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