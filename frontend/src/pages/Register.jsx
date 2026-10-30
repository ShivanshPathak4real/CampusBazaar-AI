import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Field } from './Login';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', campus: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <h1 className="font-display text-2xl font-semibold">Create your account</h1>
      <p className="mt-1 text-sm text-ink-soft">Join students already buying, selling and swapping on campus.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field label="Full name">
          <input required value={form.name} onChange={set('name')} className="focus-ring w-full rounded-md border border-line px-3 py-2 text-sm" placeholder="Ananya Sharma" />
        </Field>
        <Field label="Campus email">
          <input type="email" required value={form.email} onChange={set('email')} className="focus-ring w-full rounded-md border border-line px-3 py-2 text-sm" placeholder="you@campus.edu" />
        </Field>
        <Field label="Campus (optional)">
          <input value={form.campus} onChange={set('campus')} className="focus-ring w-full rounded-md border border-line px-3 py-2 text-sm" placeholder="North Campus" />
        </Field>
        <Field label="Password">
          <input type="password" required minLength={6} value={form.password} onChange={set('password')} className="focus-ring w-full rounded-md border border-line px-3 py-2 text-sm" placeholder="At least 6 characters" />
        </Field>
        {error && <p className="text-sm text-clay-500">{error}</p>}
        <button disabled={loading} className="focus-ring w-full rounded-full bg-ink py-2.5 text-sm font-medium text-paper disabled:opacity-60">
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Already have an account? <Link to="/login" className="font-medium text-bazaar-600">Log in</Link>
      </p>
    </div>
  );
}
