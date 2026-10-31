import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart, ShieldCheck, Flag, Star, MapPin, Clock, Calendar,
  ArrowRight, AlertTriangle, Home, Ticket, Users, Phone, Bed, Bath, Sparkles
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useSetBuddyContext } from '../context/BuddyContext';
import ProductCard from '../components/ProductCard';
import { DealBadge, Spinner } from '../components/Bits';

const PRODUCT_PLACEHOLDER = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop';
const TICKET_PLACEHOLDER = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&h=600&fit=crop';
const PROPERTY_PLACEHOLDER = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=600&fit=crop';

export default function ProductDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [actionMsg, setActionMsg] = useState('');
  const [exchangeItem, setExchangeItem] = useState('');
  const [contactMsg, setContactMsg] = useState('');

  useSetBuddyContext(listing?.id, listing?.title);

  useEffect(() => {
    setLoading(true);
    api.get(`/listings/${id}`).then((r) => {
      setListing(r.listing);
      setSimilar(r.similar);
      if (r.listing.categoryId && r.listing.price && !r.listing.ticketType && !r.listing.propertyType) {
        api
          .post('/ai/price-check', {
            categoryId: r.listing.categoryId,
            condition: r.listing.condition,
            price: r.listing.price,
            excludeListingId: r.listing.id
          })
          .then((res) => setAnalysis(res.analysis))
          .catch(() => {});
      }
    }).finally(() => setLoading(false));
  }, [id]);

  async function toggleSave() {
    if (!user) return navigate('/login');
    const res = await api.post(`/listings/${id}/save`);
    setListing((l) => ({ ...l, isSaved: res.saved }));
  }

  async function handleTransaction(type) {
    if (!user) return navigate('/login');
    try {
      await api.post('/transactions', { listingId: id, type });
      setActionMsg(type === 'rental' ? 'Rental request sent to the seller!' : 'Purchase request sent to the seller!');
    } catch (err) {
      setActionMsg(err.message);
    }
  }

  async function handleExchange(e) {
    e.preventDefault();
    if (!user) return navigate('/login');
    try {
      await api.post('/exchanges', { listingId: id, offeredItem: exchangeItem });
      setActionMsg('Exchange offer sent to the seller!');
      setExchangeItem('');
    } catch (err) {
      setActionMsg(err.message);
    }
  }

  async function handleContact(e) {
    e.preventDefault();
    if (!user) return navigate('/login');
    try {
      await api.post('/messages', { toUserId: listing.seller.id, listingId: id, body: contactMsg });
      setActionMsg('Message sent - check your inbox for the reply.');
      setContactMsg('');
    } catch (err) {
      setActionMsg(err.message);
    }
  }

  async function handleReport() {
    if (!user) return navigate('/login');
    const reason = prompt('Why are you reporting this listing?');
    if (!reason) return;
    await api.post('/reports', { targetType: 'listing', targetId: id, reason });
    setActionMsg('Thanks - our team will review this listing.');
  }

  if (loading) return <Spinner />;
  if (!listing) return <div className="p-10 text-center font-display text-lg">Listing not found.</div>;

  const isTicket =
    listing.categorySlug === 'travel-tickets' ||
    listing.categoryName?.toLowerCase().includes('ticket') ||
    !!listing.ticketType;

  const isProperty =
    listing.categorySlug === 'rent-accommodation' ||
    listing.categoryName?.toLowerCase().includes('accommodation') ||
    !!listing.propertyType;

  const defaultImg = isTicket ? TICKET_PLACEHOLDER : isProperty ? PROPERTY_PLACEHOLDER : PRODUCT_PLACEHOLDER;
  const images = listing.images?.length ? listing.images : [defaultImg];
  const isOwner = user?.id === listing.seller?.id;

  const isExpiredTicket = isTicket && listing.travelDate
    ? new Date(listing.travelDate + 'T23:59:59') < new Date()
    : false;

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-xl border border-line bg-white shadow-xs">
            <img
              src={images[activeImg] || defaultImg}
              alt={listing.title}
              className="h-full w-full object-cover"
              onError={(e) => { e.target.src = defaultImg; }}
            />
            {isTicket && (
              <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-blue-700/90 px-3 py-1 text-xs font-medium text-white shadow-sm">
                <Ticket size={13} />
                <span>{listing.ticketType || 'Travel Ticket'}</span>
              </span>
            )}
            {isProperty && (
              <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-emerald-700/90 px-3 py-1 text-xs font-medium text-white shadow-sm">
                <Home size={13} />
                <span>{listing.propertyType || 'Room Rental'}</span>
              </span>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition ${
                    i === activeImg ? 'border-bazaar-500 ring-2 ring-bazaar-500/20' : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-bazaar-600">
                {listing.categoryName || (isTicket ? 'Travel Tickets' : isProperty ? 'Rent & Accommodation' : 'Marketplace')}
              </p>
              <h1 className="font-display mt-1 text-2xl font-semibold sm:text-3xl text-ink">
                {listing.title}
              </h1>
            </div>
            <button
              onClick={toggleSave}
              className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-white hover:bg-paper transition"
              aria-label="Save"
            >
              <Heart
                size={18}
                fill={listing.isSaved ? '#A5462C' : 'none'}
                color={listing.isSaved ? '#A5462C' : 'currentColor'}
              />
            </button>
          </div>

          {/* TRAVEL TICKET SPECIFIC ROUTE & DATE DISPLAY */}
          {isTicket && (
            <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/50 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                    {listing.ticketType || 'Ticket'}
                  </div>
                  {listing.ticketQuantity && (
                    <span className="text-xs font-medium text-ink-soft">
                      {listing.ticketQuantity} available
                    </span>
                  )}
                </div>

                {isExpiredTicket ? (
                  <span className="flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-clay-600">
                    <AlertTriangle size={12} /> Past Travel Date
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    <Sparkles size={12} /> Active Ticket Listing
                  </span>
                )}
              </div>

              {/* Station Route Banner */}
              {listing.departureLocation && listing.destinationLocation && (
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-1">
                  <div>
                    <p className="text-[11px] font-medium uppercase text-ink-soft">Departure Station</p>
                    <p className="font-display text-base font-semibold text-ink">{listing.departureLocation}</p>
                    {listing.departureTime && (
                      <p className="text-xs text-ink-soft flex items-center gap-1 mt-0.5">
                        <Clock size={11} /> {listing.departureTime}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-center justify-center px-2">
                    <ArrowRight size={20} className="text-bazaar-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-medium uppercase text-ink-soft">Destination</p>
                    <p className="font-display text-base font-semibold text-ink">{listing.destinationLocation}</p>
                    {listing.arrivalTime && (
                      <p className="text-xs text-ink-soft flex items-center gap-1 justify-end mt-0.5">
                        <Clock size={11} /> {listing.arrivalTime}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Travel Date */}
              {listing.travelDate && (
                <div className="flex items-center gap-2 rounded-lg bg-white p-2.5 text-sm border border-blue-100">
                  <Calendar size={16} className="text-blue-600" />
                  <span className="font-medium text-ink">Date of Travel:</span>
                  <span className={isExpiredTicket ? 'text-clay-600 font-semibold line-through' : 'font-semibold text-bazaar-700'}>
                    {new Date(listing.travelDate).toLocaleDateString('en-IN', {
                      weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* RENTAL PROPERTY SPECIFIC OVERVIEW */}
          {isProperty && (
            <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
              <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2.5">
                <span className="rounded bg-emerald-700 px-2.5 py-0.5 text-xs font-semibold text-white">
                  {listing.propertyType || 'Room Rental'}
                </span>
                {listing.furnishing && (
                  <span className="rounded-full border border-emerald-300 bg-white px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                    {listing.furnishing}
                  </span>
                )}
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 py-1 text-xs">
                <div className="rounded-lg bg-white p-2.5 border border-emerald-100">
                  <p className="text-[10px] text-ink-soft uppercase flex items-center gap-1"><Bed size={12} /> Bedrooms</p>
                  <p className="font-semibold text-ink mt-0.5">{listing.bedrooms ? `${listing.bedrooms} BHK / Bed` : '1 Room'}</p>
                </div>
                <div className="rounded-lg bg-white p-2.5 border border-emerald-100">
                  <p className="text-[10px] text-ink-soft uppercase flex items-center gap-1"><Bath size={12} /> Bathrooms</p>
                  <p className="font-semibold text-ink mt-0.5">{listing.bathrooms ? `${listing.bathrooms} Bath` : '1 Bath'}</p>
                </div>
                <div className="rounded-lg bg-white p-2.5 border border-emerald-100">
                  <p className="text-[10px] text-ink-soft uppercase flex items-center gap-1"><Home size={12} /> Furnishing</p>
                  <p className="font-semibold text-ink mt-0.5">{listing.furnishing || 'Semi-furnished'}</p>
                </div>
                <div className="rounded-lg bg-white p-2.5 border border-emerald-100">
                  <p className="text-[10px] text-ink-soft uppercase flex items-center gap-1"><Calendar size={12} /> Available From</p>
                  <p className="font-semibold text-ink mt-0.5">
                    {listing.availableFrom ? new Date(listing.availableFrom).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Immediately'}
                  </p>
                </div>
              </div>

              {/* Address / Location */}
              {(listing.address || listing.locality || listing.city) && (
                <div className="flex items-start gap-2 rounded-lg bg-white p-2.5 text-xs border border-emerald-100 text-ink">
                  <MapPin size={15} className="text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{listing.address ? `${listing.address}, ` : ''}{listing.locality || ''}{listing.locality && listing.city ? ', ' : ''}{listing.city || ''}</p>
                    {listing.campus && <p className="text-[11px] text-ink-soft mt-0.5">Campus proximity: {listing.campus}</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PRICE SECTION */}
          <div className="flex flex-wrap items-baseline gap-3">
            <p className="font-display text-3xl font-semibold text-bazaar-600">
              {isProperty
                ? `₹${(listing.rentalPrice || listing.price)?.toLocaleString('en-IN')} / month`
                : listing.listingType === 'rent'
                ? `₹${listing.rentalPrice?.toLocaleString('en-IN')} ${listing.rentalPeriod?.replace('per-', '/ ')}`
                : listing.listingType === 'exchange'
                ? 'Exchange only'
                : `₹${listing.price?.toLocaleString('en-IN')}`}
            </p>

            {listing.originalPrice && listing.originalPrice > listing.price && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-ink-soft line-through">
                  ₹{listing.originalPrice.toLocaleString('en-IN')}
                </span>
                <span className="rounded bg-bazaar-50 px-2 py-0.5 text-xs font-semibold text-bazaar-700">
                  Save ₹{(listing.originalPrice - listing.price).toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {analysis && <DealBadge classification={analysis.classification} />}
          </div>

          {isProperty && listing.securityDeposit && (
            <p className="text-xs text-ink-soft">
              Security Deposit: <span className="font-medium text-ink">₹{listing.securityDeposit.toLocaleString('en-IN')}</span> (refundable upon vacating)
            </p>
          )}

          {/* TAGS */}
          <div className="flex flex-wrap gap-2 text-xs">
            {!isTicket && !isProperty && <Tag>{listing.condition}</Tag>}
            {listing.campus && <Tag><MapPin size={11} className="inline -mt-0.5 mr-1" />{listing.campus}</Tag>}
            <Tag><Clock size={11} className="inline -mt-0.5 mr-1" />Listed {new Date(listing.createdAt).toLocaleDateString()}</Tag>
          </div>

          {/* DESCRIPTION */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-soft mb-1.5">
              {isTicket ? 'Travel Instructions & Details' : isProperty ? 'Property Details & Amenities' : 'Description'}
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink/90">
              {listing.description}
            </p>
          </div>

          {/* RENTAL PROPERTY CONTACT INFO BOX */}
          {isProperty && listing.contactInfo && (
            <div className="rounded-xl border border-line bg-paper/60 p-4 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-xs text-ink uppercase tracking-wider">
                <Phone size={13} className="text-bazaar-600" />
                <span>Landlord / Contact Information</span>
              </div>
              <p className="font-mono text-sm font-semibold text-ink bg-white rounded p-2 border border-line">
                {listing.contactInfo}
              </p>
              <p className="text-[11px] text-ink-soft">
                Call or message directly to schedule an in-person room visit. Always inspect before paying any deposit.
              </p>
            </div>
          )}

          {/* TRAVEL TICKET WARNING / DISCLAIMER */}
          {isTicket && (
            <div className="rounded-xl border border-mustard-300 bg-mustard-50/80 p-4 space-y-1.5 text-xs text-ink">
              <div className="flex items-center gap-1.5 font-semibold text-mustard-800">
                <AlertTriangle size={16} className="text-mustard-600 shrink-0" />
                <span>Second-Hand / Transferable Ticket Notice & Safety Advisory</span>
              </div>
              <p className="leading-relaxed text-ink-soft">
                CampusBazaar operates strictly as a peer-to-peer student notice board. We do not issue tickets or guarantee transferability.
                Buyers must independently verify carrier validity, PNR status, passenger transfer guidelines, and identity rules prior to payment.
                Never transfer funds without verifying valid documentation.
              </p>
            </div>
          )}

          {/* SELLER CARD */}
          <Link
            to={`/user/${listing.seller.id}`}
            className="flex items-center gap-3 rounded-lg border border-line bg-white p-3 hover:border-ink/30 transition-colors"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-mustard-400 font-medium text-ink">
              {listing.seller.name?.charAt(0)}
            </span>
            <div className="flex-1">
              <p className="flex items-center gap-1 text-sm font-medium">
                {listing.seller.name}
                {listing.seller.isVerified && <ShieldCheck size={14} className="text-bazaar-500" />}
              </p>
              <p className="flex items-center gap-1 text-xs text-ink-soft">
                <Star size={11} fill="#D9A441" color="#D9A441" /> {listing.seller.ratingAvg || 'No ratings yet'} {listing.seller.ratingCount ? `(${listing.seller.ratingCount})` : ''}
              </p>
            </div>
          </Link>

          {/* ACTIONS */}
          {!isOwner ? (
            <div className="space-y-3 pt-2">
              {listing.listingType === 'sell' && (
                <button
                  onClick={() => handleTransaction('purchase')}
                  className="focus-ring w-full rounded-full bg-bazaar-500 py-2.5 text-sm font-medium text-paper hover:bg-bazaar-600 transition"
                >
                  {isTicket ? `Request to buy ticket (₹${listing.price?.toLocaleString('en-IN')})` : `Buy for ₹${listing.price?.toLocaleString('en-IN')}`}
                </button>
              )}
              {listing.listingType === 'rent' && (
                <button
                  onClick={() => handleTransaction('rental')}
                  className="focus-ring w-full rounded-full bg-bazaar-500 py-2.5 text-sm font-medium text-paper hover:bg-bazaar-600 transition"
                >
                  {isProperty ? 'Request rental / tenancy' : 'Request to rent'}
                </button>
              )}
              {listing.listingType === 'exchange' && (
                <form onSubmit={handleExchange} className="space-y-2 rounded-lg border border-line bg-white p-3">
                  <label className="text-xs font-medium text-ink-soft">What would you offer in exchange?</label>
                  <input
                    value={exchangeItem}
                    onChange={(e) => setExchangeItem(e.target.value)}
                    required
                    className="w-full rounded-md border border-line px-3 py-2 text-sm"
                    placeholder="e.g. Scientific calculator"
                  />
                  <button className="w-full rounded-full bg-bazaar-500 py-2 text-sm font-medium text-paper hover:bg-bazaar-600">
                    Send exchange offer
                  </button>
                </form>
              )}

              <form onSubmit={handleContact} className="flex items-center gap-2">
                <input
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  required
                  placeholder={isTicket ? 'Ask seller about ticket PNR, boarding or transfer…' : isProperty ? 'Ask landlord about room availability or visit timings…' : 'Message the seller…'}
                  className="focus-ring flex-1 rounded-full border border-line px-4 py-2 text-sm"
                />
                <button className="focus-ring shrink-0 rounded-full border border-line px-4 py-2 text-sm font-medium hover:border-ink/40">
                  Send
                </button>
              </form>

              <button onClick={handleReport} className="flex items-center gap-1 text-xs text-ink-soft hover:text-clay-500">
                <Flag size={12} /> Report this listing
              </button>
            </div>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link
                to={`/dashboard/listings/${id}/edit`}
                className="focus-ring rounded-full border border-line bg-white px-5 py-2 text-sm font-medium hover:border-ink/40"
              >
                Edit listing
              </Link>
            </div>
          )}

          {actionMsg && <p className="mt-2 text-sm font-medium text-bazaar-600">{actionMsg}</p>}
        </div>
      </div>

      {similar.length > 0 && (
        <div className="mt-14 border-t border-line pt-8">
          <h2 className="font-display mb-4 text-xl font-semibold">Similar listings</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {similar.map((l) => <ProductCard key={l.id} listing={l} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function Tag({ children }) {
  return <span className="rounded-full border border-line bg-white px-2.5 py-1 text-ink-soft">{children}</span>;
}
