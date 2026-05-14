const Course = require("../models/course.model");
const Attendance = require("../models/attendance.model");
const Session = require("../models/session.model");
const Enrollment = require("../models/enrollment.model");

// 1. Get Teacher's Courses
exports.getMyCourses = async (req, res) => {
  try {
    const courses = await Course.find({ teacherId: req.user._id || req.user.id })
      .populate("departmentId", "name");
    res.status(200).json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. Advanced Student Report Card (For a specific Course)
exports.getStudentReportCard = async (req, res) => {
  try {
    const { courseId } = req.params;

    // A. Pehle check karein total sessions kitni hui hain is course ki
    const totalSessions = await Session.countDocuments({ courseId, isActive: false });

    // B. Saare enrolled students lein unki details ke sath
    const enrolledStudents = await Enrollment.find({ courseId })
      .populate({
        path: "studentId",
        select: "name email regNo departmentId semester",
        populate: { path: "departmentId", select: "name" }
      });

    // C. Har student ke liye calculation karein
    const report = await Promise.all(enrolledStudents.map(async (enrollee) => {
      const student = enrollee.studentId;
      
      // Student ne kitni attend kein
      const attendedCount = await Attendance.countDocuments({ 
        courseId, 
        studentId: student._id 
      });

      const percentage = totalSessions > 0 ? ((attendedCount / totalSessions) * 100).toFixed(2) : 0;

      return {
        name: student.name,
        regNo: student.regNo,
        semester: student.semester,
        department: student.departmentId?.name || "N/A",
        attended: attendedCount,
        totalClasses: totalSessions,
        attendancePercentage: `${percentage}%`,
        status: percentage < 75 ? "Low Attendance" : "Good" // Alert logic
      };
    }));

    res.json({
      success: true,
      courseId,
      totalStudents: report.length,
      data: report
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};