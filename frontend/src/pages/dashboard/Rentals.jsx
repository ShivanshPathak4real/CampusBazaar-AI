import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { EmptyState, Spinner } from '../../components/Bits';

export default function Rentals() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get('/rentals').then((r) => setItems(r.rentals)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function markReturned(id) {
    await api.patch(`/rentals/${id}/return`);
    load();
  }

  if (loading) return <Spinner />;
  if (items.length === 0) return <EmptyState title="No active rentals" body="Items you rent or rent out will show up here with their return status." />;

  return (
    <div className="space-y-3">
      {items.map((r) => (
        <div key={r.id} className="flex items-center justify-between rounded-lg border border-line bg-white p-4">
          <div>
            <p className="text-sm font-medium">{r.listing_title}</p>
            <p className="text-xs text-ink-soft">
              {r.start_date || 'Start date TBD'} → {r.end_date || 'Ongoing'}
              {r.deposit_paid ? ` · Deposit ₹${r.deposit_paid}` : ''}
            </p>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.returned ? 'bg-bazaar-50 text-bazaar-600' : 'bg-mustard-100 text-mustard-500'}`}>
            {r.returned ? 'Returned' : 'Active'}
          </span>
          {!r.returned && <button onClick={() => markReturned(r.id)} className="rounded-full border border-line px-3 py-1 text-xs font-medium">Mark returned</button>}
        </div>
      ))}
    </div>
  );
}
