// Dashboard metrics route
router.get("/dashboard-metrics", async (req, res) => {
  try {
    const { from, to } = req.query;
    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Get total patients
    const totalPatients = await Patient.countDocuments();

    // Get total appointments
    const totalAppointments = await Appointment.countDocuments({
      date: { $gte: fromDate, $lte: toDate }
    });

    // Get total doctors
    const totalDoctors = await Doctor.countDocuments();

    // Get appointment status distribution
    const appointmentStatus = {
      scheduled: await Appointment.countDocuments({
        date: { $gte: fromDate, $lte: toDate },
        status: "scheduled"
      }),
      completed: await Appointment.countDocuments({
        date: { $gte: fromDate, $lte: toDate },
        status: "completed"
      }),
      canceled: await Appointment.countDocuments({
        date: { $gte: fromDate, $lte: toDate },
        status: "canceled"
      })
    };

    // Get patient growth data
    const patientGrowth = await Patient.aggregate([
      {
        $match: {
          createdAt: { $gte: fromDate, $lte: toDate }
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

    // Get appointment distribution
    const appointmentDistribution = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: fromDate, $lte: toDate }
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

    // Get doctor performance
    const doctorPerformance = await Doctor.aggregate([
      {
        $lookup: {
          from: "appointments",
          localField: "_id",
          foreignField: "doctor",
          as: "appointments"
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

    // Get daily revenue
    const dailyRevenue = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: fromDate, $lte: toDate },
          status: "completed"
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

    // Get revenue by doctor
    const revenueByDoctor = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: fromDate, $lte: toDate },
          status: "completed"
        }
      },
      {
        $lookup: {
          from: "doctors",
          localField: "doctor",
          foreignField: "_id",
          as: "doctorInfo"
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

    // Get revenue by treatment
    const revenueByTreatment = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: fromDate, $lte: toDate },
          status: "completed"
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

    // Get payment methods distribution
    const paymentMethods = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: fromDate, $lte: toDate },
          status: "completed"
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

    // Calculate average transaction value
    const averageTransactionValue = total / (await Appointment.countDocuments({
      date: { $gte: fromDate, $lte: toDate },
      status: "completed"
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