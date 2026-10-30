import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { EmptyState, Spinner } from '../../components/Bits';

const STATUS_STYLE = {
  pending: 'bg-mustard-100 text-mustard-500',
  accepted: 'bg-bazaar-50 text-bazaar-600',
  rejected: 'bg-red-50 text-clay-500',
  cancelled: 'bg-ink/10 text-ink',
};

export default function Exchanges() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get('/exchanges').then((r) => setItems(r.exchanges)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function updateStatus(id, status) {
    await api.patch(`/exchanges/${id}/status`, { status });
    load();
  }

  if (loading) return <Spinner />;
  if (items.length === 0) return <EmptyState title="No exchange requests" body="Offers you send or receive for swap listings appear here." />;

  return (
    <div className="space-y-3">
      {items.map((e) => (
        <div key={e.id} className="flex items-center gap-4 rounded-lg border border-line bg-white p-4">
          {e.listingImage && <img src={e.listingImage} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover" />}
          <div className="flex-1">
            <p className="text-sm font-medium">{e.listingTitle}</p>
            <p className="text-xs text-ink-soft">Offered: {e.offeredItem} {e.message ? `· "${e.message}"` : ''}</p>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[e.status]}`}>{e.status}</span>
          {e.status === 'pending' && e.role === 'seller' && (
            <div className="flex gap-1">
              <button onClick={() => updateStatus(e.id, 'accepted')} className="rounded-full border border-line px-3 py-1 text-xs font-medium">Accept</button>
              <button onClick={() => updateStatus(e.id, 'rejected')} className="rounded-full border border-line px-3 py-1 text-xs font-medium text-clay-500">Decline</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
