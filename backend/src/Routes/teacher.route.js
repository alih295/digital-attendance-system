const express = require("express");
const router = express.Router();

const { protect, authorizeRoles } = require("../middlewares/auth.middleware");
const { getMyCourses, getStudentReportCard } = require("../controllers/teacher.controller");
const { startSession, refreshQR, endSession, getSessionAttendance } = require("../controllers/session.controller");

// COURSE LIST
router.get("/my-courses", protect, authorizeRoles("teacher"), getMyCourses);

// SESSION & QR MANAGEMENT (From Session Controller)
router.post("/start-session/:courseId", protect, authorizeRoles("teacher"), startSession);
router.get("/refresh-qr/:sessionId", protect, authorizeRoles("teacher"), refreshQR);
router.post("/end-session/:sessionId", protect, authorizeRoles("teacher"), endSession);
router.get("/attendance/:sessionId", protect, authorizeRoles("teacher"), getSessionAttendance);

// ADVANCED REPORTING (New)
// Teacher check kar sake ke kis student ki attendance kam hai
router.get("/student-stats/:courseId", protect, authorizeRoles("teacher"), getStudentReportCard);

module.exports = router;