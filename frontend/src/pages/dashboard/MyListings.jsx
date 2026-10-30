import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { EmptyState, Spinner } from '../../components/Bits';

const STATUS_STYLE = {
  active: 'bg-bazaar-50 text-bazaar-600',
  sold: 'bg-ink/10 text-ink',
  rented: 'bg-ink/10 text-ink',
  draft: 'bg-mustard-100 text-mustard-500',
  removed: 'bg-red-50 text-clay-500',
};

export default function MyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get('/users/me/listings').then((r) => setListings(r.listings)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function remove(id) {
    if (!confirm('Delete this listing? This cannot be undone.')) return;
    await api.del(`/listings/${id}`);
    load();
  }

  if (loading) return <Spinner />;
  if (listings.length === 0) {
    return <EmptyState title="No listings yet" body="List your first item and reach students on campus." action={<Link to="/sell" className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper">List an item</Link>} />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-line bg-paper text-left text-xs text-ink-soft">
          <tr>
            <th className="px-4 py-3 font-medium">Item</th>
            <th className="px-4 py-3 font-medium">Price</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Views</th>
            <th className="px-4 py-3 font-medium">Saves</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {listings.map((l) => (
            <tr key={l.id} className="border-b border-line last:border-0">
              <td className="px-4 py-3">
                <Link to={`/listing/${l.id}`} className="font-medium hover:text-bazaar-600">{l.title}</Link>
                <p className="text-xs text-ink-soft">{l.categoryName}</p>
              </td>
              <td className="px-4 py-3">{l.price ? `₹${l.price.toLocaleString('en-IN')}` : l.rentalPrice ? `₹${l.rentalPrice}/rent` : '—'}</td>
              <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[l.status]}`}>{l.status}</span></td>
              <td className="px-4 py-3">{l.views}</td>
              <td className="px-4 py-3">{l.saves}</td>
              <td className="px-4 py-3 text-right">
                <button onClick={() => remove(l.id)} className="text-xs font-medium text-clay-500">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
