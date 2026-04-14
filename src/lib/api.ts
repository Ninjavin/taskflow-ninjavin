import type {
  AuthResponse,
  Project,
  ProjectDetail,
  Task,
  TaskPriority,
  TaskStatus,
  User,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

type RequestOptions = RequestInit & { token?: string };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    let message = 'Request failed';
    try {
      const errorBody = await response.json();
      message = errorBody.error ?? message;
    } catch {
      // Keep generic message when server body is not JSON.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export const api = {
  login(email: string, password: string) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  register(name: string, email: string, password: string) {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },
  getProjects(token: string) {
    return request<{ projects: Project[] }>('/projects', { token });
  },
  createProject(token: string, payload: { name: string; description?: string }) {
    return request<Project>('/projects', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    });
  },
  getProject(token: string, projectId: string) {
    return request<ProjectDetail>(`/projects/${projectId}`, { token });
  },
  getProjectTasks(
    token: string,
    projectId: string,
    filters?: { status?: TaskStatus; assignee?: string }
  ) {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.assignee) params.set('assignee', filters.assignee);
    const query = params.toString();
    return request<{ tasks: Task[] }>(`/projects/${projectId}/tasks${query ? `?${query}` : ''}`, {
      token,
    });
  },
  createTask(
    token: string,
    projectId: string,
    payload: {
      title: string;
      description?: string;
      status: TaskStatus;
      priority: TaskPriority;
      assignee_id: string | null;
      due_date?: string;
    }
  ) {
    return request<Task>(`/projects/${projectId}/tasks`, {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    });
  },
  updateTask(
    token: string,
    taskId: string,
    payload: Partial<{
      title: string;
      description: string;
      status: TaskStatus;
      priority: TaskPriority;
      assignee_id: string | null;
      due_date: string;
    }>
  ) {
    return request<Task>(`/tasks/${taskId}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload),
    });
  },
  deleteTask(token: string, taskId: string) {
    return request<void>(`/tasks/${taskId}`, { method: 'DELETE', token });
  },
  getUsers(token: string) {
    return request<{ users: User[] }>('/users', { token });
  },
};
