import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { Button } from './ui/button';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <nav className="navbar">
        <Link to="/projects" className="brand">
          TaskFlow
        </Link>
        <div className="nav-actions">
          <span className="chip">Hi, {user?.name ?? 'User'}</span>
          <Button
            variant="outline"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Logout
          </Button>
        </div>
      </nav>
      <main className="content">{children}</main>
    </div>
  );
}
