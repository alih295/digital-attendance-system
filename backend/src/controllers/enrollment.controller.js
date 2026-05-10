const User = require("../models/user.model");
const bcrypt = require("bcrypt");

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, departmentId } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role, // student or teacher
      departmentId,
    });

    res.json({
      message: "User created successfully",
      user,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};