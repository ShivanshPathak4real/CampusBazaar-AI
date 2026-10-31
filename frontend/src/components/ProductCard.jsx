import { Link } from 'react-router-dom';
import { Heart, MapPin, Calendar, ArrowRight, Home, Ticket, Images } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const PRODUCT_PLACEHOLDER = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop';
const TICKET_PLACEHOLDER = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=400&fit=crop';
const PROPERTY_PLACEHOLDER = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=400&fit=crop';

const TYPE_LABEL = { sell: 'For sale', rent: 'For rent', exchange: 'Exchange' };

export default function ProductCard({ listing, onToggleSave }) {
  const { user } = useAuth();

  const isTicket =
    listing.categorySlug === 'travel-tickets' ||
    listing.categoryName?.toLowerCase().includes('ticket') ||
    !!listing.ticketType;

  const isProperty =
    listing.categorySlug === 'rent-accommodation' ||
    listing.categoryName?.toLowerCase().includes('accommodation') ||
    !!listing.propertyType;

  const defaultImg = isTicket ? TICKET_PLACEHOLDER : isProperty ? PROPERTY_PLACEHOLDER : PRODUCT_PLACEHOLDER;
  const img = listing.images?.[0] || defaultImg;

  // Past travel date check for tickets
  const isExpiredTicket = isTicket && listing.travelDate
    ? new Date(listing.travelDate + 'T23:59:59') < new Date()
    : false;

  async function handleSave(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return (window.location.href = '/login');
    const res = await api.post(`/listings/${listing.id}/save`);
    onToggleSave?.(listing.id, res.saved);
  }

  // Price formatting
  let priceDisplay = `₹${listing.price?.toLocaleString('en-IN')}`;
  if (isProperty) {
    const rentAmount = listing.rentalPrice || listing.price;
    priceDisplay = `₹${rentAmount?.toLocaleString('en-IN')} / mo`;
  } else if (listing.listingType === 'rent') {
    priceDisplay = `₹${listing.rentalPrice?.toLocaleString('en-IN')} ${listing.rentalPeriod?.replace('per-', '/ ') || ''}`;
  } else if (listing.listingType === 'exchange') {
    priceDisplay = 'Exchange only';
  }

  return (
    <Link
      to={`/listing/${listing.id}`}
      className="focus-ring group block overflow-hidden rounded-lg border border-line bg-white transition-all hover:border-ink/30 hover:shadow-xs"
    >
      <div className="relative aspect-square overflow-hidden bg-paper">
        <img
          src={img}
          alt={listing.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          onError={(e) => { e.target.src = defaultImg; }}
        />

        {/* Save button */}
        <button
          onClick={handleSave}
          aria-label="Save listing"
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink-soft shadow-sm hover:text-clay-500 transition-colors"
        >
          <Heart
            size={16}
            fill={listing.isSaved ? '#A5462C' : 'none'}
            color={listing.isSaved ? '#A5462C' : 'currentColor'}
          />
        </button>

        {/* Category / Type Badge */}
        {isTicket ? (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-blue-700/90 px-2 py-0.5 text-xs font-medium text-white shadow-xs">
            <Ticket size={11} />
            <span>{listing.ticketType || 'Ticket'}</span>
          </span>
        ) : isProperty ? (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-emerald-700/90 px-2 py-0.5 text-xs font-medium text-white shadow-xs">
            <Home size={11} />
            <span>{listing.propertyType || 'Rental'}</span>
          </span>
        ) : (
          <span className="absolute left-2 top-2 rounded-full bg-ink/85 px-2 py-0.5 text-xs font-medium text-paper shadow-xs">
            {TYPE_LABEL[listing.listingType] || 'For sale'}
          </span>
        )}

        {/* Multiple photos indicator for properties */}
        {listing.images?.length > 1 && (
          <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-md bg-ink/75 px-1.5 py-0.5 text-[10px] font-medium text-white">
            <Images size={11} /> {listing.images.length}
          </span>
        )}

        {/* Expired ticket warning banner */}
        {isExpiredTicket && (
          <span className="absolute left-2 bottom-2 rounded-md bg-clay-500/95 px-2 py-0.5 text-[10px] font-semibold text-white shadow-xs">
            Past Travel Date
          </span>
        )}
      </div>

      <div className="p-3">
        <p className="line-clamp-2 text-sm font-medium leading-snug">{listing.title}</p>

        {/* Category-specific card attributes */}
        {isTicket ? (
          <div className="mt-1.5 space-y-1">
            {listing.departureLocation && listing.destinationLocation && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-ink">
                <span className="truncate max-w-[45%]">{listing.departureLocation}</span>
                <ArrowRight size={11} className="shrink-0 text-bazaar-600" />
                <span className="truncate max-w-[45%]">{listing.destinationLocation}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              {listing.travelDate && (
                <span className={`flex items-center gap-1 font-medium ${isExpiredTicket ? 'text-clay-500 line-through' : 'text-bazaar-700'}`}>
                  <Calendar size={11} />
                  <span>{new Date(listing.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </span>
              )}
              {listing.ticketQuantity > 1 && (
                <span className="text-[11px] text-ink-soft">
                  {listing.ticketQuantity} available
                </span>
              )}
            </div>
            <p className="mt-1 font-display text-base font-semibold text-bazaar-600">{priceDisplay}</p>
          </div>
        ) : isProperty ? (
          <div className="mt-1.5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-ink-soft">
              {listing.bedrooms ? <span>{listing.bedrooms} Bed</span> : null}
              {listing.bathrooms ? <span>· {listing.bathrooms} Bath</span> : null}
              {listing.furnishing ? <span>· {listing.furnishing}</span> : null}
            </div>
            {(listing.locality || listing.city) && (
              <div className="flex items-center gap-1 text-xs text-ink-soft">
                <MapPin size={11} className="shrink-0 text-bazaar-600" />
                <span className="truncate">{listing.locality || ''}{listing.locality && listing.city ? ', ' : ''}{listing.city || ''}</span>
              </div>
            )}
            <p className="mt-1 font-display text-base font-semibold text-emerald-700">{priceDisplay}</p>
          </div>
        ) : (
          <div>
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
        )}
      </div>
    </Link>
  );
}
