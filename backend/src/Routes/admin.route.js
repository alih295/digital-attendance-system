const express = require("express");
const router = express.Router();

const { protect, authorizeRoles } = require("../middlewares/auth.middleware");
const {
  createDepartment,
  createCourse,
  createUser,
  getDashboardStats,
  getDepartments,
  getTeachers,
  getCourses,
  assignTeacher,
} = require("../controllers/admin.controller");

// DASHBOARD STATS
router.get("/stats", protect, authorizeRoles("admin"), getDashboardStats);

// CREATE DEPARTMENT
router.post("/department", protect, authorizeRoles("admin"), createDepartment);

// CREATE COURSE
router.post("/course", protect, authorizeRoles("admin"), createCourse);

// CREATE USER (student/teacher)
router.post("/user", protect, authorizeRoles("admin"), createUser);

router.get("/departments", protect, authorizeRoles("admin"), getDepartments);
router.get("/teachers", protect, authorizeRoles("admin"), getTeachers);
router.get("/courses", protect, authorizeRoles("admin"), getCourses);
router.post("/assign-teacher", protect, authorizeRoles("admin"), assignTeacher);

module.exports = router;
