import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import { toast } from "react-hot-toast";
import { logoutUser } from "../services/authService";
import API from "../api/api";

// ============================================================
//  INLINED ADMIN SERVICE FUNCTIONS (replaces adminService.js)
// ============================================================
const getStats = async () => (await API.get("/admin/stats")).data;
const createDepartment = async (data) => (await API.post("/admin/department", data)).data;
const createCourse = async (data) => (await API.post("/admin/course", data)).data;
const createUser = async (data) => (await API.post("/admin/user", data)).data;
const getDepartments = async () => (await API.get("/admin/departments")).data;
const getTeachers = async () => (await API.get("/admin/teachers")).data;
const getStudents = async () => (await API.get("/admin/students")).data;
const getCourses = async () => (await API.get("/admin/courses")).data;
const assignTeacher = async (data) => (await API.post("/admin/assign-teacher", data)).data;
const enrollStudent = async (data) => (await API.post("/admin/enroll", data)).data;
const deleteUser = async (userId) => (await API.delete(`/admin/user/${userId}`)).data;
const getStudentReport = async (sid) => (await API.get(`/admin/student-report/${sid}`)).data;
// ============================================================

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // UI States
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data States
  const [stats, setStats] = useState({});
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);

  // Form States
  const [deptName, setDeptName] = useState("");

  const [courseData, setCourseData] = useState({
    name: "", code: "", departmentId: "", semester: "",
  });

  const [userData, setUserData] = useState({
    name: "", email: "", password: "", role: "student", departmentId: "",
  });

  const [assignData, setAssignData] = useState({ teacherId: "", courseId: "" });

  const [enrollData, setEnrollData] = useState({
    studentId: "", courseId: "", semester: "", departmentId: "",
  });

  // Delete User State
  const [deleteUserId, setDeleteUserId] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Student Report State
  const [reportStudentId, setReportStudentId] = useState("");
  const [studentReport, setStudentReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // ===================== SYNC DATA =====================
  const syncData = useCallback(async () => {
    try {
      setLoading(true);
      const [s, d, t, c, st] = await Promise.all([
        getStats(), getDepartments(), getTeachers(), getCourses(), getStudents(),
      ]);
      setStats(s || {});
      setDepartments(d || []);
      setTeachers(t || []);
      setCourses(c || []);
      setStudents(st || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { syncData(); }, [syncData]);

  // ===================== HANDLERS =====================

  const handleDept = async (e) => {
    e.preventDefault();
    if (!deptName.trim()) return toast.error("Please enter department name");
    try {
      setSubmitting(true);
      await createDepartment({ name: deptName.trim() });
      toast.success("Department created successfully");
      setDeptName("");
      await syncData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create department");
    } finally { setSubmitting(false); }
  };

  const handleCourse = async (e) => {
    e.preventDefault();
    if (!courseData.name || !courseData.code || !courseData.departmentId || !courseData.semester)
      return toast.error("All fields are required for creating a course");
    try {
      setSubmitting(true);
      await createCourse(courseData);
      toast.success("Course created successfully");
      setCourseData({ name: "", code: "", departmentId: "", semester: "" });
      await syncData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create course");
    } finally { setSubmitting(false); }
  };

  const handleUser = async (e) => {
    e.preventDefault();
    if (!userData.name || !userData.email || !userData.password || !userData.role)
      return toast.error("Please fill all required user fields");
    if (userData.role === "student" && !userData.departmentId)
      return toast.error("Please assign a department to the student");
    try {
      setSubmitting(true);
      await createUser(userData);
      toast.success(`${userData.role.toUpperCase()} created successfully`);
      setUserData({ name: "", email: "", password: "", role: "student", departmentId: "" });
      await syncData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create user");
    } finally { setSubmitting(false); }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignData.teacherId || !assignData.courseId)
      return toast.error("Please select both a teacher and a course");
    try {
      setSubmitting(true);
      await assignTeacher(assignData);
      toast.success("Teacher assigned to course successfully");
      setAssignData({ teacherId: "", courseId: "" });
      await syncData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign teacher");
    } finally { setSubmitting(false); }
  };

  const handleEnroll = async (e) => {
    e.preventDefault();

    if (!enrollData.studentId || !enrollData.departmentId || !enrollData.semester) {
      return toast.error("Student, Department, and Semester are all required for batch enrollment");
    }

    try {
      setSubmitting(true);

      // Backend controller ko call karega jahan pure semester ke courses auto-enroll honge
      const response = await enrollStudent(enrollData);

      // Backend se aane wale dynamic success message ko show karega
      toast.success(response?.message || "Student batch enrolled successfully");

      // Form fields ko reset karega (courseId field payload se clear)
      setEnrollData({ studentId: "", departmentId: "", semester: "" });

      // Dashboard numbers aur states ko live sync karega
      await syncData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Batch enrollment failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- DELETE USER ----
  const handleDeleteUser = async (e) => {
    e.preventDefault();
    if (!deleteUserId) return toast.error("Please select a user to delete");
    if (!deleteConfirm) return toast.error("Please confirm deletion by checking the box");
    try {
      setSubmitting(true);
      await deleteUser(deleteUserId);
      toast.success("User deleted successfully");
      setDeleteUserId("");
      setDeleteConfirm(false);
      await syncData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    } finally { setSubmitting(false); }
  };

  // ---- STUDENT REPORT ----
  const handleGetReport = async (e) => {
    e.preventDefault();
    if (!reportStudentId) return toast.error("Please select a student");
    try {
      setReportLoading(true);
      setStudentReport(null);
      const data = await getStudentReport(reportStudentId);
      setStudentReport(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch student report");
    } finally { setReportLoading(false); }
  };

  // ---- LOGOUT ----
  const handleLogout = async () => {
    try { await logoutUser(); } catch (err) { console.error("Logout API failed", err); }
    finally { logout(); navigate("/"); }
  };

  // ===================== DESATURATED GRAY COMPONENT UI STYLES =====================
  const inputStyle = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-150 disabled:bg-gray-100 disabled:cursor-not-allowed";
  const labelStyle = "block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider";
  const buttonStyle = "w-full bg-gray-900 text-white text-sm font-medium py-2.5 px-4 rounded-xl hover:bg-gray-800 active:bg-gray-900 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition duration-150 shadow-sm cursor-pointer flex items-center justify-center";

  const Spinner = () => (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans antialiased flex justify-center items-center">

      {/* OUTER CANVAS SIDEBAR DASHBOARD CANVAS CONTAINER */}
      <div className="w-full max-w-[1366px] min-h-[720px] bg-gray-800 p-4 rounded-[28px] shadow-2xl flex gap-4 border border-gray-700 overflow-hidden">

        {/* SIDEBAR NAVIGATION MODULE */}
        <aside className="w-64 flex flex-col justify-between p-4 shrink-0">
          <div>
            {/* Branding Logo */}
            <div className="px-3 mb-8">
              <h1 className="text-white font-bold text-lg tracking-tight">Ali Haider</h1>
            </div>

            {/* Navigation Tabs Layer */}
            <nav className="space-y-1 relative">
              {[
                { id: "overview", label: "Overview", icon: "▢" },
                { id: "users", label: "User Control", icon: "👤" },
                { id: "courses", label: "Courses", icon: "▤" },
                { id: "dept", label: "Departments", icon: "⚙" },
                { id: "enroll", label: "Access Request", icon: "⚲" },
                { id: "delete", label: "Delete User", icon: "✕" },
                { id: "report", label: "Student Report", icon: "📋" },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-300 relative cursor-pointer ${isActive
                        ? "text-gray-900 bg-white rounded-l-2xl rounded-r-none translate-x-4 shadow-sm z-10"
                        : "text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/40"
                      }`}
                  >
                    {isActive && (
                      <>
                        <div className="absolute right-4 top-[-16px] w-4 h-4 bg-transparent shadow-[4px_4px_0_0_#fff] rounded-br-full pointer-events-none" />
                        <div className="absolute right-4 bottom-[-16px] w-4 h-4 bg-transparent shadow-[4px_-4px_0_0_#fff] rounded-tr-full pointer-events-none" />
                      </>
                    )}
                    <span className="text-base leading-none opacity-80">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Core Support Block */}
          <div className="bg-gray-700/40 border border-gray-600/40 p-4 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 text-white font-bold text-xs p-2 rounded-xl border border-white/10">24/7</div>
              <div>
                <p className="text-xs font-semibold text-white">Support Core</p>
                <p className="text-[10px] text-gray-400">System Ready</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-400 transition-colors cursor-pointer text-xs p-1"
              title="Exit Dashboard"
            >
              Quit ⤤
            </button>
          </div>
        </aside>

        {/* MAIN DASHBOARD WHITE MAIN LAYER */}
        <main className="flex-1 bg-white rounded-[22px] p-8 flex flex-col overflow-y-auto">

          {/* CONTROL CENTER LAYER HEADER */}
          <div className="flex justify-between items-center pb-6 border-b border-gray-100 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 capitalize">{activeTab} Control Layer</h2>
              <p className="text-xs text-gray-400 mt-0.5">Management System / Central Node</p>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
              <div className="h-7 w-7 rounded-full bg-gray-900 flex items-center justify-center text-white text-[10px] font-bold">AD</div>
              <span className="text-xs font-medium text-gray-700">Ali Haider</span>
            </div>
          </div>

          {/* LOADER SYNC NOTIFICATION BANNER */}
          {loading && (
            <div className="mb-6 flex items-center gap-3 bg-gray-50 border border-gray-200 p-4 rounded-xl text-xs text-gray-600 animate-pulse">
              <span className="inline-block h-2 w-2 rounded-full bg-gray-900" />
              <p className="font-medium">Fetching real-time metrics data from the university core database...</p>
            </div>
          )}

          {/* DATA INTERFACE OUTPUT CONTROLLERS */}
          <div className="flex-1">

            {/* ===== OVERVIEW INDEX MODULE ===== */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {[
                    { title: "Sales / Enrolled", value: stats.students, desc: "Active profiles registered" },
                    { title: "Purchases / Faculty", value: stats.teachers, desc: "Verified system instructors" },
                    { title: "Orders / Courses", value: stats.courses, desc: "Syllabus active modules" },
                  ].map((card, idx) => (
                    <div key={idx} className="bg-gray-50 border border-gray-200 rounded-2xl p-6 relative overflow-hidden">
                      <div className="absolute top-4 right-4 text-xs font-mono bg-white border border-gray-200 px-2 py-0.5 rounded-md text-gray-400">↗</div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{card.title}</p>
                      <p className="text-3xl font-bold text-gray-900 tracking-tight">{loading ? "..." : (card.value || 0)}</p>
                      <span className="text-[11px] text-gray-400 block mt-1.5 font-medium">{card.desc}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-2">
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Overview / System Units</h3>
                      <span className="text-[11px] font-medium bg-white px-2 py-0.5 border border-gray-200 rounded text-gray-500">Live</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: "Registered Departments", count: stats.departments },
                        { label: "Approved Course Units", count: stats.courses },
                        { label: "Faculty Members Total", count: stats.teachers },
                        { label: "Student Profiles Safe", count: stats.students },
                      ].map((item, index) => (
                        <div key={index} className={`flex justify-between items-center p-3 rounded-lg border text-xs ${index === 0 ? 'bg-gray-900 text-white border-transparent' : 'bg-white border-gray-200 text-gray-700'}`}>
                          <span>{item.label}</span>
                          <span className="font-bold">{loading ? ".." : (item.count || 0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Total Allocation Status</h3>
                      <span className="text-[11px] text-gray-400">Live Engine</span>
                    </div>
                    <div className="my-6 flex items-center justify-center">
                      <div className="h-28 w-28 rounded-full border-8 border-gray-200 flex items-center justify-center border-t-gray-900">
                        <span className="text-xl font-bold text-gray-900 tracking-tight">70%</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 text-center font-medium">Optimal system data saturation status achieved.</p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">System Activity Feed</h3>
                      <span className="text-[11px] text-gray-400">Logs</span>
                    </div>
                    <div className="space-y-3">
                      {["Yellow status update log info", "Red status database write complete", "Green process allocation request"].map((text, i) => (
                        <div key={i} className="flex gap-2.5 items-start text-xs text-gray-600">
                          <span className={`h-2 w-2 rounded-full mt-1 shrink-0 ${i === 1 ? 'bg-red-400' : i === 2 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          <p className="line-clamp-2 leading-relaxed"><strong>{text}</strong>: Core system metrics matrix allocation layer parameters processed successfully.</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== USER MANAGEMENT ACTIONS ===== */}
            {activeTab === "users" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
                  <div className="mb-5">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Account Provisioning</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Register new students or credentialed faculty layers.</p>
                  </div>
                  <form onSubmit={handleUser} className="space-y-4">
                    <div>
                      <label className={labelStyle}>Full Name</label>
                      <input type="text" disabled={submitting} placeholder="e.g. Dr. Sarah Jenkins" className={inputStyle}
                        value={userData.name} onChange={(e) => setUserData({ ...userData, name: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelStyle}>Official Email Address</label>
                      <input type="email" disabled={submitting} placeholder="username@university.edu" className={inputStyle}
                        value={userData.email} onChange={(e) => setUserData({ ...userData, email: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelStyle}>Temporary Password</label>
                      <input type="password" disabled={submitting} placeholder="••••••••" className={inputStyle}
                        value={userData.password} onChange={(e) => setUserData({ ...userData, password: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelStyle}>Account Role</label>
                        <select disabled={submitting} className={inputStyle} value={userData.role}
                          onChange={(e) => setUserData({ ...userData, role: e.target.value })}>
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelStyle}>Assigned Department</label>
                        <select disabled={submitting} className={inputStyle} value={userData.departmentId}
                          onChange={(e) => setUserData({ ...userData, departmentId: e.target.value })}>
                          <option value="">Select Wing</option>
                          {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <button type="submit" disabled={submitting} className={buttonStyle}>
                      {submitting ? <><Spinner />Saving Profile...</> : "Generate Account"}
                    </button>
                  </form>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
                  <div className="mb-5">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Course Allocation</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Map authorized instructors to approved curriculum modules.</p>
                  </div>
                  <form onSubmit={handleAssign} className="space-y-4">
                    <div>
                      <label className={labelStyle}>Assign Instructor</label>
                      <select disabled={submitting} className={inputStyle} value={assignData.teacherId}
                        onChange={(e) => setAssignData({ ...assignData, teacherId: e.target.value })}>
                        <option value="">Select Teacher Profile</option>
                        {teachers.map((t) => <option key={t._id} value={t._id}>{t.name} ({t.email})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelStyle}>Target Course Unit</label>
                      <select disabled={submitting} className={inputStyle} value={assignData.courseId}
                        onChange={(e) => setAssignData({ ...assignData, courseId: e.target.value })}>
                        <option value="">Select Module</option>
                        {courses.map((c) => <option key={c._id} value={c._id}>{c.name} — [{c.code}]</option>)}
                      </select>
                    </div>
                    <button type="submit" disabled={submitting} className={buttonStyle}>
                      {submitting ? <><Spinner />Mapping Structure...</> : "Authorize Course Mapping"}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* ===== CURRICULUM CREATION BLOCK ===== */}
            {activeTab === "courses" && (
              <div className="max-w-xl bg-white p-6 rounded-2xl border border-gray-200 mx-auto">
                <div className="mb-5">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Curriculum Creation</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Inject verified course structures into the academic matrix.</p>
                </div>
                <form onSubmit={handleCourse} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className={labelStyle}>Course Name</label>
                      <input type="text" disabled={submitting} placeholder="Data Structures & Algorithms" className={inputStyle}
                        value={courseData.name} onChange={(e) => setCourseData({ ...courseData, name: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelStyle}>Course Code</label>
                      <input type="text" disabled={submitting} placeholder="CS-202" className={inputStyle}
                        value={courseData.code} onChange={(e) => setCourseData({ ...courseData, code: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className={labelStyle}>Target Semester</label>
                    <input type="text" disabled={submitting} placeholder="e.g. Spring 2026" className={inputStyle}
                      value={courseData.semester} onChange={(e) => setCourseData({ ...courseData, semester: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelStyle}>Hosting Department</label>
                    <select disabled={submitting} className={inputStyle} value={courseData.departmentId}
                      onChange={(e) => setCourseData({ ...courseData, departmentId: e.target.value })}>
                      <option value="">Select Academic Branch</option>
                      {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </div>
                  <button type="submit" disabled={submitting} className={buttonStyle}>
                    {submitting ? <><Spinner />Publishing Block...</> : "Launch Course Module"}
                  </button>
                </form>
              </div>
            )}

            {/* ===== DEPARTMENT GOVERNANCE BLOCK ===== */}
            {activeTab === "dept" && (
              <div className="max-w-xl bg-white p-6 rounded-2xl border border-gray-200 mx-auto">
                <div className="mb-5">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Department Governance</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Establish official institutional faculties and resource clusters.</p>
                </div>
                <form onSubmit={handleDept} className="space-y-4">
                  <div>
                    <label className={labelStyle}>Full Department Name</label>
                    <input type="text" disabled={submitting} placeholder="Department of Artificial Intelligence" className={inputStyle}
                      value={deptName} onChange={(e) => setDeptName(e.target.value)} />
                  </div>
                  <button type="submit" disabled={submitting} className={buttonStyle}>
                    {submitting ? <><Spinner />Registering...</> : "Deploy Faculty Department"}
                  </button>
                </form>
              </div>
            )}

            {/* ===== STUDENT LEDGER ENROLLMENT ACCESS ===== */}
            {activeTab === "enroll" && (
              <div className="max-w-xl bg-white p-6 rounded-2xl border border-gray-200 mx-auto">
                <div className="mb-5">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Smart Batch Enrollment Ledger</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Student ka semester aur department select karein. System us block ke saare subjects auto-enroll kar dega.
                  </p>
                </div>

                <form onSubmit={handleEnroll} className="space-y-4">
                  {/* Student Identity Selector */}
                  <div>
                    <label className={labelStyle}>Target Student Profile</label>
                    <select
                      disabled={submitting}
                      className={inputStyle}
                      value={enrollData.studentId}
                      onChange={(e) => setEnrollData({ ...enrollData, studentId: e.target.value })}
                    >
                      <option value="">Select Enrolling Student</option>
                      {students.map((s) => (
                        <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Destination Department */}
                    <div>
                      <label className={labelStyle}>Destination Department</label>
                      <select
                        disabled={submitting}
                        className={inputStyle}
                        value={enrollData.departmentId}
                        onChange={(e) => setEnrollData({ ...enrollData, departmentId: e.target.value })}
                      >
                        <option value="">Choose Department</option>
                        {departments.map((d) => (
                          <option key={d._id} value={d._id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Target Semester (Numeric matching backend parseInt) */}
                    <div>
                      <label className={labelStyle}>Target Semester Number</label>
                      <input
                        type="number"
                        disabled={submitting}
                        placeholder="e.g. 7"
                        className={inputStyle}
                        min="1"
                        max="12"
                        value={enrollData.semester}
                        onChange={(e) => setEnrollData({ ...enrollData, semester: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Form Action Execution Control Button */}
                  <button type="submit" disabled={submitting} className={buttonStyle}>
                    {submitting ? (
                      <>
                        <Spinner />
                        Processing Bulk Semester Grid Enrollment...
                      </>
                    ) : (
                      "Verify & Batch Enroll Student"
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ===== ACCOUNT TERMINATION TERMINAL ===== */}
            {activeTab === "delete" && (
              <div className="max-w-xl bg-white p-6 rounded-2xl border border-red-200 mx-auto bg-red-50/20">
                <div className="mb-5">
                  <h3 className="text-sm font-bold text-red-900 uppercase tracking-wider">Terminate User System Access</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Permanently purge structural student or faculty access tokens. This action is critical and absolute.</p>
                </div>
                <form onSubmit={handleDeleteUser} className="space-y-4">
                  <div>
                    <label className={labelStyle}>Select Targeted User Profile</label>
                    <select disabled={submitting} className={inputStyle} value={deleteUserId}
                      onChange={(e) => { setDeleteUserId(e.target.value); setDeleteConfirm(false); }}>
                      <option value="">— Choose profile —</option>
                      <optgroup label="Students Engine">
                        {students.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
                      </optgroup>
                      <optgroup label="Faculty Structure">
                        {teachers.map((t) => <option key={t._id} value={t._id}>{t.name} ({t.email})</option>)}
                      </optgroup>
                    </select>
                  </div>

                  {deleteUserId && (
                    <div className="flex items-start gap-3 bg-white border border-red-200 rounded-xl p-4 shadow-sm">
                      <input
                        id="confirm-delete"
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 accent-gray-900 border-gray-300 rounded cursor-pointer"
                        checked={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.checked)}
                      />
                      <label htmlFor="confirm-delete" className="text-xs text-gray-600 font-medium leading-snug cursor-pointer">
                        I authorize the permanent deletion of the selected account. All linked course history records and metrics keys will be destroyed.
                      </label>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !deleteUserId || !deleteConfirm}
                    className="w-full bg-red-600 text-white text-sm font-medium py-2.5 px-4 rounded-xl hover:bg-red-700 active:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed transition duration-150 shadow-sm cursor-pointer flex items-center justify-center"
                  >
                    {submitting ? <><Spinner />Purging Profile Token...</> : "Confirm Deletion Purge"}
                  </button>
                </form>
              </div>
            )}

            {/* ===== STUDENT ACADEMIC REPORTS ENGINE ===== */}
            {activeTab === "report" && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
                  <div className="mb-5">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Student Academic Report Ledger</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Query and compile student performance index records into data read sheets.</p>
                  </div>
                  <form onSubmit={handleGetReport} className="space-y-4">
                    <div>
                      <label className={labelStyle}>Target Student Identity Selector</label>
                      <select disabled={reportLoading} className={inputStyle} value={reportStudentId}
                        onChange={(e) => { setReportStudentId(e.target.value); setStudentReport(null); }}>
                        <option value="">— Choose student record —</option>
                        {students.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
                      </select>
                    </div>
                    <button type="submit" disabled={reportLoading || !reportStudentId} className={buttonStyle}>
                      {reportLoading ? <><Spinner />Compiling Data...</> : "Query Student Metrics"}
                    </button>
                  </form>
                </div>

                {/* Report Content Dynamic View Output */}
                {studentReport && (
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-5 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                      <div>
                        <h4 className="text-base font-bold text-gray-900">{studentReport.name || "Student Profile View"}</h4>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{studentReport.email}</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-900 text-white px-2.5 py-1 rounded-md">Compiled Ledger Data</span>
                    </div>

                    {studentReport.department && (
                      <div>
                        <p className={labelStyle}>Department Node Branch</p>
                        <p className="text-sm text-gray-900 font-medium">{studentReport.department?.name || studentReport.department}</p>
                      </div>
                    )}

                    {studentReport.enrolledCourses?.length > 0 && (
                      <div>
                        <p className={labelStyle}>Enrolled Active Courses Spectrum</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          {studentReport.enrolledCourses.map((c, i) => (
                            <div key={i} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs">
                              <span className="font-semibold text-gray-900">{c.name || c}</span>
                              {c.code && <span className="text-[10px] text-gray-400 font-mono border border-gray-100 bg-gray-50 px-1.5 py-0.5 rounded">{c.code}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ===== MERGED GRADES / MARKS TABLES LAYER ===== */}
                    {studentReport.grades?.length > 0 && (
                      <div>
                        <p className={labelStyle}>Grades Ledger Matrix</p>
                        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white mt-2">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                              <tr>
                                {Object.keys(studentReport.grades[0]).map((k) => (
                                  <th key={k} className="px-4 py-3 text-left font-semibold">{k}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {studentReport.grades.map((row, i) => (
                                <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                                  {Object.values(row).map((v, j) => (
                                    <td key={j} className="px-4 py-3 text-gray-700 font-medium">{String(v)}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* ===== MERGED DYNAMIC OBJECT PARAMETERS FALLBACK ===== */}
                    {Object.keys(studentReport)
                      .filter((k) => !["name", "email", "department", "enrolledCourses", "grades"].includes(k))
                      .map((k) => (
                        <div key={k} className="border-t border-gray-200/60 pt-3">
                          <p className={labelStyle}>{k}</p>
                          <div className="text-xs bg-white border border-gray-200 rounded-xl p-3 text-gray-700 font-mono whitespace-pre-wrap">
                            {typeof studentReport[k] === "object"
                              ? JSON.stringify(studentReport[k], null, 2)
                              : String(studentReport[k])}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
