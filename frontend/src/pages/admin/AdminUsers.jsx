import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Spinner } from '../../components/Bits';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get('/admin/users').then((r) => setUsers(r.users)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function verify(id) {
    await api.patch(`/admin/users/${id}/verify`);
    load();
  }

  if (loading) return <Spinner />;

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-line bg-paper text-left text-xs text-ink-soft">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Rating</th>
            <th className="px-4 py-3 font-medium">Verified</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-line last:border-0">
              <td className="px-4 py-3 font-medium">{u.name}</td>
              <td className="px-4 py-3 text-ink-soft">{u.email}</td>
              <td className="px-4 py-3 capitalize">{u.role}</td>
              <td className="px-4 py-3">{u.rating_avg || '—'}</td>
              <td className="px-4 py-3">{u.is_verified ? 'Yes' : 'No'}</td>
              <td className="px-4 py-3 text-right">
                {!u.is_verified && <button onClick={() => verify(u.id)} className="text-xs font-medium text-bazaar-600">Verify</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
