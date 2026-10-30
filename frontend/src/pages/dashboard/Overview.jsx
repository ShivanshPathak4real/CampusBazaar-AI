import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/Bits';

export default function Overview() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/users/me/listings'), api.get('/transactions')])
      .then(([l, t]) => { setListings(l.listings); setTransactions(t.transactions); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const active = listings.filter((l) => l.status === 'active').length;
  const sold = listings.filter((l) => l.status === 'sold' || l.status === 'rented').length;
  const totalViews = listings.reduce((s, l) => s + l.views, 0);
  const totalSaves = listings.reduce((s, l) => s + l.saves, 0);
  const pendingDeals = transactions.filter((t) => t.status === 'pending').length;

  return (
    <div className="space-y-6">
      <p className="text-ink-soft">Welcome back, {user.name.split(' ')[0]}.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Active listings" value={active} />
        <Stat label="Sold / rented" value={sold} />
        <Stat label="Total views" value={totalViews} />
        <Stat label="Total saves" value={totalSaves} />
      </div>

      {pendingDeals > 0 && (
        <div className="rounded-lg border border-mustard-400/50 bg-mustard-100/50 p-4 text-sm">
          You have {pendingDeals} pending transaction{pendingDeals > 1 ? 's' : ''} awaiting action.
          <Link to="/dashboard/transactions" className="ml-1 font-medium text-bazaar-600">Review now →</Link>
        </div>
      )}

      <div className="rounded-lg border border-line bg-white p-5">
        <p className="mb-3 font-medium">Quick actions</p>
        <div className="flex flex-wrap gap-2">
          <Link to="/sell" className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper">List a new item</Link>
          <Link to="/dashboard/listings" className="rounded-full border border-line px-4 py-2 text-sm font-medium">Manage listings</Link>
          <Link to="/profile" className="rounded-full border border-line px-4 py-2 text-sm font-medium">Edit profile</Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <p className="font-display text-2xl font-semibold">{value}</p>
      <p className="text-xs text-ink-soft">{label}</p>
    </div>
  );
}
