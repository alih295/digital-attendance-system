import { useEffect, useState, useCallback } from "react";
import { Menu, X, LogOut, CheckCircle, Clock, BookOpen, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

// Services aur API (Aapne jo pehle bataye)
import { getMe, logoutUser } from "../services/authService";
import API from "../api/api";
import QRScanner from "../components/QRScanner";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Logged-in User Data
  const fetchUser = useCallback(async () => {
    try {
      const data = await getMe();
      setUser(data.user);
    } catch (err) {
      console.error("User Fetch Error:", err);
      // Agar token invalid hai ya 401/403 hai toh login par bhej dein
      navigate("/");
    }
  }, [navigate]);

  // 2. Fetch Student's Attendance History
  const fetchAttendance = useCallback(async () => {
    try {
      const response = await API.get("/attendance/me");
      setAttendance(response.data);
    } catch (err) {
      console.error("Attendance Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    fetchAttendance();
  }, [fetchUser, fetchAttendance]);

  // 3. QR Scan Handling Logic
  const handleScan = async (sessionId) => {
    if (!sessionId) return;

    try {
      // API call to mark attendance
      const response = await API.post("/attendance/mark", { sessionId });

      if (response.data.success) {
        alert("Attendance Marked Successfully! 🎉");
        setScannerOpen(false);
        // Data refresh karein taake dashboard update ho jaye
        fetchAttendance();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to mark attendance";
      alert(errorMsg);
      setScannerOpen(false);
    }
  };

  // 4. Logout Function
  const handleLogout = async () => {
    try {
      await logoutUser();
      logout();
      navigate("/");
    } catch (err) {
      console.log("Logout Error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`
          fixed md:static top-0 left-0 z-50
          h-full w-72 bg-black text-white p-6
          flex flex-col justify-between
          transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div>
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-3xl font-bold tracking-tighter text-white">DAS</h1>
              <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest">
                Attendance Portal
              </p>
            </div>
            <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="text-white" />
            </button>
          </div>

          <nav className="space-y-2">
            <NavItem icon={<BookOpen size={20} />} label="Dashboard" active />
            <NavItem icon={<Clock size={20} />} label="History" />
            <NavItem icon={<QrCode size={20} />} label="Scanner" onClick={() => setScannerOpen(true)} />
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
        >
          <LogOut size={18} /> Logout
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="bg-black text-white p-3 rounded-xl md:hidden"
            >
              <Menu size={24} />
            </button>
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                Hey, {user?.name?.split(" ")[0] || "Student"}!
              </h2>
              <p className="text-gray-500 font-medium">Keep up the good work. Check your stats.</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 px-6 py-4 rounded-2xl shadow-sm">
            <p className="text-gray-400 text-xs font-bold uppercase">Registration No</p>
            <h3 className="text-xl font-bold text-black">{user?.regNo || "N/A"}</h3>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <StatCard title="Total Classes" value={attendance.length} color="bg-blue-600" />
          <StatCard title="Attendance %" value="92%" color="bg-green-600" />
          <StatCard title="Semester" value={user?.semester || 5} color="bg-purple-600" />
        </section>

        {/* Scanner Action Card */}
        <section className="bg-white rounded-[2rem] border border-gray-200 p-8 mb-10 flex flex-col md:flex-row items-center gap-8 shadow-sm">
          <div className="bg-gray-100 p-8 rounded-3xl">
            <QrCode size={60} className="text-black" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-bold text-gray-900">Scan Attendance</h3>
            <p className="text-gray-500 mb-6">Scan the QR code displayed by your teacher to mark your presence instantly.</p>
            <button
              onClick={() => setScannerOpen(true)}
              className="bg-black text-white px-10 py-4 rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              Open Scanner
            </button>
          </div>
        </section>

        {/* Attendance List Table */}
        <section className="bg-white rounded-[2rem] border border-gray-200 p-6 md:p-8 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Recent Records</h3>
          <div className="space-y-4">
            {attendance.length > 0 ? (
              attendance.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-5 border border-gray-100 rounded-2xl hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 p-3 rounded-full text-green-600">
                      <CheckCircle size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{item.courseId?.name || "Course Name"}</h4>
                      <p className="text-gray-400 text-sm">
                        {new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full font-bold text-xs">
                    PRESENT
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-400 font-medium">
                No attendance records found yet.
              </div>
            )}
          </div>
        </section>
      </main>

      {/* QR Scanner Modal Overlay */}
      {scannerOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-6 rounded-[2.5rem] w-full max-w-lg relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Align QR Code</h2>
              <button onClick={() => setScannerOpen(false)} className="bg-red-50 text-red-500 p-2 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="rounded-3xl overflow-hidden border-4 border-black">
              <QRScanner onScan={handleScan} />
            </div>

            <p className="text-center text-gray-500 mt-6 text-sm font-medium">
              Scanning will happen automatically once detection is clear.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components for cleaner code
function NavItem({ icon, label, active = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-medium
        ${active ? "bg-white text-black shadow-lg shadow-white/5" : "text-gray-400 hover:bg-white/10 hover:text-white"}
      `}
    >
      {icon} {label}
    </button>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-2 h-full ${color}`} />
      <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-2">{title}</p>
      <h2 className="text-5xl font-black text-gray-900 group-hover:scale-110 transition-transform origin-left">
        {value}
      </h2>
    </div>
  );
}