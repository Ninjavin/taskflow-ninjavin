import { useMemo, useState } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Textarea } from './ui/textarea';
import type { Task, TaskPriority, TaskStatus, User } from '../types';

interface TaskFormValues {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string;
  due_date: string;
}

const statusLabels: Record<TaskStatus, string> = {
  todo: 'Todo',
  in_progress: 'In Progress',
  done: 'Done',
};

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

interface TaskFormModalProps {
  users: User[];
  initialTask?: Task;
  onClose: () => void;
  onSubmit: (payload: {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    assignee_id: string | null;
    due_date?: string;
  }) => Promise<void>;
}

export function TaskFormModal({ users, initialTask, onClose, onSubmit }: TaskFormModalProps) {
  const [values, setValues] = useState<TaskFormValues>(() => ({
    title: initialTask?.title ?? '',
    description: initialTask?.description ?? '',
    status: initialTask?.status ?? 'todo',
    priority: initialTask?.priority ?? 'medium',
    assignee_id: initialTask?.assignee_id ?? '',
    due_date: initialTask?.due_date ?? '',
  }));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const modalTitle = useMemo(() => (initialTask ? 'Edit Task' : 'Create Task'), [initialTask]);
  const assigneeLabel =
    users.find((user) => user.id === values.assignee_id)?.name ?? 'Unassigned';

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!values.title.trim()) {
      setError('Task title is required.');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        title: values.title.trim(),
        description: values.description.trim() || undefined,
        status: values.status,
        priority: values.priority,
        assignee_id: values.assignee_id || null,
        due_date: values.due_date || undefined,
      });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save task');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
          <DialogDescription>
            Fill in task details and save changes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid">
          <div className="grid gap-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={values.title}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, title: event.target.value }))
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              value={values.description}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, description: event.target.value }))
              }
              rows={3}
            />
          </div>
          <div className="split">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={values.status}
                onValueChange={(value) =>
                  setValues((prev) => ({ ...prev, status: value as TaskStatus }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{statusLabels[values.status]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Todo</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Priority</Label>
              <Select
                value={values.priority}
                onValueChange={(value) =>
                  setValues((prev) => ({ ...prev, priority: value as TaskPriority }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{priorityLabels[values.priority]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="split">
            <div className="grid gap-2">
              <Label>Assignee</Label>
              <Select
                value={values.assignee_id || 'unassigned'}
                onValueChange={(value) =>
                  setValues((prev) => ({
                    ...prev,
                    assignee_id: value === 'unassigned' ? '' : (value ?? ''),
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{assigneeLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="due-date">Due Date</Label>
              <Input
                id="due-date"
                type="date"
                value={values.due_date}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, due_date: event.target.value }))
                }
              />
            </div>
          </div>
          {error ? <p className="error-text">{error}</p> : null}
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : initialTask ? 'Update task' : 'Create task'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
