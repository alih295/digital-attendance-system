import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMyCourses,
  startSession,
  endSession,
  getSessionAttendance,
  refreshQRCode, // New
  getCourseReportCard // New
} from "../services/teacherService";
import { logoutUser } from '../services/authService';
import { QRCodeCanvas } from "qrcode.react";
import { useAuth } from "../context/AuthProvider";
import { toast } from "react-hot-toast"; // Professional Notifications ke liye

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth()

  const [courses, setCourses] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [qrImage, setQrImage] = useState(null); // Direct image string from backend
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(15);

  // ---------------- FETCH INITIAL DATA ----------------
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

  useEffect(() => { initDashboard(); }, []);


    const handleLogout = async () => {
    try {
      await logoutUser();
      logout();
      navigate("/");
    } catch (err) { toast.error("Logout Error"); }
  };

  // ---------------- SESSION START LOGIC ----------------
  const handleStartSession = async (course) => {
    try {
      setLoading(true);
      const data = await startSession(course._id);
      
      // Backend returns { sessionId, qrImage, expiresAt }
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

  // ---------------- QR REFRESH LOGIC (Every 15s) ----------------
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
          setCountdown(prev => prev - 1);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeSession, countdown]);

  // ---------------- LIVE ATTENDANCE (Polled every 3s) ----------------
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

  // ---------------- END SESSION ----------------
  const handleEndSession = async () => {
    if (!window.confirm("Are you sure you want to end this class?")) return;
    try {
      setLoading(true);
      await endSession(activeSession._id);
      setActiveSession(null);
      setQrImage(null);
      setSelectedCourse(null);
      toast.success("Session closed successfully");
    } catch (err) {
      toast.error("Failed to end session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* SIDEBAR */}
      <aside className="w-full md:w-80 bg-slate-900 text-white p-6 flex flex-col shadow-2xl">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-xl">D</div>
            <h1 className="text-2xl font-black tracking-tight">DAS System</h1>
          </div>

          <div className="bg-slate-800 p-4 rounded-xl mb-8 border border-slate-700">
            <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Teacher Profile</p>
            <p className="text-white font-medium text-lg">{user?.name}</p>
          </div>

          <h2 className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-4">My Courses</h2>
          <div className="space-y-3 overflow-y-auto max-h-[50vh] pr-2">
            {courses.map((course) => (
              <button
                key={course._id}
                onClick={() => handleStartSession(course)}
                disabled={loading || activeSession}
                className={`w-full text-left p-4 rounded-xl transition-all duration-200 border-2 ${
                  selectedCourse?._id === course._id 
                  ? "border-indigo-500 bg-indigo-500/10" 
                  : "border-transparent bg-slate-800 hover:bg-slate-700"
                } disabled:opacity-50`}
              >
                <div className="font-bold text-sm truncate">{course.name}</div>
                <div className="text-[10px] text-slate-400 mt-1">{course.departmentId?.name} • Sem {course.semester}</div>
              </button>
            ))}
          </div>
        </div>

        <button onClick={()=> handleLogout()} className="w-full bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white py-3 rounded-xl font-bold transition-all mt-6 border border-rose-500/20">
          Logout Session
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
            <div>
              <h2 className="text-4xl font-black text-slate-800">Attendance Center</h2>
              <p className="text-slate-500 font-medium">Class Management & Real-time Tracking</p>
            </div>
            {selectedCourse && (
               <button 
                onClick={() => navigate(`/report/${selectedCourse._id}`)}
                className="bg-white text-slate-700 px-5 py-2.5 rounded-lg border border-slate-200 shadow-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
               >
                 📊 View Analytics
               </button>
            )}
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT: QR PANEL */}
            <div className="lg:col-span-5">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Live QR Code</h3>
                
                {!activeSession ? (
                  <div className="py-20 flex flex-col items-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <span className="text-2xl">⏳</span>
                    </div>
                    <p className="text-slate-400 font-medium">Select a course to<br/>begin attendance</p>
                  </div>
                ) : (
                  <>
                    <div className="relative p-4 bg-white border-4 border-indigo-50 rounded-3xl shadow-inner">
                      {qrImage ? (
                        <img src={qrImage} alt="QR Code" className="w-64 h-64" />
                      ) : (
                        <div className="w-64 h-64 bg-slate-50 flex items-center justify-center animate-pulse">Loading...</div>
                      )}
                    </div>
                    
                    <div className="mt-6 flex items-center gap-3">
                      <div className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold animate-pulse">
                        Refreshing in {countdown}s
                      </div>
                    </div>

                    <p className="text-slate-500 text-sm mt-4 font-medium px-4">
                      Students must scan this code within the room to verify presence.
                    </p>

                    <button
                      onClick={handleEndSession}
                      className="mt-8 w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-lg"
                    >
                      Finish Attendance
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* RIGHT: ATTENDANCE LIST */}
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
                      Waiting for scans...
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
                              <div className="text-xs text-slate-500">{item.studentId?.regNo || 'No Reg #'}</div>
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
        </div>
      </main>
    </div>
  );
}