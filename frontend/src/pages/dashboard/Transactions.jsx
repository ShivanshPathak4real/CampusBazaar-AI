import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { EmptyState, Spinner } from '../../components/Bits';

const STATUS_STYLE = {
  pending: 'bg-mustard-100 text-mustard-500',
  confirmed: 'bg-blue-50 text-blue-700',
  completed: 'bg-bazaar-50 text-bazaar-600',
  cancelled: 'bg-red-50 text-clay-500',
};

export default function Transactions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get('/transactions').then((r) => setItems(r.transactions)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function updateStatus(id, status) {
    await api.patch(`/transactions/${id}/status`, { status });
    load();
  }

  if (loading) return <Spinner />;
  if (items.length === 0) return <EmptyState title="No transactions yet" body="Purchases, sales, and rental requests will show up here." />;

  return (
    <div className="space-y-3">
      {items.map((t) => (
        <div key={t.id} className="flex items-center gap-4 rounded-lg border border-line bg-white p-4">
          {t.listingImage && <img src={t.listingImage} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover" />}
          <div className="flex-1">
            <p className="text-sm font-medium">{t.listingTitle}</p>
            <p className="text-xs text-ink-soft capitalize">
              {t.type} · you're the {t.role} {t.amount ? `· ₹${t.amount.toLocaleString('en-IN')}` : ''}
            </p>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[t.status]}`}>{t.status}</span>
          {t.status === 'pending' && t.role === 'seller' && (
            <div className="flex gap-1">
              <button onClick={() => updateStatus(t.id, 'confirmed')} className="rounded-full border border-line px-3 py-1 text-xs font-medium">Confirm</button>
              <button onClick={() => updateStatus(t.id, 'cancelled')} className="rounded-full border border-line px-3 py-1 text-xs font-medium text-clay-500">Cancel</button>
            </div>
          )}
          {t.status === 'confirmed' && (
            <button onClick={() => updateStatus(t.id, 'completed')} className="rounded-full border border-line px-3 py-1 text-xs font-medium">Mark complete</button>
          )}
        </div>
      ))}
    </div>
  );
}
