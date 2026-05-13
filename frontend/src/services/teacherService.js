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
  try {
    const response = await API.post(`/teacher/start-session/${courseId}`);

    // ✅ Guard — check before reading .session
    if (!response.data || !response.data.session) {
      throw new Error("Invalid response from server — session missing");
    }

    return response.data;

  } catch (error) {
    console.error("Start session error:", error.response?.data || error.message);
    throw error; // re-throw so UI can handle it
  }
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
