import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../services/authService";
import { useAuth } from "../context/AuthProvider";
import { toast } from "react-hot-toast";
import API from "../api/api";

// ============================================================
//  INLINED TEACHER SERVICE FUNCTIONS (replaces teacherService.js)
//  Routes covered:
//   GET  /teacher/my-courses
//   POST /teacher/start-session/:courseId
//   GET  /teacher/refresh-qr/:sessionId
//   POST /teacher/end-session/:sessionId
//   GET  /teacher/attendance/:sessionId
//   GET  /teacher/student-stats/:courseId
// ============================================================
const getMyCourses = async () => {
  const response = await API.get("/teacher/my-courses");
  return response.data;
};

const startSession = async (courseId) => {
  const response = await API.post(`/teacher/start-session/${courseId}`);
  if (!response.data?.sessionId) throw new Error("Failed to generate QR session");
  return response.data; // { sessionId, qrImage, expiresAt }
};

const refreshQRCode = async (sessionId) => {
  const response = await API.get(`/teacher/refresh-qr/${sessionId}`);
  return response.data; // { qrImage, expiresAt }
};

const endSession = async (sessionId) => {
  const response = await API.post(`/teacher/end-session/${sessionId}`);
  return response.data;
};

const getSessionAttendance = async (sessionId) => {
  const response = await API.get(`/teacher/attendance/${sessionId}`);
  return response.data; // { data: [students...] }
};

const getCourseReportCard = async (courseId) => {
  const response = await API.get(`/teacher/student-stats/${courseId}`);
  return response.data;
};
// ============================================================

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const [courses, setCourses]               = useState([]);
  const [activeSession, setActiveSession]   = useState(null);
  const [qrImage, setQrImage]               = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [attendance, setAttendance]         = useState([]);
  const [loading, setLoading]               = useState(false);
  const [countdown, setCountdown]           = useState(15);

  // Report Card State
  const [reportData, setReportData]         = useState(null);
  const [reportLoading, setReportLoading]   = useState(false);
  const [activeView, setActiveView]         = useState("attendance"); // "attendance" | "report"

  // -------------------- INIT --------------------
  useEffect(() => {
    const initDashboard = async () => {
      try {
        setLoading(true);
        const data = await getMyCourses();
        setCourses(data);
      } catch (err) {
        toast.error("Failed to load courses");
      } finally {
        setLoading(false);
      }
    };
    initDashboard();
  }, []);

  // -------------------- LOGOUT --------------------
  const handleLogout = async () => {
    try {
      await logoutUser();
      logout();
      navigate("/");
    } catch (err) {
      toast.error("Logout Error");
    }
  };

  // -------------------- START SESSION --------------------
  const handleStartSession = async (course) => {
    try {
      setLoading(true);
      setReportData(null);
      setActiveView("attendance");
      const data = await startSession(course._id);
      setActiveSession({ _id: data.sessionId });
      setQrImage(data.qrImage);
      setSelectedCourse(course);
      setAttendance([]);
      setCountdown(15);
      toast.success(`Session started for ${course.name}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error starting session");
    } finally {
      setLoading(false);
    }
  };

  // -------------------- QR AUTO-REFRESH (every 15s) --------------------
  useEffect(() => {
    let timer;
    if (activeSession) {
      timer = setInterval(async () => {
        if (countdown <= 1) {
          try {
            const data = await refreshQRCode(activeSession._id);
            setQrImage(data.qrImage);
            setCountdown(15);
          } catch (err) {
            console.error("QR Refresh Failed");
          }
        } else {
          setCountdown((prev) => prev - 1);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeSession, countdown]);

  // -------------------- LIVE ATTENDANCE POLL (every 3s) --------------------
  const fetchAttendance = useCallback(async () => {
    if (!activeSession) return;
    try {
      const response = await getSessionAttendance(activeSession._id);
      setAttendance(response.data || []);
    } catch (err) {
      console.error("Attendance poll error");
    }
  }, [activeSession]);

  useEffect(() => {
    let interval;
    if (activeSession) {
      interval = setInterval(fetchAttendance, 3000);
    }
    return () => clearInterval(interval);
  }, [activeSession, fetchAttendance]);

  // -------------------- END SESSION --------------------
  const handleEndSession = async () => {
    if (!window.confirm("Are you sure you want to end this class?")) return;
    try {
      setLoading(true);
      await endSession(activeSession._id);
      setActiveSession(null);
      setQrImage(null);
      setSelectedCourse(null);
      setAttendance([]);
      toast.success("Session closed successfully");
    } catch (err) {
      toast.error("Failed to end session");
    } finally {
      setLoading(false);
    }
  };

  // -------------------- COURSE REPORT CARD --------------------
  const handleViewReport = async (course) => {
    if (!course) return;
    try {
      setReportLoading(true);
      setActiveView("report");
      setSelectedCourse(course);
      const data = await getCourseReportCard(course._id);
      setReportData(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load report card");
      setActiveView("attendance");
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">

      {/* ===== SIDEBAR ===== */}
      <aside className="w-full md:w-80 bg-slate-900 text-white p-6 flex flex-col shadow-2xl">
        <div className="flex-1">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-xl">D</div>
            <h1 className="text-2xl font-black tracking-tight">DAS System</h1>
          </div>

          {/* Teacher Info */}
          <div className="bg-slate-800 p-4 rounded-xl mb-8 border border-slate-700">
            <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Teacher Profile</p>
            <p className="text-white font-medium text-lg">{user?.name}</p>
          </div>

          {/* Course List */}
          <h2 className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-4">My Courses</h2>
          <div className="space-y-3 overflow-y-auto max-h-[50vh] pr-2">
            {courses.map((course) => (
              <div
                key={course._id}
                className={`rounded-xl border-2 transition-all duration-200 ${
                  selectedCourse?._id === course._id
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-transparent bg-slate-800"
                }`}
              >
                {/* Course Name */}
                <button
                  onClick={() => handleStartSession(course)}
                  disabled={loading || !!activeSession}
                  className="w-full text-left p-4 disabled:opacity-50 hover:bg-slate-700/40 rounded-xl transition-colors"
                >
                  <div className="font-bold text-sm truncate">{course.name}</div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {course.departmentId?.name} • Sem {course.semester}
                  </div>
                </button>

                {/* Report Card Button (always accessible) */}
                <button
                  onClick={() => handleViewReport(course)}
                  disabled={reportLoading}
                  className="w-full text-left px-4 pb-3 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                >
                  📊 View Report Card
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white py-3 rounded-xl font-bold transition-all mt-6 border border-rose-500/20"
        >
          Logout Session
        </button>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
            <div>
              <h2 className="text-4xl font-black text-slate-800">Attendance Center</h2>
              <p className="text-slate-500 font-medium">Class Management & Real-time Tracking</p>
            </div>
            {selectedCourse && (
              <div className="flex gap-3">
                <button
                  onClick={() => setActiveView("attendance")}
                  className={`px-5 py-2.5 rounded-lg border font-bold text-sm transition-all ${
                    activeView === "attendance"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  📡 Live Attendance
                </button>
                <button
                  onClick={() => handleViewReport(selectedCourse)}
                  className={`px-5 py-2.5 rounded-lg border font-bold text-sm transition-all ${
                    activeView === "report"
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  📊 Report Card
                </button>
              </div>
            )}
          </header>

          {/* ===== ATTENDANCE VIEW ===== */}
          {activeView === "attendance" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* QR Panel */}
              <div className="lg:col-span-5">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Live QR Code</h3>

                  {!activeSession ? (
                    <div className="py-20 flex flex-col items-center">
                      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl">⏳</span>
                      </div>
                      <p className="text-slate-400 font-medium">Select a course to<br />begin attendance</p>
                    </div>
                  ) : (
                    <>
                      <div className="relative p-4 bg-white border-4 border-indigo-50 rounded-3xl shadow-inner">
                        {qrImage ? (
                          <img src={qrImage} alt="QR Code" className="w-64 h-64" />
                        ) : (
                          <div className="w-64 h-64 bg-slate-50 flex items-center justify-center animate-pulse text-slate-400 text-sm">
                            Loading QR...
                          </div>
                        )}
                      </div>

                      <div className="mt-6">
                        <div className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold animate-pulse inline-block">
                          Refreshing in {countdown}s
                        </div>
                      </div>

                      <p className="text-slate-500 text-sm mt-4 font-medium px-4">
                        Students must scan this code within the room to verify presence.
                      </p>

                      <button
                        onClick={handleEndSession}
                        disabled={loading}
                        className="mt-8 w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-lg disabled:opacity-60"
                      >
                        {loading ? "Ending..." : "Finish Attendance"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Attendance List */}
              <div className="lg:col-span-7">
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
                  <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                    <h3 className="text-xl font-bold text-slate-800">Present Students</h3>
                    <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-lg text-xs font-black">
                      {attendance.length} TOTAL
                    </span>
                  </div>

                  <div className="p-2 max-h-[500px] overflow-y-auto">
                    {attendance.length === 0 ? (
                      <div className="py-20 text-center text-slate-400 font-medium">
                        {activeSession ? "Waiting for scans..." : "No active session"}
                      </div>
                    ) : (
                      <table className="w-full text-left border-separate border-spacing-y-2 px-4">
                        <thead>
                          <tr className="text-slate-400 text-[10px] uppercase tracking-widest font-black">
                            <th className="px-4 py-2">Student Info</th>
                            <th className="px-4 py-2">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendance.map((item) => (
                            <tr key={item._id} className="group transition-all">
                              <td className="bg-slate-50 group-hover:bg-indigo-50 p-4 rounded-l-2xl">
                                <div className="font-bold text-slate-800">{item.studentId?.name}</div>
                                <div className="text-xs text-slate-500">{item.studentId?.regNo || "No Reg #"}</div>
                              </td>
                              <td className="bg-slate-50 group-hover:bg-indigo-50 p-4 rounded-r-2xl font-mono text-xs text-indigo-500 font-bold">
                                {new Date(item.markedAt || item.createdAt).toLocaleTimeString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== REPORT CARD VIEW ===== */}
          {activeView === "report" && (
            <div className="space-y-6">
              {/* Course Header */}
              {selectedCourse && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-between shadow-sm">
                  <div>
                    <h3 className="text-xl font-black text-slate-800">{selectedCourse.name}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {selectedCourse.departmentId?.name} • Semester {selectedCourse.semester} • Code: {selectedCourse.code}
                    </p>
                  </div>
                  <span className="bg-indigo-100 text-indigo-700 text-xs font-black px-4 py-2 rounded-full uppercase tracking-wider">
                    Attendance Report
                  </span>
                </div>
              )}

              {reportLoading ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-20 flex flex-col items-center shadow-sm">
                  <div className="flex space-x-2 mb-4">
                    {[0, 150, 300].map((d) => (
                      <div key={d} className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                  <p className="text-slate-400 font-medium">Generating student report card...</p>
                </div>
              ) : reportData ? (
                <>
                  {/* Summary Stats */}
                  {(reportData.totalSessions !== undefined || reportData.summary) && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label: "Total Sessions",  value: reportData.totalSessions ?? reportData.summary?.totalSessions ?? "—", color: "from-slate-500 to-slate-600" },
                        { label: "Total Students",  value: reportData.totalStudents ?? reportData.students?.length ?? "—",       color: "from-indigo-500 to-purple-500" },
                        { label: "Avg Attendance",  value: reportData.averageAttendance ? `${reportData.averageAttendance}%` : "—", color: "from-emerald-500 to-teal-500" },
                        { label: "Below 75%",       value: reportData.belowThreshold ?? reportData.students?.filter(s => (s.percentage ?? s.attendancePercentage) < 75).length ?? "—", color: "from-rose-500 to-pink-500" },
                      ].map((stat, i) => (
                        <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
                          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`} />
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                          <p className="text-2xl font-black text-slate-800">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Student Table */}
                  {(reportData.students?.length > 0) && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50">
                        <h4 className="font-bold text-slate-800">Student Breakdown</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <tr>
                              <th className="px-6 py-3 text-left">#</th>
                              <th className="px-6 py-3 text-left">Student</th>
                              <th className="px-6 py-3 text-left">Reg No</th>
                              <th className="px-6 py-3 text-left">Present</th>
                              <th className="px-6 py-3 text-left">Total</th>
                              <th className="px-6 py-3 text-left">Percentage</th>
                              <th className="px-6 py-3 text-left">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {reportData.students.map((s, idx) => {
                              const pct = s.percentage ?? s.attendancePercentage ?? 0;
                              const isLow = pct < 75;
                              return (
                                <tr key={s._id || idx} className="hover:bg-slate-50/60 transition-colors">
                                  <td className="px-6 py-4 text-slate-400 font-mono text-xs">{idx + 1}</td>
                                  <td className="px-6 py-4">
                                    <div className="font-bold text-slate-800">{s.name || s.studentId?.name}</div>
                                    <div className="text-xs text-slate-400">{s.email || s.studentId?.email}</div>
                                  </td>
                                  <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                    {s.regNo || s.studentId?.regNo || "—"}
                                  </td>
                                  <td className="px-6 py-4 font-bold text-emerald-600">
                                    {s.presentCount ?? s.attended ?? "—"}
                                  </td>
                                  <td className="px-6 py-4 text-slate-500">
                                    {s.totalSessions ?? s.total ?? reportData.totalSessions ?? "—"}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 bg-slate-100 rounded-full h-2 w-20">
                                        <div
                                          className={`h-2 rounded-full transition-all ${isLow ? "bg-rose-400" : "bg-emerald-400"}`}
                                          style={{ width: `${Math.min(pct, 100)}%` }}
                                        />
                                      </div>
                                      <span className={`text-xs font-black ${isLow ? "text-rose-600" : "text-emerald-600"}`}>
                                        {pct}%
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                                      isLow
                                        ? "bg-rose-100 text-rose-600"
                                        : "bg-emerald-100 text-emerald-600"
                                    }`}>
                                      {isLow ? "⚠ Low" : "✓ OK"}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Raw fallback for unexpected API shapes */}
                  {!reportData.students && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Raw Report Data</p>
                      <pre className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(reportData, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 p-20 text-center shadow-sm">
                  <p className="text-slate-400 font-medium">No report data available.</p>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}