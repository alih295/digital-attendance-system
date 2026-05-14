const express = require("express");
const router = express.Router();

// Middlewares
const { protect, authorizeRoles } = require("../middlewares/auth.middleware");

// Controller Functions
const {
  getDashboardStats,
  createDepartment,
  getDepartments,
  createCourse,
  getCourses,
  createUser,
  getAllStudents,
  getTeachers,
  assignTeacher,
  enrollStudent,           // New
  getStudentAttendanceReport, // New
  deleteUser              // New
} = require("../controllers/admin.controller");

// ======================================================
// 1. DASHBOARD & STATS
// ======================================================
router.get("/stats", protect, authorizeRoles("admin"), getDashboardStats);

// ======================================================
// 2. DEPARTMENT ROUTES
// ======================================================
router.post("/department", protect, authorizeRoles("admin"), createDepartment);
router.get("/departments", protect, authorizeRoles("admin"), getDepartments);

// ======================================================
// 3. COURSE ROUTES
// ======================================================
router.post("/course", protect, authorizeRoles("admin"), createCourse);
router.get("/courses", protect, authorizeRoles("admin"), getCourses);
router.post("/assign-teacher", protect, authorizeRoles("admin"), assignTeacher);

// ======================================================
// 4. USER MANAGEMENT (Teachers & Students)
// ======================================================
router.post("/user", protect, authorizeRoles("admin"), createUser);
router.get("/teachers", protect, authorizeRoles("admin"), getTeachers);
router.get("/students", protect, authorizeRoles("admin"), getAllStudents);
router.delete("/user/:id", protect, authorizeRoles("admin"), deleteUser);

// ======================================================
// 5. ENROLLMENT & ATTENDANCE REPORTS (The Professional Part)
// ======================================================

// Student ko course mein enroll karne ke liye (Important for scan to work)
router.post("/enroll", protect, authorizeRoles("admin"), enrollStudent);

// Kisi bhi student ki puri attendance history dekhne ke liye
router.get("/student-report/:studentId", protect, authorizeRoles("admin"), getStudentAttendanceReport);

module.exports = router;