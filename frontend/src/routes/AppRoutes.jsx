import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider"; // Context use karein

import Login from "../pages/Login";
import StudentDashboard from "../pages/StudentDashboard";
import TeacherDashboard from "../pages/TeacherDashboard";
import AdminDashboard from "../pages/AdminDashboard";
import ProtectedRoute from "./ProtectedRoute";

const AppRoutes = () => {
  const { user, loading } = useAuth(); // Context se data lein

  // 1. Jab tak fetching ho rahi hai, screen ko hold karein
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-xl font-semibold">Loading...</span>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* 2. Agar user login hai aur wo '/' par jaye, to usay dashboard par bhej do */}
        <Route
          path="/"
          element={
            user ? (
              <Navigate to={`/${user.role}-dashboard`} replace />
            ) : (
              <Login />
            )
          }
        />

        {/* 3. Protected Routes - useAuth context automatically handles state */}
        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher-dashboard"
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* 4. Catch all undefined routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;