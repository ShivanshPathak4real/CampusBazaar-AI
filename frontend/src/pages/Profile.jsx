import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, campus: user.campus || '', bio: user.bio || '' });
  const [saved, setSaved] = useState(false);

  function set(key) { return (e) => setForm((f) => ({ ...f, [key]: e.target.value })); }

  async function handleSave(e) {
    e.preventDefault();
    const res = await api.patch('/users/me', form);
    updateUser(res.user);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-mustard-400 font-display text-xl">
          {user.name.charAt(0)}
        </span>
        <div>
          <h1 className="font-display text-xl font-semibold">{user.name}</h1>
          <p className="text-sm text-ink-soft">{user.email}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="mt-8 space-y-4 rounded-lg border border-line bg-white p-5">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Name</label>
          <input value={form.name} onChange={set('name')} className="w-full rounded-md border border-line px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Campus</label>
          <input value={form.campus} onChange={set('campus')} className="w-full rounded-md border border-line px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Bio</label>
          <textarea value={form.bio} onChange={set('bio')} rows={3} className="w-full rounded-md border border-line px-3 py-2 text-sm" placeholder="Tell other students a bit about yourself…" />
        </div>
        <button className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper">Save changes</button>
        {saved && <span className="ml-3 text-sm text-bazaar-600">Saved!</span>}
      </form>
    </div>
  );
}
