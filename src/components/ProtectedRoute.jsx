import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="farmos-loading">Loading…</div>;
  }

  if (!user) {
    return <Navigate to="/farm-os/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
