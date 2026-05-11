const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dbConnectMiddleware = require("./middlewares/dbConnect.middleware");
const app = express();

app.use(express.json());
app.use(cookieParser());

// Determine frontend URL based on environment
const frontendURL = process.env.FRONTEND_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://digital-attendance-system-nine.vercel.app'
    : 'http://localhost:5173');

console.log("🔧 Environment Setup:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("Frontend URL:", frontendURL);
console.log("MONGO_URI:", process.env.MONGO_URI ? "✅ Set" : "❌ Missing");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "✅ Set" : "❌ Missing");

app.use(cors({
  origin: 'https://digital-attendance-system-nine.vercel.app', 
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Database Connection Middleware - MUST be before routes
app.use(dbConnectMiddleware);

// routes
const authRoutes = require("./Routes/auth.route");
const sessionRoutes = require("./Routes/session.route");
const adminRoutes = require("./Routes/admin.route");
const attendanceRoutes = require("./Routes/attendance.route");
const enrollmentRoutes = require("./Routes/enrollment.route");
const teacherRoute = require("./Routes/teacher.route");
app.use("/api/auth", authRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/enrollment", enrollmentRoutes);
app.use("/api/teacher", teacherRoute);

// test route
app.get("/", (req, res) => {
  res.send("API Running...");
});

module.exports = app;
