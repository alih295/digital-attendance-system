const Session = require("../models/session.model");
const uuid = require("uuid"); // Pura module require karein
const uuidv4 = uuid.v4; // v4 ko yahan extract karein
const QRCode = require("qrcode");

// Baqi code waisa hi rehne dein...

// START CLASS
exports.startSession = async (req, res) => {
  try {
    const { courseId } = req.body;

    // 1. Create token
    const qrToken = uuidv4();

    // 2. Expiry (15 sec)
    const expiresAt = new Date(Date.now() + 15 * 1000);

    // 3. Create session
    const session = await Session.create({
      courseId,
      teacherId: req.user.id,
      qrToken,
      expiresAt,
      isActive: true,
    });

    // 4. Generate QR (contains token + sessionId)
    const qrData = JSON.stringify({
      sessionId: session._id,
      token: qrToken,
    });

    const qrImage = await QRCode.toDataURL(qrData);

    res.json({
      sessionId: session._id,
      qrImage,
      expiresAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.refreshQR = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId);

    if (!session || !session.isActive) {
      return res.status(400).json({ message: "Session not active" });
    }

    // new token
    const newToken = uuidv4();
    const expiresAt = new Date(Date.now() + 15 * 1000);

    session.qrToken = newToken;
    session.expiresAt = expiresAt;

    await session.save();

    const qrData = JSON.stringify({
      sessionId: session._id,
      token: newToken,
    });

    const qrImage = await QRCode.toDataURL(qrData);

    res.json({ qrImage, expiresAt });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
