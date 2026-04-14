import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../auth/useAuth';
import { api } from '../lib/api';
import type { Project } from '../types';

export function ProjectsPage() {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function loadProjects() {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const response = await api.getProjects(token);
        setProjects(response.projects);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load projects');
      } finally {
        setLoading(false);
      }
    }
    void loadProjects();
  }, [token]);

  async function handleCreateProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const project = await api.createProject(token, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setProjects((prev) => [project, ...prev]);
      setName('');
      setDescription('');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create project');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="stack">
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
          <CardDescription>Create a new project and manage its tasks.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateProject} className="grid">
            <div className="grid gap-2">
              <Label htmlFor="project-name">Project name</Label>
              <Input
                id="project-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
              />
            </div>
            <Button type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create project'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accessible projects</CardTitle>
        </CardHeader>
        <CardContent>
        {loading ? <p>Loading projects...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
        {!loading && !projects.length ? (
          <p className="muted">No projects yet. Create your first project above.</p>
        ) : null}
        <div className="list">
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`} className="list-item link">
              <div>
                <h3>{project.name}</h3>
                <p className="muted">{project.description || 'No description yet.'}</p>
              </div>
              <span className="chip">Open</span>
            </Link>
          ))}
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
