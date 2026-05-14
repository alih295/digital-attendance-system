const Session = require("../models/session.model");
const Attendance = require("../models/attendance.model");
const Enrollment = require("../models/enrollment.model");
const mongoose = require("mongoose");

// 🎯 1. MARK ATTENDANCE
exports.markAttendance = async (req, res) => {
  try {
    const { sessionId, token } = req.body; 

    // ✅ FIX 1: req.user.id vs req.user._id
    // MongoDB projects mein hamesha _id ya req.user._id use karein safety ke liye
    const studentId = req.user._id || req.user.id; 

    const session = await Session.findById(sessionId);

    if (!session || !session.isActive) {
      return res.status(400).json({ message: "Invalid or inactive session" });
    }

    // ✅ FIX 2: Expiry logic improvement
    // Kabhi kabhi server time ka thora farq hota hai, isliye log check karein
    if (new Date() > new Date(session.expiresAt)) {
      return res.status(400).json({ message: "QR code has expired" });
    }

    if (session.qrToken !== token) {
      return res.status(400).json({ message: "Invalid QR Code" });
    }

    // Enrollment check
    const isEnrolled = await Enrollment.findOne({
      studentId: studentId,
      courseId: session.courseId,
    });

    if (!isEnrolled) {
      return res.status(403).json({ message: "You are not enrolled in this course" });
    }

    // Check if already marked
    const alreadyMarked = await Attendance.findOne({
      sessionId,
      studentId: studentId,
    });

    if (alreadyMarked) {
      return res.status(400).json({ message: "Your attendance is already marked for this session" });
    }

    // Create Attendance
    await Attendance.create({
      sessionId,
      studentId: studentId,
      courseId: session.courseId,
      markedAt: new Date() // ✅ Professional practice: timestamp khud set karein
    });

    res.json({ success: true, message: "Attendance marked successfully" });

  } catch (err) {
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