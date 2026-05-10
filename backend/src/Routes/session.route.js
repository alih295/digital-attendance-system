const express = require("express");

const router = express.Router();
const { protect, authorizeRoles } = require("../middlewares/auth.middleware");
const {
  startSession,
  refreshQR,
} = require("../controllers/session.controller");

router.post("/start", protect, authorizeRoles("teacher"), startSession);
router.get(
  "/refresh/:sessionId",
  protect,
  authorizeRoles("teacher"),
  refreshQR,
);

module.exports = router;
