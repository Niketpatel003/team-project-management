import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const { currentUser, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formState, setFormState] = useState({
    email: "aarav@syncsphere.app",
    password: "password123",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  const from = location.state?.from?.pathname ?? "/dashboard";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(formState);
      navigate(from, { replace: true });
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-showcase">
        <div className="brand-block brand-block-large">
          <div className="brand-mark">S</div>
          <div>
            <p className="brand-name">SyncSphere</p>
            <p className="brand-tag">Team task management, designed for momentum.</p>
          </div>
        </div>

        <div className="hero-copy">
          <p className="eyebrow">Collaborative execution</p>
          <h1>Keep every project, task, and teammate aligned in one place.</h1>
          <p>
            This app includes authentication, project membership, admin controls, task
            assignment, status tracking, and an analytics dashboard powered by the backend API.
          </p>
        </div>

          <div className="showcase-grid">
            <article className="showcase-card">
              <h3>Role-aware workflow</h3>
              <p>Admins manage projects and members. Members focus on assigned work and status updates.</p>
            </article>
            <article className="showcase-card">
              <h3>Insightful dashboard</h3>
              <p>Track total tasks, progress by status, overdue items, and team workload distribution.</p>
            </article>
            <article className="showcase-card">
              <h3>Live API integration</h3>
              <p>The UI is now wired to the Django + MongoDB backend with JWT authentication.</p>
            </article>
          </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <p className="eyebrow">Welcome back</p>
          <h2>Log into your workspace</h2>
          <p className="muted">Use a seeded backend demo account below or sign up for a fresh user.</p>

          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={formState.email}
                onChange={(event) =>
                  setFormState((previous) => ({ ...previous, email: event.target.value }))
                }
                placeholder="name@example.com"
                required
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={formState.password}
                onChange={(event) =>
                  setFormState((previous) => ({ ...previous, password: event.target.value }))
                }
                placeholder="Enter password"
                required
              />
            </label>

            {error ? <p className="form-error">{error}</p> : null}

            <button type="submit" className="button button-primary button-block" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="demo-credentials">
            <p className="eyebrow">Demo credentials</p>
            <strong>Aarav Mehta</strong>
            <span>aarav@syncsphere.app / password123</span>
            <strong>Maya Nair</strong>
            <span>maya@syncsphere.app / password123</span>
          </div>

          <p className="auth-switch">
            Need an account? <Link to="/signup">Create one</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
