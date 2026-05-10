const express = require("express");
const router = express.Router();

const {
  getMyCourses,
  startSession,
  endSession,
  getSessionAttendance,
} = require("../controllers/teacher.controller");

const { protect, authorizeRoles } = require("../middlewares/auth.middleware");

router.get("/my-courses", protect, authorizeRoles("teacher"), getMyCourses);

router.post(
  "/start-session/:courseId",
  protect,
  authorizeRoles("teacher"),
  startSession,
);

router.post(
  "/end-session/:sessionId",
  protect,
  authorizeRoles("teacher"),
  endSession,
);

router.get(
  "/attendance/:sessionId",
  protect,
  authorizeRoles("teacher"),
  getSessionAttendance,
);

module.exports = router;
