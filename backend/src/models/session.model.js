const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },

  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  startTime: {
    type: Date,
    default: Date.now,
  },

  endTime: {
    type: Date,
  },

  isActive: {
    type: Boolean,
    default: true,
  },

  qrToken: {
    type: String,
  },

  expiresAt: {
    type: Date,
  },
});

const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;