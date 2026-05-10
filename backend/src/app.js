const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();




// middlewares
app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: true, // Deploy ke baad hum yahan exact Vercel link daal denge
  credentials: true
}));

// routes
const authRoutes = require("./Routes/auth.route");
const sessionRoutes = require("./Routes/session.route");
const adminRoutes = require("./Routes/admin.route");
const attendanceRoutes = require("./Routes/attendance.route");
const enrollmentRoutes = require('./Routes/enrollment.route')
const teacherRoute = require('./Routes/teacher.route')
app.use("/api/auth", authRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use('/api/enrollment' , enrollmentRoutes)
app.use('/api/teacher' , teacherRoute)

// test route
app.get("/", (req, res) => {
  res.send("API Running...");
});

module.exports = app;
