import { useEffect, useState, useCallback } from "react";
import {
  Menu, X, LogOut, CheckCircle, Clock, BookOpen, QrCode, TrendingUp, Hash
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import { getMe, logoutUser } from "../services/authService";
import API from "../api/api";
import QRScanner from "../components/QRScanner";
import { toast } from "react-hot-toast";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  // 1. Fetch User Data
  const fetchUser = useCallback(async () => {
    try {
      const data = await getMe();
      setUser(data.user);
    } catch (err) {
      navigate("/");
    }
  }, [navigate]);

  // 2. Fetch Attendance History
  const fetchAttendance = useCallback(async () => {
    try {
      const response = await API.get("/attendance/me");
      setAttendance(response.data);
    } catch (err) {
      console.error("Attendance Fetch Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    fetchAttendance();
  }, [fetchUser, fetchAttendance]);

  // 3. Mark Attendance Logic
  const handleScan = async (scannedData) => {
    if (marking) return; // Prevent multiple scans
    try {
      setMarking(true);
      const qrObj = JSON.parse(scannedData);

      const response = await API.post("/attendance/mark", {
        sessionId: qrObj.sessionId,
        token: qrObj.token,
      });

      toast.success("Attendance Marked Successfully!", {
        icon: '✅',
        style: { borderRadius: '15px', background: '#333', color: '#fff' }
      });
      
      setScannerOpen(false);
      fetchAttendance(); // List refresh karein
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or Expired QR");
    } finally {
      setMarking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      logout();
      navigate("/");
    } catch (err) { toast.error("Logout failed"); }
  };

  // Calculate Stats
  const attendancePercentage = attendance.length > 0 ? "92%" : "0%"; // Static for now, calculate based on total classes if available

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 border-solid"></div>
          <p className="text-slate-500 font-bold animate-pulse">Syncing Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white p-6 
        flex flex-col transition-transform duration-300 shadow-2xl
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-500 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/20">S</div>
              <h1 className="text-2xl font-black tracking-tighter">STUDENT</h1>
            </div>
            <button className="md:hidden p-2 hover:bg-slate-800 rounded-lg" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <nav className="space-y-2">
            <NavItem icon={<BookOpen size={20} />} label="My Dashboard" active />
            <NavItem icon={<Clock size={20} />} label="Attendance History" />
            <NavItem icon={<QrCode size={20} />} label="Scan Now" onClick={() => setScannerOpen(true)} />
          </nav>
        </div>

        <button onClick={handleLogout} className="mt-auto flex items-center justify-center gap-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white py-4 rounded-2xl font-bold transition-all duration-300 border border-rose-500/20">
          <LogOut size={20} /> Sign Out
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 md:p-10 lg:p-14 overflow-y-auto">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="p-3 bg-white border border-slate-200 rounded-xl md:hidden shadow-sm">
              <Menu size={24} />
            </button>
            <div>
              <h2 className="text-4xl font-black text-slate-800 tracking-tight">
                Welcome, {user?.name?.split(" ")[0]}!
              </h2>
              <p className="text-slate-500 font-medium mt-1">Check your academic presence and logs.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-white border border-slate-200 px-6 py-4 rounded-[1.5rem] shadow-sm flex items-center gap-4">
               <div className="bg-slate-100 p-2.5 rounded-lg text-slate-600"><Hash size={18}/></div>
               <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Registration</p>
                  <h3 className="text-lg font-bold text-slate-800">{user?.regNo || "Not Set"}</h3>
               </div>
            </div>
          </div>
        </header>

        {/* STATS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <StatCard title="Classes Attended" value={attendance.length} icon={<CheckCircle className="text-blue-600"/>} color="border-blue-200" />
          <StatCard title="Attendance Rate" value={attendancePercentage} icon={<TrendingUp className="text-emerald-600"/>} color="border-emerald-200" />
          <StatCard title="Current Semester" value={user?.semester || "N/A"} icon={<BookOpen className="text-purple-600"/>} color="border-purple-200" />
        </section>

        {/* QUICK SCAN CARD */}
        <section className="group relative bg-indigo-600 rounded-[2.5rem] p-10 mb-12 flex flex-col md:flex-row items-center gap-10 overflow-hidden shadow-2xl shadow-indigo-200 transition-all hover:scale-[1.01]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl transition-transform group-hover:scale-110" />
          <div className="relative bg-white/20 backdrop-blur-md p-10 rounded-[2rem] border border-white/30 shadow-xl">
            <QrCode size={60} className="text-white" />
          </div>
          <div className="relative flex-1 text-center md:text-left text-white">
            <h3 className="text-3xl font-black mb-3">Ready for Class?</h3>
            <p className="text-indigo-100 mb-8 font-medium max-w-md">
              Point your camera at the teacher's screen to instantly mark your attendance for the current session.
            </p>
            <button
              onClick={() => setScannerOpen(true)}
              className="bg-white text-indigo-600 px-10 py-4 rounded-[1.2rem] font-black text-lg shadow-xl shadow-indigo-900/20 hover:bg-slate-50 transition-all active:scale-95"
            >
              Launch QR Scanner
            </button>
          </div>
        </section>

        {/* RECORDS TABLE */}
        <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-800">Recent Logs</h3>
            <button className="text-indigo-600 font-bold text-sm hover:underline">View All</button>
          </div>

          <div className="p-4">
            {attendance.length > 0 ? (
              <div className="space-y-3">
                {attendance.map((item) => (
                  <div key={item._id} className="group flex items-center justify-between p-5 rounded-[1.5rem] bg-slate-50/50 hover:bg-indigo-50/50 border border-transparent hover:border-indigo-100 transition-all">
                    <div className="flex items-center gap-5">
                      <div className="bg-white p-3.5 rounded-2xl shadow-sm text-emerald-500 border border-slate-100">
                        <CheckCircle size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 group-hover:text-indigo-900 transition-colors">
                          {item.courseId?.name || "Course Session"}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                           <p className="text-slate-400 text-xs font-medium flex items-center gap-1">
                             <Clock size={12}/> {new Date(item.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                           </p>
                           <span className="w-1 h-1 bg-slate-300 rounded-full" />
                           <p className="text-slate-400 text-xs font-medium">
                             {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </p>
                        </div>
                      </div>
                    </div>
                    <div className="px-5 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-tighter">
                      Present
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <BookOpen size={30} className="text-slate-300" />
                </div>
                <p className="text-slate-400 font-bold">No attendance recorded yet</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* SCANNER MODAL */}
      {scannerOpen && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl flex items-center justify-center z-[100] p-6">
          <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 flex justify-between items-center border-b border-slate-100">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Camera Scanner</h2>
                <p className="text-slate-500 text-sm font-medium">Align the QR code inside the frame</p>
              </div>
              <button onClick={() => setScannerOpen(false)} className="bg-slate-100 text-slate-500 p-3 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="p-8">
              <div className="relative aspect-square rounded-[2rem] overflow-hidden border-8 border-slate-900 bg-black shadow-inner">
                {marking ? (
                   <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                      <div className="text-center text-white">
                         <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-4"></div>
                         <p className="font-bold">Verifying Presence...</p>
                      </div>
                   </div>
                ) : (
                  <QRScanner onScan={handleScan} />
                )}
                <div className="absolute inset-0 border-[40px] border-black/20 pointer-events-none" />
                <div className="absolute top-1/2 left-0 w-full h-1 bg-indigo-500 animate-scan shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
              </div>
              <p className="text-center text-slate-400 mt-8 text-sm font-bold animate-pulse uppercase tracking-widest">
                Scanning Auto-Detect Mode
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components
function NavItem({ icon, label, active = false, onClick }) {
  return (
    <button onClick={onClick} className={`
      w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold tracking-tight
      ${active ? "bg-white text-slate-900 shadow-xl shadow-black/20" : "text-slate-400 hover:bg-slate-800 hover:text-white"}
    `}>
      {icon} {label}
    </button>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className={`bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:border-indigo-100 group`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform">{icon}</div>
      </div>
      <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">{title}</p>
      <h2 className="text-4xl font-black text-slate-800 tracking-tighter">{value}</h2>
    </div>
  );
}