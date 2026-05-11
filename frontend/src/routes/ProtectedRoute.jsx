import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

// Props mein 'children' aur 'allowedRole' lazmi check karein
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();

  // Jab tak auth check ho raha hai
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // Agar user nahi hai
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Role check
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;