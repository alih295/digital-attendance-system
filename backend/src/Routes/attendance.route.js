const express = require("express");
const router = express.Router();

const { protect, authorizeRoles } = require("../middlewares/auth.middleware");

const {
  markAttendance,
  getCourseAttendance,
  getMyAttendance,
} = require("../controllers/attendance.controller");


// 🎯 1. STUDENT → mark attendance
router.post(
  "/mark",
  protect,
  authorizeRoles("student"),
  markAttendance
);


// 📊 2. TEACHER → course attendance dekhna
router.get(
  "/course/:courseId",
  protect,
  authorizeRoles("teacher"),
  getCourseAttendance
);


// 👨‍🎓 3. STUDENT → apni attendance
router.get(
  "/me",
  protect,
  authorizeRoles("student"),
  getMyAttendance
);


module.exports = router;