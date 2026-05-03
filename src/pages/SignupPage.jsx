import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function SignupPage() {
  const { currentUser, signup } = useAuth();
  const navigate = useNavigate();
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (formState.password !== formState.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await signup(formState);
      navigate("/dashboard", { replace: true });
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell auth-shell-reversed">
      <section className="auth-panel">
        <div className="auth-card">
          <p className="eyebrow">Create account</p>
          <h2>Start a new team workspace</h2>
          <p className="muted">New users can immediately create a project or join one with a code.</p>

          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="field">
              <span>Full name</span>
              <input
                type="text"
                value={formState.name}
                onChange={(event) =>
                  setFormState((previous) => ({ ...previous, name: event.target.value }))
                }
                placeholder="Enter your name"
                required
              />
            </label>

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
                placeholder="Create a password"
                required
                minLength={6}
              />
            </label>

            <label className="field">
              <span>Confirm password</span>
              <input
                type="password"
                value={formState.confirmPassword}
                onChange={(event) =>
                  setFormState((previous) => ({ ...previous, confirmPassword: event.target.value }))
                }
                placeholder="Repeat password"
                required
                minLength={6}
              />
            </label>

            {error ? <p className="form-error">{error}</p> : null}

            <button type="submit" className="button button-primary button-block" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </section>

      <section className="auth-showcase auth-showcase-alt">
        <div className="hero-copy">
          <p className="eyebrow">What's included</p>
          <h1>A collaborative task app with a live backend behind it.</h1>
          <p>
            Sign-up, protected routes, project creation, join codes, task assignment, analytics,
            and role-aware controls are already connected to the backend API flow.
          </p>
        </div>

        <div className="showcase-metric-row">
          <article className="showcase-card showcase-card-featured">
            <strong>Projects</strong>
            <span>Create, join, and manage multi-user workspaces.</span>
          </article>
          <article className="showcase-card showcase-card-featured">
            <strong>Tasks</strong>
            <span>Track priorities, due dates, assignees, and status changes.</span>
          </article>
          <article className="showcase-card showcase-card-featured">
            <strong>Dashboard</strong>
            <span>See workload, overdue items, and overall execution health.</span>
          </article>
        </div>
      </section>
    </div>
  );
}
