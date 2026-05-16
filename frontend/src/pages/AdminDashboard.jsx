import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import { toast } from "react-hot-toast";
import { logoutUser } from "../services/authService";
import API from "../api/api";

// ============================================================
//  INLINED ADMIN SERVICE FUNCTIONS (replaces adminService.js)
// ============================================================
const getStats          = async ()       => (await API.get("/admin/stats")).data;
const createDepartment  = async (data)   => (await API.post("/admin/department", data)).data;
const createCourse      = async (data)   => (await API.post("/admin/course", data)).data;
const createUser        = async (data)   => (await API.post("/admin/user", data)).data;
const getDepartments    = async ()       => (await API.get("/admin/departments")).data;
const getTeachers       = async ()       => (await API.get("/admin/teachers")).data;
const getStudents       = async ()       => (await API.get("/admin/students")).data;
const getCourses        = async ()       => (await API.get("/admin/courses")).data;
const assignTeacher     = async (data)   => (await API.post("/admin/assign-teacher", data)).data;
const enrollStudent     = async (data)   => (await API.post("/admin/enroll", data)).data;
const deleteUser        = async (userId) => (await API.delete(`/admin/user/${userId}`)).data;
const getStudentReport  = async (sid)    => (await API.get(`/admin/student-report/${sid}`)).data;
// ============================================================

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // UI States
  const [activeTab, setActiveTab]   = useState("overview");
  const [loading, setLoading]       = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data States
  const [stats, setStats]           = useState({});
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers]     = useState([]);
  const [courses, setCourses]       = useState([]);
  const [students, setStudents]     = useState([]);

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
  const [deleteUserId, setDeleteUserId]     = useState("");
  const [deleteConfirm, setDeleteConfirm]   = useState(false);

  // Student Report State
  const [reportStudentId, setReportStudentId] = useState("");
  const [studentReport, setStudentReport]     = useState(null);
  const [reportLoading, setReportLoading]     = useState(false);

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
    if (!enrollData.studentId || !enrollData.courseId || !enrollData.semester || !enrollData.departmentId)
      return toast.error("All enrollment fields are required");
    try {
      setSubmitting(true);
      await enrollStudent(enrollData);
      toast.success("Student enrolled successfully");
      setEnrollData({ studentId: "", courseId: "", semester: "", departmentId: "" });
      await syncData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Enrollment failed");
    } finally { setSubmitting(false); }
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

  // ===================== STYLES =====================
  const inputStyle  = "w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm transition-all placeholder:text-slate-400 bg-white focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:cursor-not-allowed";
  const labelStyle  = "block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider";
  const Spinner     = () => (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  const allUsers = [...students, ...teachers];

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans antialiased">

      {/* HEADER */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-50 shadow-xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-blue-500/20">A</div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-none">Control Center</h1>
              <span className="text-xs text-slate-500 font-medium">System Administrator</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100/80 active:bg-red-200 rounded-xl transition duration-200 gap-2 cursor-pointer"
          >
            Exit Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* TABS */}
        <div className="flex p-1 bg-slate-200/80 rounded-xl mb-8 max-w-4xl overflow-x-auto shadow-xs border border-slate-200/40">
          {[
            { id: "overview", label: "Overview" },
            { id: "users",    label: "User Management" },
            { id: "courses",  label: "Courses" },
            { id: "dept",     label: "Departments" },
            { id: "enroll",   label: "Enrolment" },
            { id: "delete",   label: "Delete User" },
            { id: "report",   label: "Student Report" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[110px] text-center px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* LOADING INDICATOR */}
        {loading && (
          <div className="mb-6 flex items-center gap-3 bg-white border border-blue-100 p-3.5 rounded-xl text-xs sm:text-sm text-blue-700 shadow-xs">
            <div className="flex space-x-1.5 items-center">
              {[0, 150, 300].map((d) => (
                <div key={d} className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
            <p className="font-medium">Fetching real-time university metrics...</p>
          </div>
        )}

        {/* ===== OVERVIEW ===== */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { title: "Total Enrolled Students", value: stats.students,    desc: "Active profiles",    color: "from-blue-500 to-cyan-500" },
              { title: "Academic Faculty",         value: stats.teachers,    desc: "Verified educators", color: "from-indigo-500 to-purple-500" },
              { title: "Registered Departments",   value: stats.departments, desc: "Operational wings",  color: "from-emerald-500 to-teal-500" },
              { title: "Approved Courses",         value: stats.courses,     desc: "Syllabus active",    color: "from-amber-500 to-orange-500" },
            ].map((card, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r ${card.color}`} />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{card.title}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold tracking-tight text-slate-800">{loading ? "..." : (card.value || 0)}</p>
                  <span className="text-xs text-slate-400 font-medium">{card.desc}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== USERS ===== */}
        {activeTab === "users" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

            {/* Create User */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-slate-200/80">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-slate-900">Account Provisioning</h2>
                <p className="text-xs text-slate-500 mt-0.5">Register new student credentials or faculty access layers.</p>
              </div>
              <form onSubmit={handleUser} className="space-y-4">
                <div>
                  <label className={labelStyle}>Full Name</label>
                  <input type="text" disabled={submitting} placeholder="e.g. Dr. Sarah Jenkins" className={inputStyle}
                    value={userData.name} onChange={(e) => setUserData({ ...userData, name: e.target.value })} />
                </div>
                <div>
                  <label className={labelStyle}>Official Email</label>
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
                    <label className={labelStyle}>Department</label>
                    <select disabled={submitting} className={inputStyle} value={userData.departmentId}
                      onChange={(e) => setUserData({ ...userData, departmentId: e.target.value })}>
                      <option value="">Select Wing</option>
                      {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={submitting}
                  className="w-full bg-blue-600 text-white text-sm font-semibold py-2.5 px-4 rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-70 disabled:cursor-not-allowed transition duration-150 shadow-sm mt-2 cursor-pointer">
                  {submitting ? <><Spinner />Saving Profile...</> : "Generate Account"}
                </button>
              </form>
            </div>

            {/* Assign Teacher */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-slate-200/80">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-slate-900">Course Allocation</h2>
                <p className="text-xs text-slate-500 mt-0.5">Map authorized instructors to approved curriculum modules.</p>
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
                <button type="submit" disabled={submitting}
                  className="w-full bg-indigo-600 text-white text-sm font-semibold py-2.5 px-4 rounded-xl hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-70 disabled:cursor-not-allowed transition duration-150 shadow-sm mt-2 cursor-pointer">
                  {submitting ? <><Spinner />Mapping Structure...</> : "Authorize Course Mapping"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ===== COURSES ===== */}
        {activeTab === "courses" && (
          <div className="max-w-xl bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-slate-200/80 mx-auto">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">Curriculum Creation</h2>
              <p className="text-xs text-slate-500 mt-0.5">Inject verified course structures into the academic matrix.</p>
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
                <input type="text" disabled={submitting} placeholder="e.g. Spring 2026 / 3rd" className={inputStyle}
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
              <button type="submit" disabled={submitting}
                className="w-full bg-blue-600 text-white text-sm font-semibold py-2.5 px-4 rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-70 disabled:cursor-not-allowed transition duration-150 shadow-sm mt-2 cursor-pointer">
                {submitting ? <><Spinner />Publishing Block...</> : "Launch Course Module"}
              </button>
            </form>
          </div>
        )}

        {/* ===== DEPARTMENTS ===== */}
        {activeTab === "dept" && (
          <div className="max-w-xl bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-slate-200/80 mx-auto">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">Department Governance</h2>
              <p className="text-xs text-slate-500 mt-0.5">Establish legal institutional faculties and resource clusters.</p>
            </div>
            <form onSubmit={handleDept} className="space-y-4">
              <div>
                <label className={labelStyle}>Full Department Name</label>
                <input type="text" disabled={submitting} placeholder="Department of Artificial Intelligence" className={inputStyle}
                  value={deptName} onChange={(e) => setDeptName(e.target.value)} />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full bg-blue-600 text-white text-sm font-semibold py-2.5 px-4 rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-70 disabled:cursor-not-allowed transition duration-150 shadow-sm mt-2 cursor-pointer">
                {submitting ? <><Spinner />Registering...</> : "Deploy Faculty Department"}
              </button>
            </form>
          </div>
        )}

        {/* ===== ENROLMENT ===== */}
        {activeTab === "enroll" && (
          <div className="max-w-xl bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-slate-200/80 mx-auto">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">Student Enrollment Ledger</h2>
              <p className="text-xs text-slate-500 mt-0.5">Securely process core ledger enrollment assignments for students.</p>
            </div>
            <form onSubmit={handleEnroll} className="space-y-4">
              <div>
                <label className={labelStyle}>Target Student</label>
                <select disabled={submitting} className={inputStyle} value={enrollData.studentId}
                  onChange={(e) => setEnrollData({ ...enrollData, studentId: e.target.value })}>
                  <option value="">Select Enrolling Student</option>
                  {students.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Destination Faculty</label>
                  <select disabled={submitting} className={inputStyle} value={enrollData.departmentId}
                    onChange={(e) => setEnrollData({ ...enrollData, departmentId: e.target.value })}>
                    <option value="">Choose Department</option>
                    {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelStyle}>Selected Course</label>
                  <select disabled={submitting} className={inputStyle} value={enrollData.courseId}
                    onChange={(e) => setEnrollData({ ...enrollData, courseId: e.target.value })}>
                    <option value="">Choose Course</option>
                    {courses.map((c) => <option key={c._id} value={c._id}>{c.name} [{c.code}]</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelStyle}>Active Registration Semester</label>
                <input type="text" disabled={submitting} placeholder="e.g. 4th Semester" className={inputStyle}
                  value={enrollData.semester} onChange={(e) => setEnrollData({ ...enrollData, semester: e.target.value })} />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full bg-emerald-600 text-white text-sm font-semibold py-2.5 px-4 rounded-xl hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-70 disabled:cursor-not-allowed transition duration-150 shadow-sm mt-2 cursor-pointer">
                {submitting ? <><Spinner />Enrolling Account...</> : "Verify & Commit Enrollment"}
              </button>
            </form>
          </div>
        )}

        {/* ===== DELETE USER ===== */}
        {activeTab === "delete" && (
          <div className="max-w-xl bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-red-100 mx-auto">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-red-700">Delete User Account</h2>
              <p className="text-xs text-slate-500 mt-0.5">Permanently remove a student or faculty account from the system. This action cannot be undone.</p>
            </div>
            <form onSubmit={handleDeleteUser} className="space-y-4">
              <div>
                <label className={labelStyle}>Select User to Delete</label>
                <select disabled={submitting} className={inputStyle} value={deleteUserId}
                  onChange={(e) => { setDeleteUserId(e.target.value); setDeleteConfirm(false); }}>
                  <option value="">— Choose a user —</option>
                  <optgroup label="Students">
                    {students.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
                  </optgroup>
                  <optgroup label="Teachers">
                    {teachers.map((t) => <option key={t._id} value={t._id}>{t.name} ({t.email})</option>)}
                  </optgroup>
                </select>
              </div>

              {deleteUserId && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                  <input
                    id="confirm-delete"
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 accent-red-600 cursor-pointer"
                    checked={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.checked)}
                  />
                  <label htmlFor="confirm-delete" className="text-xs text-red-700 font-medium leading-snug cursor-pointer">
                    I understand this will <strong>permanently delete</strong> the selected user and all associated data. This action is irreversible.
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !deleteUserId || !deleteConfirm}
                className="w-full bg-red-600 text-white text-sm font-semibold py-2.5 px-4 rounded-xl hover:bg-red-700 active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 shadow-sm mt-2 cursor-pointer"
              >
                {submitting ? <><Spinner />Deleting Account...</> : "Permanently Delete User"}
              </button>
            </form>
          </div>
        )}

        {/* ===== STUDENT REPORT ===== */}
        {activeTab === "report" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-slate-200/80">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-slate-900">Student Report</h2>
                <p className="text-xs text-slate-500 mt-0.5">Retrieve a full academic report for any enrolled student.</p>
              </div>
              <form onSubmit={handleGetReport} className="space-y-4">
                <div>
                  <label className={labelStyle}>Select Student</label>
                  <select disabled={reportLoading} className={inputStyle} value={reportStudentId}
                    onChange={(e) => { setReportStudentId(e.target.value); setStudentReport(null); }}>
                    <option value="">— Choose a student —</option>
                    {students.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
                  </select>
                </div>
                <button type="submit" disabled={reportLoading || !reportStudentId}
                  className="w-full bg-violet-600 text-white text-sm font-semibold py-2.5 px-4 rounded-xl hover:bg-violet-700 active:bg-violet-800 disabled:opacity-70 disabled:cursor-not-allowed transition duration-150 shadow-sm mt-2 cursor-pointer">
                  {reportLoading ? <><Spinner />Generating Report...</> : "Generate Student Report"}
                </button>
              </form>
            </div>

            {/* Report Output */}
            {studentReport && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-slate-200/80 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{studentReport.name || "Student"}</h3>
                    <p className="text-xs text-slate-500">{studentReport.email}</p>
                  </div>
                  <span className="text-xs font-semibold bg-violet-100 text-violet-700 px-3 py-1 rounded-full">Academic Report</span>
                </div>

                {/* Department */}
                {studentReport.department && (
                  <div>
                    <p className={labelStyle}>Department</p>
                    <p className="text-sm text-slate-700">{studentReport.department?.name || studentReport.department}</p>
                  </div>
                )}

                {/* Enrolled Courses */}
                {studentReport.enrolledCourses?.length > 0 && (
                  <div>
                    <p className={labelStyle}>Enrolled Courses</p>
                    <div className="space-y-2 mt-1">
                      {studentReport.enrolledCourses.map((c, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5 text-sm">
                          <span className="font-medium text-slate-800">{c.name || c}</span>
                          {c.code && <span className="text-xs text-slate-500 font-mono">{c.code}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grades / Marks — render whatever keys the API sends */}
                {studentReport.grades?.length > 0 && (
                  <div>
                    <p className={labelStyle}>Grades</p>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          <tr>
                            {Object.keys(studentReport.grades[0]).map((k) => (
                              <th key={k} className="px-4 py-2.5 text-left">{k}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {studentReport.grades.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                              {Object.values(row).map((v, j) => (
                                <td key={j} className="px-4 py-2.5 text-slate-700">{String(v)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Raw fallback for any other fields */}
                {Object.keys(studentReport)
                  .filter((k) => !["name", "email", "department", "enrolledCourses", "grades"].includes(k))
                  .map((k) => (
                    <div key={k}>
                      <p className={labelStyle}>{k}</p>
                      <p className="text-sm text-slate-700">
                        {typeof studentReport[k] === "object"
                          ? JSON.stringify(studentReport[k], null, 2)
                          : String(studentReport[k])}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}