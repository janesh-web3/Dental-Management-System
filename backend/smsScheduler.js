const cron = require("node-cron");
const axios = require("axios");
const dotenv = require("dotenv");
const aakashSmsConfig = require("./config/aakashSms");
dotenv.config();

// URL of your backend API
const API_URL = process.env.API_URL || "http://localhost:8080/api";
const API_KEY = process.env.SMS_SCHEDULER_API_KEY || "your-api-key";

// Check Aakash SMS credit balance daily
cron.schedule("0 9 * * *", async () => {
  console.log("Checking Aakash SMS credit balance...");

  try {
    // Use axios directly
    const response = await axios.get(aakashSmsConfig.availableCreditUrl, {
      headers: {
        "auth-token": aakashSmsConfig.authToken,
      },
    });

    if (response.data && response.data.available_credit !== undefined) {
      const availableCredit = response.data.available_credit;
      console.log(`Available SMS credit: ${availableCredit}`);

      // Alert if credit is low (less than 100)
      if (availableCredit < 100) {
        console.warn(
          `⚠️ WARNING: Low SMS credit! Only ${availableCredit} credits remaining.`
        );

        // You can add additional notification logic here (email, internal notification, etc.)
      }
    } else {
      console.error(
        "Failed to check SMS credit: Could not retrieve credit information"
      );
    }
  } catch (error) {
    console.error("Error checking SMS credit:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
  }
});

// Schedule task to run every 5 minutes for sending scheduled SMS
cron.schedule("*/5 * * * *", async () => {
  console.log("Running SMS scheduler task for Aakash SMS...");

  try {
    // Check credit before sending
    let hasSufficientCredit = true;

    try {
      const creditResponse = await axios.get(
        aakashSmsConfig.availableCreditUrl,
        {
          headers: {
            "auth-token": aakashSmsConfig.authToken,
          },
        }
      );

      if (creditResponse.data && creditResponse.data.available_credit <= 0) {
        console.error("❌ Cannot process scheduled SMS: No credits available");
        hasSufficientCredit = false;
      }
    } catch (creditError) {
      console.warn(
        "Could not check credit balance, proceeding anyway:",
        creditError.message
      );
    }

    if (!hasSufficientCredit) {
      return;
    }

    const response = await axios.post(
      `${API_URL}/sms/process-scheduled`,
      {},
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.success) {
      console.log(
        `SMS scheduler task completed: ${response.data.totalSent} messages sent, ${response.data.totalErrors} errors`
      );

      if (response.data.totalSent > 0) {
        console.log("Successfully sent messages:");
        response.data.results.forEach((result) => {
          console.log(
            `- To: ${result.to}, Status: ${result.status}, ID: ${result.messageId}`
          );
        });
      }

      if (response.data.totalErrors > 0) {
        console.log("Failed messages:");
        response.data.errors.forEach((error) => {
          console.log(`- ID: ${error.historyId}, Error: ${error.error}`);
        });
      }
    } else {
      console.log("SMS scheduler task completed with no messages to process");
    }
  } catch (error) {
    console.error("Error in SMS scheduler task:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
  }
});

// Fetch and log monthly SMS report on the 1st of each month
cron.schedule("0 1 1 * *", async () => {
  try {
    console.log("Generating monthly SMS report...");

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const firstDayLastMonth = new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth(),
      1
    );

    const startDate = `${firstDayLastMonth.getFullYear()}-${String(
      firstDayLastMonth.getMonth() + 1
    ).padStart(2, "0")}-01`;
    const endDate = `${lastMonth.getFullYear()}-${String(
      lastMonth.getMonth() + 1
    ).padStart(2, "0")}-${String(lastMonth.getDate()).padStart(2, "0")}`;

    const response = await axios.post(
      aakashSmsConfig.reportApiUrl,
      { start_date: startDate, end_date: endDate },
      { headers: { "auth-token": aakashSmsConfig.authToken } }
    );

    if (response.data) {
      console.log(`Monthly SMS Report (${startDate} to ${endDate}):`);
      console.log(`Total SMS sent: ${response.data.total || "N/A"}`);
      console.log(`Total credit used: ${response.data.total_credit || "N/A"}`);

      // Save the report to a file or database if needed
    }
  } catch (error) {
    console.error("Error generating monthly SMS report:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
  }
});

console.log(
  "Aakash SMS scheduler started. Messages will be processed every 5 minutes."
);
console.log("Credit balance will be checked daily at 9:00 AM.");
console.log(
  "Monthly reports will be generated on the 1st of each month at 1:00 AM."
);
