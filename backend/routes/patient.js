// Dashboard metrics route
router.get("/dashboard-metrics", async (req, res) => {
  try {
    const { from, to } = req.query;
    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Get total patients (exclude soft-deleted)
    const totalPatients = await Patient.countDocuments({ isDeleted: { $ne: true } });

    // Get total appointments (exclude soft-deleted)
    const totalAppointments = await Appointment.countDocuments({
      date: { $gte: fromDate, $lte: toDate },
      isDeleted: { $ne: true }
    });

    // Get total doctors (exclude soft-deleted)
    const totalDoctors = await Doctor.countDocuments({ isDeleted: { $ne: true } });

    // Get appointment status distribution (exclude soft-deleted)
    const appointmentStatus = {
      scheduled: await Appointment.countDocuments({
        date: { $gte: fromDate, $lte: toDate },
        status: "scheduled",
        isDeleted: { $ne: true }
      }),
      completed: await Appointment.countDocuments({
        date: { $gte: fromDate, $lte: toDate },
        status: "completed",
        isDeleted: { $ne: true }
      }),
      canceled: await Appointment.countDocuments({
        date: { $gte: fromDate, $lte: toDate },
        status: "canceled",
        isDeleted: { $ne: true }
      })
    };

    // Get patient growth data (exclude soft-deleted)
    const patientGrowth = await Patient.aggregate([
      {
        $match: {
          createdAt: { $gte: fromDate, $lte: toDate },
          isDeleted: { $ne: true }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          count: 1
        }
      }
    ]);

    // Get appointment distribution (exclude soft-deleted)
    const appointmentDistribution = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: fromDate, $lte: toDate },
          isDeleted: { $ne: true }
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          count: 1
        }
      }
    ]);

    // Get doctor performance (exclude soft-deleted)
    const doctorPerformance = await Doctor.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $lookup: {
          from: "appointments",
          localField: "_id",
          foreignField: "doctor",
          as: "appointments",
          pipeline: [
            { $match: { isDeleted: { $ne: true } } }
          ]
        }
      },
      {
        $project: {
          doctorName: "$name",
          appointments: {
            $size: {
              $filter: {
                input: "$appointments",
                as: "appointment",
                cond: {
                  $and: [
                    { $gte: ["$$appointment.date", fromDate] },
                    { $lte: ["$$appointment.date", toDate] }
                  ]
                }
              }
            }
          },
          completionRate: {
            $multiply: [
              {
                $divide: [
                  {
                    $size: {
                      $filter: {
                        input: "$appointments",
                        as: "appointment",
                        cond: {
                          $and: [
                            { $eq: ["$$appointment.status", "completed"] },
                            { $gte: ["$$appointment.date", fromDate] },
                            { $lte: ["$$appointment.date", toDate] }
                          ]
                        }
                      }
                    }
                  },
                  {
                    $size: {
                      $filter: {
                        input: "$appointments",
                        as: "appointment",
                        cond: {
                          $and: [
                            { $gte: ["$$appointment.date", fromDate] },
                            { $lte: ["$$appointment.date", toDate] }
                          ]
                        }
                      }
                    }
                  }
                ]
              },
              100
            ]
          }
        }
      }
    ]);

    res.json({
      data: {
        totalPatients,
        totalAppointments,
        totalDoctors,
        appointmentStatus,
        patientGrowth,
        appointmentDistribution,
        doctorPerformance
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Financial insights route
router.get("/financial-insights", async (req, res) => {
  try {
    const { from, to } = req.query;
    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Get daily revenue (exclude soft-deleted)
    const dailyRevenue = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: fromDate, $lte: toDate },
          status: "completed",
          isDeleted: { $ne: true }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          revenue: { $sum: "$amount" }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          revenue: 1
        }
      }
    ]);

    // Calculate daily, weekly, and monthly totals
    const daily = dailyRevenue.reduce((sum, day) => sum + day.revenue, 0) / dailyRevenue.length || 0;
    const weekly = dailyRevenue.reduce((sum, day) => sum + day.revenue, 0) * 7 || 0;
    const monthly = dailyRevenue.reduce((sum, day) => sum + day.revenue, 0) * 30 || 0;
    const total = dailyRevenue.reduce((sum, day) => sum + day.revenue, 0) || 0;

    // Get revenue by doctor (exclude soft-deleted)
    const revenueByDoctor = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: fromDate, $lte: toDate },
          status: "completed",
          isDeleted: { $ne: true }
        }
      },
      {
        $lookup: {
          from: "doctors",
          localField: "doctor",
          foreignField: "_id",
          as: "doctorInfo",
          pipeline: [
            { $match: { isDeleted: { $ne: true } } }
          ]
        }
      },
      {
        $unwind: "$doctorInfo"
      },
      {
        $group: {
          _id: "$doctorInfo.name",
          revenue: { $sum: "$amount" }
        }
      },
      {
        $project: {
          _id: 0,
          doctorName: "$_id",
          revenue: 1
        }
      }
    ]);

    // Get revenue by treatment (exclude soft-deleted)
    const revenueByTreatment = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: fromDate, $lte: toDate },
          status: "completed",
          isDeleted: { $ne: true }
        }
      },
      {
        $lookup: {
          from: "treatments",
          localField: "treatment",
          foreignField: "_id",
          as: "treatmentInfo"
        }
      },
      {
        $unwind: "$treatmentInfo"
      },
      {
        $group: {
          _id: "$treatmentInfo.name",
          revenue: { $sum: "$amount" }
        }
      },
      {
        $project: {
          _id: 0,
          treatmentType: "$_id",
          revenue: 1
        }
      }
    ]);

    // Get payment methods distribution (exclude soft-deleted)
    const paymentMethods = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: fromDate, $lte: toDate },
          status: "completed",
          isDeleted: { $ne: true }
        }
      },
      {
        $group: {
          _id: "$paymentMethod",
          amount: { $sum: "$amount" }
        }
      },
      {
        $project: {
          _id: 0,
          method: "$_id",
          amount: 1
        }
      }
    ]);

    // Calculate profit margin (assuming 30% profit margin)
    const profitMargin = 30;

    // Calculate average transaction value (exclude soft-deleted)
    const averageTransactionValue = total / (await Appointment.countDocuments({
      date: { $gte: fromDate, $lte: toDate },
      status: "completed",
      isDeleted: { $ne: true }
    })) || 0;

    res.json({
      data: {
        daily,
        weekly,
        monthly,
        total,
        revenueByDoctor,
        revenueByTreatment,
        revenueTrend: dailyRevenue,
        paymentMethods,
        profitMargin,
        averageTransactionValue
      }
    });
  } catch (error) {
    console.error("Error fetching financial insights:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}); 