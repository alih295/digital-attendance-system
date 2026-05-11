const connectDB = require("../config/db/db");

// This middleware ensures database is connected for every request
const dbConnectMiddleware = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("❌ DB Connection Error:", error.message);
    res.status(500).json({ 
      message: "Database connection failed",
      error: error.message 
    });
  }
};

module.exports = dbConnectMiddleware;
