const Session = require("../models/session.model");
const Attendance = require("../models/attendance.model");
const Enrollment = require("../models/enrollment.model");
const mongoose = require("mongoose");

// 🎯 1. MARK ATTENDANCE
exports.markAttendance = async (req, res) => {
  try {
    console.log("Request Received:", req.body); // Check karein data aa raha hai?
    const { sessionId, token } = req.body; 
    const studentId = req.user._id;

    console.log("Checking Session...");
    const session = await Session.findById(sessionId);
    if (!session) { console.log("Session not found"); return res.status(404).json({message: "No session"}); }

    console.log("Checking Enrollment...");
    // Yahan check karein agar crash ho raha hai
    const isEnrolled = await Enrollment.findOne({ studentId, courseId: session.courseId });
    
    if (!isEnrolled) {
       console.log("Not Enrolled:", studentId, "in", session.courseId);
       return res.status(403).json({ message: "Not enrolled" });
    }

    // ... baqi code
  } catch (err) {
    console.error("CRITICAL ERROR:", err.message); // Logs mein error dikhega
    res.status(500).json({ message: err.message });
  }
};

// 📊 2. TEACHER → COURSE ATTENDANCE
exports.getCourseAttendance = async (req, res) => {
  try {
    const { courseId } = req.params;

    const attendance = await Attendance.find({ courseId })
      .populate("studentId", "name email regNo") // ✅ regNo bhi add kiya
      .sort({ markedAt: -1 });

    res.json(attendance);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 👨‍🎓 3. STUDENT → MY ATTENDANCE
exports.getMyAttendance = async (req, res) => {
  try {
    // ✅ FIX 3: studentId verification
    const studentId = req.user._id || req.user.id;

    const attendance = await Attendance.find({
      studentId: studentId,
    }).populate("courseId", "name code");

    res.json(attendance);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};