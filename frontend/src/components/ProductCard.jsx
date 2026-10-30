import { Link } from 'react-router-dom';
import { Heart, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop';

const TYPE_LABEL = { sell: 'For sale', rent: 'For rent', exchange: 'Exchange' };

export default function ProductCard({ listing, onToggleSave }) {
  const { user } = useAuth();
  const img = listing.images?.[0] || PLACEHOLDER;

  async function handleSave(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return (window.location.href = '/login');
    const res = await api.post(`/listings/${listing.id}/save`);
    onToggleSave?.(listing.id, res.saved);
  }

  const priceDisplay =
    listing.listingType === 'rent'
      ? `₹${listing.rentalPrice?.toLocaleString('en-IN')} ${listing.rentalPeriod?.replace('per-', '/ ') || ''}`
      : listing.listingType === 'exchange'
      ? 'Exchange only'
      : `₹${listing.price?.toLocaleString('en-IN')}`;

  return (
    <Link
      to={`/listing/${listing.id}`}
      className="focus-ring group block overflow-hidden rounded-lg border border-line bg-white transition-colors hover:border-ink/30"
    >
      <div className="relative aspect-square overflow-hidden bg-paper">
        <img src={img} alt={listing.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        <button
          onClick={handleSave}
          aria-label="Save listing"
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink-soft shadow-sm hover:text-clay-500"
        >
          <Heart size={16} fill={listing.isSaved ? '#A5462C' : 'none'} color={listing.isSaved ? '#A5462C' : 'currentColor'} />
        </button>
        <span className="absolute left-2 top-2 rounded-full bg-ink/85 px-2 py-0.5 text-xs font-medium text-paper">
          {TYPE_LABEL[listing.listingType]}
        </span>
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-medium leading-snug">{listing.title}</p>
        <p className="mt-1.5 font-display text-base font-semibold text-bazaar-600">{priceDisplay}</p>
        <div className="mt-2 flex items-center justify-between text-xs text-ink-soft">
          <span className="capitalize">{listing.condition}</span>
          {listing.campus && (
            <span className="flex items-center gap-1">
              <MapPin size={11} /> {listing.campus}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
