import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, ShieldCheck, Flag, Star, Clock } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useSetBuddyContext } from '../context/BuddyContext';
import ProductCard from '../components/ProductCard';
import { Spinner, DealBadge } from '../components/Bits';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop';

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
      if (r.listing.categoryId) {
        api
          .post('/ai/price-check', { categoryId: r.listing.categoryId, condition: r.listing.condition, price: r.listing.price, excludeListingId: r.listing.id })
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
    } catch (e) {
      setActionMsg(e.message);
    }
  }

  async function handleExchange(e) {
    e.preventDefault();
    if (!user) return navigate('/login');
    try {
      await api.post('/exchanges', { listingId: id, offeredItem: exchangeItem });
      setActionMsg('Exchange request sent!');
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
  if (!listing) return <div className="p-10 text-center">Listing not found.</div>;

  const images = listing.images.length ? listing.images : [PLACEHOLDER];
  const isOwner = user?.id === listing.seller.id;

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="aspect-square overflow-hidden rounded-lg border border-line bg-white">
            <img src={images[activeImg]} alt={listing.title} className="h-full w-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`h-16 w-16 overflow-hidden rounded-md border-2 ${i === activeImg ? 'border-bazaar-500' : 'border-transparent'}`}>
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase text-bazaar-500">{listing.categoryName}</p>
              <h1 className="font-display mt-1 text-2xl font-semibold sm:text-3xl">{listing.title}</h1>
            </div>
            <button onClick={toggleSave} className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line" aria-label="Save">
              <Heart size={18} fill={listing.isSaved ? '#A5462C' : 'none'} color={listing.isSaved ? '#A5462C' : 'currentColor'} />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="font-display text-2xl font-semibold text-bazaar-600">
              {listing.listingType === 'rent'
                ? `₹${listing.rentalPrice?.toLocaleString('en-IN')} ${listing.rentalPeriod?.replace('per-', '/ ')}`
                : listing.listingType === 'exchange'
                ? 'Exchange only'
                : `₹${listing.price?.toLocaleString('en-IN')}`}
            </p>
            {analysis && <DealBadge classification={analysis.classification} />}
          </div>
          {analysis?.status === 'ok' && (
            <p className="mt-1 text-sm text-ink-soft">
              Similar listings: ₹{analysis.fairPriceRange.low.toLocaleString('en-IN')}–₹{analysis.fairPriceRange.high.toLocaleString('en-IN')} ({analysis.sampleSize} compared)
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Tag>{listing.condition}</Tag>
            {listing.campus && <Tag><MapPin size={11} className="inline -mt-0.5 mr-1" />{listing.campus}</Tag>}
            <Tag><Clock size={11} className="inline -mt-0.5 mr-1" />Listed {new Date(listing.createdAt).toLocaleDateString()}</Tag>
          </div>

          <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{listing.description}</p>

          {listing.listingType === 'exchange' && listing.exchangeFor && (
            <p className="mt-3 text-sm"><span className="font-medium">Looking for:</span> {listing.exchangeFor}</p>
          )}
          {listing.listingType === 'rent' && listing.securityDeposit && (
            <p className="mt-2 text-sm text-ink-soft">Security deposit: ₹{listing.securityDeposit.toLocaleString('en-IN')}</p>
          )}

          {/* Seller */}
          <Link to={`/user/${listing.seller.id}`} className="mt-6 flex items-center gap-3 rounded-lg border border-line bg-white p-3 hover:border-ink/30">
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

          {!isOwner ? (
            <div className="mt-5 space-y-3">
              {listing.listingType === 'sell' && (
                <button onClick={() => handleTransaction('purchase')} className="focus-ring w-full rounded-full bg-bazaar-500 py-2.5 text-sm font-medium text-paper hover:bg-bazaar-600">
                  Buy for ₹{listing.price?.toLocaleString('en-IN')}
                </button>
              )}
              {listing.listingType === 'rent' && (
                <button onClick={() => handleTransaction('rental')} className="focus-ring w-full rounded-full bg-bazaar-500 py-2.5 text-sm font-medium text-paper hover:bg-bazaar-600">
                  Request to rent
                </button>
              )}
              {listing.listingType === 'exchange' && (
                <form onSubmit={handleExchange} className="space-y-2 rounded-lg border border-line bg-white p-3">
                  <label className="text-xs font-medium text-ink-soft">What would you offer in exchange?</label>
                  <input value={exchangeItem} onChange={(e) => setExchangeItem(e.target.value)} required className="w-full rounded-md border border-line px-3 py-2 text-sm" placeholder="e.g. Scientific calculator" />
                  <button className="w-full rounded-full bg-bazaar-500 py-2 text-sm font-medium text-paper hover:bg-bazaar-600">Send exchange offer</button>
                </form>
              )}

              <form onSubmit={handleContact} className="flex items-center gap-2">
                <input value={contactMsg} onChange={(e) => setContactMsg(e.target.value)} required placeholder="Message the seller…" className="focus-ring w-full rounded-full border border-line px-4 py-2 text-sm" />
                <button className="focus-ring shrink-0 rounded-full border border-line px-4 py-2 text-sm font-medium hover:border-ink/40">Send</button>
              </form>

              <button onClick={handleReport} className="flex items-center gap-1 text-xs text-ink-soft hover:text-clay-500">
                <Flag size={12} /> Report this listing
              </button>
            </div>
          ) : (
            <div className="mt-5 flex gap-2">
              <Link to={`/dashboard/listings/${id}/edit`} className="focus-ring rounded-full border border-line px-4 py-2 text-sm font-medium hover:border-ink/40">Edit listing</Link>
            </div>
          )}

          {actionMsg && <p className="mt-3 text-sm font-medium text-bazaar-600">{actionMsg}</p>}
        </div>
      </div>

      {similar.length > 0 && (
        <div className="mt-14">
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
  return <span className="rounded-full border border-line bg-white px-2.5 py-1 capitalize text-ink-soft">{children}</span>;
}
