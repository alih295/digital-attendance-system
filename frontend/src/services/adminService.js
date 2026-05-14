import API from '../api/api';

export const getStats = async () => {
  const response = await API.get("/admin/stats");
  return response.data;
};

export const createDepartment = async (data) => {
  const response = await API.post("/admin/department", data);
  return response.data;
};

export const createCourse = async (data) => {
  const response = await API.post("/admin/course", data);
  return response.data;
};

export const createUser = async (data) => {
  const response = await API.post("/admin/user", data);
  return response.data;
};

export const getDepartments = async () => {
  const response = await API.get("/admin/departments");
  return response.data;
};

export const getTeachers = async () => {
  const response = await API.get("/admin/teachers");
  return response.data;
};

export const getStudents = async () => {
  const response = await API.get("/admin/students");
  return response.data;
};

export const getCourses = async () => {
  const response = await API.get("/admin/courses");
  return response.data;
};

export const assignTeacher = async (data) => {
  const response = await API.post("/admin/assign-teacher", data);
  return response.data;
};

// 🔥 NEW PROFESSIONAL LOGIC
export const enrollStudent = async (data) => {
  const response = await API.post("/admin/enroll", data);
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await API.delete(`/admin/user/${userId}`);
  return response.data;
};

export const getStudentReport = async (studentId) => {
  const response = await API.get(`/admin/student-report/${studentId}`);
  return response.data;
};