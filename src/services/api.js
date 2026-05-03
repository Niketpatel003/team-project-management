const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000").replace(
  /\/$/,
  "",
);

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

function extractErrorMessage(payload, fallback) {
  if (!payload) {
    return fallback;
  }

  if (typeof payload === "string") {
    return payload;
  }

  if (typeof payload.detail === "string") {
    return payload.detail;
  }

  const firstValue = Object.values(payload)[0];

  if (Array.isArray(firstValue) && firstValue.length) {
    return String(firstValue[0]);
  }

  if (typeof firstValue === "string") {
    return firstValue;
  }

  return fallback;
}

async function request(path, { method = "GET", body, token, signal } = {}) {
  const headers = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch (error) {
      payload = text;
    }
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, `Request failed with status ${response.status}.`));
  }

  return payload;
}

function normalizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.created_at ?? user.createdAt ?? null,
    totalTasks: user.total_tasks ?? user.totalTasks ?? 0,
    completedTasks: user.completed_tasks ?? user.completedTasks ?? 0,
    activeTasks: user.active_tasks ?? user.activeTasks ?? 0,
  };
}

function normalizeTask(task) {
  return {
    id: task.id,
    projectId: task.project_id ?? task.projectId,
    creatorId: task.creator_id ?? task.creatorId,
    title: task.title,
    description: task.description,
    dueDate: task.due_date ?? task.dueDate,
    priority: task.priority,
    status: task.status,
    assigneeId: task.assignee_id ?? task.assigneeId ?? null,
    createdAt: task.created_at ?? task.createdAt ?? null,
    updatedAt: task.updated_at ?? task.updatedAt ?? null,
    projectName: task.project_name ?? task.projectName ?? null,
  };
}

function normalizeProject(project) {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    color: project.color,
    adminId: project.admin_id ?? project.adminId,
    memberIds: project.member_ids ?? project.memberIds ?? [],
    joinCode: project.join_code ?? project.joinCode,
    createdAt: project.created_at ?? project.createdAt ?? null,
    updatedAt: project.updated_at ?? project.updatedAt ?? null,
    isAdmin: project.is_admin ?? project.isAdmin ?? false,
    taskCount: project.task_count ?? project.taskCount ?? 0,
    doneCount: project.done_count ?? project.doneCount ?? 0,
    overdueCount: project.overdue_count ?? project.overdueCount ?? 0,
    members: Array.isArray(project.members) ? project.members.map(normalizeUser) : [],
    tasks: Array.isArray(project.tasks) ? project.tasks.map(normalizeTask) : [],
    summary: project.summary
      ? {
          todo: project.summary.todo ?? 0,
          inProgress: project.summary.in_progress ?? project.summary.inProgress ?? 0,
          done: project.summary.done ?? 0,
          memberCount: project.summary.member_count ?? project.summary.memberCount ?? 0,
          taskCount: project.summary.task_count ?? project.summary.taskCount ?? 0,
        }
      : null,
  };
}

function normalizeDashboard(payload) {
  return {
    totalTasks: payload.total_tasks ?? payload.totalTasks ?? 0,
    tasksByStatus: {
      todo: payload.tasks_by_status?.todo ?? payload.tasksByStatus?.todo ?? 0,
      "in-progress":
        payload.tasks_by_status?.["in-progress"] ?? payload.tasksByStatus?.["in-progress"] ?? 0,
      done: payload.tasks_by_status?.done ?? payload.tasksByStatus?.done ?? 0,
    },
    tasksPerUser: Array.isArray(payload.tasks_per_user)
      ? payload.tasks_per_user.map(normalizeUser)
      : [],
    overdueTasks: Array.isArray(payload.overdue_tasks)
      ? payload.overdue_tasks.map(normalizeTask)
      : [],
    assignedTasksCount: payload.assigned_tasks_count ?? payload.assignedTasksCount ?? 0,
    projectCount: payload.project_count ?? payload.projectCount ?? 0,
  };
}

export async function loginUser(credentials) {
  const payload = await request("/api/auth/login/", {
    method: "POST",
    body: credentials,
  });

  return {
    token: payload.token,
    user: normalizeUser(payload.user),
  };
}

export async function signupUser(credentials) {
  const payload = await request("/api/auth/signup/", {
    method: "POST",
    body: credentials,
  });

  return {
    token: payload.token,
    user: normalizeUser(payload.user),
  };
}

export async function fetchCurrentUser(token) {
  const payload = await request("/api/auth/me/", { token });
  return normalizeUser(payload.user);
}

export async function fetchDashboard(token) {
  const payload = await request("/api/dashboard/", { token });
  return normalizeDashboard(payload);
}

export async function fetchProjects(token) {
  const payload = await request("/api/projects/", { token });
  return payload.projects.map(normalizeProject);
}

export async function fetchProjectDetail(projectId, token) {
  const payload = await request(`/api/projects/${projectId}/`, { token });
  return normalizeProject(payload.project);
}

export async function fetchMyTasks(token) {
  const payload = await request("/api/tasks/my-tasks/", { token });
  return payload.tasks.map(normalizeTask);
}

export async function createProjectRequest(data, token) {
  const payload = await request("/api/projects/", {
    method: "POST",
    body: data,
    token,
  });
  return normalizeProject(payload.project);
}

export async function joinProjectRequest(joinCode, token) {
  const payload = await request("/api/projects/join/", {
    method: "POST",
    body: { join_code: joinCode },
    token,
  });
  return normalizeProject(payload.project);
}

export async function addProjectMemberRequest(projectId, email, token) {
  const payload = await request(`/api/projects/${projectId}/members/`, {
    method: "POST",
    body: { email },
    token,
  });
  return normalizeUser(payload.member);
}

export async function removeProjectMemberRequest(projectId, memberId, token) {
  await request(`/api/projects/${projectId}/members/${memberId}/`, {
    method: "DELETE",
    token,
  });
}

export async function createTaskRequest(projectId, data, token) {
  const payload = await request(`/api/projects/${projectId}/tasks/`, {
    method: "POST",
    token,
    body: {
      title: data.title,
      description: data.description,
      due_date: data.dueDate,
      priority: data.priority,
      status: data.status,
      assignee_id: data.assigneeId || null,
    },
  });
  return normalizeTask(payload.task);
}

export async function updateTaskRequest(taskId, data, token) {
  const payload = await request(`/api/tasks/${taskId}/`, {
    method: "PATCH",
    token,
    body: {
      title: data.title,
      description: data.description,
      due_date: data.dueDate,
      priority: data.priority,
      status: data.status,
      assignee_id: data.assigneeId || null,
    },
  });
  return normalizeTask(payload.task);
}

export async function deleteTaskRequest(taskId, token) {
  await request(`/api/tasks/${taskId}/`, {
    method: "DELETE",
    token,
  });
}

export async function updateTaskStatusRequest(taskId, status, token) {
  const payload = await request(`/api/tasks/${taskId}/status/`, {
    method: "PATCH",
    token,
    body: { status },
  });
  return normalizeTask(payload.task);
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}
