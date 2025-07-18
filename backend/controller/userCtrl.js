const { generateToken } = require("../middleware/jwtToken.js");

const User = require("../model/User.js");
const Appointment = require("../model/Appointment.js");
const Patient = require("../model/Patient.js");
const Doctor = require("../model/Doctor.js");
const Income = require("../model/Income.js");
const Expense = require("../model/Expense.js");
const ServicePayment = require("../model/ServicePayment.js");

const bcrypt = require("bcrypt");

const addUser = async (req, res) => {
  try {
    const { name, email, password, role, contact } = req.body;
    const findUser = await User.findOne({ contact: contact });
    if (!findUser) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        role,
        contact,
      });
      await newUser.save();
      res.status(201).json(newUser);
    } else {
      res.json("User already exists");
    }
  } catch (error) {
    res.json({ error: error });
    console.log(error);
  }
};

const loginUser = async (req, res) => {
  try {
    const { contact, password } = req.body;
    console.log("Login attempt:", { contact, passwordLength: password ? password.length : 0 });
    
    // Check if contact is a number or string and handle accordingly
    let contactQuery = contact;
    if (!isNaN(contact)) {
      contactQuery = contact.toString();
    }
    
    const user = await User.findOne({ contact: contactQuery });
    
    if (!user) {
      console.log("User not found for contact:", contact);
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: "Account is deactivated. Please contact administrator." });
    }
    
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      // Update last login
      user.lastLogin = new Date();
      await user.save();

      const token = generateToken(user._id);
      return res.status(200).json({ 
        message: "Logged in successfully", 
        token: token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions
        }
      });
    } else {
      console.log("Password mismatch for user:", user._id);
      return res.status(401).json({ message: "Incorrect password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: error.message || "An error occurred during login" });
  }
};

const dashboard = async (req, res) => {
  try {
    const now = new Date();
    const today = now.toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

    // Doctor Performance Analysis
    const doctorAnalysis = await Doctor.aggregate([
      {
        $lookup: {
          from: "appointments",
          localField: "_id",
          foreignField: "doctor",
          as: "appointments",
        },
      },
      {
        $addFields: {
          totalAppointments: { $size: "$appointments" },
          completedAppointments: {
            $size: {
              $filter: {
                input: "$appointments",
                as: "appointment",
                cond: { $eq: ["$$appointment.hasVisited", true] },
              },
            },
          },
          todayAppointments: {
            $size: {
              $filter: {
                input: "$appointments",
                as: "appointment",
                cond: {
                  $and: [
                    { $eq: ["$$appointment.appointmentDate", today] },
                    { $eq: ["$$appointment.status", "Accepted"] },
                  ],
                },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          specialization: 1,
          image: 1,
          totalAppointments: 1,
          completedAppointments: 1,
          todayAppointments: 1,
          performanceRate: {
            $multiply: [
              {
                $cond: [
                  { $eq: ["$totalAppointments", 0] },
                  0,
                  {
                    $divide: ["$completedAppointments", "$totalAppointments"],
                  },
                ],
              },
              100,
            ],
          },
        },
      },
    ]);

    // Recent Treatments with Documents
    const recentTreatments = await Patient.aggregate([
      { $unwind: "$medicalDetails" },
      { $unwind: "$medicalDetails.treatmentPlanning" },
      {
        $match: {
          "medicalDetails.treatmentPlanning.treatmentDocuments": {
            $exists: true,
            $ne: [],
          },
        },
      },
      { $sort: { "medicalDetails.treatmentPlanning.treatmentDate": -1 } },
      { $limit: 10 },
      {
        $project: {
          patientName: "$personalDetails.name",
          treatment: "$medicalDetails.treatmentPlanning.treatmentDetails", // Corrected field name
          date: "$medicalDetails.treatmentPlanning.treatmentDate",
          amount: "$medicalDetails.treatmentPlanning.treatmentAmount",
          documents: {
            $map: {
              input: "$medicalDetails.treatmentPlanning.treatmentDocuments",
              as: "doc",
              in: {
                fileName: "$$doc.fileName", // Corrected field name
                fileUrl: "$$doc.fileUrl", // Corrected field name
                uploadDate: "$$doc.uploadDate", // Corrected field name
              },
            },
          },
        },
      },
    ]);

    // Treatment Analysis
    const treatments = await Patient.aggregate([
      { $unwind: "$medicalDetails" },
      { $unwind: "$medicalDetails.treatmentPlanning" },
      {
        $group: {
          _id: "$medicalDetails.treatmentPlanning.treatmentName",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Add appointment statistics
    const appointmentStats = await Appointment.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
          },
          accepted: {
            $sum: { $cond: [{ $eq: ["$status", "Accepted"] }, 1, 0] },
          },
          rejected: {
            $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] },
          },
        },
      },
    ]);

    // Today's Appointments with Doctor Details
    const todayAppointments = await Appointment.find({
      appointmentDate: today,
      status: "Accepted",
    })
      .populate("doctor", "name")
      .sort({ appointmentTime: 1 });

    // Get upcoming appointments
    const upcomingAppointments = await Appointment.find({
      appointmentDate: { $gt: today },
      status: "Accepted",
    })
      .populate("doctor")
      .sort({ appointmentDate: 1 })
      .limit(5);

    // Basic counts
    const totalPatients = (await Patient.countDocuments()) || 0;
    const totalDoctors = (await Doctor.countDocuments()) || 0;
    const monthlyPatients =
      (await Patient.countDocuments({
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
        },
      })) || 0;

    res.json({
      overview: {
        totalPatients,
        totalDoctors,
        monthlyPatients,
        todayAppointmentsCount: todayAppointments?.length || 0,
        appointmentStats: appointmentStats[0] || {
          total: 0,
          pending: 0,
          accepted: 0,
          rejected: 0,
        },
      },
      appointments: {
        today: todayAppointments,
        upcoming: upcomingAppointments,
      },
      analytics: {
        topTreatments: treatments,
        recentTreatments,
        financialAnalysis: {
          daily: await calculateRevenue(today),
          weekly: await calculateRevenue(
            new Date(now.setDate(now.getDate() - 7)).toISOString().split("T")[0]
          ),
          monthly: await calculateRevenue(
            new Date(now.getFullYear(), now.getMonth(), 1)
              .toISOString()
              .split("T")[0]
          ),
          total: await calculateTotalRevenue(),
        },
        doctorAnalysis,
      },
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Helper function for revenue calculation
async function calculateRevenue(startDate) {
  const result = await Patient.aggregate([
    { $unwind: "$medicalDetails" },
    { $unwind: "$medicalDetails.treatmentPlanning" },
    {
      $match: {
        "medicalDetails.treatmentPlanning.treatmentDate": {
          $gte: new Date(startDate),
        },
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $cond: [
              {
                $eq: ["$medicalDetails.treatmentPlanning.treatmentAmount", ""],
              },
              0,
              {
                $toDouble: {
                  $ifNull: [
                    "$medicalDetails.treatmentPlanning.treatmentAmount",
                    "0",
                  ],
                },
              },
            ],
          },
        },
      },
    },
  ]);
  return result[0]?.total || 0;
}

async function calculateTotalRevenue() {
  const result = await Patient.aggregate([
    { $unwind: "$medicalDetails" },
    { $unwind: "$medicalDetails.treatmentPlanning" },
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $cond: [
              {
                $eq: ["$medicalDetails.treatmentPlanning.treatmentAmount", ""],
              },
              0,
              {
                $toDouble: {
                  $ifNull: [
                    "$medicalDetails.treatmentPlanning.treatmentAmount",
                    "0",
                  ],
                },
              },
            ],
          },
        },
      },
    },
  ]);
  return result[0]?.total || 0;
}
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, contact, password, permissions } = req.body;

    // Create update object
    const updateData = { name, email, role, contact };

    // If password is provided, hash it and add to update
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // If permissions are provided, add them to update
    if (permissions) {
      updateData.permissions = permissions;
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
    }).select("-password"); // Exclude password from response

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error updating user", 
      error: error.message 
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: error.message });
  }
};

const getRole = async (req, res) => {
  try {
    // If no user ID in request, return a graceful error rather than 500
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Find the user
    const getUser = await User.findById(req.user._id);

    if (getUser) {
      return res.status(200).json({
        _id: getUser._id,
        name: getUser.name,
        email: getUser.email,
        role: getUser.role,
        contact: getUser.contact,
      });
    }

    // User not found - return 404
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  } catch (error) {
    console.error("Get role error:", error);
    // Return a more graceful error response
    return res.status(400).json({
      success: false,
      message: "Failed to get user role",
      error: error.message,
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // Exclude password field
    res.status(200).json({ data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: error.message });
  }
};

// Admin Dashboard with Full Access
const adminDashboard = async (req, res) => {
  try {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

    // Comprehensive analytics for admin
    const [
      totalPatients,
      totalDoctors,
      totalUsers,
      monthlyPatients,
      appointmentStats,
      todayAppointments,
      upcomingAppointments,
      recentTreatments,
      treatments,
      financialData,
      doctorAnalysis,
      revenueAnalytics
    ] = await Promise.all([
      Patient.countDocuments(),
      Doctor.countDocuments(),
      User.countDocuments(),
      Patient.countDocuments({ createdAt: { $gte: startOfMonth } }),
      
      // Appointment statistics
      Appointment.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
            accepted: { $sum: { $cond: [{ $eq: ["$status", "Accepted"] }, 1, 0] } },
            rejected: { $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] } },
          }
        }
      ]),
      
      // Today's appointments
      Appointment.find({ appointmentDate: today, status: "Accepted" })
        .populate("doctor", "name")
        .sort({ appointmentTime: 1 }),
      
      // Upcoming appointments
      Appointment.find({ appointmentDate: { $gt: today }, status: "Accepted" })
        .populate("doctor")
        .sort({ appointmentDate: 1 })
        .limit(5),
      
      // Recent treatments
      Patient.aggregate([
        { $unwind: "$medicalDetails" },
        { $unwind: "$medicalDetails.treatmentPlanning" },
        { $sort: { "medicalDetails.treatmentPlanning.treatmentDate": -1 } },
        { $limit: 10 },
        {
          $project: {
            patientName: "$personalDetails.name",
            treatment: "$medicalDetails.treatmentPlanning.treatmentDetails",
            date: "$medicalDetails.treatmentPlanning.treatmentDate",
            amount: "$medicalDetails.treatmentPlanning.treatmentAmount"
          }
        }
      ]),
      
      // Top treatments
      Patient.aggregate([
        { $unwind: "$medicalDetails" },
        { $unwind: "$medicalDetails.treatmentPlanning" },
        {
          $group: {
            _id: "$medicalDetails.treatmentPlanning.treatmentName",
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      
      // Financial data
      Promise.all([
        Income.aggregate([
          { $group: { _id: null, total: { $sum: { $toDouble: "$amount" } } } }
        ]),
        Expense.aggregate([
          { $group: { _id: null, total: { $sum: { $toDouble: "$amount" } } } }
        ]),
        ServicePayment.aggregate([
          { $group: { _id: null, total: { $sum: { $toDouble: "$amount" } } } }
        ])
      ]),
      
      // Doctor analysis
      Doctor.aggregate([
        {
          $lookup: {
            from: "appointments",
            localField: "_id",
            foreignField: "doctor",
            as: "appointments"
          }
        },
        {
          $addFields: {
            totalAppointments: { $size: "$appointments" },
            completedAppointments: {
              $size: {
                $filter: {
                  input: "$appointments",
                  as: "appointment",
                  cond: { $eq: ["$$appointment.hasVisited", true] }
                }
              }
            }
          }
        },
        {
          $project: {
            name: 1,
            specialization: 1,
            totalAppointments: 1,
            completedAppointments: 1,
            performanceRate: {
              $multiply: [
                {
                  $cond: [
                    { $eq: ["$totalAppointments", 0] },
                    0,
                    { $divide: ["$completedAppointments", "$totalAppointments"] }
                  ]
                },
                100
              ]
            }
          }
        }
      ]),
      
      // Revenue analytics
      calculateRevenueAnalytics()
    ]);

    res.json({
      overview: {
        totalPatients,
        totalDoctors,
        totalUsers,
        monthlyPatients,
        todayAppointmentsCount: todayAppointments?.length || 0,
        appointmentStats: appointmentStats[0] || { total: 0, pending: 0, accepted: 0, rejected: 0 }
      },
      appointments: {
        today: todayAppointments,
        upcoming: upcomingAppointments
      },
      analytics: {
        topTreatments: treatments,
        recentTreatments,
        doctorAnalysis,
        revenueAnalytics
      },
      financial: {
        totalIncome: financialData[0][0]?.total || 0,
        totalExpenses: financialData[1][0]?.total || 0,
        totalServicePayments: financialData[2][0]?.total || 0,
        netProfit: (financialData[0][0]?.total || 0) - (financialData[1][0]?.total || 0)
      }
    });
  } catch (error) {
    console.error("Admin Dashboard Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Staff Dashboard with Limited Access
const staffDashboard = async (req, res) => {
  try {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

    // Limited analytics for staff
    const [
      todayAppointments,
      todayIncome,
      todayExpenses,
      weeklyIncome,
      weeklyExpenses,
      basicStats
    ] = await Promise.all([
      // Today's appointments
      Appointment.find({ appointmentDate: today, status: "Accepted" })
        .populate("doctor", "name")
        .sort({ appointmentTime: 1 }),
      
      // Today's income
      Income.aggregate([
        { $match: { date: { $gte: new Date(today) } } },
        { $group: { _id: null, total: { $sum: { $toDouble: "$amount" } } } }
      ]),
      
      // Today's expenses
      Expense.aggregate([
        { $match: { date: { $gte: new Date(today) } } },
        { $group: { _id: null, total: { $sum: { $toDouble: "$amount" } } } }
      ]),
      
      // Weekly income
      Income.aggregate([
        { $match: { date: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: { $toDouble: "$amount" } } } }
      ]),
      
      // Weekly expenses
      Expense.aggregate([
        { $match: { date: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: { $toDouble: "$amount" } } } }
      ]),
      
      // Basic statistics
      Promise.all([
        Patient.countDocuments(),
        Doctor.countDocuments(),
        Appointment.countDocuments({ status: "Pending" })
      ])
    ]);

    const dailyCollection = todayIncome[0]?.total || 0;
    const dailyExpenses = todayExpenses[0]?.total || 0;
    const weeklyCollection = weeklyIncome[0]?.total || 0;
    const weeklyExpensesTotal = weeklyExpenses[0]?.total || 0;

    res.json({
      overview: {
        dailyCollection,
        dailyExpenses,
        dailyNet: dailyCollection - dailyExpenses,
        weeklyCollection,
        weeklyExpenses: weeklyExpensesTotal,
        weeklyNet: weeklyCollection - weeklyExpensesTotal,
        totalPatients: basicStats[0],
        totalDoctors: basicStats[1],
        pendingAppointments: basicStats[2]
      },
      appointments: {
        today: todayAppointments
      },
      transactions: {
        todayIncome: dailyCollection,
        todayExpenses: dailyExpenses,
        weeklyIncome: weeklyCollection,
        weeklyExpenses: weeklyExpensesTotal
      }
    });
  } catch (error) {
    console.error("Staff Dashboard Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Helper function for revenue analytics
async function calculateRevenueAnalytics() {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [daily, weekly, monthly, total] = await Promise.all([
    calculateRevenue(today),
    calculateRevenue(startOfWeek.toISOString().split("T")[0]),
    calculateRevenue(startOfMonth.toISOString().split("T")[0]),
    calculateTotalRevenue()
  ]);

  return { daily, weekly, monthly, total };
}

// User management endpoints
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, contact, permissions } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { contact }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "User with this email or contact already exists" 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      contact,
      permissions: permissions || undefined, // Let the schema handle default permissions
    });

    await newUser.save();
    
    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        contact: newUser.contact,
        isActive: newUser.isActive,
        permissions: newUser.permissions,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error creating user", 
      error: error.message 
    });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error("Toggle user status error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error updating user status", 
      error: error.message 
    });
  }
};

const changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    user.role = role;
    await user.save(); // This will trigger the pre-save middleware to update permissions

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error("Change user role error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error updating user role", 
      error: error.message 
    });
  }
};

module.exports = {
  dashboard,
  addUser,
  loginUser,
  getRole,
  updateUser,
  deleteUser,
  getUsers,
  adminDashboard,
  staffDashboard,
  createUser,
  toggleUserStatus,
  changeUserRole,
};
