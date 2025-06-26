const { generateToken } = require("../middleware/jwtToken.js");

const User = require("../model/User.js");
const Appointment = require("../model/Appointment.js");
const Patient = require("../model/Patient.js");
const Doctor = require("../model/Doctor.js");

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
    console.log("Login attempt for:", contact);
    
    if (!contact || !password) {
      console.log("Missing credentials:", { contact: !!contact, password: !!password });
      return res.status(400).json({ message: "Contact and password are required" });
    }
    
    // Attempt to find the user without any type conversion first
    let user = await User.findOne({ contact });
    
    // If user not found, try with string contact
    if (!user && typeof contact === 'number') {
      user = await User.findOne({ contact: contact.toString() });
    }
    
    // If still not found, try with different formats
    if (!user) {
      const contactStr = contact.toString().trim();
      console.log("Trying alternate formats for:", contactStr);
      user = await User.findOne({ 
        $or: [
          { contact: contactStr },
          { contact: contactStr.replace(/^0+/, '') } // Remove leading zeros
        ]
      });
    }
    
    console.log("User found:", user ? "Yes" : "No");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    console.log("Verifying password for user:", user._id);
    const match = await bcrypt.compare(password, user.password);
    
    if (match) {
      const token = generateToken(user._id);
      console.log("Login successful for:", user._id);
      return res.status(200).json({ 
        message: "Logged in successfully", 
        token, 
        user: {
          _id: user._id,
          name: user.name,
          role: user.role,
          email: user.email
        }
      });
    } else {
      console.log("Password mismatch for user:", user._id);
      return res.status(401).json({ message: "Incorrect password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ 
      error: "An error occurred during login", 
      details: error.message 
    });
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
    const { name, email, role, contact, password } = req.body;

    // Create update object
    const updateData = { name, email, role, contact };

    // If password is provided, hash it and add to update
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
    }).select("-password"); // Exclude password from response

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: error.message });
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

module.exports = {
  dashboard,
  addUser,
  loginUser,
  getRole,
  updateUser,
  deleteUser,
  getUsers,
};
