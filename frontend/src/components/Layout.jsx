import { Outlet, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import BazaarBuddy from './BazaarBuddy';
import { useAuth } from '../context/AuthContext';

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <BazaarBuddy />
    </div>
  );
}

export function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center text-ink-soft">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RequireAdmin() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center text-ink-soft">Loading…</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}
