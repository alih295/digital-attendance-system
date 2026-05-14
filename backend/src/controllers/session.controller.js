const Session = require("../models/session.model");
const Attendance = require("../models/attendance.model"); // ✅ Added missing import
const uuid = require("uuid");
const uuidv4 = uuid.v4;
const QRCode = require("qrcode");

// =======================================
// 1. START SESSION (QR Code Generation)
// =======================================
exports.startSession = async (req, res) => {
  try {
    const { courseId } = req.params; // ✅ Using params to match your route

    // Pehle se chalne wali sessions ko close karein taake conflict na ho
    await Session.updateMany({ courseId, isActive: true }, { isActive: false });

    // Unique Token aur Expiry set karein (15 seconds security ke liye)
    const qrToken = uuidv4();
    const expiresAt = new Date(Date.now() + 15 * 1000);

    const session = await Session.create({
      courseId,
      teacherId: req.user.id, // Middleware se user id lein
      qrToken,
      expiresAt,
      isActive: true,
    });

    // QR Data generate karein
    const qrData = JSON.stringify({
      sessionId: session._id,
      token: qrToken,
    });

    const qrImage = await QRCode.toDataURL(qrData);

    res.status(201).json({
      success: true,
      sessionId: session._id,
      qrImage,
      expiresAt,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// =======================================
// 2. REFRESH QR (Security Rotation)
// =======================================
exports.refreshQR = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId);

    if (!session || !session.isActive) {
      return res.status(400).json({ message: "Session not active or not found" });
    }

    // Naya token aur expiry generate karein
    const newToken = uuidv4();
    const newExpiry = new Date(Date.now() + 15 * 1000);

    session.qrToken = newToken;
    session.expiresAt = newExpiry;
    await session.save();

    const qrData = JSON.stringify({
      sessionId: session._id,
      token: newToken,
    });

    const qrImage = await QRCode.toDataURL(qrData);

    res.json({ success: true, qrImage, expiresAt: newExpiry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// =======================================
// 3. END SESSION
// =======================================
exports.endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findByIdAndUpdate(
      sessionId,
      { isActive: false },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.status(200).json({ success: true, message: "Session ended successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// =======================================
// 4. GET SESSION ATTENDANCE
// =======================================
exports.getSessionAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Attendance record dhoondein aur student ki detail populate karein
    const attendance = await Attendance.find({ sessionId })
      .populate("studentId", "name email regNo")
      .sort({ markedAt: -1 });

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};