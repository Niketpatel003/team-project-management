import StatCard from "../components/ui/StatCard";
import StatusBadge from "../components/ui/StatusBadge";
import { useAppData } from "../contexts/AppDataContext";
import { useAuth } from "../contexts/AuthContext";
import { clamp, formatDate } from "../services/utils";

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const { dataLoading, projects, assignedTasks, dashboardMetrics } = useAppData();

  const totalTasks = dashboardMetrics.totalTasks || 1;
  const completionRate = clamp(
    Math.round((dashboardMetrics.tasksByStatus.done / totalTasks) * 100),
    0,
    100,
  );

  if (dataLoading) {
    return (
      <div className="loading-card">
        <div className="spinner" />
        <p>Loading dashboard metrics...</p>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="hero-banner">
        <div>
          <p className="eyebrow">Today's focus</p>
          <h2>{currentUser.name.split(" ")[0]}, your team workspace is moving.</h2>
          <p>
            You currently have access to {projects.length} project{projects.length === 1 ? "" : "s"},
            with {dashboardMetrics.assignedTasksCount} task
            {dashboardMetrics.assignedTasksCount === 1 ? "" : "s"} assigned to you.
          </p>
        </div>

        <div className="hero-badge-cluster">
          <div className="hero-badge">
            <span>Completion</span>
            <strong>{completionRate}%</strong>
          </div>
          <div className="hero-badge">
            <span>Overdue</span>
            <strong>{dashboardMetrics.overdueTasks.length}</strong>
          </div>
        </div>
      </section>

      <section className="stat-grid">
        <StatCard
          label="Total visible tasks"
          value={dashboardMetrics.totalTasks}
          detail="All tasks across projects you belong to."
          tone="amber"
        />
        <StatCard
          label="To Do"
          value={dashboardMetrics.tasksByStatus.todo}
          detail="Tasks that still need to be started."
          tone="rose"
        />
        <StatCard
          label="In Progress"
          value={dashboardMetrics.tasksByStatus["in-progress"]}
          detail="Tasks actively being worked on."
          tone="teal"
        />
        <StatCard
          label="Done"
          value={dashboardMetrics.tasksByStatus.done}
          detail="Completed tasks already delivered."
          tone="slate"
        />
      </section>

      <section className="dashboard-grid">
        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Status distribution</p>
              <h3>Progress across visible tasks</h3>
            </div>
          </div>

          <div className="bar-list">
            {Object.entries(dashboardMetrics.tasksByStatus).map(([status, count]) => {
              const percentage = clamp(Math.round((count / totalTasks) * 100), 0, 100);

              return (
                <div key={status} className="bar-item">
                  <div className="row-between">
                    <StatusBadge value={status} />
                    <strong>{count}</strong>
                  </div>
                  <div className="progress-track progress-track-muted">
                    <div className="progress-fill" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Team workload</p>
              <h3>Tasks per teammate</h3>
            </div>
          </div>

          <div className="workload-list">
            {dashboardMetrics.tasksPerUser.map((user) => (
              <div key={user.id} className="workload-item">
                <div>
                  <strong>{user.name}</strong>
                  <span>{user.totalTasks} assigned task{user.totalTasks === 1 ? "" : "s"}</span>
                </div>
                <div className="workload-metrics">
                  <span>{user.activeTasks} active</span>
                  <span>{user.completedTasks} done</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Assigned to you</p>
              <h3>Upcoming work</h3>
            </div>
          </div>

          <div className="task-list">
            {assignedTasks.length ? (
              assignedTasks.slice(0, 4).map((task) => (
                <div key={task.id} className="compact-task">
                  <div>
                    <strong>{task.title}</strong>
                    <span>{formatDate(task.dueDate)}</span>
                  </div>
                  <StatusBadge value={task.status} />
                </div>
              ))
            ) : (
              <p className="empty-copy">You do not have any assigned tasks right now.</p>
            )}
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Needs attention</p>
              <h3>Overdue tasks</h3>
            </div>
          </div>

          <div className="task-list">
            {dashboardMetrics.overdueTasks.length ? (
              dashboardMetrics.overdueTasks.map((task) => (
                <div key={task.id} className="compact-task compact-task-overdue">
                  <div>
                    <strong>{task.title}</strong>
                    <span>{formatDate(task.dueDate)}</span>
                  </div>
                  <StatusBadge value={task.priority} kind="priority" />
                </div>
              ))
            ) : (
              <p className="empty-copy">No overdue tasks across your visible projects.</p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
