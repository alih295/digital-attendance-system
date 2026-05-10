import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import { useEffect, useState } from "react";

import Login from "../pages/Login";
import StudentDashboard from "../pages/StudentDashboard";
import TeacherDashboard from "../pages/TeacherDashboard";
import AdminDashboard from "../pages/AdminDashboard";

import ProtectedRoute from "./ProtectedRoute";

import { getMe } from "../services/authService";

const AppRoutes = () => {

  const [user, setUser] = useState(null);

  useEffect(() => {

    const fetchUser = async () => {

      try {

        const data = await getMe();

        setUser(data.user);

      } catch (err) {

        console.log(err);
      }
    };

    fetchUser();

  }, []);

  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute
              user={user}
              allowedRole="student"
            >
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher-dashboard"
          element={
            <ProtectedRoute
              user={user}
              allowedRole="teacher"
            >
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute
              user={user}
              allowedRole="admin"
            >
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

      </Routes>

    </BrowserRouter>
  );
};

export default AppRoutes;