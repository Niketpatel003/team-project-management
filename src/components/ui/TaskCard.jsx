import StatusBadge from "./StatusBadge";
import { formatDate, getInitials, isOverdue } from "../../services/utils";

export default function TaskCard({
  task,
  assignee,
  projectName,
  canManage,
  canUpdateStatus,
  onStatusChange,
  onEdit,
  onDelete,
}) {
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <article className={`task-card ${overdue ? "task-card-overdue" : ""}`}>
      <div className="row-between row-start">
        <div>
          <div className="task-card-badges">
            <StatusBadge value={task.status} />
            <StatusBadge value={task.priority} kind="priority" />
          </div>
          <h4>{task.title}</h4>
        </div>

        {canManage ? (
          <div className="task-actions-inline">
            <button type="button" className="text-button" onClick={onEdit}>
              Edit
            </button>
            <button type="button" className="text-button text-button-danger" onClick={onDelete}>
              Delete
            </button>
          </div>
        ) : null}
      </div>

      <p className="task-description">{task.description}</p>

      <div className="task-meta">
        <div>
          <span>Due</span>
          <strong>{formatDate(task.dueDate)}</strong>
        </div>
        <div>
          <span>Project</span>
          <strong>{projectName}</strong>
        </div>
      </div>

      <div className="task-footer">
        <div className="task-assignee">
          <span className="profile-avatar profile-avatar-small">
            {assignee ? getInitials(assignee.name) : "NA"}
          </span>
          <div>
            <span>Assignee</span>
            <strong>{assignee?.name ?? "Unassigned"}</strong>
          </div>
        </div>

        <label className="status-select">
          <span>Status</span>
          <select
            value={task.status}
            onChange={(event) => onStatusChange(event.target.value)}
            disabled={!canUpdateStatus}
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </label>
      </div>
    </article>
  );
}
