import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();

  if (loading) return null; // AuthProvider handle kar raha hai, but safety first

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Role check (lowercase taake case sensitivity ka masla na ho)
  if (user.role.toLowerCase() !== allowedRole.toLowerCase()) {
    return <Navigate to="/" replace />;
  }

  return children;
};