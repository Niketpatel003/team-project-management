import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Modal from "../components/ui/Modal";
import StatusBadge from "../components/ui/StatusBadge";
import TaskCard from "../components/ui/TaskCard";
import { useAppData } from "../contexts/AppDataContext";
import { useAuth } from "../contexts/AuthContext";
import { formatDate, getInitials } from "../services/utils";

const blankTaskForm = {
  title: "",
  description: "",
  dueDate: "",
  priority: "medium",
  status: "todo",
  assigneeId: "",
};

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const { currentUser } = useAuth();
  const {
    dataLoading,
    getProjectById,
    getTasksForProject,
    loadProjectDetail,
    projectDetailsLoading,
    isProjectAdmin,
    canUpdateTask,
    addMemberToProject,
    removeMemberFromProject,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
  } = useAppData();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [taskForm, setTaskForm] = useState(blankTaskForm);
  const [editingTaskId, setEditingTaskId] = useState(null);

  useEffect(() => {
    if (projectId) {
      loadProjectDetail(projectId);
    }
  }, [projectId]);

  const project = getProjectById(projectId);
  const isAdmin = isProjectAdmin(projectId);
  const isProjectLoading = Boolean(dataLoading || projectDetailsLoading[projectId]);

  const members = useMemo(() => {
    return project?.members ?? [];
  }, [project]);

  const tasks = useMemo(() => {
    return project ? getTasksForProject(project.id) : [];
  }, [getTasksForProject, project]);

  const tasksByStatus = useMemo(() => {
    return {
      todo: tasks.filter((task) => task.status === "todo"),
      "in-progress": tasks.filter((task) => task.status === "in-progress"),
      done: tasks.filter((task) => task.status === "done"),
    };
  }, [tasks]);

  if (isProjectLoading && (!project || !project.summary)) {
    return (
      <div className="loading-card">
        <div className="spinner" />
        <p>Loading the project workspace...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="empty-card">
        <h2>Project not found</h2>
        <p>The project may not exist or you may not have access to it.</p>
      </div>
    );
  }

  if (!project.memberIds.includes(currentUser.id)) {
    return (
      <div className="empty-card">
        <h2>Access restricted</h2>
        <p>You need to be a project member before you can view this workspace.</p>
      </div>
    );
  }

  const resetTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTaskId(null);
    setTaskForm(blankTaskForm);
  };

  const handleAddMember = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const member = await addMemberToProject({ projectId, email: memberEmail });
      setMemberEmail("");
      setIsMemberModalOpen(false);
      setMessage(`${member.name} was added to the project.`);
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveTask = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      if (editingTaskId) {
        await updateTask(
          editingTaskId,
          {
            ...taskForm,
            assigneeId: taskForm.assigneeId || null,
          },
          projectId,
        );
        setMessage("Task updated successfully.");
      } else {
        await createTask({
          projectId,
          ...taskForm,
          assigneeId: taskForm.assigneeId || null,
        });
        setMessage("Task created successfully.");
      }

      resetTaskModal();
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditTask = (task) => {
    setEditingTaskId(task.id);
    setTaskForm({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate.slice(0, 10),
      priority: task.priority,
      status: task.status,
      assigneeId: task.assigneeId ?? "",
    });
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = async (taskId) => {
    setError("");
    setMessage("");

    try {
      await deleteTask(taskId, projectId);
      setMessage("Task deleted.");
    } catch (submissionError) {
      setError(submissionError.message);
    }
  };

  const handleRemoveMember = async (memberId) => {
    setError("");
    setMessage("");

    try {
      await removeMemberFromProject({ projectId, memberId });
      setMessage("Member removed from the project.");
    } catch (submissionError) {
      setError(submissionError.message);
    }
  };

  return (
    <div className="page-stack">
      <section className={`project-hero project-hero-${project.color}`}>
        <div>
          <p className="eyebrow">{isAdmin ? "Project admin view" : "Project member view"}</p>
          <h2>{project.name}</h2>
          <p>{project.description}</p>
        </div>

        <div className="project-hero-side">
          <div className="join-code-display">
            <span>Join code</span>
            <strong>{project.joinCode}</strong>
          </div>
          <div className="hero-stat-inline">
            <span>{members.length} members</span>
            <span>{tasks.length} tasks</span>
          </div>
        </div>
      </section>

      {message ? <div className="alert alert-success">{message}</div> : null}
      {error ? <div className="alert alert-error">{error}</div> : null}

      <section className="project-detail-grid">
        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Team</p>
              <h3>Project members</h3>
            </div>
            {isAdmin ? (
              <button type="button" className="button button-secondary" onClick={() => setIsMemberModalOpen(true)}>
                Add Member
              </button>
            ) : null}
          </div>

          <div className="member-list">
            {members.map((member) => (
              <div key={member.id} className="member-item">
                <div className="member-item-main">
                  <span className="profile-avatar">{getInitials(member.name)}</span>
                  <div>
                    <strong>{member.name}</strong>
                    <span>{member.email}</span>
                  </div>
                </div>
                <div className="member-item-meta">
                  <span className="role-pill">
                    {project.adminId === member.id ? "Admin" : "Member"}
                  </span>
                  {isAdmin && project.adminId !== member.id ? (
                    <button
                      type="button"
                      className="text-button text-button-danger"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Quick summary</p>
              <h3>Project health</h3>
            </div>
            {isAdmin ? (
              <button
                type="button"
                className="button button-primary"
                onClick={() => {
                  setTaskForm(blankTaskForm);
                  setEditingTaskId(null);
                  setIsTaskModalOpen(true);
                }}
              >
                Create Task
              </button>
            ) : null}
          </div>

          <div className="project-summary-grid">
            <div>
              <span>To Do</span>
              <strong>{tasksByStatus.todo.length}</strong>
            </div>
            <div>
              <span>In Progress</span>
              <strong>{tasksByStatus["in-progress"].length}</strong>
            </div>
            <div>
              <span>Done</span>
              <strong>{tasksByStatus.done.length}</strong>
            </div>
            <div>
              <span>Created</span>
              <strong>{formatDate(project.createdAt)}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="task-board">
        {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
          <div key={status} className="task-column">
            <div className="task-column-head">
              <StatusBadge value={status} />
              <strong>{statusTasks.length}</strong>
            </div>

            <div className="task-column-body">
              {statusTasks.length ? (
                statusTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    assignee={task.assigneeId ? members.find((member) => member.id === task.assigneeId) : null}
                    projectName={project.name}
                    canManage={isAdmin}
                    canUpdateStatus={canUpdateTask(task)}
                    onStatusChange={(nextStatus) => updateTaskStatus(task.id, nextStatus, projectId)}
                    onEdit={() => openEditTask(task)}
                    onDelete={() => handleDeleteTask(task.id)}
                  />
                ))
              ) : (
                <div className="empty-column">
                  <p>No tasks in this lane yet.</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </section>

      {isMemberModalOpen ? (
        <Modal
          title="Add member"
          description="Invite a registered user to this project by email."
          onClose={() => setIsMemberModalOpen(false)}
        >
          <form className="form-grid" onSubmit={handleAddMember}>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={memberEmail}
                onChange={(event) => setMemberEmail(event.target.value)}
                placeholder="member@example.com"
                required
              />
            </label>

            <div className="modal-actions">
              <button type="button" className="button button-ghost" onClick={() => setIsMemberModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="button button-primary" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Member"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {isTaskModalOpen ? (
        <Modal
          title={editingTaskId ? "Edit task" : "Create task"}
          description="Admins can define priorities, assignees, due dates, and initial status."
          onClose={resetTaskModal}
        >
          <form className="form-grid" onSubmit={handleSaveTask}>
            <label className="field">
              <span>Title</span>
              <input
                type="text"
                value={taskForm.title}
                onChange={(event) =>
                  setTaskForm((previous) => ({ ...previous, title: event.target.value }))
                }
                required
                placeholder="Task title"
              />
            </label>

            <label className="field">
              <span>Description</span>
              <textarea
                rows="4"
                value={taskForm.description}
                onChange={(event) =>
                  setTaskForm((previous) => ({ ...previous, description: event.target.value }))
                }
                required
                placeholder="Task description"
              />
            </label>

            <div className="field-row">
              <label className="field">
                <span>Due date</span>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(event) =>
                    setTaskForm((previous) => ({ ...previous, dueDate: event.target.value }))
                  }
                  required
                />
              </label>

              <label className="field">
                <span>Priority</span>
                <select
                  value={taskForm.priority}
                  onChange={(event) =>
                    setTaskForm((previous) => ({ ...previous, priority: event.target.value }))
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </label>
            </div>

            <div className="field-row">
              <label className="field">
                <span>Assignee</span>
                <select
                  value={taskForm.assigneeId}
                  onChange={(event) =>
                    setTaskForm((previous) => ({ ...previous, assigneeId: event.target.value }))
                  }
                >
                  <option value="">Unassigned</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Status</span>
                <select
                  value={taskForm.status}
                  onChange={(event) =>
                    setTaskForm((previous) => ({ ...previous, status: event.target.value }))
                  }
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="button button-ghost" onClick={resetTaskModal}>
                Cancel
              </button>
              <button type="submit" className="button button-primary" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingTaskId ? "Save Changes" : "Create Task"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
