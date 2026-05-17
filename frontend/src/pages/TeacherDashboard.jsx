import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../services/authService";
import { useAuth } from "../context/AuthProvider";
import { toast } from "react-hot-toast";
import API from "../api/api";

// ============================================================
//  INLINED TEACHER SERVICE FUNCTIONS
// ============================================================
const getMyCourses = async () => {
  const response = await API.get("/teacher/my-courses");
  return response.data;
};

const startSession = async (courseId) => {
  const response = await API.post(`/teacher/start-session/${courseId}`);
  if (!response.data?.sessionId) throw new Error("Failed to generate QR session");
  return response.data;
};

const refreshQRCode = async (sessionId) => {
  const response = await API.get(`/teacher/refresh-qr/${sessionId}`);
  return response.data;
};

const endSession = async (sessionId) => {
  const response = await API.post(`/teacher/end-session/${sessionId}`);
  return response.data;
};

const getSessionAttendance = async (sessionId) => {
  const response = await API.get(`/teacher/attendance/${sessionId}`);
  return response.data;
};

const getCourseReportCard = async (courseId) => {
  const response = await API.get(`/teacher/student-stats/${courseId}`);
  return response.data;
};
// ============================================================

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // Core Data States
  const [allMyCourses, setAllMyCourses]     = useState([]); // Master copy of teacher's assigned courses
  const [filteredCourses, setFilteredCourses] = useState([]); // Filtered array shown in UI
  const [departments, setDepartments]       = useState([]); // Extracted departments where teacher has access
  const [semesters, setSemesters]           = useState([]); // Extracted semesters where teacher has access
  
  // Selection Filters
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  
  // Active Management States
  const [activeSession, setActiveSession]   = useState(null);
  const [qrImage, setQrImage]               = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [attendance, setAttendance]         = useState([]);
  const [loading, setLoading]               = useState(false);
  const [countdown, setCountdown]           = useState(15);

  // Report Card State
  const [reportData, setReportData]         = useState(null);
  const [reportLoading, setReportLoading]   = useState(false);
  const [activeView, setActiveView]         = useState("attendance"); 

  // -------------------- INIT (Load Teacher's Assigned Courses Only) --------------------
  useEffect(() => {
    const initDashboard = async () => {
      try {
        setLoading(true);
        const assignedCourses = await getMyCourses(); // Sirf teacher ke apne courses aaye
        setAllMyCourses(assignedCourses);
        setFilteredCourses(assignedCourses);

        // 1. Unique Departments Extract karein jinme teacher ko access hai
        const deptMap = {};
        assignedCourses.forEach(course => {
          if (course.departmentId && course.departmentId._id) {
            deptMap[course.departmentId._id] = course.departmentId.name;
          }
        });
        const uniqueDepts = Object.keys(deptMap).map(id => ({ _id: id, name: deptMap[id] }));
        setDepartments(uniqueDepts);

        // 2. Unique Semesters Extract karein jinme teacher ko access hai (Sorted numerically)
        const uniqueSems = [...new Set(assignedCourses.map(c => c.semester))].sort((a, b) => a - b);
        setSemesters(uniqueSems);

      } catch (err) {
        toast.error("Failed to load assigned courses");
      } finally {
        setLoading(false);
      }
    };
    initDashboard();
  }, []);

  // -------------------- DYNAMIC FRONTEND SORTING / FILTER MATRIX --------------------
  useEffect(() => {
    let result = [...allMyCourses];

    // Agar Department filter active hai
    if (selectedDeptId) {
      result = result.filter(c => c.departmentId && c.departmentId._id === selectedDeptId);
    }

    // Agar Semester filter active hai
    if (selectedSemester) {
      result = result.filter(c => c.semester === parseInt(selectedSemester, 10));
    }

    setFilteredCourses(result);
  }, [selectedDeptId, selectedSemester, allMyCourses]);

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

  const selectStyle = "w-full bg-slate-800 text-white text-xs rounded-xl border border-slate-700 p-2.5 outline-none focus:border-indigo-500 transition-colors cursor-pointer";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">

      {/* ===== ACCESSIBLE TEACHER SCHEDULE SIDEBAR ===== */}
      <aside className="w-full md:w-80 bg-slate-900 text-white p-6 flex flex-col shadow-2xl">
        <div className="flex-1">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-xl">D</div>
            <h1 className="text-2xl font-black tracking-tight">DAS System</h1>
          </div>

          {/* Teacher Profile Info */}
          <div className="bg-slate-800 p-4 rounded-xl mb-6 border border-slate-700">
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">Logged Faculty</p>
            <p className="text-white font-medium text-base truncate">{user?.name}</p>
          </div>

          <hr className="border-slate-800 mb-6" />

          {/* ===== TEACHER-CENTRIC DROPDOWN FILTERS ===== */}
          <div className="mb-6 space-y-3 bg-slate-950 p-3 rounded-2xl border border-slate-800/60">
            <p className="text-indigo-400 text-[10px] uppercase tracking-widest font-black px-1">🔍 Filter Your Schedule</p>
            
            {/* Unique Department Dropdown (only shows your departments) */}
            <div>
              <select 
                className={selectStyle}
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                disabled={!!activeSession}
              >
                <option value="">All My Departments</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>{dept.name}</option>
                ))}
              </select>
            </div>

            {/* Unique Semester Dropdown (only shows your active semesters) */}
            <div>
              <select 
                className={selectStyle}
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                disabled={!!activeSession}
              >
                <option value="">All My Semesters</option>
                {semesters.map((sem) => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>

            {(selectedDeptId || selectedSemester) && (
              <button 
                onClick={() => { setSelectedDeptId(""); setSelectedSemester(""); }}
                className="w-full text-center text-[10px] text-rose-400 hover:underline pt-1 font-bold"
                disabled={!!activeSession}
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Course List Output Panel */}
          <h2 className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-3 px-1">
            Assigned Courses ({filteredCourses.length})
          </h2>
          
          <div className="space-y-3 overflow-y-auto max-h-[38vh] pr-1">
            {filteredCourses.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-4 font-medium">No matching courses found in your schedule.</p>
            ) : (
              filteredCourses.map((course) => (
                <div
                  key={course._id}
                  className={`rounded-xl border-2 transition-all duration-200 ${
                    selectedCourse?._id === course._id
                      ? "border-indigo-500 bg-indigo-500/10"
                      : "border-transparent bg-slate-800/80"
                  }`}
                >
                  {/* Course Primary Selection Trigger */}
                  <button
                    onClick={() => handleStartSession(course)}
                    disabled={loading || !!activeSession}
                    className="w-full text-left p-3.5 disabled:opacity-50 hover:bg-slate-700/40 rounded-xl transition-colors"
                  >
                    <div className="font-bold text-xs text-slate-100 line-clamp-2 leading-snug">{course.name}</div>
                    <div className="text-[10px] text-slate-400 mt-1.5 flex flex-col gap-0.5">
                      <div>Code: <span className="font-mono text-slate-300">{course.code}</span></div>
                      <div className="truncate">Dept: {course.departmentId?.name} • Sem {course.semester}</div>
                    </div>
                  </button>

                  {/* Report Card Button Action */}
                  <button
                    onClick={() => handleViewReport(course)}
                    disabled={reportLoading}
                    className="w-full text-left px-3.5 pb-2.5 text-[9px] text-indigo-400 hover:text-indigo-300 font-black uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    📊 View Report Ledger
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white py-3 rounded-xl font-bold transition-all mt-4 border border-rose-500/20 text-sm"
        >
          Logout Session
        </button>
      </aside>

      {/* ===== MAIN CONTENT AREA ===== */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto">

          {/* Main Top Header Block */}
          <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
            <div>
              <h2 className="text-4xl font-black text-slate-800">Attendance Center</h2>
              <p className="text-slate-500 font-medium">
                {selectedCourse ? `Currently Managing: ${selectedCourse.name}` : "Class Management & Real-time Tracking"}
              </p>
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

          {/* ===== ATTENDANCE ENGINE RENDER ===== */}
          {activeView === "attendance" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* QR Code Panel Block */}
              <div className="lg:col-span-5">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Live QR Code</h3>

                  {!activeSession ? (
                    <div className="py-20 flex flex-col items-center">
                      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl">⏳</span>
                      </div>
                      <p className="text-slate-400 font-medium">Select an assigned course<br />to trigger active scanner</p>
                    </div>
                  ) : (
                    <>
                      <div className="relative p-4 bg-white border-4 border-indigo-50 rounded-3xl shadow-inner">
                        {qrImage ? (
                          <img src={qrImage} alt="QR Code" className="w-64 h-64" />
                        ) : (
                          <div className="w-64 h-64 bg-slate-50 flex items-center justify-center animate-pulse text-slate-400 text-sm">
                            Loading QR Tracking Matrix...
                          </div>
                        )}
                      </div>

                      <div className="mt-6">
                        <div className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold animate-pulse inline-block">
                          Refreshing in {countdown}s
                        </div>
                      </div>

                      <p className="text-slate-500 text-sm mt-4 font-medium px-4">
                        Students must scan this rotating token inside classroom coordinates.
                      </p>

                      <button
                        onClick={handleEndSession}
                        disabled={loading}
                        className="mt-8 w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-lg disabled:opacity-60"
                      >
                        {loading ? "Ending active broadcast..." : "Finish Attendance"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Realtime Live Scan Feed Table */}
              <div className="lg:col-span-7">
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
                  <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                    <h3 className="text-xl font-bold text-slate-800">Present Students</h3>
                    <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-lg text-xs font-black">
                      {attendance.length} PRESENT
                    </span>
                  </div>

                  <div className="p-2 max-h-[500px] overflow-y-auto">
                    {attendance.length === 0 ? (
                      <div className="py-20 text-center text-slate-400 font-medium">
                        {activeSession ? "Awaiting inbound broadcast pings..." : "No active verification stream session"}
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
                                <div className="text-xs text-slate-500">{item.studentId?.regNo || "No Registration Tracking #"}</div>
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

          {/* ===== REPORT CARD DATA GRID LAYER ===== */}
          {activeView === "report" && (
            <div className="space-y-6">
              {/* Active Header Overview */}
              {selectedCourse && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-between shadow-sm">
                  <div>
                    <h3 className="text-xl font-black text-slate-800">{selectedCourse.name}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {selectedCourse.departmentId?.name} • Semester {selectedCourse.semester} • Code: {selectedCourse.code}
                    </p>
                  </div>
                  <span className="bg-indigo-100 text-indigo-700 text-xs font-black px-4 py-2 rounded-full uppercase tracking-wider">
                    Ledger Metrics
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
                  <p className="text-slate-400 font-medium">Generating cumulative report calculations...</p>
                </div>
              ) : reportData ? (
                <>
                  {/* Summary Metric Layout widgets */}
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

                  {/* Student Listing Table Grid */}
                  {(reportData.students?.length > 0) && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50">
                        <h4 className="font-bold text-slate-800">Student Percentage Audit</h4>
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
                                      isLow ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
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
                </>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 p-20 text-center shadow-sm">
                  <p className="text-slate-400 font-medium">No system matrix data recorded for this tracking branch.</p>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}