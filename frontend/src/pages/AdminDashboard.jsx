import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "../services/adminService";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ---------------- STATES ----------------
  const [stats, setStats] = useState({});

  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);

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

  // ---------------- LOAD STATS ----------------
  const loadStats = async () => {
    try {
      const res = await getStats();
      setStats(res);
    } catch (err) {
      console.log(err);
    }
  };

  // ---------------- LOAD DATA ----------------
 const loadData = async () => {
  try {
    const deptRes = await getDepartments();
    const teacherRes = await getTeachers();
    const courseRes = await getCourses();

    setDepartments(deptRes);
    setTeachers(teacherRes);
    setCourses(courseRes);

  } catch (err) {
    console.log(err);
  }
};

  useEffect(() => {
    loadStats();
    loadData();
  }, []);

  // ---------------- CREATE DEPARTMENT ----------------
  const handleDept = async () => {
    try {
      if (!deptName) {
        return alert("Enter Department Name");
      }

      await createDepartment({
        name: deptName,
      });

      setDeptName("");

      loadStats();
      loadData();

      alert("Department Created");

    } catch (err) {
      console.log(err);
      alert("Failed");
    }
  };

  // ---------------- CREATE COURSE ----------------
  const handleCourse = async () => {
    try {
      await createCourse(courseData);

      setCourseData({
        name: "",
        code: "",
        departmentId: "",
        semester: "",
      });

      loadStats();
      loadData();

      alert("Course Created");

    } catch (err) {
      console.log(err);
      alert("Failed");
    }
  };

  // ---------------- CREATE USER ----------------
  const handleUser = async () => {
    try {
      await createUser(userData);

      setUserData({
        name: "",
        email: "",
        password: "",
        role: "student",
        departmentId: "",
      });

      loadStats();
      loadData();

      alert("User Created");

    } catch (err) {
      console.log(err);
      alert("Failed");
    }
  };


 const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/");
    } catch (err) {
      console.log("Logout Error:", err);
    }
  };



  // ---------------- ASSIGN TEACHER ----------------
  const handleAssign = async () => {
    try {
      await assignTeacher(assignData);

      setAssignData({
        teacherId: "",
        courseId: "",
      });

      alert("Teacher Assigned");

    } catch (err) {
      console.log(err);
      alert("Failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex relative">

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <div
        className={`fixed lg:static top-0 left-0 h-full w-72 bg-black text-white p-6 flex flex-col justify-between z-50 transition-transform duration-300 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div>
          <h1 className="text-3xl font-bold">DAS</h1>

          <p className="text-gray-400 text-sm mb-8">
            Admin Panel
          </p>

          <nav className="space-y-4">

            <button className="bg-white text-black px-4 py-3 rounded-xl w-full text-left font-semibold">
              Dashboard
            </button>

            <button className="hover:bg-gray-900 px-4 py-3 rounded-xl w-full text-left">
              Departments
            </button>

            <button className="hover:bg-gray-900 px-4 py-3 rounded-xl w-full text-left">
              Courses
            </button>

            <button className="hover:bg-gray-900 px-4 py-3 rounded-xl w-full text-left">
              Users
            </button>

          </nav>
        </div>

        <button onClick={handleLogout} className="bg-red-500 cursor-pointer py-3 rounded-xl font-semibold">
          Logout
        </button>
      </div>

      {/* MAIN */}
      <div className="flex-1 p-4 md:p-8 w-full">

        {/* MOBILE HEADER */}
        <div className="flex justify-between items-center lg:hidden mb-6">

          <button
            onClick={() => setSidebarOpen(true)}
            className="bg-black text-white p-3 rounded-xl"
          >
            <Menu />
          </button>

          <h2 className="font-bold">
            Admin Dashboard
          </h2>

        </div>

        {/* HEADER */}
        <div className="mb-10">

          <h1 className="text-3xl md:text-5xl font-bold">
            Admin Dashboard
          </h1>

          <p className="text-gray-500">
            Manage system data
          </p>

        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">

          <div className="bg-white p-5 rounded-3xl shadow">
            <p>Departments</p>
            <h2 className="text-4xl font-bold">
              {stats.departments || 0}
            </h2>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow">
            <p>Courses</p>
            <h2 className="text-4xl font-bold">
              {stats.courses || 0}
            </h2>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow">
            <p>Teachers</p>
            <h2 className="text-4xl font-bold">
              {stats.teachers || 0}
            </h2>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow">
            <p>Students</p>
            <h2 className="text-4xl font-bold">
              {stats.students || 0}
            </h2>
          </div>

        </div>

        {/* FORMS */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* CREATE DEPARTMENT */}
          <div className="bg-white p-6 rounded-3xl shadow">

            <h2 className="text-xl font-bold mb-4">
              Create Department
            </h2>

            <input
              type="text"
              placeholder="Department Name"
              value={deptName}
              onChange={(e) =>
                setDeptName(e.target.value)
              }
              className="border w-full p-3 rounded-xl mb-4"
            />

            <button
              onClick={handleDept}
              className="bg-black text-white w-full py-3 rounded-xl"
            >
              Create Department
            </button>

          </div>

          {/* CREATE COURSE */}
          <div className="bg-white p-6 rounded-3xl shadow">

            <h2 className="text-xl font-bold mb-4">
              Create Course
            </h2>

            <input
              placeholder="Course Name"
              value={courseData.name}
              onChange={(e) =>
                setCourseData({
                  ...courseData,
                  name: e.target.value,
                })
              }
              className="border w-full p-3 rounded-xl mb-2"
            />

            <input
              placeholder="Course Code"
              value={courseData.code}
              onChange={(e) =>
                setCourseData({
                  ...courseData,
                  code: e.target.value,
                })
              }
              className="border w-full p-3 rounded-xl mb-2"
            />

            <select
              value={courseData.departmentId}
              onChange={(e) =>
                setCourseData({
                  ...courseData,
                  departmentId: e.target.value,
                })
              }
              className="border w-full p-3 rounded-xl mb-2"
            >
              <option value="">
                Select Department
              </option>

              {departments.map((dept) => (
                <option
                  key={dept._id}
                  value={dept._id}
                >
                  {dept.name}
                </option>
              ))}
            </select>

            <input
              placeholder="Semester"
              value={courseData.semester}
              onChange={(e) =>
                setCourseData({
                  ...courseData,
                  semester: e.target.value,
                })
              }
              className="border w-full p-3 rounded-xl mb-4"
            />

            <button
              onClick={handleCourse}
              className="bg-black text-white w-full py-3 rounded-xl"
            >
              Create Course
            </button>

          </div>

          {/* CREATE USER */}
          <div className="bg-white p-6 rounded-3xl shadow">

            <h2 className="text-xl font-bold mb-4">
              Create User
            </h2>

            <input
              placeholder="Name"
              value={userData.name}
              onChange={(e) =>
                setUserData({
                  ...userData,
                  name: e.target.value,
                })
              }
              className="border w-full p-3 rounded-xl mb-2"
            />

            <input
              placeholder="Email"
              value={userData.email}
              onChange={(e) =>
                setUserData({
                  ...userData,
                  email: e.target.value,
                })
              }
              className="border w-full p-3 rounded-xl mb-2"
            />

            <input
              type="password"
              placeholder="Password"
              value={userData.password}
              onChange={(e) =>
                setUserData({
                  ...userData,
                  password: e.target.value,
                })
              }
              className="border w-full p-3 rounded-xl mb-2"
            />

            <select
              value={userData.role}
              onChange={(e) =>
                setUserData({
                  ...userData,
                  role: e.target.value,
                })
              }
              className="border w-full p-3 rounded-xl mb-2"
            >
              <option value="student">
                Student
              </option>

              <option value="teacher">
                Teacher
              </option>
            </select>

            <select
              value={userData.departmentId}
              onChange={(e) =>
                setUserData({
                  ...userData,
                  departmentId: e.target.value,
                })
              }
              className="border w-full p-3 rounded-xl mb-4"
            >
              <option value="">
                Select Department
              </option>

              {departments.map((dept) => (
                <option
                  key={dept._id}
                  value={dept._id}
                >
                  {dept.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleUser}
              className="bg-black text-white w-full py-3 rounded-xl"
            >
              Create User
            </button>

          </div>

          {/* ASSIGN TEACHER */}
          <div className="bg-white p-6 rounded-3xl shadow">

            <h2 className="text-xl font-bold mb-4">
              Assign Teacher
            </h2>

            <select
              value={assignData.teacherId}
              onChange={(e) =>
                setAssignData({
                  ...assignData,
                  teacherId: e.target.value,
                })
              }
              className="border w-full p-3 rounded-xl mb-2"
            >
              <option value="">
                Select Teacher
              </option>

              {teachers.map((teacher) => (
                <option
                  key={teacher._id}
                  value={teacher._id}
                >
                  {teacher.name}
                </option>
              ))}
            </select>

            <select
              value={assignData.courseId}
              onChange={(e) =>
                setAssignData({
                  ...assignData,
                  courseId: e.target.value,
                })
              }
              className="border w-full p-3 rounded-xl mb-4"
            >
              <option value="">
                Select Course
              </option>

              {courses.map((course) => (
                <option
                  key={course._id}
                  value={course._id}
                >
                  {course.name} ({course.code})
                </option>
              ))}
            </select>

            <button
              onClick={handleAssign}
              className="bg-black text-white w-full py-3 rounded-xl"
            >
              Assign Teacher
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}