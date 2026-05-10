import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();

  // 🔥 BLOCK ROUTING UNTIL AUTH CHECK FINISHES
  if (loading) {
    return <div className="flex h-screen items-center justify-center">
      Loading...
    </div>;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  if (user.role !== allowedRole) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;