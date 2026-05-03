import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { authLoading, currentUser } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="screen-center">
        <div className="loading-card">
          <div className="spinner" />
          <p>Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
