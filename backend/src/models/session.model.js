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
    // Teacher manual stop bhi kar sakta hai
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  qrToken: {
    type: String,
    required: true, // Iska hona zaroori hai security ke liye
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: '0s' } // Optional: MongoDB automatic deletion logic
  },
}, { timestamps: true });

// Pre-save hook: Agar manual expiry nahi di to default 10 min set kar de
sessionSchema.pre('save', function(next) {
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 Minutes default
  }
  next();
});

const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;