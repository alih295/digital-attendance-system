import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import { toast } from "react-hot-toast";
import { logoutUser } from "../services/authService";

import {
  getStats,
  createDepartment,
  createCourse,
  createUser,
  assignTeacher,
  getDepartments,
  getTeachers,
  getCourses,
  enrollStudent,
} from "../services/adminService";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // UI
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);

  // Data
  const [stats, setStats] = useState({});
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);

  // Forms
  const [deptName, setDeptName] = useState("");

  const [courseData, setCourseData] = useState({
    name: "",
    code: "",
    departmentId: "",
    semester: "",
  });

  const [userData, setUserData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    departmentId: "",
  });

  const [assignData, setAssignData] = useState({
    teacherId: "",
    courseId: "",
  });

  const [enrollData, setEnrollData] = useState({
    studentId: "",
    courseId: "",
    semester: "",
    departmentId: "",
  });

  // ================= LOAD DATA =================
  const syncData = useCallback(async () => {
    try {
      setLoading(true);

      const [s, d, t, c] = await Promise.all([
        getStats(),
        getDepartments(),
        getTeachers(),
        getCourses(),
      ]);

      setStats(s);
      setDepartments(d);
      setTeachers(t);
      setCourses(c);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncData();
  }, [syncData]);

  // ================= DEPARTMENT =================
  const handleDept = async () => {
    try {
      if (!deptName) return toast.error("Enter department name");

      await createDepartment({ name: deptName });
      toast.success("Department created");
      setDeptName("");
      syncData();
    } catch {
      toast.error("Failed");
    }
  };

  // ================= COURSE =================
  const handleCourse = async () => {
    try {
      await createCourse(courseData);
      toast.success("Course created");
      setCourseData({
        name: "",
        code: "",
        departmentId: "",
        semester: "",
      });
      syncData();
    } catch {
      toast.error("Failed");
    }
  };

  // ================= USER =================
  const handleUser = async () => {
    try {
      await createUser(userData);
      toast.success("User created");

      setUserData({
        name: "",
        email: "",
        password: "",
        role: "student",
        departmentId: "",
      });

      syncData();
    } catch {
      toast.error("Failed");
    }
  };

  // ================= ASSIGN TEACHER =================
  const handleAssign = async () => {
    try {
      await assignTeacher(assignData);
      toast.success("Teacher assigned");

      setAssignData({
        teacherId: "",
        courseId: "",
      });

      syncData();
    } catch {
      toast.error("Failed");
    }
  };

  // ================= ENROLL STUDENT (IMPORTANT FIX) =================
  const handleEnroll = async () => {
    try {
      await enrollStudent(enrollData);

      toast.success("Student enrolled");

      setEnrollData({
        studentId: "",
        courseId: "",
        semester: "",
        departmentId: "",
      });

      syncData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Enrollment failed");
    }
  };

  // ================= LOGOUT =================
  const handleLogout = async () => {
    await logoutUser();
    logout();
    navigate("/");
  };

  // ================= UI =================
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      {/* NAV */}
      <div className="flex gap-3 mb-6">
        <button onClick={() => setActiveTab("overview")}>Overview</button>
        <button onClick={() => setActiveTab("users")}>Users</button>
        <button onClick={() => setActiveTab("courses")}>Courses</button>
        <button onClick={() => setActiveTab("dept")}>Department</button>
        <button onClick={() => setActiveTab("enroll")}>Enroll</button>
      </div>

      {/* ================= OVERVIEW ================= */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded shadow">
            Students: {stats.students || 0}
          </div>
          <div className="bg-white p-4 rounded shadow">
            Teachers: {stats.teachers || 0}
          </div>
          <div className="bg-white p-4 rounded shadow">
            Departments: {stats.departments || 0}
          </div>
          <div className="bg-white p-4 rounded shadow">
            Courses: {stats.courses || 0}
          </div>
        </div>
      )}

      {/* ================= USERS ================= */}
      {activeTab === "users" && (
        <div className="bg-white p-4 rounded shadow max-w-md">
          <h2 className="font-bold mb-3">Create User</h2>

          <input
            placeholder="Name"
            value={userData.name}
            onChange={(e) =>
              setUserData({ ...userData, name: e.target.value })
            }
            className="input"
          />

          <input
            placeholder="Email"
            value={userData.email}
            onChange={(e) =>
              setUserData({ ...userData, email: e.target.value })
            }
            className="input"
          />

          <input
            placeholder="Password"
            type="password"
            value={userData.password}
            onChange={(e) =>
              setUserData({ ...userData, password: e.target.value })
            }
            className="input"
          />

          <select
            value={userData.role}
            onChange={(e) =>
              setUserData({ ...userData, role: e.target.value })
            }
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>

          <button onClick={handleUser} className="btn">
            Create User
          </button>
        </div>
      )}

      {/* ================= COURSES ================= */}
      {activeTab === "courses" && (
        <div className="bg-white p-4 rounded shadow max-w-md">
          <h2 className="font-bold mb-3">Create Course</h2>

          <input
            placeholder="Course Name"
            value={courseData.name}
            onChange={(e) =>
              setCourseData({ ...courseData, name: e.target.value })
            }
          />

          <input
            placeholder="Code"
            value={courseData.code}
            onChange={(e) =>
              setCourseData({ ...courseData, code: e.target.value })
            }
          />

          <input
            placeholder="Semester"
            value={courseData.semester}
            onChange={(e) =>
              setCourseData({ ...courseData, semester: e.target.value })
            }
          />

          <button onClick={handleCourse}>Create Course</button>
        </div>
      )}

      {/* ================= DEPARTMENT ================= */}
      {activeTab === "dept" && (
        <div className="bg-white p-4 rounded shadow max-w-md">
          <h2 className="font-bold mb-3">Create Department</h2>

          <input
            placeholder="Department Name"
            value={deptName}
            onChange={(e) => setDeptName(e.target.value)}
          />

          <button onClick={handleDept}>Create</button>
        </div>
      )}

      {/* ================= ENROLLMENT ================= */}
      {activeTab === "enroll" && (
        <div className="bg-white p-4 rounded shadow max-w-md">
          <h2 className="font-bold mb-3">Enroll Student</h2>

          <input
            placeholder="Student ID"
            value={enrollData.studentId}
            onChange={(e) =>
              setEnrollData({ ...enrollData, studentId: e.target.value })
            }
          />

          <select
            value={enrollData.courseId}
            onChange={(e) =>
              setEnrollData({ ...enrollData, courseId: e.target.value })
            }
          >
            <option>Select Course</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            placeholder="Semester"
            value={enrollData.semester}
            onChange={(e) =>
              setEnrollData({ ...enrollData, semester: e.target.value })
            }
          />

          <button onClick={handleEnroll} className="bg-green-600 text-white">
            Enroll Student
          </button>
        </div>
      )}
    </div>
  );
}