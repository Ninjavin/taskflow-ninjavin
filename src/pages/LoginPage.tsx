import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/projects');
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-layout">
      <Card className="auth-card">
        <CardHeader>
          <CardTitle>Login to TaskFlow</CardTitle>
          <CardDescription>Use seeded credentials or create a new account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error ? <p className="error-text">{error}</p> : null}
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Logging in...' : 'Login'}
            </Button>
            <p className="muted">
              New here? <Link to="/register">Create account</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
