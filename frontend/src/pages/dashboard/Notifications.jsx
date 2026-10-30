import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { EmptyState, Spinner } from '../../components/Bits';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get('/notifications').then((r) => setItems(r.notifications)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function markAllRead() {
    await api.patch('/notifications/read-all');
    load();
  }

  if (loading) return <Spinner />;
  if (items.length === 0) return <EmptyState title="You're all caught up" body="New messages, offers, and updates will show up here." />;

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button onClick={markAllRead} className="text-xs font-medium text-bazaar-600">Mark all as read</button>
      </div>
      <div className="space-y-2">
        {items.map((n) => (
          <div key={n.id} className={`rounded-lg border border-line bg-white p-3 ${!n.read ? 'border-l-4 border-l-bazaar-500' : ''}`}>
            <p className="text-sm font-medium">{n.title}</p>
            {n.body && <p className="text-xs text-ink-soft">{n.body}</p>}
            <p className="mt-1 text-xs text-ink-soft/70">{new Date(n.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
