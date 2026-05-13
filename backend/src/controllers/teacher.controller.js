const Course = require("../models/course.model");
const Session = require("../models/session.model");
const Attendance = require("../models/attendance.model");

// =======================================
// GET MY COURSES
// =======================================

exports.getMyCourses = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const courses = await Course.find({
      teacherId,
    })
      .populate("departmentId", "name")
      .populate("teacherId", "name email");

    res.status(200).json(courses);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
};

// =======================================
// START SESSION
// =======================================

exports.startSession = async (req, res) => {
  try {
     if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" }); // ✅ safe fallback
    }
    const { courseId } = req.params;

    // Purani sessions close karein
    await Session.updateMany({ courseId, isActive: true }, { isActive: false });

    const qrToken = Math.random().toString(36).substring(2, 12);
    
    // ⏰ Expiry time set karein (e.g., 40 minutes from now)
    const expiresAt = new Date(Date.now() + 40 * 60 * 1000); 

    const session = await Session.create({
      courseId,
      teacherId: req.user.id, // Ensure your middleware uses ._id or .id consistently
      qrToken,
      isActive: true,
      expiresAt, // Ye add karna zaroori hai
    });

    res.status(201).json({
      message: "Session started",
      session,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =======================================
// END SESSION
// =======================================

exports.endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    session.isActive = false;

    await session.save();

    res.status(200).json({
      message: "Session ended",
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
};

// =======================================
// GET SESSION ATTENDANCE
// =======================================

exports.getSessionAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const attendance = await Attendance.find({ sessionId })
      .populate("studentId", "name email regNo") // regNo bhi populate karein agar user model mein hai
      .sort({ markedAt: -1 });

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
