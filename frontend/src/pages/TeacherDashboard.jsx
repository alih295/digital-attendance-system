import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMyCourses,
  startSession,
  endSession,
  getSessionAttendance,
} from "../services/teacherService";
import {logoutUser} from '../services/authService'

import { QRCodeCanvas } from "qrcode.react";
import { useAuth } from "../context/AuthProvider";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);

  // ---------------- FETCH COURSES ----------------
  const fetchCourses = async () => {
    try {
        console.log("cookies / auth check running");

      const data = await getMyCourses();
      setCourses(data);
    } catch (err) {
      console.log("Courses error:", err);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

   const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/");
    } catch (err) {
      console.log("Logout Error:", err);
    }
  };

  const handleStartSession = async (course) => {
    try {
      setLoading(true);

      const data = await startSession(course._id);

      setActiveSession(data.session);
      setSelectedCourse(course);
      setAttendance([]);
    } catch (err) {
      console.log("Start session error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- END SESSION ----------------
  const handleEndSession = async () => {
    try {
      setLoading(true);

      await endSession(activeSession._id);

      setActiveSession(null);
      setSelectedCourse(null);
      setAttendance([]);
    } catch (err) {
      console.log("End session error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- LIVE ATTENDANCE ----------------
  const fetchAttendance = async () => {
    try {
      if (!activeSession) return;

      const data = await getSessionAttendance(activeSession._id);
      setAttendance(data);
    } catch (err) {
      console.log("Attendance error:", err);
    }
  };

  useEffect(() => {
    let interval;

    if (activeSession) {
      interval = setInterval(fetchAttendance, 3000);
    }

    return () => clearInterval(interval);
  }, [activeSession]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* ---------------- SIDEBAR ---------------- */}
      <div className="w-full md:w-72 bg-black text-white p-6 flex flex-col justify-between">
        <div>
          <h1 className="text-3xl font-bold">DAS</h1>

          <p className="text-gray-400 text-sm mt-1 mb-6">
            Welcome, {user?.name}
          </p>

          {/* COURSES */}
          <div className="space-y-3">
            {courses.map((course) => (
              <button
                key={course._id}
                onClick={() => handleStartSession(course)}
                disabled={loading}
                className="w-full text-left bg-white text-black px-4 py-3 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
              >
                <div className="text-sm font-bold">{course.name}</div>

                <div className="text-xs text-gray-600">
                  {course.departmentId?.name} | Sem {course.semester}
                </div>
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleLogout} className="bg-red-500 py-3 rounded-xl font-semibold cursor-pointer mt-6">
          Logout
        </button>
      </div>

      {/* ---------------- MAIN ---------------- */}
      <div className="flex-1 p-4 md:p-8">
        {/* HEADER */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold">Teacher Dashboard</h2>

          <p className="text-gray-500">Manage attendance sessions</p>
        </div>

        {/* ACTIVE COURSE */}
        {selectedCourse && (
          <div className="bg-white p-4 rounded-2xl shadow mb-6">
            <h3 className="font-bold">Course: {selectedCourse.name}</h3>

            <p className="text-gray-500 text-sm">
              {selectedCourse.departmentId?.name} | Semester{" "}
              {selectedCourse.semester}
            </p>
          </div>
        )}

        {/* SESSION */}
        <div className="bg-white p-6 rounded-3xl shadow mb-6">
          <h3 className="text-xl font-bold mb-4">Live Session</h3>

          {!activeSession ? (
            <p className="text-gray-500">No active session</p>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <QRCodeCanvas
                value={JSON.stringify({
                  sessionId: activeSession._id,
                  token: activeSession.qrToken,
                })}
                size={220}
              />

              <p className="text-gray-500 text-sm">
                Students scan QR to mark attendance
              </p>

              <button
                onClick={handleEndSession}
                disabled={loading}
                className="bg-red-500 text-white px-6 py-3 rounded-xl"
              >
                {loading ? "Ending..." : "End Session"}
              </button>
            </div>
          )}
        </div>

        {/* ATTENDANCE */}
        <div className="bg-white p-6 rounded-3xl shadow">
          <h3 className="text-xl font-bold mb-4">Live Attendance</h3>

          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">Student</th>
                <th className="py-2 text-left">Email</th>
                <th className="py-2 text-left">Time</th>
              </tr>
            </thead>

            <tbody>
              {attendance.map((item) => (
                <tr key={item._id} className="border-b">
                  <td>{item.studentId?.name}</td>
                  <td>{item.studentId?.email}</td>
                  <td>{new Date(item.createdAt).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
