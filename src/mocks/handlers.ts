import { http, HttpResponse } from 'msw';
import { mockDb } from './data';
import type { TaskStatus } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

function endpoint(path: string) {
  return `${API_BASE}${path}`;
}

function uuid() {
  return crypto.randomUUID();
}

function nowIso() {
  return new Date().toISOString();
}

function getAuthedUser(request: Request) {
  const auth = request.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.replace('Bearer ', '');
  const userId = token.split('.')[0];
  return mockDb.users.find((user) => user.id === userId) ?? null;
}

function sanitizeUser(user: (typeof mockDb.users)[number]) {
  return { id: user.id, name: user.name, email: user.email };
}

export const handlers = [
  http.post(endpoint('/auth/register'), async ({ request }) => {
    const body = (await request.json()) as { name?: string; email?: string; password?: string };
    const fields: Record<string, string> = {};
    if (!body.name) fields.name = 'is required';
    if (!body.email) fields.email = 'is required';
    if (!body.password) fields.password = 'is required';
    if (Object.keys(fields).length) {
      return HttpResponse.json({ error: 'validation failed', fields }, { status: 400 });
    }
    if (mockDb.users.some((user) => user.email === body.email)) {
      return HttpResponse.json(
        { error: 'validation failed', fields: { email: 'already exists' } },
        { status: 400 }
      );
    }
    const name = body.name!;
    const email = body.email!;
    const password = body.password!;
    const user = {
      id: uuid(),
      name,
      email,
      password,
      created_at: nowIso(),
    };
    mockDb.users.push(user);
    const token = `${user.id}.${btoa(user.email)}`;
    return HttpResponse.json({ token, user: sanitizeUser(user) }, { status: 201 });
  }),

  http.post(endpoint('/auth/login'), async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    const user = mockDb.users.find((item) => item.email === body.email && item.password === body.password);
    if (!user) {
      return HttpResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const token = `${user.id}.${btoa(user.email)}`;
    return HttpResponse.json({ token, user: sanitizeUser(user) }, { status: 200 });
  }),

  http.get(endpoint('/users'), ({ request }) => {
    if (!getAuthedUser(request)) {
      return HttpResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return HttpResponse.json({ users: mockDb.users.map(sanitizeUser) });
  }),

  http.get(endpoint('/projects'), ({ request }) => {
    const user = getAuthedUser(request);
    if (!user) return HttpResponse.json({ error: 'unauthorized' }, { status: 401 });
    const taskProjectIds = new Set(
      mockDb.tasks.filter((task) => task.assignee_id === user.id).map((task) => task.project_id)
    );
    const projects = mockDb.projects.filter(
      (project) => project.owner_id === user.id || taskProjectIds.has(project.id)
    );
    return HttpResponse.json({ projects });
  }),

  http.post(endpoint('/projects'), async ({ request }) => {
    const user = getAuthedUser(request);
    if (!user) return HttpResponse.json({ error: 'unauthorized' }, { status: 401 });
    const body = (await request.json()) as { name?: string; description?: string };
    if (!body.name) {
      return HttpResponse.json(
        { error: 'validation failed', fields: { name: 'is required' } },
        { status: 400 }
      );
    }
    const project = {
      id: uuid(),
      name: body.name,
      description: body.description ?? '',
      owner_id: user.id,
      created_at: nowIso(),
    };
    mockDb.projects.unshift(project);
    return HttpResponse.json(project, { status: 201 });
  }),

  http.get(endpoint('/projects/:id'), ({ params, request }) => {
    if (!getAuthedUser(request)) return HttpResponse.json({ error: 'unauthorized' }, { status: 401 });
    const project = mockDb.projects.find((item) => item.id === params.id);
    if (!project) return HttpResponse.json({ error: 'not found' }, { status: 404 });
    const tasks = mockDb.tasks.filter((task) => task.project_id === project.id);
    return HttpResponse.json({ ...project, tasks });
  }),

  http.get(endpoint('/projects/:id/tasks'), ({ params, request }) => {
    if (!getAuthedUser(request)) return HttpResponse.json({ error: 'unauthorized' }, { status: 401 });
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const assignee = url.searchParams.get('assignee');
    let tasks = mockDb.tasks.filter((task) => task.project_id === params.id);
    if (status) tasks = tasks.filter((task) => task.status === status);
    if (assignee) tasks = tasks.filter((task) => task.assignee_id === assignee);
    return HttpResponse.json({ tasks });
  }),

  http.post(endpoint('/projects/:id/tasks'), async ({ params, request }) => {
    if (!getAuthedUser(request)) return HttpResponse.json({ error: 'unauthorized' }, { status: 401 });
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      status?: TaskStatus;
      priority?: 'low' | 'medium' | 'high';
      assignee_id?: string | null;
      due_date?: string;
    };
    if (!body.title) {
      return HttpResponse.json(
        { error: 'validation failed', fields: { title: 'is required' } },
        { status: 400 }
      );
    }
    const task = {
      id: uuid(),
      title: body.title,
      description: body.description ?? '',
      status: body.status ?? 'todo',
      priority: body.priority ?? 'medium',
      project_id: String(params.id),
      assignee_id: body.assignee_id ?? null,
      due_date: body.due_date ?? '',
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    mockDb.tasks.unshift(task);
    return HttpResponse.json(task, { status: 201 });
  }),

  http.patch(endpoint('/tasks/:id'), async ({ params, request }) => {
    if (!getAuthedUser(request)) return HttpResponse.json({ error: 'unauthorized' }, { status: 401 });
    const task = mockDb.tasks.find((item) => item.id === params.id);
    if (!task) return HttpResponse.json({ error: 'not found' }, { status: 404 });
    const updates = (await request.json()) as Partial<typeof task>;
    Object.assign(task, updates, { updated_at: nowIso() });
    return HttpResponse.json(task);
  }),

  http.delete(endpoint('/tasks/:id'), ({ params, request }) => {
    if (!getAuthedUser(request)) return HttpResponse.json({ error: 'unauthorized' }, { status: 401 });
    const index = mockDb.tasks.findIndex((item) => item.id === params.id);
    if (index < 0) return HttpResponse.json({ error: 'not found' }, { status: 404 });
    mockDb.tasks.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
