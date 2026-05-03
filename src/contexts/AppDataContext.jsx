import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  addProjectMemberRequest,
  createProjectRequest,
  createTaskRequest,
  deleteTaskRequest,
  fetchDashboard,
  fetchMyTasks,
  fetchProjectDetail,
  fetchProjects,
  joinProjectRequest,
  removeProjectMemberRequest,
  updateTaskRequest,
  updateTaskStatusRequest,
} from "../services/api";

const AppDataContext = createContext(null);

const emptyDashboardMetrics = {
  totalTasks: 0,
  tasksByStatus: {
    todo: 0,
    "in-progress": 0,
    done: 0,
  },
  tasksPerUser: [],
  overdueTasks: [],
  assignedTasksCount: 0,
  projectCount: 0,
};

export function AppDataProvider({ children }) {
  const { authToken, currentUser, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState(emptyDashboardMetrics);
  const [projectDetailsById, setProjectDetailsById] = useState({});
  const [dataLoading, setDataLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [assignedTasksLoading, setAssignedTasksLoading] = useState(false);
  const [projectDetailsLoading, setProjectDetailsLoading] = useState({});

  const resetData = () => {
    setProjects([]);
    setAssignedTasks([]);
    setDashboardMetrics(emptyDashboardMetrics);
    setProjectDetailsById({});
  };

  const handleDataError = (error) => {
    if (/authentication failed|token|401/i.test(error.message)) {
      logout();
    }
    throw error;
  };

  const refreshProjects = async () => {
    if (!authToken) {
      return [];
    }

    setProjectsLoading(true);
    try {
      const nextProjects = await fetchProjects(authToken);
      setProjects(nextProjects);
      return nextProjects;
    } catch (error) {
      handleDataError(error);
      return [];
    } finally {
      setProjectsLoading(false);
    }
  };

  const refreshDashboard = async () => {
    if (!authToken) {
      return emptyDashboardMetrics;
    }

    setDashboardLoading(true);
    try {
      const nextMetrics = await fetchDashboard(authToken);
      setDashboardMetrics(nextMetrics);
      return nextMetrics;
    } catch (error) {
      handleDataError(error);
      return emptyDashboardMetrics;
    } finally {
      setDashboardLoading(false);
    }
  };

  const refreshAssignedTasks = async () => {
    if (!authToken) {
      return [];
    }

    setAssignedTasksLoading(true);
    try {
      const nextTasks = await fetchMyTasks(authToken);
      setAssignedTasks(nextTasks);
      return nextTasks;
    } catch (error) {
      handleDataError(error);
      return [];
    } finally {
      setAssignedTasksLoading(false);
    }
  };

  const loadProjectDetail = async (projectId, { force = false } = {}) => {
    if (!authToken) {
      return null;
    }

    if (!force && projectDetailsById[projectId]?.summary) {
      return projectDetailsById[projectId];
    }

    setProjectDetailsLoading((previous) => ({ ...previous, [projectId]: true }));
    try {
      const detail = await fetchProjectDetail(projectId, authToken);
      setProjectDetailsById((previous) => ({ ...previous, [projectId]: detail }));
      return detail;
    } catch (error) {
      handleDataError(error);
      return null;
    } finally {
      setProjectDetailsLoading((previous) => ({ ...previous, [projectId]: false }));
    }
  };

  const refreshAllData = async () => {
    await Promise.all([refreshProjects(), refreshDashboard(), refreshAssignedTasks()]);
  };

  useEffect(() => {
    let ignore = false;

    async function bootstrapData() {
      if (!currentUser || !authToken) {
        resetData();
        setDataLoading(false);
        return;
      }

      setDataLoading(true);
      try {
        await Promise.all([refreshProjects(), refreshDashboard(), refreshAssignedTasks()]);
      } catch (error) {
        if (!ignore) {
          resetData();
        }
      } finally {
        if (!ignore) {
          setDataLoading(false);
        }
      }
    }

    bootstrapData();

    return () => {
      ignore = true;
    };
  }, [authToken, currentUser?.id]);

  const currentUserProjectsById = useMemo(
    () => Object.fromEntries(projects.map((project) => [project.id, project])),
    [projects],
  );

  const usersById = useMemo(() => {
    const entries = [];

    if (currentUser) {
      entries.push([currentUser.id, currentUser]);
    }

    for (const project of projects) {
      for (const member of project.members ?? []) {
        entries.push([member.id, member]);
      }
    }

    for (const detail of Object.values(projectDetailsById)) {
      for (const member of detail.members ?? []) {
        entries.push([member.id, member]);
      }
    }

    return Object.fromEntries(entries);
  }, [currentUser, projectDetailsById, projects]);

  const getProjectById = (projectId) => {
    return projectDetailsById[projectId] ?? currentUserProjectsById[projectId] ?? null;
  };

  const getTasksForProject = (projectId) => {
    return getProjectById(projectId)?.tasks ?? [];
  };

  const isProjectAdmin = (projectId) => {
    return Boolean(currentUser?.id && getProjectById(projectId)?.adminId === currentUser.id);
  };

  const canUpdateTask = (task) => {
    if (!currentUser) {
      return false;
    }

    return isProjectAdmin(task.projectId) || task.assigneeId === currentUser.id;
  };

  const createProject = async ({ name, description, color }) => {
    const project = await createProjectRequest({ name, description, color }, authToken);
    await Promise.all([refreshProjects(), refreshDashboard()]);
    return project;
  };

  const joinProject = async ({ joinCode }) => {
    const project = await joinProjectRequest(joinCode.trim().toUpperCase(), authToken);
    await Promise.all([refreshProjects(), refreshDashboard()]);
    return project;
  };

  const addMemberToProject = async ({ projectId, email }) => {
    const member = await addProjectMemberRequest(projectId, email.trim().toLowerCase(), authToken);
    await Promise.all([
      refreshProjects(),
      refreshDashboard(),
      loadProjectDetail(projectId, { force: true }),
    ]);
    return member;
  };

  const removeMemberFromProject = async ({ projectId, memberId }) => {
    await removeProjectMemberRequest(projectId, memberId, authToken);
    await Promise.all([
      refreshProjects(),
      refreshDashboard(),
      refreshAssignedTasks(),
      loadProjectDetail(projectId, { force: true }),
    ]);
  };

  const createTask = async ({ projectId, ...taskData }) => {
    const task = await createTaskRequest(projectId, taskData, authToken);
    await Promise.all([
      refreshProjects(),
      refreshDashboard(),
      refreshAssignedTasks(),
      loadProjectDetail(projectId, { force: true }),
    ]);
    return task;
  };

  const updateTask = async (taskId, updates, projectId) => {
    const task = await updateTaskRequest(taskId, updates, authToken);
    await Promise.all([
      refreshProjects(),
      refreshDashboard(),
      refreshAssignedTasks(),
      loadProjectDetail(projectId ?? task.projectId, { force: true }),
    ]);
    return task;
  };

  const deleteTask = async (taskId, projectId) => {
    await deleteTaskRequest(taskId, authToken);
    await Promise.all([
      refreshProjects(),
      refreshDashboard(),
      refreshAssignedTasks(),
      loadProjectDetail(projectId, { force: true }),
    ]);
  };

  const updateTaskStatus = async (taskId, status, projectId) => {
    const task = await updateTaskStatusRequest(taskId, status, authToken);
    await Promise.all([
      refreshProjects(),
      refreshDashboard(),
      refreshAssignedTasks(),
      projectId ? loadProjectDetail(projectId, { force: true }) : Promise.resolve(),
    ]);
    return task;
  };

  const value = {
    dataLoading,
    projectsLoading,
    dashboardLoading,
    assignedTasksLoading,
    projectDetailsLoading,
    usersById,
    projects,
    currentUserProjectsById,
    assignedTasks,
    dashboardMetrics,
    getProjectById,
    getTasksForProject,
    isProjectAdmin,
    canUpdateTask,
    refreshAllData,
    loadProjectDetail,
    createProject,
    joinProject,
    addMemberToProject,
    removeMemberFromProject,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error("useAppData must be used inside AppDataProvider.");
  }

  return context;
}
