import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Sparkles, Upload, X, Loader2, ArrowLeft, AlertCircle, CheckCircle2,
  Ticket, Home, Package, AlertTriangle, Calendar, Clock, MapPin, Phone, Bed, Bath
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { DealBadge, Spinner } from '../../components/Bits';

const CONDITIONS = ['new', 'like-new', 'good', 'fair', 'worn'];
const STATUSES = ['active', 'sold', 'rented', 'draft'];
const TICKET_TYPES = ['Train Ticket', 'Bus Ticket', 'Flight Ticket', 'Other'];
const PROPERTY_TYPES = ['Single Room', 'Shared Room', '1 BHK', '2 BHK', '3 BHK', 'Other'];
const FURNISHING_TYPES = ['Furnished', 'Semi-furnished', 'Unfurnished'];

export default function EditListing() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('general');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [analyzingPrice, setAnalyzingPrice] = useState(false);
  const [improvingDesc, setImprovingDesc] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [unauthorized, setUnauthorized] = useState(false);

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
    campus: '',
    status: 'active',
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
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError('');

        const [catRes, listRes] = await Promise.all([
          api.get('/categories'),
          api.get(`/listings/${id}`),
        ]);

        if (!isMounted) return;

        const cats = catRes.categories || [];
        setCategories(cats);

        const l = listRes.listing;
        if (!l) {
          setError('Listing not found');
          return;
        }

        // Authorization check: only seller or admin can edit
        if (user && l.seller?.id && l.seller.id !== user.id && user.role !== 'admin') {
          setUnauthorized(true);
          return;
        }

        // Determine category mode
        let detectedMode = 'general';
        if (l.categorySlug === 'travel-tickets' || l.ticketType) {
          detectedMode = 'travel-tickets';
        } else if (l.categorySlug === 'rent-accommodation' || l.propertyType) {
          detectedMode = 'rent-accommodation';
        }
        setSelectedCategorySlug(detectedMode);

        setForm({
          title: l.title || '',
          categoryId: l.categoryId || '',
          listingType: l.listingType || (detectedMode === 'rent-accommodation' ? 'rent' : 'sell'),
          condition: l.condition || 'good',
          description: l.description || '',
          price: l.price != null ? String(l.price) : '',
          rentalPrice: l.rentalPrice != null ? String(l.rentalPrice) : (l.price != null ? String(l.price) : ''),
          rentalPeriod: l.rentalPeriod || (detectedMode === 'rent-accommodation' ? 'per-month' : 'per-week'),
          securityDeposit: l.securityDeposit != null ? String(l.securityDeposit) : '',
          originalPrice: l.originalPrice != null ? String(l.originalPrice) : '',
          purchaseYear: l.purchaseYear != null ? String(l.purchaseYear) : '',
          exchangeFor: l.exchangeFor || '',
          campus: l.campus || user?.campus || '',
          status: l.status || 'active',
          images: Array.isArray(l.images) ? l.images : [],

          // Travel Tickets
          ticketType: l.ticketType || 'Train Ticket',
          travelDate: l.travelDate || '',
          departureLocation: l.departureLocation || '',
          destinationLocation: l.destinationLocation || '',
          departureTime: l.departureTime || '',
          arrivalTime: l.arrivalTime || '',
          ticketQuantity: l.ticketQuantity != null ? String(l.ticketQuantity) : '1',

          // Rental Property
          propertyType: l.propertyType || 'Single Room',
          locality: l.locality || '',
          city: l.city || 'Delhi',
          address: l.address || '',
          bedrooms: l.bedrooms != null ? String(l.bedrooms) : '1',
          bathrooms: l.bathrooms != null ? String(l.bathrooms) : '1',
          furnishing: l.furnishing || 'Furnished',
          availableFrom: l.availableFrom || '',
          contactInfo: l.contactInfo || '',
        });
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load listing');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (id) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [id, user]);

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function handleCategoryChange(catId) {
    const cat = categories.find((c) => c.id === catId);
    setForm((f) => ({ ...f, categoryId: catId }));
    if (cat?.slug === 'travel-tickets') {
      setSelectedCategorySlug('travel-tickets');
      setForm((f) => ({ ...f, listingType: 'sell' }));
    } else if (cat?.slug === 'rent-accommodation') {
      setSelectedCategorySlug('rent-accommodation');
      setForm((f) => ({ ...f, listingType: 'rent', rentalPeriod: 'per-month' }));
    } else {
      setSelectedCategorySlug('general');
    }
  }

  function handleModeTab(slug) {
    setSelectedCategorySlug(slug);
    const cat = categories.find((c) => c.slug === slug);
    if (cat) {
      setForm((f) => ({
        ...f,
        categoryId: cat.id,
        listingType: slug === 'rent-accommodation' ? 'rent' : f.listingType,
      }));
    } else if (slug === 'general') {
      const firstGen = categories.find(
        (c) => c.slug !== 'travel-tickets' && c.slug !== 'rent-accommodation'
      );
      if (firstGen) setForm((f) => ({ ...f, categoryId: firstGen.id }));
    }
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

  function handleAddImageUrl(e) {
    e.preventDefault();
    const url = newImageUrl.trim();
    if (!url) return;
    if (form.images.length >= 5) {
      setUploadError('Maximum 5 images allowed');
      return;
    }
    setForm((f) => ({ ...f, images: [...f.images, url] }));
    setNewImageUrl('');
    setUploadError('');
  }

  function removeImage(urlToRemove) {
    setForm((f) => ({
      ...f,
      images: f.images.filter((img) => img !== urlToRemove),
    }));
  }

  async function runPriceCheck() {
    if (!form.categoryId) {
      setError('Please select a category first to check pricing');
      return;
    }
    setAnalyzingPrice(true);
    try {
      const res = await api.post('/ai/price-check', {
        categoryId: form.categoryId,
        condition: form.condition,
        price: Number(form.price) || undefined,
        excludeListingId: id,
      });
      setAnalysis(res.analysis);
    } catch (err) {
      setError(err.message || 'Failed to check price');
    } finally {
      setAnalyzingPrice(false);
    }
  }

  async function improveDescription() {
    if (!form.description.trim()) {
      setError('Please enter a description first');
      return;
    }
    setImprovingDesc(true);
    try {
      const res = await api.post('/ai/improve-description', { description: form.description });
      setForm((f) => ({ ...f, description: res.improved }));
    } catch (err) {
      setError(err.message || 'Failed to improve description');
    } finally {
      setImprovingDesc(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Dynamic validations based on category mode
    if (selectedCategorySlug === 'travel-tickets') {
      if (!form.title.trim()) return setError('Ticket title is required');
      if (!form.ticketType) return setError('Please select a ticket type');
      if (!form.travelDate) return setError('Travel date is required');
      if (!form.departureLocation.trim()) return setError('Departure location / boarding station is required');
      if (!form.destinationLocation.trim()) return setError('Destination station / arrival location is required');
      const p = Number(form.price);
      if (!form.price || isNaN(p) || p <= 0) return setError('Ticket price must be greater than 0');
    } else if (selectedCategorySlug === 'rent-accommodation') {
      if (!form.title.trim()) return setError('Property title is required');
      if (!form.propertyType) return setError('Property type is required');
      const rp = Number(form.rentalPrice || form.price);
      if (!rp || rp <= 0) return setError('Monthly rent must be greater than 0');
      if (!form.locality.trim()) return setError('Locality / Area is required');
      if (!form.city.trim()) return setError('City is required');
      if (!form.contactInfo.trim()) return setError('Contact information is required for student inquiries');
      if (!form.description.trim()) return setError('Property description is required');
    } else {
      // General Product validations
      if (!form.title.trim()) return setError('Listing title is required');
      if (!form.categoryId) return setError('Please select a category');
      if (!form.description.trim()) return setError('Description is required');
      if (form.listingType === 'sell') {
        const p = Number(form.price);
        if (!form.price || isNaN(p) || p <= 0) {
          return setError('Please enter a valid selling price greater than 0');
        }
      }
      if (form.listingType === 'rent') {
        const rp = Number(form.rentalPrice);
        if (!form.rentalPrice || isNaN(rp) || rp <= 0) {
          return setError('Please enter a valid rental price greater than 0');
        }
      }
      if (form.listingType === 'exchange' && !form.exchangeFor.trim()) {
        return setError('Please specify what item you want in exchange');
      }
    }

    setSubmitting(true);
    try {
      let payload = {
        title: form.title.trim(),
        categoryId: form.categoryId,
        status: form.status,
        description: form.description.trim(),
        images: form.images,
        campus: form.campus.trim(),
      };

      if (selectedCategorySlug === 'travel-tickets') {
        const ticketCat = categories.find((c) => c.slug === 'travel-tickets');
        payload = {
          ...payload,
          categoryId: ticketCat?.id || form.categoryId,
          listingType: 'sell',
          condition: 'good',
          price: Number(form.price),
          originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
          ticketType: form.ticketType,
          travelDate: form.travelDate,
          departureLocation: form.departureLocation.trim(),
          destinationLocation: form.destinationLocation.trim(),
          departureTime: form.departureTime.trim(),
          arrivalTime: form.arrivalTime.trim(),
          ticketQuantity: Number(form.ticketQuantity) || 1,
        };
      } else if (selectedCategorySlug === 'rent-accommodation') {
        const propCat = categories.find((c) => c.slug === 'rent-accommodation');
        payload = {
          ...payload,
          categoryId: propCat?.id || form.categoryId,
          listingType: 'rent',
          condition: 'good',
          rentalPrice: Number(form.rentalPrice || form.price),
          rentalPeriod: 'per-month',
          securityDeposit: form.securityDeposit ? Number(form.securityDeposit) : null,
          propertyType: form.propertyType,
          locality: form.locality.trim(),
          city: form.city.trim(),
          address: form.address.trim(),
          bedrooms: Number(form.bedrooms) || 1,
          bathrooms: Number(form.bathrooms) || 1,
          furnishing: form.furnishing,
          availableFrom: form.availableFrom,
          contactInfo: form.contactInfo.trim(),
        };
      } else {
        // General product payload
        payload = {
          ...payload,
          listingType: form.listingType,
          condition: form.condition,
          price: form.listingType === 'sell' ? Number(form.price) : null,
          rentalPrice: form.listingType === 'rent' ? Number(form.rentalPrice) : null,
          rentalPeriod: form.listingType === 'rent' ? form.rentalPeriod : null,
          securityDeposit: form.securityDeposit ? Number(form.securityDeposit) : null,
          originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
          purchaseYear: form.purchaseYear ? Number(form.purchaseYear) : null,
          exchangeFor: form.listingType === 'exchange' ? form.exchangeFor.trim() : null,
        };
      }

      const res = await api.patch(`/listings/${id}`, payload);
      setSuccessMsg('Listing updated successfully!');

      setTimeout(() => {
        navigate(`/listing/${res.listing?.id || id}`);
      }, 900);
    } catch (err) {
      setError(err.message || 'Failed to update listing');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle size={36} className="mx-auto text-clay-500" />
        <h2 className="mt-3 font-display text-lg font-semibold text-ink">Unauthorized</h2>
        <p className="mt-1 text-sm text-ink-soft">
          You are not the owner of this listing and do not have permission to edit it.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Link
            to={`/listing/${id}`}
            className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:border-ink/40"
          >
            View listing
          </Link>
          <Link
            to="/dashboard/listings"
            className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper"
          >
            My listings
          </Link>
        </div>
      </div>
    );
  }

  if (error && !form.title) {
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-line bg-white p-6 text-center">
        <AlertCircle size={36} className="mx-auto text-clay-500" />
        <h2 className="mt-3 font-display text-lg font-semibold">Listing Error</h2>
        <p className="mt-1 text-sm text-ink-soft">{error}</p>
        <Link
          to="/dashboard/listings"
          className="mt-4 inline-block rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper"
        >
          Back to My Listings
        </Link>
      </div>
    );
  }

  const isTicket = selectedCategorySlug === 'travel-tickets';
  const isProperty = selectedCategorySlug === 'rent-accommodation';
  const isPastTravelDate = isTicket && form.travelDate && new Date(form.travelDate + 'T23:59:59') < new Date();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={`/listing/${id}`}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-ink-soft hover:text-ink"
            title="Back to listing"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-semibold">Edit Listing</h1>
            <p className="text-xs text-ink-soft">Update details, photos, pricing, and availability</p>
          </div>
        </div>

        <Link
          to={`/listing/${id}`}
          className="rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-medium hover:border-ink/40"
        >
          View public page
        </Link>
      </div>

      {/* Category Mode Switcher Tabs */}
      <div className="mb-5 flex flex-wrap gap-2 border-b border-line pb-4">
        <button
          type="button"
          onClick={() => handleModeTab('general')}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium transition ${
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
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium transition ${
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
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium transition ${
            isProperty
              ? 'bg-emerald-700 text-paper shadow-xs'
              : 'border border-line bg-white text-ink-soft hover:text-emerald-700 hover:border-emerald-300'
          }`}
        >
          <Home size={14} />
          <span>Room / Accommodation</span>
        </button>
      </div>

      {successMsg && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-bazaar-200 bg-bazaar-50 p-3.5 text-sm text-bazaar-700">
          <CheckCircle2 size={18} className="shrink-0 text-bazaar-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-clay-600">
          <AlertCircle size={18} className="shrink-0 text-clay-500" />
          <span>{error}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. TRAVEL TICKETS EDIT FORM                              */}
      {/* ======================================================== */}
      {isTicket && (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-line bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h2 className="font-display text-lg font-semibold flex items-center gap-2 text-blue-700">
                <Ticket size={18} /> Edit Travel Ticket
              </h2>
              <p className="text-xs text-ink-soft">Update route, travel date, seat count, and pricing</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={form.status}
                onChange={set('status')}
                className="rounded-md border border-line px-2.5 py-1 text-xs capitalize focus:border-ink focus:outline-none"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    Status: {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Past Date Warning */}
          {isPastTravelDate && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <AlertTriangle size={16} className="shrink-0 text-amber-600" />
              <span>
                <strong>Past Travel Date:</strong> This travel date ({form.travelDate}) has already passed. Please update the date or mark the listing as sold/draft.
              </span>
            </div>
          )}

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

            {/* Times & Quantity */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Departure Time (optional)</label>
                <input
                  type="text"
                  value={form.departureTime}
                  onChange={set('departureTime')}
                  placeholder="e.g. 16:55"
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Arrival Time (optional)</label>
                <input
                  type="text"
                  value={form.arrivalTime}
                  onChange={set('arrivalTime')}
                  placeholder="e.g. 08:35"
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Available Tickets</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={form.ticketQuantity}
                  onChange={set('ticketQuantity')}
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Asking Ticket Price (₹) <span className="text-clay-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.price}
                  onChange={set('price')}
                  required
                  placeholder="e.g. 1850"
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Original Ticket Price (₹, optional)</label>
                <input
                  type="number"
                  min="1"
                  value={form.originalPrice}
                  onChange={set('originalPrice')}
                  placeholder="e.g. 2150"
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>
            </div>

            {/* Instructions / Details */}
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">
                Travel Instructions & Seat / Coach Details
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={set('description')}
                placeholder="Coach number, berth type, ID requirement, transfer instructions..."
                className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
              />
            </div>

            {/* Image / Supporting Document */}
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">
                Ticket Confirmation or Supporting Photos (optional)
              </label>
              {form.images.length > 0 && (
                <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {form.images.map((img, idx) => (
                    <div key={idx} className="relative aspect-video overflow-hidden rounded-md border border-line bg-paper">
                      <img src={img} alt="Ticket preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(img)}
                        className="absolute right-1 top-1 rounded-full bg-ink/80 p-1 text-paper hover:bg-ink"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {form.images.length < 5 && (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-line p-4 text-center hover:border-blue-500 hover:bg-blue-50/30">
                  <Upload size={18} className="text-blue-600" />
                  <span className="mt-1 text-xs font-medium text-ink">Upload ticket screenshot or ID verification</span>
                  <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                </label>
              )}
            </div>

            {/* Transferability Advisory Notice */}
            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-700" /> Transferability & Carrier Policy Advisory
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
                Please verify that your ticket type permits traveler name changes, transfers, or endorsements per official carrier regulations (IRCTC, State Transport, or Airlines). CampusBazaar does not issue tickets or guarantee third-party carrier transferability. Buyers must independently verify ticket validity.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-line pt-4">
            <Link to={`/listing/${id}`} className="rounded-full border border-line px-5 py-2 text-sm font-medium hover:border-ink/40">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? 'Saving ticket…' : 'Save ticket changes'}
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* 2. ROOM & PROPERTY RENTALS EDIT FORM                     */}
      {/* ======================================================== */}
      {isProperty && (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-line bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h2 className="font-display text-lg font-semibold flex items-center gap-2 text-emerald-800">
                <Home size={18} /> Edit Property & Accommodation
              </h2>
              <p className="text-xs text-ink-soft">Update room rent, location, photos, furnishing, and contact details</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={form.status}
                onChange={set('status')}
                className="rounded-md border border-line px-2.5 py-1 text-xs capitalize focus:border-ink focus:outline-none"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    Status: {s}
                  </option>
                ))}
              </select>
            </div>
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
                placeholder="e.g. Spacious 1 BHK near North Campus Metro"
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
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Furnishing Status <span className="text-clay-500">*</span>
                </label>
                <select
                  value={form.furnishing}
                  onChange={set('furnishing')}
                  required
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                >
                  {FURNISHING_TYPES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rent & Deposit */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Security Deposit (₹, optional)</label>
                <input
                  type="number"
                  min="0"
                  value={form.securityDeposit}
                  onChange={set('securityDeposit')}
                  placeholder="e.g. 10000"
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>
            </div>

            {/* Location Specs */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Locality / Area <span className="text-clay-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.locality}
                  onChange={set('locality')}
                  required
                  placeholder="e.g. Vijay Nagar / Hudson Lane"
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  City <span className="text-clay-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={set('city')}
                  required
                  placeholder="e.g. Delhi"
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">Full Address (optional)</label>
              <input
                type="text"
                value={form.address}
                onChange={set('address')}
                placeholder="House/Flat number, Street name, Landmark"
                className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
              />
            </div>

            {/* Bedrooms, Bathrooms, Available From */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Bedrooms</label>
                <input
                  type="number"
                  min="1"
                  max="10"
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
                  max="10"
                  value={form.bathrooms}
                  onChange={set('bathrooms')}
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
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

            {/* Landlord Contact Info */}
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">
                Contact Phone / WhatsApp <span className="text-clay-500">*</span>
              </label>
              <input
                type="text"
                value={form.contactInfo}
                onChange={set('contactInfo')}
                required
                placeholder="e.g. +91 98765 43210 (Call / WhatsApp between 10am-7pm)"
                className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
              />
            </div>

            {/* Property Description */}
            <div>
              <div className="flex items-center justify-between">
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Property Description & Amenities <span className="text-clay-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={improveDescription}
                  disabled={improvingDesc}
                  className="flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800"
                >
                  <Sparkles size={13} />
                  {improvingDesc ? 'Improving…' : 'Clean up wording with AI'}
                </button>
              </div>
              <textarea
                rows={4}
                value={form.description}
                onChange={set('description')}
                required
                placeholder="Describe amenities (Wi-Fi, AC, RO water, power backup), distance to campus/metro, restrictions..."
                className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
              />
            </div>

            {/* Room Images Gallery */}
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">
                Room & Property Photos (up to 5 images)
              </label>

              {form.images.length > 0 && (
                <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {form.images.map((img, idx) => (
                    <div key={idx} className="group relative aspect-square overflow-hidden rounded-md border border-line bg-paper">
                      <img src={img} alt={`Room ${idx + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(img)}
                        className="absolute right-1.5 top-1.5 rounded-full bg-ink/80 p-1 text-paper hover:bg-ink shadow-xs"
                      >
                        <X size={13} />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-1.5 left-1.5 rounded bg-emerald-700 px-1.5 py-0.5 text-[10px] font-medium text-paper">
                          Cover
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {form.images.length < 5 && (
                <div className="space-y-2">
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-line p-5 text-center hover:border-emerald-600 hover:bg-emerald-50/30">
                    <Upload size={22} className="text-emerald-700" />
                    <span className="mt-1 text-xs font-medium text-ink">Click to upload photos of bedroom, kitchen, washroom</span>
                    <span className="text-[11px] text-ink-soft">JPG, PNG, WEBP up to 10MB</span>
                    <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="Or paste an image web URL..."
                      className="flex-1 rounded-md border border-line px-3 py-1.5 text-xs focus:border-ink focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="rounded-md border border-line bg-paper px-3 py-1.5 text-xs font-medium hover:border-ink/40"
                    >
                      Add URL
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-line pt-4">
            <Link to={`/listing/${id}`} className="rounded-full border border-line px-5 py-2 text-sm font-medium hover:border-ink/40">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-full bg-emerald-700 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? 'Saving property…' : 'Save property changes'}
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* 3. GENERAL PRODUCT EDIT FORM                             */}
      {/* ======================================================== */}
      {!isTicket && !isProperty && (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-line bg-white p-6 shadow-xs">
          {/* Section 1: Basic Info */}
          <div className="space-y-4">
            <h2 className="font-display text-base font-semibold border-b border-line pb-2">Basic Information</h2>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">
                Title <span className="text-clay-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={set('title')}
                required
                placeholder="e.g. Casio FX-991ES Scientific Calculator"
                className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Category <span className="text-clay-500">*</span>
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  required
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Listing Status</label>
                <select
                  value={form.status}
                  onChange={set('status')}
                  className="w-full rounded-md border border-line px-3 py-2 text-sm capitalize focus:border-ink focus:outline-none"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">Listing Type</label>
              <div className="grid grid-cols-3 gap-2">
                {['sell', 'rent', 'exchange'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, listingType: t }))}
                    className={`rounded-md border py-2 text-sm font-medium capitalize transition-colors ${
                      form.listingType === t
                        ? 'border-ink bg-ink text-paper'
                        : 'border-line bg-paper/50 text-ink hover:bg-paper'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">Campus / Location</label>
              <input
                type="text"
                value={form.campus}
                onChange={set('campus')}
                placeholder="e.g. North Campus, Hostel Block C"
                className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
              />
            </div>
          </div>

          {/* Section 2: Pricing & Details */}
          <div className="space-y-4">
            <h2 className="font-display text-base font-semibold border-b border-line pb-2">Pricing & Details</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Condition</label>
                <select
                  value={form.condition}
                  onChange={set('condition')}
                  className="w-full rounded-md border border-line px-3 py-2 text-sm capitalize focus:border-ink focus:outline-none"
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Purchase Year (optional)</label>
                <input
                  type="number"
                  value={form.purchaseYear}
                  onChange={set('purchaseYear')}
                  placeholder="e.g. 2023"
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>
            </div>

            {form.listingType === 'sell' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">
                    Asking Price (₹) <span className="text-clay-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={set('price')}
                    required
                    min="1"
                    placeholder="e.g. 450"
                    className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">Original Retail Price (₹, optional)</label>
                  <input
                    type="number"
                    value={form.originalPrice}
                    onChange={set('originalPrice')}
                    placeholder="e.g. 900"
                    className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                  />
                </div>
              </div>
            )}

            {form.listingType === 'rent' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">
                    Rental Price (₹) <span className="text-clay-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.rentalPrice}
                    onChange={set('rentalPrice')}
                    required
                    min="1"
                    placeholder="e.g. 50"
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

                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">Security Deposit (₹, optional)</label>
                  <input
                    type="number"
                    value={form.securityDeposit}
                    onChange={set('securityDeposit')}
                    placeholder="e.g. 200"
                    className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                  />
                </div>
              </div>
            )}

            {form.listingType === 'exchange' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  What item would you like in exchange? <span className="text-clay-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.exchangeFor}
                  onChange={set('exchangeFor')}
                  required
                  placeholder="e.g. Scientific calculator or Operating Systems textbook"
                  className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
                />
              </div>
            )}

            {/* AI Price Check Tool */}
            {form.listingType === 'sell' && (
              <div className="rounded-md border border-line bg-paper/40 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-ink">AI Price Intelligence</p>
                    <p className="text-[11px] text-ink-soft">Compare your asking price with similar campus listings</p>
                  </div>
                  <button
                    type="button"
                    onClick={runPriceCheck}
                    disabled={analyzingPrice}
                    className="flex items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1 text-xs font-medium text-bazaar-600 hover:border-bazaar-500"
                  >
                    <Sparkles size={12} />
                    {analyzingPrice ? 'Checking…' : 'Check fair price'}
                  </button>
                </div>

                {analysis && (
                  <div className="mt-2.5 rounded bg-white p-2.5 text-xs border border-line">
                    {analysis.status === 'insufficient_data' ? (
                      <p className="text-ink-soft">{analysis.message}</p>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <DealBadge classification={analysis.classification} />
                          <span className="text-ink-soft">
                            (based on {analysis.sampleSize} comparable campus listings)
                          </span>
                        </div>
                        <p className="text-ink-soft">
                          Fair market range: <span className="font-semibold text-ink">₹{analysis.fairPriceRange.low.toLocaleString('en-IN')} – ₹{analysis.fairPriceRange.high.toLocaleString('en-IN')}</span>
                        </p>
                        {analysis.negotiationRange && (
                          <p className="text-ink-soft">
                            Recommended negotiation range: ₹{analysis.negotiationRange.low.toLocaleString('en-IN')} – ₹{analysis.negotiationRange.high.toLocaleString('en-IN')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 3: Description */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <h2 className="font-display text-base font-semibold">Description</h2>
              <button
                type="button"
                onClick={improveDescription}
                disabled={improvingDesc}
                className="flex items-center gap-1 text-xs font-medium text-bazaar-600 hover:text-bazaar-700"
              >
                <Sparkles size={13} />
                {improvingDesc ? 'Improving…' : 'Clean up wording with AI'}
              </button>
            </div>

            <div>
              <textarea
                value={form.description}
                onChange={set('description')}
                rows={4}
                required
                placeholder="Describe condition, features, why you are selling, included accessories, etc."
                className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-ink focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-ink-soft">
                Be honest and clear. AI assists only with spelling and flow, never inventing facts.
              </p>
            </div>
          </div>

          {/* Section 4: Images */}
          <div className="space-y-4">
            <h2 className="font-display text-base font-semibold border-b border-line pb-2">Photos & Images</h2>
            <p className="text-xs text-ink-soft">
              Manage your photos (up to 5 images). High quality photos get 3x more interest from campus buyers.
            </p>

            {form.images.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {form.images.map((img, idx) => (
                  <div key={idx} className="group relative aspect-square overflow-hidden rounded-md border border-line bg-paper">
                    <img
                      src={img}
                      alt={`Photo ${idx + 1}`}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(img)}
                      className="absolute right-1.5 top-1.5 rounded-full bg-ink/80 p-1 text-paper hover:bg-ink shadow-xs"
                      title="Remove photo"
                    >
                      <X size={13} />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 rounded bg-ink/80 px-1.5 py-0.5 text-[10px] font-medium text-paper">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {form.images.length < 5 && (
              <div className="space-y-3">
                <label
                  className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-5 text-center transition cursor-pointer ${
                    uploading
                      ? 'border-line bg-paper opacity-60 cursor-not-allowed'
                      : 'border-line hover:border-bazaar-500 hover:bg-bazaar-50/40'
                  }`}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-1.5 text-ink-soft">
                      <Loader2 className="animate-spin text-bazaar-600" size={22} />
                      <span className="text-xs font-medium">Uploading photo…</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-ink-soft">
                      <Upload size={22} className="text-bazaar-600" />
                      <span className="text-xs font-medium text-ink">Click to upload photo from your device</span>
                      <span className="text-[11px] text-ink-soft">JPG, PNG, WEBP up to 10MB</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploading}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {/* URL add fallback */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Or paste an image web URL..."
                    className="flex-1 rounded-md border border-line px-3 py-1.5 text-xs focus:border-ink focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="rounded-md border border-line bg-paper px-3 py-1.5 text-xs font-medium hover:border-ink/40"
                  >
                    Add URL
                  </button>
                </div>
              </div>
            )}

            {uploadError && <p className="text-xs text-clay-500">{uploadError}</p>}
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-between border-t border-line pt-5">
            <Link
              to={`/listing/${id}`}
              className="rounded-full border border-line px-5 py-2 text-sm font-medium hover:border-ink/40"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="focus-ring flex items-center gap-2 rounded-full bg-bazaar-500 px-6 py-2 text-sm font-medium text-paper hover:bg-bazaar-600 disabled:opacity-60"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? 'Saving changes…' : 'Save changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
