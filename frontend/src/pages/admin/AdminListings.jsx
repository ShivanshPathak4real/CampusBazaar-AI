import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Spinner } from '../../components/Bits';

export default function AdminListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get('/admin/listings').then((r) => setListings(r.listings)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function setStatus(id, status) {
    await api.patch(`/admin/listings/${id}/status`, { status });
    load();
  }

  if (loading) return <Spinner />;

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-line bg-paper text-left text-xs text-ink-soft">
          <tr>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Seller</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {listings.map((l) => (
            <tr key={l.id} className="border-b border-line last:border-0">
              <td className="px-4 py-3 font-medium">{l.title}</td>
              <td className="px-4 py-3 text-ink-soft">{l.seller_name}</td>
              <td className="px-4 py-3 capitalize">{l.listing_type}</td>
              <td className="px-4 py-3 capitalize">{l.status}</td>
              <td className="px-4 py-3 text-right space-x-2">
                {l.status !== 'active' && <button onClick={() => setStatus(l.id, 'active')} className="text-xs font-medium text-bazaar-600">Approve</button>}
                {l.status !== 'removed' && <button onClick={() => setStatus(l.id, 'removed')} className="text-xs font-medium text-clay-500">Remove</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
