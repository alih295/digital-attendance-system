const Department = require("../models/department.model");
const Course = require("../models/course.model");
const User = require("../models/user.model");
const Enrollment = require("../models/enrollment.model");
const Attendance = require("../models/attendance.model");
const bcrypt = require("bcrypt");

// ---------------- 1. DASHBOARD STATS ----------------
exports.getDashboardStats = async (req, res) => {
  try {
    const [departments, courses, teachers, students] = await Promise.all([
      Department.countDocuments(),
      Course.countDocuments(),
      User.countDocuments({ role: "teacher" }),
      User.countDocuments({ role: "student" }),
    ]);

    res.json({ departments, courses, teachers, students });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- 2. USER MANAGEMENT (With Search & Populate) ----------------
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, departmentId, regNo } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name, email, password: hashed, role, departmentId, regNo
    });

    res.status(201).json({ message: "User created successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .populate("departmentId", "name")
      .select("-password");
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- 3. ENROLLMENT MANAGEMENT (Very Important) ----------------
// Student ko course mein enroll karne ke liye (Attendance tabhi lagegi)
exports.enrollStudent = async (req, res) => {
  try {
    const { studentId, courseId } = req.body;

    const alreadyEnrolled = await Enrollment.findOne({ studentId, courseId });
    if (alreadyEnrolled) return res.status(400).json({ message: "Student already enrolled" });

    await Enrollment.create({ studentId, courseId });
    res.json({ message: "Student enrolled successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- 4. COURSE & TEACHER ASSIGNMENT ----------------
exports.assignTeacher = async (req, res) => {
  try {
    const { teacherId, courseId } = req.body;
    const course = await Course.findByIdAndUpdate(
      courseId, 
      { teacherId }, 
      { new: true }
    ).populate("teacherId", "name email");

    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json({ message: "Teacher assigned successfully", course });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- 5. ADVANCED ATTENDANCE REPORTS (Professional) ----------------
// Kisi bhi specific student ki full attendance report check karna
exports.getStudentAttendanceReport = async (req, res) => {
  try {
    const { studentId } = req.params;

    const report = await Attendance.find({ studentId })
      .populate("courseId", "name code")
      .populate("sessionId", "createdAt")
      .sort({ markedAt: -1 });

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- 6. DELETE LOGIC (For Cleanup) ----------------
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    // User delete ho to uski enrollments bhi khatam honi chahiye
    await Enrollment.deleteMany({ studentId: id });
    res.json({ message: "User and their records deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- 7. DEPARTMENT & COURSE LISTS ----------------
exports.getDepartments = async (req, res) => {
  res.json(await Department.find());
};

exports.getCourses = async (req, res) => {
  const courses = await Course.find()
    .populate("departmentId", "name")
    .populate("teacherId", "name");
  res.json(courses);
};