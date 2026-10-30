import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Spinner } from '../../components/Bits';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);

  useEffect(() => { api.get('/admin/stats').then(setStats); }, []);

  if (!stats) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Users" value={stats.users} />
        <Stat label="Active listings" value={stats.activeListings} />
        <Stat label="Sales" value={stats.sales} />
        <Stat label="Rentals" value={stats.rentals} />
        <Stat label="Exchanges" value={stats.exchanges} />
        <Stat label="Total listings" value={stats.listings} />
        <Stat label="Open reports" value={stats.openReports} highlight={stats.openReports > 0} />
      </div>

      <div className="rounded-lg border border-line bg-white p-5">
        <p className="mb-3 font-medium">Listings by category</p>
        <div className="space-y-2">
          {stats.byCategory.map((c) => (
            <div key={c.name} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-sm">{c.name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper">
                <div className="h-full bg-bazaar-500" style={{ width: `${Math.min(100, (c.count / Math.max(1, stats.listings)) * 100 * 3)}%` }} />
              </div>
              <span className="w-6 text-right text-xs text-ink-soft">{c.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div className={`rounded-lg border p-4 ${highlight ? 'border-clay-400/50 bg-red-50' : 'border-line bg-white'}`}>
      <p className="font-display text-2xl font-semibold">{value}</p>
      <p className="text-xs text-ink-soft">{label}</p>
    </div>
  );
}
