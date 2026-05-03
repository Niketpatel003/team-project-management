import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { AppDataProvider } from "../contexts/AppDataContext";
import AppShell from "../components/layout/AppShell";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import DashboardPage from "../pages/DashboardPage";
import LoginPage from "../pages/LoginPage";
import MyTasksPage from "../pages/MyTasksPage";
import NotFoundPage from "../pages/NotFoundPage";
import ProjectDetailPage from "../pages/ProjectDetailPage";
import ProjectsPage from "../pages/ProjectsPage";
import SignupPage from "../pages/SignupPage";

function AuthRedirect() {
  const { currentUser } = useAuth();

  return <Navigate to={currentUser ? "/dashboard" : "/login"} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AuthRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="/my-tasks" element={<MyTasksPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <AppRoutes />
      </AppDataProvider>
    </AuthProvider>
  );
}
