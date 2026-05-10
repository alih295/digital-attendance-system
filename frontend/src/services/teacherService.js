import API from "../api/api";

// =========================
// GET MY COURSES
// =========================

export const getMyCourses = async () => {
  console.log(document.cookie);
  const response = await API.get("/teacher/my-courses");

  return response.data;
};

// =========================
// START SESSION
// =========================

export const startSession = async (courseId) => {
  const response = await API.post(`/teacher/start-session/${courseId}`);

  return response.data;
};

// =========================
// END SESSION
// =========================

export const endSession = async (sessionId) => {
  const response = await API.post(`/teacher/end-session/${sessionId}`);

  return response.data;
};

// =========================
// GET ATTENDANCE
// =========================

export const getSessionAttendance = async (sessionId) => {
  const response = await API.get(`/teacher/attendance/${sessionId}`);

  return response.data;
};
