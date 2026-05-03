import { startTransition, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProjectCard from "../components/ui/ProjectCard";
import Modal from "../components/ui/Modal";
import { useAppData } from "../contexts/AppDataContext";

const projectColors = ["sunset", "lagoon", "mango"];

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { dataLoading, projects, isProjectAdmin, createProject, joinProject } = useAppData();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    color: "sunset",
  });
  const [joinCode, setJoinCode] = useState("");

  const projectSummaries = useMemo(() => {
    return projects.map((project) => ({
      ...project,
      members: project.members ?? [],
    }));
  }, [projects]);

  const handleCreateProject = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const nextProject = await createProject(createForm);
      setCreateForm({ name: "", description: "", color: "sunset" });
      setIsCreateOpen(false);
      setMessage(`Project "${nextProject.name}" created successfully.`);
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinProject = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const joinedProject = await joinProject({ joinCode });
      setJoinCode("");
      setIsJoinOpen(false);
      setMessage(`You joined "${joinedProject.name}".`);
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="loading-card">
        <div className="spinner" />
        <p>Loading your projects...</p>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="section-toolbar">
        <div>
          <p className="eyebrow">Workspace map</p>
          <h2>Projects you can actively collaborate on</h2>
          <p className="muted">
            Create a new project as admin, or join an existing one with the team code.
          </p>
        </div>

        <div className="button-row">
          <button type="button" className="button button-secondary" onClick={() => setIsJoinOpen(true)}>
            Join Project
          </button>
          <button type="button" className="button button-primary" onClick={() => setIsCreateOpen(true)}>
            Create Project
          </button>
        </div>
      </section>

      {message ? <div className="alert alert-success">{message}</div> : null}
      {error ? <div className="alert alert-error">{error}</div> : null}

      <section className="project-grid">
        {projectSummaries.length ? (
          projectSummaries.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              members={project.members}
              taskCount={project.taskCount}
              doneCount={project.doneCount}
              overdueCount={project.overdueCount}
              isAdmin={isProjectAdmin(project.id)}
              onOpen={() => navigate(`/projects/${project.id}`)}
            />
          ))
        ) : (
          <article className="empty-card">
            <h3>No projects yet</h3>
            <p>Create your first project or join one with a shared code to get started.</p>
          </article>
        )}
      </section>

      {isCreateOpen ? (
        <Modal
          title="Create project"
          description="The creator becomes the project admin automatically."
          onClose={() => setIsCreateOpen(false)}
        >
          <form className="form-grid" onSubmit={handleCreateProject}>
            <label className="field">
              <span>Project name</span>
              <input
                type="text"
                value={createForm.name}
                onChange={(event) =>
                  setCreateForm((previous) => ({ ...previous, name: event.target.value }))
                }
                required
                placeholder="Enter project name"
              />
            </label>

            <label className="field">
              <span>Description</span>
              <textarea
                rows="4"
                value={createForm.description}
                onChange={(event) =>
                  setCreateForm((previous) => ({ ...previous, description: event.target.value }))
                }
                required
                placeholder="Describe the goal and scope"
              />
            </label>

            <label className="field">
              <span>Theme color</span>
              <select
                value={createForm.color}
                onChange={(event) =>
                  setCreateForm((previous) => ({ ...previous, color: event.target.value }))
                }
              >
                {projectColors.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
            </label>

            <div className="modal-actions">
              <button type="button" className="button button-ghost" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="button button-primary" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Project"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {isJoinOpen ? (
        <Modal
          title="Join project"
          description="Use the project code shared by an admin."
          onClose={() => setIsJoinOpen(false)}
        >
          <form className="form-grid" onSubmit={handleJoinProject}>
            <label className="field">
              <span>Join code</span>
              <input
                type="text"
                value={joinCode}
                onChange={(event) => {
                  const value = event.target.value.toUpperCase();
                  startTransition(() => setJoinCode(value));
                }}
                placeholder="Example: LAUNCH6"
                required
              />
            </label>

            <div className="modal-actions">
              <button type="button" className="button button-ghost" onClick={() => setIsJoinOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="button button-primary" disabled={isSubmitting}>
                {isSubmitting ? "Joining..." : "Join Project"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
