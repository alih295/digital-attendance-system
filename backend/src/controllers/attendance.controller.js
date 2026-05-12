const Session = require("../models/session.model");
const Attendance = require("../models/attendance.model");
const Enrollment = require("../models/enrollment.model");
const mongoose = require("mongoose");

// 🎯 1. MARK ATTENDANCE


exports.markAttendance = async (req, res) => {
  try {
    // 1. sessionId aur QR-Token hum QR scan se le rahe hain (req.body)
    const { sessionId, token } = req.body; 

    // 2. Student ki ID hum middleware se le rahe hain (req.user)
    const studentId = req.user._id; 

    const session = await Session.findById(sessionId);

    // Session validation
    if (!session || !session.isActive) {
      return res.status(400).json({ message: "Invalid session" });
    }

    // QR Security Token check (Jo teacher ke QR mein hai)
    if (session.qrToken !== token) {
      return res.status(400).json({ message: "Invalid QR Code" });
    }

    // Expiry check
    if (new Date() > session.expiresAt) {
      return res.status(400).json({ message: "QR expired" });
    }

    // Enrollment check (Using req.user._id)
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
      return res.status(400).json({ message: "Already marked" });
    }

    // Create Attendance
    await Attendance.create({
      sessionId,
      studentId: studentId,
      courseId: session.courseId,
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
      .populate("studentId", "name email");

    res.json(attendance);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// 👨‍🎓 3. STUDENT → MY ATTENDANCE
exports.getMyAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({
      studentId: req.user._id,
    }).populate("courseId", "name code");

    res.json(attendance);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};