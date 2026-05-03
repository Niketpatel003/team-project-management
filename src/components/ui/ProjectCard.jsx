import { getInitials } from "../../services/utils";

export default function ProjectCard({
  project,
  members,
  taskCount,
  doneCount,
  overdueCount,
  isAdmin,
  onOpen,
}) {
  const progress = taskCount ? Math.round((doneCount / taskCount) * 100) : 0;

  return (
    <article className={`project-card project-card-${project.color}`}>
      <div className="project-card-top">
        <div>
          <p className="eyebrow">{isAdmin ? "Admin" : "Member"}</p>
          <h3>{project.name}</h3>
        </div>
        <span className="join-code-pill">{project.joinCode}</span>
      </div>

      <p className="project-description">{project.description}</p>

      <div className="project-progress-block">
        <div className="row-between">
          <span>Progress</span>
          <strong>{progress}%</strong>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="project-meta-grid">
        <div>
          <span>Tasks</span>
          <strong>{taskCount}</strong>
        </div>
        <div>
          <span>Completed</span>
          <strong>{doneCount}</strong>
        </div>
        <div>
          <span>Overdue</span>
          <strong>{overdueCount}</strong>
        </div>
      </div>

      <div className="row-between">
        <div className="avatar-stack">
          {members.slice(0, 4).map((member) => (
            <span key={member.id} className="avatar-stack-item" title={member.name}>
              {getInitials(member.name)}
            </span>
          ))}
          {members.length > 4 ? <span className="avatar-stack-count">+{members.length - 4}</span> : null}
        </div>

        <button type="button" className="button button-secondary" onClick={onOpen}>
          Open Project
        </button>
      </div>
    </article>
  );
}
