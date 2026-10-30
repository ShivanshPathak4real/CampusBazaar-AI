import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheck, Star } from 'lucide-react';
import { api } from '../lib/api';
import ProductCard from '../components/ProductCard';
import { Spinner } from '../components/Bits';

export default function UserProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/users/${id}`),
      api.get(`/listings?limit=50`),
      api.get(`/reviews/user/${id}`),
    ]).then(([p, l, r]) => {
      setProfile(p.user);
      setListings(l.listings.filter((li) => li.seller.id === id));
      setReviews(r.reviews);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (!profile) return <div className="p-10 text-center">User not found.</div>;

  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-6">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-mustard-400 font-display text-xl">{profile.name.charAt(0)}</span>
        <div>
          <p className="flex items-center gap-1 font-display text-xl font-semibold">
            {profile.name} {profile.isVerified && <ShieldCheck size={16} className="text-bazaar-500" />}
          </p>
          <p className="flex items-center gap-1 text-sm text-ink-soft">
            <Star size={13} fill="#D9A441" color="#D9A441" /> {profile.ratingAvg || 'No ratings yet'} {profile.ratingCount ? `(${profile.ratingCount} reviews)` : ''}
            {profile.campus && ` · ${profile.campus}`}
          </p>
        </div>
      </div>
      {profile.bio && <p className="mt-4 max-w-lg text-sm text-ink-soft">{profile.bio}</p>}

      <h2 className="font-display mt-10 mb-4 text-lg font-semibold">Listings from {profile.name.split(' ')[0]}</h2>
      {listings.length === 0 ? (
        <p className="text-sm text-ink-soft">No active listings right now.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {listings.map((l) => <ProductCard key={l.id} listing={l} />)}
        </div>
      )}

      {reviews.length > 0 && (
        <>
          <h2 className="font-display mt-10 mb-4 text-lg font-semibold">Reviews</h2>
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-lg border border-line bg-white p-4">
                <p className="flex items-center gap-1 text-sm font-medium">{r.reviewer_name} <Star size={12} fill="#D9A441" color="#D9A441" /> {r.rating}</p>
                {r.comment && <p className="mt-1 text-sm text-ink-soft">{r.comment}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
