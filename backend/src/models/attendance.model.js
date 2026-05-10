const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Session",
    required: true,
  },

  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },

  status: {
    type: String,
    enum: ["present", "late"],
    default: "present",
  },

  markedAt: {
    type: Date,
    default: Date.now,
  },
});

// prevent duplicate attendance
attendanceSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;
