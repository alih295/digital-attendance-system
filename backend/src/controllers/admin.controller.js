const Department = require("../models/department.model");
const Course = require("../models/course.model");
const User = require("../models/user.model");
const bcrypt = require("bcrypt");

// ---------------- DASHBOARD STATS ----------------
exports.getDashboardStats = async (req, res) => {
  try {
    const departments = await Department.countDocuments();
    const courses = await Course.countDocuments();
    const teachers = await User.countDocuments({ role: "teacher" });
    const students = await User.countDocuments({ role: "student" });

    res.json({
      departments,
      courses,
      teachers,
      students,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- DEPARTMENT ----------------
exports.createDepartment = async (req, res) => {
  try {
    const { name } = req.body;

    const exists = await Department.findOne({ name });

    if (exists) {
      return res.status(400).json({
        message: "Department already exists",
      });
    }

    const dept = await Department.create({
      name,
    });

    res.json(dept);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// ---------------- COURSE ----------------
exports.createCourse = async (req, res) => {
  try {
    const { name, code, departmentId, semester } = req.body;

    // ---------------- DUPLICATE CHECK ----------------
    const existingCourse = await Course.findOne({
      code: code,
      departmentId: departmentId,
    });

    if (existingCourse) {
      return res.status(400).json({
        message: "Course already exists in this department",
      });
    }

    // ---------------- CREATE COURSE ----------------
    const course = await Course.create({
      name,
      code,
      departmentId,
      semester,
      teacherId: null,
    });

    res.status(201).json(course);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

// ---------------- USER (teacher/student) ----------------
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, departmentId } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role,
      departmentId,
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDepartments = async (req, res) => {
  const departments = await Department.find();

  res.json(departments);
};

exports.getTeachers = async (req, res) => {
  const teachers = await User.find({
    role: "teacher",
  });

  res.json(teachers);
};
exports.getCourses = async (req, res) => {
  const courses = await Course.find();

  res.json(courses);
};
exports.assignTeacher = async (req, res) => {
  try {
    const { teacherId, courseId } = req.body;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    course.teacherId = teacherId;

    await course.save();

    res.json({
      message: "Teacher assigned successfully",
      course,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
