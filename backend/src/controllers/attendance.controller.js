const Session = require("../models/session.model");
const Attendance = require("../models/attendance.model");
const Enrollment = require("../models/enrollment.model");


// 🎯 1. MARK ATTENDANCE
exports.markAttendance = async (req, res) => {
  try {
    const { sessionId, token } = req.body;

    const session = await Session.findById(sessionId);

    if (!session || !session.isActive) {
      return res.status(400).json({ message: "Invalid session" });
    }

    if (session.qrToken !== token) {
      return res.status(400).json({ message: "Invalid QR" });
    }

    if (new Date() > session.expiresAt) {
      return res.status(400).json({ message: "QR expired" });
    }

    const isEnrolled = await Enrollment.findOne({
      studentId: req.user._id,
      courseId: session.courseId,
    });

    if (!isEnrolled) {
      return res.status(403).json({
        message: "You are not enrolled in this course",
      });
    }

    const alreadyMarked = await Attendance.findOne({
      sessionId,
      studentId: req.user._id,
    });

    if (alreadyMarked) {
      return res.status(400).json({ message: "Already marked" });
    }

    await Attendance.create({
      sessionId,
      studentId: req.user._id,
      courseId: session.courseId,
    });

    res.json({ message: "Attendance marked successfully" });

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