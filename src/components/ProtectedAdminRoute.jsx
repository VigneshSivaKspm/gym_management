import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // ⚠️ DEVELOPMENT MODE - Allow all access without login
  const ENABLE_AUTH = false; // Set to true in production

  if (!ENABLE_AUTH) {
    return children; // Allow access without login for dev
  }

  // Loading spinner until profile loads
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mb-4"></div>
          <p className="text-gray-400">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  // Not logged in → redirect to admin-login
  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  // If logged in but not admin → redirect based on role
  if (user.role !== "ADMIN") {
    if (user.role === "TRAINER") return <Navigate to="/trainer" replace />;
    if (user.role === "TRAINEE") return <Navigate to="/trainee" replace />;
    return <Navigate to="/login" replace />;
  }

  // Authenticated admin → allow access
  return children;
};

export default ProtectedAdminRoute;
