const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema({
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

  semester: String,
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
  },
});

module.exports = mongoose.model("Enrollment", enrollmentSchema);