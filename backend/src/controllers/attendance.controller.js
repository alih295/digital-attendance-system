const Session = require("../models/session.model");
const Attendance = require("../models/attendance.model");
const Enrollment = require("../models/enrollment.model");
const mongoose = require("mongoose");


exports.markAttendance = async (req, res) => {
  try {
    console.log("📥 Request Received for Attendance:", req.body);
    const { sessionId, token } = req.body; 
    const studentId = req.user._id;

    // 1. Data Parsing & Strict Type Casting (Object ID Verification)
    if (!sessionId || !token) {
      return res.status(400).json({ success: false, message: "Missing sessionId or scanned token registry." });
    }

    const castedStudentId = new mongoose.Types.ObjectId(studentId);
    const castedSessionId = new mongoose.Types.ObjectId(sessionId);

    // 2. Checking Session Validity
    console.log("🔍 Checking Session Validity...");
    const session = await Session.findById(castedSessionId);
    if (!session) { 
      console.log("❌ Session missing from registries"); 
      return res.status(404).json({ success: false, message: "Attendance session not found or expired." }); 
    }

    // 3. Check if Session is Active
    if (!session.isActive) {
       console.log("❌ Active status sequence validation failed");
       return res.status(400).json({ success: false, message: "This session has been closed by the teacher." });
    }

    // 4. Token Match Verification (Security Key Check)
    // Jo token scan hoke aaya hai, kya wo live session token se match karta hai?
   if (session.qrToken !== token) {
  console.log("❌ Security Token Mismatch. Scanned:", token, "Expected:", session.qrToken);
  return res.status(400).json({ 
    success: false, 
    message: "Invalid or expired QR Code dynamic token." 
  });
}

    // 5. Validating Enrollment Pipeline
    console.log("🛡️ Validating Enrollment Pipeline...");
    const castedCourseId = new mongoose.Types.ObjectId(session.courseId);

    const isEnrolled = await Enrollment.findOne({ 
      studentId: castedStudentId, 
      courseId: castedCourseId 
    });
    
    if (!isEnrolled) {
       console.log(`❌ Enrollment Identity Mismatch for Student [${castedStudentId}]`);
       return res.status(403).json({ 
         success: false, 
         message: "Access Denied: You are not officially enrolled in this course." 
       });
    }

    // 6. Duplicate Prevention Check (Anti-Double Marking Rule)
    // Check karein ke is student ne is specific session mein pehle se attendance mark toh nahi ki hui
    console.log("🔄 Checking for existing attendance logs...");
    const alreadyMarked = await Attendance.findOne({
      studentId: castedStudentId,
      sessionId: castedSessionId
    });

    if (alreadyMarked) {
      console.log(`⚠️ Duplicate Attempt: Student [${castedStudentId}] already marked.`);
      return res.status(400).json({ 
        success: false, 
        message: "Your attendance for this session has already been recorded." 
      });
    }

    // 7. Commit Record Mutation (Saving Data Logs)
    console.log("📝 Generating new attendance manifest sheet...");
    const newAttendance = new Attendance({
      studentId: castedStudentId,
      sessionId: castedSessionId,
      courseId: castedCourseId,
      status: "present",
      markedAt: new Date()
    });

    await newAttendance.save();

    console.log(`✅ Attendance marked successfully for student: ${castedStudentId}`);
    return res.status(200).json({
       success: true,
       message: "Attendance recorded successfully! Status: PRESENT"
    });

  } catch (err) {
    console.error("💥 CRITICAL CORRUPTION ERROR:", err.message);
    return res.status(500).json({ success: false, message: "Internal server registry fault: " + err.message });
  }
};

// 📊 2. TEACHER → COURSE ATTENDANCE
exports.getCourseAttendance = async (req, res) => {
  try {
    const { courseId } = req.params;

    const attendance = await Attendance.find({ courseId })
      .populate("studentId", "name email regNo") // ✅ regNo bhi add kiya
      .sort({ markedAt: -1 });

    res.json(attendance);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 👨‍🎓 3. STUDENT → MY ATTENDANCE
exports.getMyAttendance = async (req, res) => {
  try {
    // ✅ FIX 3: studentId verification
    const studentId = req.user._id || req.user.id;

    const attendance = await Attendance.find({
      studentId: studentId,
    }).populate("courseId", "name code");

    res.json(attendance);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};