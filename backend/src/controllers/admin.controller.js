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

// ---------------- 2. DEPARTMENT MANAGEMENT ----------------
exports.createDepartment = async (req, res) => {
  try {
    const { name } = req.body;
    const exists = await Department.findOne({ name });
    if (exists) return res.status(400).json({ message: "Department already exists" });

    const dept = await Department.create({ name });
    res.status(201).json(dept);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    res.json(departments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- 3. COURSE MANAGEMENT ----------------
exports.createCourse = async (req, res) => {
  try {
    const { name, code, departmentId, semester } = req.body;
    const exists = await Course.findOne({ code });
    if (exists) return res.status(400).json({ message: "Course code already exists" });

    const course = await Course.create({ name, code, departmentId, semester });
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("departmentId", "name")
      .populate("teacherId", "name");
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- 4. USER MANAGEMENT ----------------
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

exports.getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: "teacher" }).select("-password");
    res.json(teachers);
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

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    await Enrollment.deleteMany({ studentId: id });
    res.json({ message: "User and their records deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- 5. ENROLLMENT & ASSIGNMENT ----------------
exports.enrollStudent = async (req, res) => {
  try {
    const { studentId, departmentId, semester } = req.body;

    // Validation check
    if (!studentId || !departmentId || !semester) {
      return res.status(400).json({ message: "Student, Department, and Semester are all required" });
    }

    // Aapke model me semester Number hai, isliye hum isko safe side base-10 integer me convert kar rahe hain
    const targetSemester = parseInt(semester, 10);
    if (isNaN(targetSemester)) {
      return res.status(400).json({ message: "Semester must be a valid numeric value" });
    }

    // 1. Us specific department aur semester ke jitne courses hain unhe find karo (chahe unpar teacher assigned ho ya null ho)
    const availableCourses = await Course.find({ 
      departmentId, 
      semester: targetSemester 
    });

    if (!availableCourses || availableCourses.length === 0) {
      return res.status(404).json({ 
        message: "No courses found matching this specific department and semester structural block." 
      });
    }

    let enrolledCount = 0;
    let skippedCount = 0;

    // 2. Linear processing run karein: duplicate entry bypass block loop
    for (const course of availableCourses) {
      const alreadyEnrolled = await Enrollment.findOne({ studentId, courseId: course._id });
      
      if (!alreadyEnrolled) {
        await Enrollment.create({ 
          studentId, 
          courseId: course._id 
        });
        enrolledCount++;
      } else {
        skippedCount++;
      }
    }

    // 3. Responses mapping block layout structure
    if (enrolledCount === 0) {
      return res.status(400).json({ 
        message: `Student was already enrolled in all ${skippedCount} courses of this semester.` 
      });
    }

    res.json({ 
      message: `Successfully batch enrolled student in ${enrolledCount} courses.${skippedCount > 0 ? ` (${skippedCount} already enrolled skipping system matches)` : ""}` 
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
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

// ---------------- 6. REPORTS ----------------
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