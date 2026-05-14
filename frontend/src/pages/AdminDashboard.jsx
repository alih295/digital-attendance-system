import { useEffect, useState, useCallback } from "react";
import { 
  Menu, X, LogOut, Users, BookOpen, Building2, LayoutDashboard, 
  UserPlus, PlusCircle, Link, Trash2, ShieldCheck, Search
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import { logoutUser } from "../services/authService";
import { toast } from "react-hot-toast";

import {
  getStats, createDepartment, createCourse, createUser,
  assignTeacher, getDepartments, getTeachers, getCourses,
} from "../services/adminService";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // UI States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // overview, users, courses, depts
  const [loading, setLoading] = useState(true);

  // Data States
  const [stats, setStats] = useState({});
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);

  // Form States
  const [deptName, setDeptName] = useState("");
  const [courseData, setCourseData] = useState({ name: "", code: "", departmentId: "", semester: "" });
  const [userData, setUserData] = useState({ name: "", email: "", password: "", role: "student", departmentId: "" });
  const [assignData, setAssignData] = useState({ teacherId: "", courseId: "" });

  const syncData = useCallback(async () => {
    try {
      setLoading(true);
      const [s, d, t, c] = await Promise.all([
        getStats(), getDepartments(), getTeachers(), getCourses()
      ]);
      setStats(s);
      setDepartments(d);
      setTeachers(t);
      setCourses(c);
    } catch (err) {
      toast.error("Failed to sync server data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncData();
  }, [syncData]);

  // Handlers
  const handleDept = async () => {
    if (!deptName) return toast.error("Enter Department Name");
    try {
      await createDepartment({ name: deptName });
      toast.success("Department Created");
      setDeptName("");
      syncData();
    } catch (err) { toast.error("Creation Failed"); }
  };

  const handleCourse = async () => {
    try {
      await createCourse(courseData);
      toast.success("Course Registered");
      setCourseData({ name: "", code: "", departmentId: "", semester: "" });
      syncData();
    } catch (err) { toast.error("Course Creation Failed"); }
  };

  const handleUser = async () => {
    try {
      await createUser(userData);
      toast.success(`${userData.role} Account Created`);
      setUserData({ name: "", email: "", password: "", role: "student", departmentId: "" });
      syncData();
    } catch (err) { toast.error("User Creation Failed"); }
  };

  const handleAssign = async () => {
    try {
      await assignTeacher(assignData);
      toast.success("Teacher Linked to Course");
      setAssignData({ teacherId: "", courseId: "" });
      syncData();
    } catch (err) { toast.error("Assignment Failed"); }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      logout();
      navigate("/");
    } catch (err) { toast.error("Logout Error"); }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
      {/* SIDEBAR */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white p-6 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="h-10 w-10 bg-indigo-500 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/20">A</div>
          <h1 className="text-2xl font-black tracking-tighter italic">ADMIN</h1>
          <button className="lg:hidden ml-auto" onClick={() => setSidebarOpen(false)}><X /></button>
        </div>

        <nav className="space-y-2 flex-1">
          <SideNavItem icon={<LayoutDashboard size={20}/>} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <SideNavItem icon={<Users size={20}/>} label="User Management" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          <SideNavItem icon={<BookOpen size={20}/>} label="Course Catalog" active={activeTab === 'courses'} onClick={() => setActiveTab('courses')} />
          <SideNavItem icon={<Building2 size={20}/>} label="Departments" active={activeTab === 'depts'} onClick={() => setActiveTab('depts')} />
        </nav>

        <button onClick={handleLogout} className="mt-auto flex items-center justify-center gap-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white py-4 rounded-2xl font-bold transition-all border border-rose-500/10">
          <LogOut size={20} /> Sign Out
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
             <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 bg-white rounded-lg shadow-sm"><Menu /></button>
             <div>
                <h2 className="text-3xl font-black text-slate-800 capitalize">{activeTab}</h2>
                <p className="text-slate-400 font-medium text-sm">Control center for DAS institution</p>
             </div>
          </div>
          <div className="hidden md:flex bg-white p-1 rounded-xl border border-slate-200">
             <button onClick={syncData} className="px-4 py-2 hover:bg-slate-50 rounded-lg text-slate-500 text-sm font-bold transition-all">Refresh Sync</button>
          </div>
        </header>

        {activeTab === 'overview' && (
          <>
            {/* STATS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <StatCard title="Total Students" value={stats.students} color="bg-blue-500" icon={<Users className="text-white"/>} />
              <StatCard title="Teachers" value={stats.teachers} color="bg-indigo-500" icon={<ShieldCheck className="text-white"/>} />
              <StatCard title="Departments" value={stats.departments} color="bg-emerald-500" icon={<Building2 className="text-white"/>} />
              <StatCard title="Courses" value={stats.courses} color="bg-amber-500" icon={<BookOpen className="text-white"/>} />
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
               {/* ASSIGN TEACHER FORM */}
               <section className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Link size={20}/></div>
                    <h3 className="text-xl font-bold">Assign Teacher to Course</h3>
                  </div>
                  <div className="space-y-4">
                    <Select label="Select Instructor" value={assignData.teacherId} onChange={(e) => setAssignData({...assignData, teacherId: e.target.value})} options={teachers} />
                    <Select label="Select Course" value={assignData.courseId} onChange={(e) => setAssignData({...assignData, courseId: e.target.value})} options={courses} isCourse />
                    <button onClick={handleAssign} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200">Link Instructor</button>
                  </div>
               </section>

               {/* RECENT DATA PREVIEW (Simplified list) */}
               <section className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-bold mb-6">Quick Overview</h3>
                  <div className="space-y-4">
                     {courses.slice(0, 4).map(c => (
                       <div key={c._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                         <span className="font-bold text-slate-700">{c.name}</span>
                         <span className="text-[10px] font-black uppercase bg-white px-3 py-1 rounded-full text-slate-400 border border-slate-200">{c.code}</span>
                       </div>
                     ))}
                  </div>
               </section>
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <FormCard title="New User" icon={<UserPlus/>}>
                <Input placeholder="Full Name" value={userData.name} onChange={(e) => setUserData({...userData, name: e.target.value})} />
                <Input placeholder="Email Address" value={userData.email} onChange={(e) => setUserData({...userData, email: e.target.value})} />
                <Input placeholder="Password" type="password" value={userData.password} onChange={(e) => setUserData({...userData, password: e.target.value})} />
                <Select label="Role" value={userData.role} onChange={(e) => setUserData({...userData, role: e.target.value})} options={[{_id:'student', name:'Student'}, {_id:'teacher', name:'Teacher'}]} />
                <Select label="Department" value={userData.departmentId} onChange={(e) => setUserData({...userData, departmentId: e.target.value})} options={departments} />
                <button onClick={handleUser} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold">Register User</button>
              </FormCard>
            </div>
            <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 overflow-hidden">
               <div className="p-6 border-b border-slate-100 font-bold">Recent Registered Users</div>
               <div className="p-4 space-y-3">
                  {[...teachers].map(u => (
                    <div key={u._id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">{u.name[0]}</div>
                        <div>
                          <p className="font-bold text-slate-800">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase px-3 py-1 bg-slate-100 text-slate-500 rounded-lg">{u.role}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
           <div className="grid lg:grid-cols-3 gap-8">
              <FormCard title="New Course" icon={<PlusCircle/>}>
                <Input placeholder="Course Name" value={courseData.name} onChange={(e) => setCourseData({...courseData, name: e.target.value})} />
                <Input placeholder="Course Code (e.g. CS-101)" value={courseData.code} onChange={(e) => setCourseData({...courseData, code: e.target.value})} />
                <Input placeholder="Semester" value={courseData.semester} onChange={(e) => setCourseData({...courseData, semester: e.target.value})} />
                <Select label="Department" value={courseData.departmentId} onChange={(e) => setCourseData({...courseData, departmentId: e.target.value})} options={departments} />
                <button onClick={handleCourse} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold">Add Course</button>
              </FormCard>
           </div>
        )}

        {activeTab === 'depts' && (
           <div className="max-w-md">
              <FormCard title="New Department" icon={<Building2/>}>
                <Input placeholder="Department Name" value={deptName} onChange={(e) => setDeptName(e.target.value)} />
                <button onClick={handleDept} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold">Create Department</button>
              </FormCard>
           </div>
        )}
      </main>
    </div>
  );
}

// ---------------- UI COMPONENTS ----------------

function SideNavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${active ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
      {icon} {label}
    </button>
  );
}

function StatCard({ title, value, color, icon }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-all">
      <div className={`${color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>{icon}</div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
      <h2 className="text-4xl font-black text-slate-800 mt-1">{value || 0}</h2>
    </div>
  );
}

function FormCard({ title, icon, children }) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">{icon}</div>
        <h3 className="text-xl font-bold">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Input(props) {
  return <input {...props} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />;
}

function Select({ label, options, value, onChange, isCourse }) {
  return (
    <select value={value} onChange={onChange} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none">
      <option value="">{label}</option>
      {options.map(opt => (
        <option key={opt._id} value={opt._id}>{opt.name} {isCourse && `(${opt.code})`}</option>
      ))}
    </select>
  );
}