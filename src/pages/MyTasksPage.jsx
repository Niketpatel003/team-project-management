import { startTransition, useDeferredValue, useMemo, useState } from "react";
import TaskCard from "../components/ui/TaskCard";
import { useAppData } from "../contexts/AppDataContext";
import { useAuth } from "../contexts/AuthContext";

export default function MyTasksPage() {
  const { currentUser } = useAuth();
  const {
    assignedTasks,
    assignedTasksLoading,
    currentUserProjectsById,
    updateTaskStatus,
  } = useAppData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const deferredSearch = useDeferredValue(search);

  const filteredTasks = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();

    return assignedTasks.filter((task) => {
      const matchesStatus = statusFilter === "all" ? true : task.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        task.title.toLowerCase().includes(normalizedSearch) ||
        task.description.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [assignedTasks, deferredSearch, statusFilter]);

  if (assignedTasksLoading) {
    return (
      <div className="loading-card">
        <div className="spinner" />
        <p>Loading your assigned tasks...</p>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="section-toolbar">
        <div>
          <p className="eyebrow">Personal queue</p>
          <h2>Tasks currently assigned to you</h2>
          <p className="muted">Members can update their task status here without needing admin access.</p>
        </div>
      </section>

      <section className="filter-bar">
        <label className="field">
          <span>Search</span>
          <input
            type="text"
            value={search}
            onChange={(event) => {
              const value = event.target.value;
              startTransition(() => setSearch(value));
            }}
            placeholder="Search title or description"
          />
        </label>

        <label className="field">
          <span>Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </label>
      </section>

      <section className="task-list-grid">
        {filteredTasks.length ? (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              assignee={currentUser}
              projectName={currentUserProjectsById[task.projectId]?.name ?? "Project"}
              canManage={false}
              canUpdateStatus
              onStatusChange={(nextStatus) => updateTaskStatus(task.id, nextStatus, task.projectId)}
            />
          ))
        ) : (
          <article className="empty-card">
            <h3>No matching tasks</h3>
            <p>Try another search or filter, or wait for a new task assignment.</p>
          </article>
        )}
      </section>
    </div>
  );
}
