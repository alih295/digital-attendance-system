const User = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// REGISTER
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, regNo, departmentId } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔥 ROLE LOGIC
    let role = "student";

    if (email === process.env.ADMIN_EMAIL) {
      role = "admin";
    } else if (email === process.env.TEACHER_EMAIL) {
      role = "teacher";
    }

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      regNo,
      departmentId,
      role,
    });

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// LOGIN
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    // Backend (authController.js ya jahan cookie set ho rahi hai)
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // HTTPS ke liye zaroori
      sameSite: "none", // Cross-site (HF Frontend to HF Backend) ke liye zaroori
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.json({
      message: "Login successful",
      user: {
        id: user._id,
        role: user.role,
        name: user.name,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.status(500).json({ message: err.message });
  }
};
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    res.json({
      user,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

exports.logoutUser = async (req, res) => {
  res.clearCookie("token");

  res.json({
    message: "Logged out successfully",
  });
};
