import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(location.state?.from || '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <h1 className="font-display text-2xl font-semibold">Welcome back</h1>
      <p className="mt-1 text-sm text-ink-soft">Log in to buy, sell, rent and message other students.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field label="Campus email">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="focus-ring w-full rounded-md border border-line px-3 py-2 text-sm" placeholder="you@campus.edu" />
        </Field>
        <Field label="Password">
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="focus-ring w-full rounded-md border border-line px-3 py-2 text-sm" placeholder="••••••••" />
        </Field>
        {error && <p className="text-sm text-clay-500">{error}</p>}
        <button disabled={loading} className="focus-ring w-full rounded-full bg-ink py-2.5 text-sm font-medium text-paper disabled:opacity-60">
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="mt-4 rounded-md bg-white p-3 text-xs text-ink-soft">
        Demo account: <span className="font-medium">ananya@campus.edu</span> / <span className="font-medium">password123</span>
        <br />Admin: <span className="font-medium">admin@campus.edu</span> / <span className="font-medium">password123</span>
      </p>

      <p className="mt-6 text-center text-sm text-ink-soft">
        New here? <Link to="/register" className="font-medium text-bazaar-600">Create an account</Link>
      </p>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  );
}
