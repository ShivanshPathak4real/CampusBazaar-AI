import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { EmptyState, Spinner } from '../../components/Bits';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop';

export default function Saved() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/me/saved').then((r) => setItems(r.listings)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (items.length === 0) {
    return <EmptyState title="Nothing saved yet" body="Tap the heart icon on any listing to save it here for later." action={<Link to="/browse" className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper">Browse listings</Link>} />;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {items.map((l) => (
        <Link key={l.id} to={`/listing/${l.id}`} className="block overflow-hidden rounded-lg border border-line bg-white hover:border-ink/30">
          <img src={l.images?.[0] || PLACEHOLDER} alt={l.title} className="aspect-square w-full object-cover" />
          <div className="p-3">
            <p className="line-clamp-2 text-sm font-medium">{l.title}</p>
            <p className="mt-1 text-sm font-semibold text-bazaar-600">{l.price ? `₹${l.price.toLocaleString('en-IN')}` : l.rentalPrice ? `₹${l.rentalPrice}` : 'Exchange'}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
