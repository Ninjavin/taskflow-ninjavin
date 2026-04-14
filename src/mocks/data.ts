import type { Project, Task, User } from '../types';

const now = '2026-04-10T10:00:00Z';

export const mockDb: {
  users: Array<User & { password: string; created_at: string }>;
  projects: Project[];
  tasks: Task[];
} = {
  users: [
    {
      id: 'f9184c2e-5ba0-43a1-8cf5-3f7ad7858fa1',
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      created_at: now,
    },
  ],
  projects: [
    {
      id: 'dbf2d41c-b01a-4ac7-af97-a6e559788897',
      name: 'Website Redesign',
      description: 'Q2 project',
      owner_id: 'f9184c2e-5ba0-43a1-8cf5-3f7ad7858fa1',
      created_at: now,
    },
  ],
  tasks: [
    {
      id: '07e11f9c-aa43-49f4-a3ea-87f8f590d74c',
      title: 'Design homepage',
      description: 'Share first draft in review meeting',
      status: 'todo',
      priority: 'high',
      project_id: 'dbf2d41c-b01a-4ac7-af97-a6e559788897',
      assignee_id: 'f9184c2e-5ba0-43a1-8cf5-3f7ad7858fa1',
      due_date: '2026-04-15',
      created_at: '2026-04-10T12:00:00Z',
      updated_at: '2026-04-10T12:00:00Z',
    },
    {
      id: '4203354e-e67a-4efe-9847-867d85065d99',
      title: 'Finalize typography',
      description: 'Get design tokens approved',
      status: 'in_progress',
      priority: 'medium',
      project_id: 'dbf2d41c-b01a-4ac7-af97-a6e559788897',
      assignee_id: 'f9184c2e-5ba0-43a1-8cf5-3f7ad7858fa1',
      due_date: '2026-04-18',
      created_at: '2026-04-11T12:00:00Z',
      updated_at: '2026-04-11T12:00:00Z',
    },
    {
      id: '07f6d4d6-a6d3-4f77-bdc1-e896e91d11f3',
      title: 'Publish design QA checklist',
      description: 'Document all responsive breakpoints',
      status: 'done',
      priority: 'low',
      project_id: 'dbf2d41c-b01a-4ac7-af97-a6e559788897',
      assignee_id: null,
      due_date: '2026-04-13',
      created_at: '2026-04-12T12:00:00Z',
      updated_at: '2026-04-13T16:00:00Z',
    },
  ],
};
