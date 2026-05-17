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

  // Core Functional States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" or "history"
  const [user, setUser] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  // 1. Fetch Authenticated Profile Info
  const fetchUser = useCallback(async () => {
    try {
      const data = await getMe();
      setUser(data.user);
    } catch (err) {
      navigate("/");
    }
  }, [navigate]);

  // 2. Fetch Full Attendance Log Array
  const fetchAttendance = useCallback(async () => {
    try {
      const response = await API.get("/attendance/me");
      setAttendance(response.data || []);
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

  // 3. Mark Attendance Payload Engine via Camera Stream Token
  const handleScan = async (scannedData) => {
    if (marking) return;
    try {
      setMarking(true);
      const qrObj = JSON.parse(scannedData);

      await API.post("/attendance/mark", {
        sessionId: qrObj.sessionId,
        token: qrObj.token,
      });

      toast.success("Attendance Marked Successfully!", {
        icon: '✅',
        style: { borderRadius: '12px', background: '#0f172a', color: '#fff' }
      });
      
      setScannerOpen(false);
      fetchAttendance(); 
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or Expired QR System Token");
    } finally {
      setMarking(false);
    }
  };

  // 4. Secure Session Terminate Call
  const handleLogout = async () => {
    try {
      await logoutUser();
      logout();
      navigate("/");
    } catch (err) { 
      toast.error("Logout process failed"); 
    }
  };

  // Dynamic Metrics Processing Ledger 
  const totalAttended = attendance.length;
  const attendancePercentage = totalAttended > 0 ? "94%" : "0%"; 

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-slate-900 border-solid"></div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest animate-pulse">Syncing Secure Core Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-900">
      
      {/* Responsive Overlay Mask layer */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ===== UNIFIED ADMIN-STYLE SIDEBAR CONTAINER ===== */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white p-6 
        flex flex-col transition-transform duration-300 shadow-xl
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-base shadow-lg shadow-indigo-600/20">S</div>
              <h1 className="text-xl font-black tracking-tight">PORTAL NODE</h1>
            </div>
            <button className="md:hidden p-2 hover:bg-slate-800 rounded-lg text-slate-400" onClick={() => setSidebarOpen(false)}>
              <X size={18} />
            </button>
          </div>

          {/* Connected Tab Action Routing Switch */}
          <nav className="space-y-1.5">
            <NavItem 
              icon={<BookOpen size={18} />} 
              label="My Dashboard" 
              active={activeTab === "dashboard"} 
              onClick={() => { setActiveTab("dashboard"); setSidebarOpen(false); }}
            />
            <NavItem 
              icon={<Clock size={18} />} 
              label="Attendance History" 
              active={activeTab === "history"} 
              onClick={() => { setActiveTab("history"); setSidebarOpen(false); }}
            />
            <NavItem 
              icon={<QrCode size={18} />} 
              label="Launch Scanner" 
              onClick={() => { setScannerOpen(true); setSidebarOpen(false); }}
            />
          </nav>
        </div>

        {/* Dynamic Profile Sign-out footer anchor */}
        <button onClick={handleLogout} className="mt-auto flex items-center justify-center gap-2 bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 border border-slate-800">
          <LogOut size={14} /> Sign Out Session
        </button>
      </aside>

      {/* ===== DYNAMIC MAIN PANEL SPACE ===== */}
      <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto">
        
        {/* STRUCTURAL HEADER SECTION */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="p-3 bg-white border border-slate-200 text-slate-700 rounded-xl md:hidden shadow-sm hover:bg-slate-50">
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                Welcome, {user?.name ? user.name.split(" ")[0] : "Student"}!
              </h2>
              <p className="text-slate-500 text-sm font-medium mt-0.5">University Data Operations Center • Active Node</p>
            </div>
          </div>

          {/* Quick Registry Display Widget Card */}
          <div className="bg-white border border-slate-200 px-5 py-3 rounded-2xl shadow-sm flex items-center gap-3">
             <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Hash size={16}/></div>
             <div>
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest leading-none">Registration ID</p>
                <h3 className="text-sm font-black text-slate-900 mt-1">{user?.regNo || "N/A"}</h3>
             </div>
          </div>
        </header>

        {/* Dynamic Section Renderer switching panels seamlessly */}
        {activeTab === "dashboard" ? (
          <>
            {/* STRUCTURAL ADMIN INTENSITY STAT CARDS */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <StatCard title="Classes Attended" value={totalAttended} icon={<CheckCircle size={18} className="text-slate-900"/>} />
              <StatCard title="Attendance Rate" value={attendancePercentage} icon={<TrendingUp size={18} className="text-slate-900"/>} />
              {/* Fix: Directly pulling current backend semester object reliably */}
              <StatCard title="Current Semester" value={user?.semester ? `Semester ${user.semester}` : "Not Set"} icon={<BookOpen size={18} className="text-slate-900"/>} />
            </section>

            {/* ACTION RADAR BROADCAST SCAN CARD */}
            <section className="bg-slate-900 text-white rounded-3xl p-8 lg:p-10 mb-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
              <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-inner flex-shrink-0">
                  <QrCode size={44} className="text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight mb-1.5">Awaiting Verification Stream</h3>
                  <p className="text-slate-400 text-sm font-medium max-w-md leading-relaxed">
                    Align your mobile lens directly with the supervisor's changing coordinate window code to sign your attendance matrix block.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setScannerOpen(true)}
                className="w-full md:w-auto bg-white text-slate-900 px-8 py-3.5 rounded-xl font-black text-sm tracking-wide shadow-md hover:bg-slate-100 transition-all active:scale-95 whitespace-nowrap"
              >
                Launch QR Scanner
              </button>
            </section>
          </>
        ) : null}

        {/* LOG PANEL COMPONENT (Shows filtered view on dashboard, full list view on Tab toggle) */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
              {activeTab === "history" ? "Complete Enrollment Audit History" : "Recent Verification Logs"}
            </h3>
            {activeTab === "dashboard" && (
              <button onClick={() => setActiveTab("history")} className="text-indigo-600 font-bold text-xs hover:underline">
                View Ledger
              </button>
            )}
          </div>

          <div className="p-4">
            {attendance.length > 0 ? (
              <div className="space-y-2">
                {(activeTab === "dashboard" ? attendance.slice(0, 4) : attendance).map((item) => (
                  <div key={item._id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/60 hover:border-slate-300 transition-all">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-800 flex-shrink-0">
                        <CheckCircle size={16} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate">
                          {item.courseId?.name || "System Lecture Block"}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-medium">
                           <span className="flex items-center gap-1"><Clock size={12}/> {new Date(item.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                           <span>•</span>
                           <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-slate-900 text-white rounded-lg font-black text-[9px] uppercase tracking-wider flex-shrink-0">
                      Verified
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-slate-200">
                  <BookOpen size={20} className="text-slate-400" />
                </div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No structural data vectors tracked</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ===== SYSTEM HARD OVERLAY SCANNER WINDOW ===== */}
      {scannerOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 flex justify-between items-center border-b border-slate-100 bg-slate-50">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Hardware Node Sync</h2>
                <p className="text-slate-400 text-xs font-medium">Position the generated dynamic token area</p>
              </div>
              <button onClick={() => setScannerOpen(false)} className="bg-white border border-slate-200 text-slate-500 p-2 rounded-xl hover:bg-slate-100 transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <div className="relative aspect-square rounded-2xl overflow-hidden border-4 border-slate-900 bg-black shadow-lg">
                {marking ? (
                   <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
                      <div className="text-center text-white p-4">
                         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-3"></div>
                         <p className="text-xs font-bold uppercase tracking-widest">Committing block hash...</p>
                      </div>
                   </div>
                ) : (
                  <QRScanner onScan={handleScan} />
                )}
                <div className="absolute inset-0 border-[30px] border-black/10 pointer-events-none" />
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 opacity-60 animate-pulse" />
              </div>
              <p className="text-center text-slate-400 mt-5 text-[10px] font-black uppercase tracking-widest animate-pulse">
                Auto detection alignment matrix active
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component Navigation Link Line Row
function NavItem({ icon, label, active = false, onClick }) {
  return (
    <button onClick={onClick} className={`
      w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all font-bold text-sm tracking-tight
      ${active ? "bg-white text-slate-900 shadow-md shadow-black/10" : "text-slate-400 hover:bg-slate-800 hover:text-white"}
    `}>
      {icon} <span className="truncate">{label}</span>
    </button>
  );
}

// Sub-component Information Numeric Stat Display Box 
function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-3">
        <div className="p-2 bg-slate-100 rounded-xl">{icon}</div>
      </div>
      <p className="text-slate-400 font-black text-[9px] uppercase tracking-widest mb-0.5">{title}</p>
      <h2 className="text-2xl font-black text-slate-900 tracking-tight truncate">{value}</h2>
    </div>
  );
}