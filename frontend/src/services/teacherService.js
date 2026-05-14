import API from "../api/api";

// =======================================
// 1. GET TEACHER'S ASSIGNED COURSES
// =======================================
export const getMyCourses = async () => {
  try {
    const response = await API.get("/teacher/my-courses");
    return response.data;
  } catch (error) {
    console.error("Error fetching courses:", error.response?.data || error.message);
    throw error;
  }
};

// =======================================
// 2. START SESSION (Generate QR)
// =======================================
export const startSession = async (courseId) => {
  try {
    const response = await API.post(`/teacher/start-session/${courseId}`);

    // Check if qrImage and sessionId exist
    if (!response.data || !response.data.sessionId) {
      throw new Error("Failed to generate QR session");
    }

    return response.data; // { sessionId, qrImage, expiresAt }
  } catch (error) {
    console.error("Start session error:", error.response?.data || error.message);
    throw error;
  }
};

// =======================================
// 3. REFRESH QR CODE (Every 15 Seconds)
// =======================================
export const refreshQRCode = async (sessionId) => {
  try {
    const response = await API.get(`/teacher/refresh-qr/${sessionId}`);
    return response.data; // { qrImage, expiresAt }
  } catch (error) {
    console.error("QR Refresh error:", error.response?.data || error.message);
    throw error;
  }
};

// =======================================
// 4. END SESSION
// =======================================
export const endSession = async (sessionId) => {
  try {
    const response = await API.post(`/teacher/end-session/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error("End session error:", error.response?.data || error.message);
    throw error;
  }
};

// =======================================
// 5. LIVE SESSION ATTENDANCE (Real-time list)
// =======================================
export const getSessionAttendance = async (sessionId) => {
  try {
    const response = await API.get(`/teacher/attendance/${sessionId}`);
    return response.data; // { data: [students...] }
  } catch (error) {
    console.error("Fetch attendance error:", error.response?.data || error.message);
    throw error;
  }
};


export const getCourseReportCard = async (courseId) => {
  try {
    // Ye API check karegi kis student ki attendance kitne % hai
    const response = await API.get(`/teacher/student-stats/${courseId}`);
    return response.data;
  } catch (error) {
    console.error("Fetch report card error:", error.response?.data || error.message);
    throw error;
  }
};