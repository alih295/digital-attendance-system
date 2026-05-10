const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  role: {
    type: String,
    enum: ["student", "teacher", "admin"],
    default: "student",
  },

  // Only for students
  regNo: {
    type: String,
    unique: true,
    sparse: true, // allow null for teachers/admin
  },

  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
  },

  // Only for teachers
  assignedCourses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;