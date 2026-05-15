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
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: "0s" },
  },
}, { timestamps: true });

sessionSchema.pre("save", function () {
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  }
});

const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;