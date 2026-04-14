import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { TaskFormModal } from "../components/TaskFormModal";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useAuth } from "../auth/useAuth";
import { api } from "../lib/api";
import type { ProjectDetail, Task, TaskStatus, User } from "../types";

const statusLabels: Record<TaskStatus, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
};

export function ProjectDetailPage() {
  const { token } = useAuth();
  const { projectId } = useParams();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [modalState, setModalState] = useState<{ open: boolean; task?: Task }>({
    open: false,
  });

  useEffect(() => {
    async function loadData() {
      if (!token || !projectId) return;
      setLoading(true);
      setError(null);
      try {
        const [projectResponse, usersResponse] = await Promise.all([
          api.getProject(token, projectId),
          api.getUsers(token),
        ]);
        setProject(projectResponse);
        setTasks(projectResponse.tasks);
        setUsers(usersResponse.users);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load project",
        );
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [projectId, token]);

  useEffect(() => {
    async function applyFilters() {
      if (!token || !projectId) return;
      if (!statusFilter && !assigneeFilter) {
        if (project) setTasks(project.tasks);
        return;
      }
      try {
        const response = await api.getProjectTasks(token, projectId, {
          status: statusFilter || undefined,
          assignee: assigneeFilter || undefined,
        });
        setTasks(response.tasks);
      } catch (filterError) {
        setError(
          filterError instanceof Error
            ? filterError.message
            : "Unable to filter tasks",
        );
      }
    }
    void applyFilters();
  }, [assigneeFilter, project, projectId, statusFilter, token]);

  const usersById = useMemo(
    () =>
      users.reduce<Record<string, User>>((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {}),
    [users],
  );
  const statusFilterLabel = statusFilter ? statusLabels[statusFilter] : "All";
  const assigneeFilterLabel = assigneeFilter
    ? (usersById[assigneeFilter]?.name ?? "All assignees")
    : "All assignees";

  async function saveTask(payload: {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: "low" | "medium" | "high";
    assignee_id: string | null;
    due_date?: string;
  }) {
    if (!token || !projectId) return;
    if (modalState.task) {
      const updated = await api.updateTask(token, modalState.task.id, payload);
      setTasks((prev) =>
        prev.map((task) => (task.id === updated.id ? updated : task)),
      );
      setProject((prev) =>
        prev
          ? {
              ...prev,
              tasks: prev.tasks.map((task) =>
                task.id === updated.id ? updated : task,
              ),
            }
          : prev,
      );
    } else {
      const created = await api.createTask(token, projectId, payload);
      setTasks((prev) => [created, ...prev]);
      setProject((prev) =>
        prev ? { ...prev, tasks: [created, ...prev.tasks] } : prev,
      );
    }
  }

  async function updateStatusOptimistically(task: Task, status: TaskStatus) {
    if (!token) return;
    const previousTask = task;
    const optimisticTask = { ...task, status };
    setTasks((prev) =>
      prev.map((item) => (item.id === task.id ? optimisticTask : item)),
    );
    setProject((prev) =>
      prev
        ? {
            ...prev,
            tasks: prev.tasks.map((item) =>
              item.id === task.id ? optimisticTask : item,
            ),
          }
        : prev,
    );
    try {
      const updated = await api.updateTask(token, task.id, { status });
      setTasks((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      setProject((prev) =>
        prev
          ? {
              ...prev,
              tasks: prev.tasks.map((item) =>
                item.id === updated.id ? updated : item,
              ),
            }
          : prev,
      );
    } catch (updateError) {
      setTasks((prev) =>
        prev.map((item) => (item.id === previousTask.id ? previousTask : item)),
      );
      setProject((prev) =>
        prev
          ? {
              ...prev,
              tasks: prev.tasks.map((item) =>
                item.id === previousTask.id ? previousTask : item,
              ),
            }
          : prev,
      );
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update status",
      );
    }
  }

  async function deleteTask(taskId: string) {
    if (!token) return;
    await api.deleteTask(token, taskId);
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    setProject((prev) =>
      prev
        ? { ...prev, tasks: prev.tasks.filter((task) => task.id !== taskId) }
        : prev,
    );
  }

  return (
    <div className="stack">
      <div>
        <Link to="/projects" className="muted">
          &lt;- Back to projects
        </Link>
      </div>
      {loading ? <p>Loading project details...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {project ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{project.name}</CardTitle>
              <CardDescription>
                {project.description || "No project description yet."}
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="tasks-toolbar">
              <Button className="w-full sm:w-auto" onClick={() => setModalState({ open: true })}>
                New task
              </Button>
            </div>
            <div className="split filters">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={statusFilter || "all"}
                  onValueChange={(value) =>
                    setStatusFilter(value === "all" ? "" : (value as TaskStatus))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>{statusFilterLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="todo">Todo</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Assignee</Label>
                <Select
                  value={assigneeFilter || "all"}
                  onValueChange={(value) =>
                    setAssigneeFilter(value === "all" ? "" : (value ?? ""))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>{assigneeFilterLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All assignees</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {!tasks.length ? (
              <p className="muted">No tasks match your current filters.</p>
            ) : null}
            <div className="list">
              {tasks.map((task) => (
                <article className="list-item" key={task.id}>
                  <div className="inline-actions">
                    <h3>{task.title}</h3>
                    <span className="chip">{task.priority}</span>
                  </div>
                  <p className="muted">
                    {task.description || "No description provided."}
                  </p>
                  <div className="task-meta">
                    <span>
                      Assignee:{" "}
                      {task.assignee_id
                        ? usersById[task.assignee_id]?.name
                        : "Unassigned"}
                    </span>
                    <span>Due: {task.due_date || "No date"}</span>
                  </div>
                  <div className="task-actions">
                    <Select
                      value={task.status}
                      onValueChange={(value) =>
                        updateStatusOptimistically(task, value as TaskStatus)
                      }
                    >
                      <SelectTrigger className="w-full sm:w-[170px]">
                        <SelectValue>{statusLabels[task.status]}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">{statusLabels.todo}</SelectItem>
                        <SelectItem value="in_progress">
                          {statusLabels.in_progress}
                        </SelectItem>
                        <SelectItem value="done">{statusLabels.done}</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="task-actions-buttons">
                      <Button
                        variant="outline"
                        onClick={() => setModalState({ open: true, task })}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => void deleteTask(task.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            </CardContent>
          </Card>
        </>
      ) : null}
      {modalState.open ? (
        <TaskFormModal
          users={users}
          initialTask={modalState.task}
          onClose={() => setModalState({ open: false })}
          onSubmit={saveTask}
        />
      ) : null}
    </div>
  );
}
