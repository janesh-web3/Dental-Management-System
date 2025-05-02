const mongoose = require("mongoose");
const dbConnect = () => {
  try {
    const connection = mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Database Connected successfully");
  } catch (error) {
    console.log("Database connection error");
  }
};

module.exports = dbConnect;
