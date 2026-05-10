const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middlewares/auth.middleware");

const {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
} = require("../controllers/auth.controller");
const { refreshQR } = require("../controllers/session.controller");



// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

router.get("/refresh/:sessionId", protect, authorizeRoles("teacher"), refreshQR);

router.get("/me", protect, getMe);

router.post("/logout", logoutUser);

router.get("/test", (req, res) => {
    res.send("Auth route working!");
});


module.exports = router;