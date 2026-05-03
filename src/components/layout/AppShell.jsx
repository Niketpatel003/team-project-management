import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getInitials } from "../../services/utils";

const navigation = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Projects", path: "/projects" },
  { label: "My Tasks", path: "/my-tasks" },
];

const routeHeadings = {
  "/dashboard": "Performance at a glance",
  "/projects": "Projects in motion",
  "/my-tasks": "Your delivery queue",
};

export default function AppShell() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const routeLabel = routeHeadings[location.pathname] ?? "Project workspace";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">S</div>
          <div>
            <p className="brand-name">SyncSphere</p>
            <p className="brand-tag">Team task command center</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? "sidebar-link sidebar-link-active" : "sidebar-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footnote">
          <p className="eyebrow">Full-stack milestone</p>
          <p>
            This workspace is now wired around a Django + MongoDB API with JWT auth, ready for
            local end-to-end testing and the final deployment pass.
          </p>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Workspace</p>
            <h1>{routeLabel}</h1>
          </div>

          <div className="topbar-actions">
            <div className="profile-chip">
              <span className="profile-avatar">{getInitials(currentUser.name)}</span>
              <div>
                <p>{currentUser.name}</p>
                <span>{currentUser.email}</span>
              </div>
            </div>
            <button type="button" className="button button-ghost" onClick={logout}>
              Log out
            </button>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
