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
    const { courseId } = req.params;

    // close old active sessions
    await Session.updateMany(
      {
        courseId,
        isActive: true,
      },
      {
        isActive: false,
      },
    );

    const qrToken = Math.random().toString(36).substring(2, 12);

    const session = await Session.create({
      courseId,
      teacherId: req.user.id,
      qrToken,
      isActive: true,
    });

    res.status(201).json({
      message: "Session started",
      session,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
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

    const attendance = await Attendance.find({
      sessionId,
    })
      .populate("studentId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(attendance);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
};
