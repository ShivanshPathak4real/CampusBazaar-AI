import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Check, Upload, X, Loader2, Ticket, Home, Package,
  AlertTriangle, Calendar, Clock, MapPin, Phone, Bed, Bath
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { DealBadge } from '../components/Bits';

const STEPS = ['Basics', 'Details', 'Images', 'AI assist', 'Preview'];
const CONDITIONS = ['new', 'like-new', 'good', 'fair', 'worn'];
const TICKET_TYPES = ['Train Ticket', 'Bus Ticket', 'Flight Ticket', 'Other'];
const PROPERTY_TYPES = ['Single Room', 'Shared Room', '1 BHK', '2 BHK', '3 BHK', 'Other'];
const FURNISHING_TYPES = ['Furnished', 'Semi-furnished', 'Unfurnished'];

export default function Sell() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('general');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [error, setError] = useState('');

  // General product wizard step
  const [step, setStep] = useState(0);
  const [analysis, setAnalysis] = useState(null);

  // Common & General Form State
  const [form, setForm] = useState({
    title: '',
    categoryId: '',
    listingType: 'sell',
    condition: 'good',
    description: '',
    price: '',
    rentalPrice: '',
    rentalPeriod: 'per-week',
    securityDeposit: '',
    originalPrice: '',
    purchaseYear: '',
    exchangeFor: '',
    campus: user?.campus || '',
    images: [],

    // Travel Tickets Specific Fields
    ticketType: 'Train Ticket',
    travelDate: '',
    departureLocation: '',
    destinationLocation: '',
    departureTime: '',
    arrivalTime: '',
    ticketQuantity: '1',

    // Rental Property Specific Fields
    propertyType: 'Single Room',
    locality: '',
    city: 'Delhi',
    address: '',
    bedrooms: '1',
    bathrooms: '1',
    furnishing: 'Furnished',
    availableFrom: '',
    contactInfo: '',
  });

  useEffect(() => {
    api.get('/categories').then((r) => {
      setCategories(r.categories || []);
    });
  }, []);

  // Update category and synchronize mode
  function handleCategoryChange(catId) {
    const cat = categories.find((c) => c.id === catId);
    setForm((f) => ({ ...f, categoryId: catId }));
    if (cat?.slug === 'travel-tickets') {
      setSelectedCategorySlug('travel-tickets');
    } else if (cat?.slug === 'rent-accommodation') {
      setSelectedCategorySlug('rent-accommodation');
    } else {
      setSelectedCategorySlug('general');
    }
  }

  function handleModeTab(slug) {
    setSelectedCategorySlug(slug);
    const cat = categories.find((c) => c.slug === slug);
    if (cat) {
      setForm((f) => ({ ...f, categoryId: cat.id }));
    } else if (slug === 'general') {
      const firstGen = categories.find((c) => c.slug !== 'travel-tickets' && c.slug !== 'rent-accommodation');
      if (firstGen) setForm((f) => ({ ...f, categoryId: firstGen.id }));
    }
  }

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleFileChange(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (form.images.length + files.length > 5) {
      setUploadError('Maximum 5 images allowed');
      return;
    }

    setUploading(true);
    setUploadError('');
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));

    try {
      const res = await api.upload('/listings/upload-images', formData);
      setForm((f) => ({ ...f, images: [...f.images, ...(res.urls || [])] }));
    } catch (err) {
      setUploadError(err.message || 'Failed to upload images');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function removeImage(urlToRemove) {
    setForm((f) => ({
      ...f,
      images: f.images.filter((img) => img !== urlToRemove),
    }));
  }

  async function runPriceCheck() {
    if (!form.categoryId) return;
    const res = await api.post('/ai/price-check', {
      categoryId: form.categoryId,
      condition: form.condition,
      price: Number(form.price) || undefined,
    });
    setAnalysis(res.analysis);
  }

  async function improveDescription() {
    if (!form.description.trim()) return;
    const res = await api.post('/ai/improve-description', { description: form.description });
    setForm((f) => ({ ...f, description: res.improved }));
  }

  // --- SUBMISSION FOR TRAVEL TICKETS ---
  async function handlePublishTicket(e) {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) return setError('Ticket title is required');
    if (!form.ticketType) return setError('Please select a ticket type');
    if (!form.travelDate) return setError('Travel date is required');
    if (!form.departureLocation.trim()) return setError('Departure location / boarding station is required');
    if (!form.destinationLocation.trim()) return setError('Destination station / arrival location is required');
    const priceNum = Number(form.price);
    if (!form.price || isNaN(priceNum) || priceNum <= 0) return setError('Ticket price must be greater than 0');

    setSubmitting(true);
    try {
      const ticketCat = categories.find((c) => c.slug === 'travel-tickets');
      const payload = {
        title: form.title.trim(),
        categoryId: ticketCat?.id || form.categoryId,
        listingType: 'sell',
        condition: 'good',
        price: priceNum,
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        description: form.description.trim() || `Transferable ${form.ticketType} from ${form.departureLocation.trim()} to ${form.destinationLocation.trim()} on ${form.travelDate}.`,
        images: form.images,
        ticketType: form.ticketType,
        travelDate: form.travelDate,
        departureLocation: form.departureLocation.trim(),
        destinationLocation: form.destinationLocation.trim(),
        departureTime: form.departureTime.trim(),
        arrivalTime: form.arrivalTime.trim(),
        ticketQuantity: Number(form.ticketQuantity) || 1,
        campus: form.campus || user?.campus,
      };

      const res = await api.post('/listings', payload);
      navigate(`/listing/${res.listing.id}`);
    } catch (err) {
      setError(err.message || 'Failed to list ticket');
    } finally {
      setSubmitting(false);
    }
  }

  // --- SUBMISSION FOR RENT / ACCOMMODATION ---
  async function handlePublishProperty(e) {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) return setError('Property title is required');
    if (!form.propertyType) return setError('Property type is required');
    const rentNum = Number(form.rentalPrice || form.price);
    if (!rentNum || rentNum <= 0) return setError('Monthly rent must be greater than 0');
    if (!form.locality.trim()) return setError('Locality / Area is required');
    if (!form.city.trim()) return setError('City is required');
    if (!form.contactInfo.trim()) return setError('Contact information is required for student inquiries');
    if (!form.description.trim()) return setError('Property description and details are required');

    setSubmitting(true);
    try {
      const propCat = categories.find((c) => c.slug === 'rent-accommodation');
      const payload = {
        title: form.title.trim(),
        categoryId: propCat?.id || form.categoryId,
        listingType: 'rent',
        condition: 'good',
        rentalPrice: rentNum,
        rentalPeriod: 'per-month',
        securityDeposit: form.securityDeposit ? Number(form.securityDeposit) : undefined,
        description: form.description.trim(),
        images: form.images,
        propertyType: form.propertyType,
        locality: form.locality.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        bedrooms: Number(form.bedrooms) || 1,
        bathrooms: Number(form.bathrooms) || 1,
        furnishing: form.furnishing,
        availableFrom: form.availableFrom,
        contactInfo: form.contactInfo.trim(),
        campus: form.campus || form.locality.trim(),
      };

      const res = await api.post('/listings', payload);
      navigate(`/listing/${res.listing.id}`);
    } catch (err) {
      setError(err.message || 'Failed to list property');
    } finally {
      setSubmitting(false);
    }
  }

  // --- SUBMISSION FOR GENERAL PRODUCTS ---
  async function handlePublishProduct() {
    setSubmitting(true);
    setError('');
    try {
      // Build a clean payload — only send fields relevant to the chosen listingType.
      // Do NOT spread the whole form object, which would leak rental/property/ticket
      // fields (rentalPrice, rentalPeriod, propertyType, city, locality, etc.)
      // into a sell or exchange listing and cause it to be mis-categorised.
      const payload = {
        title: form.title.trim(),
        categoryId: form.categoryId,
        listingType: form.listingType,
        condition: form.condition,
        description: form.description.trim(),
        campus: form.campus.trim(),
        images: form.images,
        // Price fields — only populate the one that matches the listing type
        price: form.listingType === 'sell' ? Number(form.price) : undefined,
        originalPrice: form.listingType === 'sell' && form.originalPrice ? Number(form.originalPrice) : undefined,
        rentalPrice: form.listingType === 'rent' ? Number(form.rentalPrice) : undefined,
        rentalPeriod: form.listingType === 'rent' ? form.rentalPeriod : undefined,
        securityDeposit: form.listingType === 'rent' && form.securityDeposit ? Number(form.securityDeposit) : undefined,
        exchangeFor: form.listingType === 'exchange' ? form.exchangeFor.trim() : undefined,
        purchaseYear: form.purchaseYear ? Number(form.purchaseYear) : undefined,
      };
      const res = await api.post('/listings', payload);
      navigate(`/listing/${res.listing.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="font-display text-xl font-semibold">Log in to list an item</p>
        <p className="mt-2 text-sm text-ink-soft">
          You'll need an account to sell items, transferable tickets, or list accommodations on CampusBazaar.
        </p>
      </div>
    );
  }

  const isTicket = selectedCategorySlug === 'travel-tickets';
  const isProperty = selectedCategorySlug === 'rent-accommodation';

  const canNextGeneral = [
    !!form.title && !!form.categoryId,
    !!form.condition && !!form.description && (form.listingType !== 'sell' || !!form.price) && (form.listingType !== 'rent' || !!form.rentalPrice),
    form.images.length > 0,
    true,
    true,
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-semibold">List on CampusBazaar</h1>
          <p className="text-xs text-ink-soft">Choose what you want to list: items, travel tickets, or rental rooms</p>
        </div>
      </div>

      {/* Mode / Category Quick Switcher Tabs */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-line pb-4">
        <button
          type="button"
          onClick={() => handleModeTab('general')}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs sm:text-sm font-medium transition ${
            !isTicket && !isProperty
              ? 'bg-ink text-paper shadow-xs'
              : 'border border-line bg-white text-ink-soft hover:text-ink hover:border-ink/40'
          }`}
        >
          <Package size={14} />
          <span>General Product</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeTab('travel-tickets')}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs sm:text-sm font-medium transition ${
            isTicket
              ? 'bg-blue-600 text-paper shadow-xs'
              : 'border border-line bg-white text-ink-soft hover:text-blue-700 hover:border-blue-300'
          }`}
        >
          <Ticket size={14} />
          <span>Travel Tickets</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeTab('rent-accommodation')}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs sm:text-sm font-medium transition ${
            isProperty
              ? 'bg-emerald-700 text-paper shadow-xs'
              : 'border border-line bg-white text-ink-soft hover:text-emerald-700 hover:border-emerald-300'
          }`}
        >
          <Home size={14} />
          <span>Room / Accommodation</span>
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-clay-600">
          <AlertTriangle size={16} className="shrink-0 text-clay-500" />
          <span>{error}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. DEDICATED TRAVEL TICKETS FORM                          */}
      {/* ======================================================== */}
      {isTicket && (
        <form onSubmit={handlePublishTicket} className="mt-6 space-y-6 rounded-xl border border-line bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h2 className="font-display text-lg font-semibold flex items-center gap-2 text-blue-700">
                <Ticket size={18} /> Travel Ticket Listing
              </h2>
              <p className="text-xs text-ink-soft">Post transferable bus, train, or flight tickets for fellow students</p>
            </div>
            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
              Transferable only
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">
                Ticket Title <span className="text-clay-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={set('title')}
                required
                placeholder="e.g. Delhi to Mumbai Rajdhani Express 2AC"
                className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Ticket Type <span className="text-clay-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TICKET_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, ticketType: t }))}
                      className={`rounded-md border py-2 text-xs font-medium transition ${
                        form.ticketType === t
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-line bg-paper/40 text-ink hover:bg-paper'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Travel Date <span className="text-clay-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.travelDate}
                  onChange={set('travelDate')}
                  required
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>
            </div>

            {/* Stations Route */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Boarding / Departure Location <span className="text-clay-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.departureLocation}
                  onChange={set('departureLocation')}
                  required
                  placeholder="e.g. New Delhi Railway Station (NDLS) / ISBT"
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Destination / Arrival Location <span className="text-clay-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.destinationLocation}
                  onChange={set('destinationLocation')}
                  required
                  placeholder="e.g. Mumbai Central (MMCT) / Panaji Bus Stand"
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>
            </div>

            {/* Optional Times */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Departure Time (optional)</label>
                <input
                  type="text"
                  value={form.departureTime}
                  onChange={set('departureTime')}
                  placeholder="e.g. 16:55 or 04:55 PM"
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Arrival Time (optional)</label>
                <input
                  type="text"
                  value={form.arrivalTime}
                  onChange={set('arrivalTime')}
                  placeholder="e.g. 08:35 or 08:35 AM"
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Tickets Available <span className="text-clay-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.ticketQuantity}
                  onChange={set('ticketQuantity')}
                  required
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Ticket Price (₹) <span className="text-clay-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.price}
                  onChange={set('price')}
                  required
                  placeholder="e.g. 1250"
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Original Face Value Price (₹, optional)</label>
                <input
                  type="number"
                  value={form.originalPrice}
                  onChange={set('originalPrice')}
                  placeholder="e.g. 1550"
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">
                Additional Travel Information & Instructions
              </label>
              <textarea
                value={form.description}
                onChange={set('description')}
                rows={3}
                placeholder="Mention coach/berth type, confirmation status, baggage allowances, passenger transfer rules, or contact timings…"
                className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
              />
            </div>

            {/* Ticket Photo / Document Preview */}
            <div>
              <p className="text-xs font-medium text-ink-soft mb-1">Ticket Proof or Booking Screenshot (optional)</p>
              <p className="text-[11px] text-ink-soft/80 mb-2">
                Tip: Redact or blur out private Aadhaar numbers, personal phone numbers, or credit card digits before uploading.
              </p>

              {form.images.length > 0 && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 mb-3">
                  {form.images.map((img) => (
                    <div key={img} className="group relative aspect-square overflow-hidden rounded-md border border-line bg-paper">
                      <img src={img} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(img)}
                        className="absolute right-1 top-1 rounded-full bg-ink/75 p-1 text-paper hover:bg-ink"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {form.images.length < 3 && (
                <label className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center cursor-pointer ${uploading ? 'opacity-50' : 'border-line hover:border-blue-500'}`}>
                  {uploading ? (
                    <div className="flex items-center gap-2 text-xs text-ink-soft">
                      <Loader2 size={16} className="animate-spin" /> Uploading image…
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-ink-soft">
                      <Upload size={16} className="text-blue-600" />
                      <span>Upload ticket / booking screenshot (PNG, JPG up to 10MB)</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" disabled={uploading} onChange={handleFileChange} className="hidden" />
                </label>
              )}
            </div>

            {/* Safety Warning */}
            <div className="rounded-lg border border-mustard-300 bg-mustard-50/70 p-3.5 text-xs text-ink space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-mustard-800">
                <AlertTriangle size={15} />
                <span>Ticket Transfer & Verification Guidelines</span>
              </div>
              <p className="text-ink-soft">
                CampusBazaar does not issue tickets or guarantee carriage. Only list transferable tickets where authorized by carrier rules.
                Buyers must independently verify ticket validity before transferring payment.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-line">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              {submitting ? 'Publishing Ticket…' : 'Publish Ticket Listing'}
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* 2. DEDICATED RENT / ACCOMMODATION FORM                    */}
      {/* ======================================================== */}
      {isProperty && (
        <form onSubmit={handlePublishProperty} className="mt-6 space-y-6 rounded-xl border border-line bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h2 className="font-display text-lg font-semibold flex items-center gap-2 text-emerald-800">
                <Home size={18} /> Room & Property Rental Listing
              </h2>
              <p className="text-xs text-ink-soft">List student rooms, flatshares, 1 BHK/2 BHK rentals near campus</p>
            </div>
            <span className="rounded bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              Accommodation
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">
                Property Title <span className="text-clay-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={set('title')}
                required
                placeholder="e.g. Spacious 2 BHK Flat near North Campus Arts Faculty"
                className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Property Type <span className="text-clay-500">*</span>
                </label>
                <select
                  value={form.propertyType}
                  onChange={set('propertyType')}
                  required
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                >
                  {PROPERTY_TYPES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Monthly Rent (₹) <span className="text-clay-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.rentalPrice}
                  onChange={set('rentalPrice')}
                  required
                  placeholder="e.g. 8500"
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>
            </div>

            {/* Address & Locality */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-ink-soft">Full Address (optional for public)</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={set('address')}
                  placeholder="e.g. Flat 302, Green Park Apartments, Lane 4"
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Locality / Area <span className="text-clay-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.locality}
                  onChange={set('locality')}
                  required
                  placeholder="e.g. Kamla Nagar / Hudson Lane"
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  City <span className="text-clay-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={set('city')}
                  required
                  placeholder="e.g. Delhi, Mumbai, Bengaluru"
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Campus Proximity</label>
                <input
                  type="text"
                  value={form.campus}
                  onChange={set('campus')}
                  placeholder="e.g. 5 mins walk to North Campus"
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Security Deposit (₹, optional)</label>
                <input
                  type="number"
                  value={form.securityDeposit}
                  onChange={set('securityDeposit')}
                  placeholder="e.g. 8500"
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>
            </div>

            {/* Specifications */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Bedrooms</label>
                <input
                  type="number"
                  min="1"
                  value={form.bedrooms}
                  onChange={set('bedrooms')}
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Bathrooms</label>
                <input
                  type="number"
                  min="1"
                  value={form.bathrooms}
                  onChange={set('bathrooms')}
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Furnishing Status</label>
                <select
                  value={form.furnishing}
                  onChange={set('furnishing')}
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                >
                  {FURNISHING_TYPES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Available From</label>
                <input
                  type="date"
                  value={form.availableFrom}
                  onChange={set('availableFrom')}
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>
            </div>

            {/* Contact info */}
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">
                Landlord / Flatmate Contact Information <span className="text-clay-500">*</span>
              </label>
              <input
                type="text"
                value={form.contactInfo}
                onChange={set('contactInfo')}
                required
                placeholder="e.g. Call or WhatsApp: +91 98765 43210 (Mr. Sharma) or visiting hours: 4 PM - 8 PM"
                className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">
                Property Description & Amenities <span className="text-clay-500">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={set('description')}
                rows={4}
                required
                placeholder="Describe room dimensions, Wi-Fi speed, power backup, kitchen/mess facility, water purifier, restrictions, and nearby metro station…"
                className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
              />
            </div>

            {/* Room Images Upload Gallery */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-ink">Room & Property Photos</p>
                <span className="text-xs text-ink-soft">Up to 5 photos (max 10MB each)</span>
              </div>
              <p className="text-xs text-ink-soft mb-3">Upload clear photos of bedrooms, washrooms, and common areas.</p>

              {form.images.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 mb-3">
                  {form.images.map((img, idx) => (
                    <div key={img} className="group relative aspect-square overflow-hidden rounded-md border border-line bg-paper">
                      <img src={img} alt={`Room ${idx + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(img)}
                        className="absolute right-1 top-1 rounded-full bg-ink/75 p-1 text-paper hover:bg-ink"
                      >
                        <X size={13} />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 rounded bg-ink/80 px-1.5 py-0.5 text-[9px] text-white">
                          Cover
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {form.images.length < 5 && (
                <label className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-5 text-center cursor-pointer ${uploading ? 'opacity-50' : 'border-line hover:border-emerald-600'}`}>
                  {uploading ? (
                    <div className="flex items-center gap-2 text-xs text-ink-soft">
                      <Loader2 size={18} className="animate-spin text-emerald-600" /> Uploading room photos…
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-xs text-ink-soft">
                      <Upload size={20} className="text-emerald-700" />
                      <span className="font-medium text-ink">Select multiple property photos</span>
                      <span className="text-[11px]">PNG, JPG, WEBP up to 10MB</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" multiple disabled={uploading} onChange={handleFileChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-line">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-full bg-emerald-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60 transition"
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              {submitting ? 'Publishing Property…' : 'Publish Property Listing'}
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* 3. STANDARD GENERAL PRODUCT WIZARD FORM                   */}
      {/* ======================================================== */}
      {!isTicket && !isProperty && (
        <div className="mt-6">
          <ol className="flex items-center gap-2 text-xs">
            {STEPS.map((s, i) => (
              <li
                key={s}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 ${
                  i === step
                    ? 'bg-ink text-paper'
                    : i < step
                    ? 'bg-bazaar-50 text-bazaar-600'
                    : 'bg-white text-ink-soft border border-line'
                }`}
              >
                {i < step ? <Check size={12} /> : null} {s}
              </li>
            ))}
          </ol>

          <div className="mt-6 rounded-xl border border-line bg-white p-6 shadow-xs">
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">Item Title</label>
                  <input
                    value={form.title}
                    onChange={set('title')}
                    placeholder="e.g. Casio FX-991ES Scientific Calculator"
                    className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">Category</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                  >
                    <option value="">Select a category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">Listing Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['sell', 'rent', 'exchange'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, listingType: t }))}
                        className={`rounded-md border py-2 text-sm capitalize transition ${
                          form.listingType === t ? 'border-ink bg-ink text-paper' : 'border-line hover:bg-paper'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">Campus Location</label>
                  <input
                    value={form.campus}
                    onChange={set('campus')}
                    placeholder="e.g. North Campus, Hostel Block C"
                    className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">Condition</label>
                  <select
                    value={form.condition}
                    onChange={set('condition')}
                    className="w-full rounded-md border border-line px-3 py-2 text-sm capitalize focus:border-ink focus:outline-none"
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {form.listingType === 'sell' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-ink-soft">Asking Price (₹)</label>
                      <input
                        type="number"
                        value={form.price}
                        onChange={set('price')}
                        className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-ink-soft">Original Retail Price (₹)</label>
                      <input
                        type="number"
                        value={form.originalPrice}
                        onChange={set('originalPrice')}
                        className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {form.listingType === 'rent' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-ink-soft">Rental Price (₹)</label>
                      <input
                        type="number"
                        value={form.rentalPrice}
                        onChange={set('rentalPrice')}
                        className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-ink-soft">Period</label>
                      <select
                        value={form.rentalPeriod}
                        onChange={set('rentalPeriod')}
                        className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                      >
                        <option value="per-day">Per day</option>
                        <option value="per-week">Per week</option>
                        <option value="per-month">Per month</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="mb-1 block text-xs font-medium text-ink-soft">Security Deposit (₹, optional)</label>
                      <input
                        type="number"
                        value={form.securityDeposit}
                        onChange={set('securityDeposit')}
                        className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {form.listingType === 'exchange' && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink-soft">What would you like in exchange?</label>
                    <input
                      value={form.exchangeFor}
                      onChange={set('exchangeFor')}
                      className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                      placeholder="e.g. Scientific calculator or DSA Textbook"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">Purchase Year (optional)</label>
                  <input
                    type="number"
                    value={form.purchaseYear}
                    onChange={set('purchaseYear')}
                    className="w-36 rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">Description</label>
                  <textarea
                    value={form.description}
                    onChange={set('description')}
                    rows={4}
                    className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                    placeholder="Describe item condition, accessories included, reason for selling…"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Upload photos</p>
                  <p className="mt-0.5 text-xs text-ink-soft">Add at least 1 image of your item. (Max 5 photos, up to 10MB each)</p>
                </div>

                {form.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {form.images.map((img, idx) => (
                      <div key={img} className="group relative aspect-square overflow-hidden rounded-md border border-line bg-paper">
                        <img src={img} alt={`Upload ${idx + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(img)}
                          className="absolute right-1 top-1 rounded-full bg-ink/75 p-1 text-paper hover:bg-ink"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {form.images.length < 5 && (
                  <label className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center cursor-pointer ${uploading ? 'opacity-50' : 'border-line hover:border-bazaar-500'}`}>
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2 text-ink-soft">
                        <Loader2 className="animate-spin" size={24} />
                        <span className="text-xs font-medium">Uploading photo…</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-ink-soft">
                        <Upload size={24} className="text-bazaar-600" />
                        <span className="text-xs font-medium text-ink">Click to select photos</span>
                        <span className="text-[11px] text-ink-soft">PNG, JPG, WEBP up to 10MB</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" multiple disabled={uploading} onChange={handleFileChange} className="hidden" />
                  </label>
                )}
                {uploadError && <p className="text-xs text-clay-500">{uploadError}</p>}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Improve your description</p>
                    <button
                      type="button"
                      onClick={improveDescription}
                      className="flex items-center gap-1 text-xs font-medium text-bazaar-600 hover:text-bazaar-700"
                    >
                      <Sparkles size={13} /> Clean up wording with AI
                    </button>
                  </div>
                  <textarea
                    value={form.description}
                    onChange={set('description')}
                    rows={4}
                    className="mt-2 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-ink-soft">AI only tightens your wording - it never adds facts or claims you didn't write.</p>
                </div>

                {form.listingType === 'sell' && (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">AI Price Intelligence</p>
                      <button
                        type="button"
                        onClick={runPriceCheck}
                        className="flex items-center gap-1 text-xs font-medium text-bazaar-600 hover:text-bazaar-700"
                      >
                        <Sparkles size={13} /> Check my price
                      </button>
                    </div>
                    {analysis && (
                      <div className="mt-2 rounded-md bg-paper p-3 text-sm">
                        {analysis.status === 'insufficient_data' ? (
                          <p className="text-ink-soft">{analysis.message}</p>
                        ) : (
                          <>
                            <div className="mb-1"><DealBadge classification={analysis.classification} /></div>
                            <p className="text-ink-soft text-xs">
                              Similar listings: ₹{analysis.fairPriceRange.low.toLocaleString('en-IN')}–₹{analysis.fairPriceRange.high.toLocaleString('en-IN')} (from {analysis.sampleSize} comparable campus listings)
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold">Preview your listing</p>
                  <p className="text-xs text-ink-soft">This is how your listing will appear to buyers on CampusBazaar.</p>
                </div>

                <div className="overflow-hidden rounded-xl border border-line bg-white shadow-xs">
                  {/* Cover Image */}
                  {form.images.length > 0 ? (
                    <div className="relative aspect-video w-full overflow-hidden bg-paper">
                      <img src={form.images[0]} alt="Cover" className="h-full w-full object-cover" />
                      {form.images.length > 1 && (
                        <span className="absolute bottom-2 right-2 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-medium text-paper">
                          +{form.images.length - 1} more
                        </span>
                      )}
                      <div className="absolute top-2 left-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                          form.listingType === 'sell' ? 'bg-bazaar-500 text-paper' :
                          form.listingType === 'rent' ? 'bg-emerald-700 text-paper' :
                          'bg-mustard-400 text-ink'
                        }`}>
                          {form.listingType === 'sell' ? 'For Sale' : form.listingType === 'rent' ? 'For Rent' : 'Exchange'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center bg-paper/60 text-ink-soft">
                      <p className="text-xs">No photos added</p>
                    </div>
                  )}

                  {/* Listing Details */}
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="font-display text-lg font-semibold text-ink leading-tight">{form.title || 'Untitled listing'}</p>
                      <p className="mt-0.5 text-xs text-ink-soft capitalize">{form.condition} condition{form.campus ? ` · ${form.campus}` : ''}</p>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-2">
                      {form.listingType === 'sell' && form.price && (
                        <>
                          <span className="font-display text-2xl font-bold text-bazaar-600">
                            ₹{Number(form.price).toLocaleString('en-IN')}
                          </span>
                          {form.originalPrice && Number(form.originalPrice) > Number(form.price) && (
                            <span className="text-sm text-ink-soft line-through">
                              ₹{Number(form.originalPrice).toLocaleString('en-IN')}
                            </span>
                          )}
                          {form.originalPrice && Number(form.originalPrice) > Number(form.price) && (
                            <span className="rounded bg-bazaar-50 px-1.5 py-0.5 text-xs font-semibold text-bazaar-600">
                              {Math.round((1 - Number(form.price) / Number(form.originalPrice)) * 100)}% off
                            </span>
                          )}
                        </>
                      )}
                      {form.listingType === 'rent' && form.rentalPrice && (
                        <span className="font-display text-2xl font-bold text-emerald-700">
                          ₹{Number(form.rentalPrice).toLocaleString('en-IN')}
                          <span className="text-base font-medium text-ink-soft ml-1">{form.rentalPeriod.replace('per-', '/ ')}</span>
                        </span>
                      )}
                      {form.listingType === 'exchange' && (
                        <span className="font-display text-lg font-bold text-mustard-600">Exchange Only</span>
                      )}
                    </div>

                    {form.listingType === 'exchange' && form.exchangeFor && (
                      <p className="rounded-md border border-line bg-paper/60 px-3 py-2 text-sm text-ink-soft">
                        <span className="font-medium text-ink">Looking for: </span>{form.exchangeFor}
                      </p>
                    )}

                    {form.listingType === 'rent' && form.securityDeposit && (
                      <p className="text-xs text-ink-soft">
                        Security deposit: <span className="font-medium text-ink">₹{Number(form.securityDeposit).toLocaleString('en-IN')}</span>
                      </p>
                    )}

                    {/* Description */}
                    {form.description && (
                      <div className="border-t border-line pt-3">
                        <p className="text-xs font-semibold text-ink-soft mb-1">Description</p>
                        <p className="text-sm text-ink leading-relaxed whitespace-pre-line">{form.description}</p>
                      </div>
                    )}

                    {/* Image thumbnails row */}
                    {form.images.length > 1 && (
                      <div className="border-t border-line pt-3">
                        <p className="text-xs font-semibold text-ink-soft mb-2">All Photos ({form.images.length})</p>
                        <div className="flex gap-2 overflow-x-auto">
                          {form.images.map((img, idx) => (
                            <img key={idx} src={img} alt={`Photo ${idx + 1}`} className="h-16 w-16 flex-shrink-0 rounded-md object-cover border border-line" />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t border-line pt-3 flex items-center gap-2 text-xs text-ink-soft">
                      <span className="rounded-full bg-paper border border-line px-2.5 py-1 font-medium text-ink">{form.condition}</span>
                      {form.purchaseYear && <span>Purchased in {form.purchaseYear}</span>}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-center text-ink-soft">
                  Ready to go live? Click <span className="font-semibold text-bazaar-600">Publish listing</span> to make it visible to campus buyers.
                </p>
              </div>
            )}

          </div>

          <div className="mt-4 flex justify-between">
            <button
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
              className="rounded-full border border-line px-4 py-2 text-sm font-medium disabled:opacity-40"
            >
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                disabled={!canNextGeneral[step]}
                onClick={() => setStep((s) => s + 1)}
                className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper disabled:opacity-40"
              >
                Continue
              </button>
            ) : (
              <button
                disabled={submitting}
                onClick={handlePublishProduct}
                className="rounded-full bg-bazaar-500 px-5 py-2 text-sm font-medium text-paper hover:bg-bazaar-600 disabled:opacity-60"
              >
                {submitting ? 'Publishing…' : 'Publish listing'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
