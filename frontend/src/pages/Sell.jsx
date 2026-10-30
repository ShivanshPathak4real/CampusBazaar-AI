import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Check, Upload, X, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { DealBadge } from '../components/Bits';

const STEPS = ['Basics', 'Details', 'Images', 'AI assist', 'Preview'];
const CONDITIONS = ['new', 'like-new', 'good', 'fair', 'worn'];

export default function Sell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '', categoryId: '', listingType: 'sell', condition: 'good',
    description: '', price: '', rentalPrice: '', rentalPeriod: 'per-week',
    securityDeposit: '', originalPrice: '', purchaseYear: '', exchangeFor: '',
    campus: user?.campus || '', images: [],
  });

  useEffect(() => { api.get('/categories').then((r) => setCategories(r.categories)); }, []);

  function set(key) { return (e) => setForm((f) => ({ ...f, [key]: e.target.value })); }

  async function handleFileChange(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setUploadError('');
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));

    try {
      const res = await api.upload('/listings/upload-images', formData);
      setForm((f) => ({ ...f, images: [...f.images, ...res.urls] }));
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
      categoryId: form.categoryId, condition: form.condition, price: Number(form.price) || undefined,
    });
    setAnalysis(res.analysis);
  }

  async function improveDescription() {
    const res = await api.post('/ai/improve-description', { description: form.description });
    setForm((f) => ({ ...f, description: res.improved }));
  }

  async function handlePublish() {
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/listings', {
        ...form,
        price: form.listingType === 'sell' ? Number(form.price) : undefined,
        rentalPrice: form.listingType === 'rent' ? Number(form.rentalPrice) : undefined,
        securityDeposit: form.securityDeposit ? Number(form.securityDeposit) : undefined,
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        purchaseYear: form.purchaseYear ? Number(form.purchaseYear) : undefined,
      });
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
        <p className="mt-2 text-sm text-ink-soft">You'll need an account to sell, rent, or exchange on CampusBazaar.</p>
      </div>
    );
  }

  const canNext = [
    !!form.title && !!form.categoryId,
    !!form.condition && !!form.description && (form.listingType !== 'sell' || !!form.price) && (form.listingType !== 'rent' || !!form.rentalPrice),
    form.images.length > 0,
    true,
    true,
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-semibold">List an item</h1>

      <ol className="mt-6 flex items-center gap-2 text-xs">
        {STEPS.map((s, i) => (
          <li key={s} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 ${i === step ? 'bg-ink text-paper' : i < step ? 'bg-bazaar-50 text-bazaar-600' : 'bg-white text-ink-soft'}`}>
            {i < step ? <Check size={12} /> : null} {s}
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-lg border border-line bg-white p-6">
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">Title</label>
              <input value={form.title} onChange={set('title')} placeholder="e.g. Casio FX-991ES Scientific Calculator" className="w-full rounded-md border border-line px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">Category</label>
              <select value={form.categoryId} onChange={set('categoryId')} className="w-full rounded-md border border-line px-3 py-2 text-sm">
                <option value="">Select a category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">I want to</label>
              <div className="grid grid-cols-3 gap-2">
                {['sell', 'rent', 'exchange'].map((t) => (
                  <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, listingType: t }))} className={`rounded-md border py-2 text-sm capitalize ${form.listingType === t ? 'border-ink bg-ink text-paper' : 'border-line'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">Campus / location</label>
              <input value={form.campus} onChange={set('campus')} placeholder="North Campus" className="w-full rounded-md border border-line px-3 py-2 text-sm" />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">Condition</label>
              <select value={form.condition} onChange={set('condition')} className="w-full rounded-md border border-line px-3 py-2 text-sm capitalize">
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {form.listingType === 'sell' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">Asking price (₹)</label>
                  <input type="number" value={form.price} onChange={set('price')} className="w-full rounded-md border border-line px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">Original price (₹)</label>
                  <input type="number" value={form.originalPrice} onChange={set('originalPrice')} className="w-full rounded-md border border-line px-3 py-2 text-sm" />
                </div>
              </div>
            )}

            {form.listingType === 'rent' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">Rental price (₹)</label>
                  <input type="number" value={form.rentalPrice} onChange={set('rentalPrice')} className="w-full rounded-md border border-line px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">Period</label>
                  <select value={form.rentalPeriod} onChange={set('rentalPeriod')} className="w-full rounded-md border border-line px-3 py-2 text-sm">
                    <option value="per-day">Per day</option>
                    <option value="per-week">Per week</option>
                    <option value="per-month">Per month</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-ink-soft">Security deposit (₹, optional)</label>
                  <input type="number" value={form.securityDeposit} onChange={set('securityDeposit')} className="w-full rounded-md border border-line px-3 py-2 text-sm" />
                </div>
              </div>
            )}

            {form.listingType === 'exchange' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">What would you like in exchange?</label>
                <input value={form.exchangeFor} onChange={set('exchangeFor')} className="w-full rounded-md border border-line px-3 py-2 text-sm" placeholder="e.g. Scientific calculator" />
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">Purchase year (optional)</label>
              <input type="number" value={form.purchaseYear} onChange={set('purchaseYear')} className="w-32 rounded-md border border-line px-3 py-2 text-sm" />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">Description</label>
              <textarea value={form.description} onChange={set('description')} rows={4} className="w-full rounded-md border border-line px-3 py-2 text-sm" placeholder="Describe the item's condition, accessories included, reason for selling…" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Upload photos</p>
              <p className="mt-0.5 text-xs text-ink-soft">
                Add at least 1 image of your item. (Max 5 photos, up to 10MB each)
              </p>
            </div>

            {form.images.length > 0 && (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {form.images.map((img, idx) => (
                  <div key={img} className="group relative aspect-square overflow-hidden rounded-md border border-line bg-paper">
                    <img src={img} alt={`Uploaded photo ${idx + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(img)}
                      className="absolute right-1 top-1 rounded-full bg-ink/75 p-1 text-paper hover:bg-ink"
                      title="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {form.images.length < 5 && (
              <div>
                <label className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition cursor-pointer ${uploading ? 'border-line bg-paper opacity-50 cursor-not-allowed' : 'border-line hover:border-bazaar-500 hover:bg-bazaar-50/50'}`}>
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2 text-ink-soft">
                      <Loader2 className="animate-spin" size={24} />
                      <span className="text-xs font-medium">Uploading to Cloudinary…</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-ink-soft">
                      <Upload size={24} className="text-bazaar-600" />
                      <span className="text-xs font-medium text-ink">
                        Click to select photos
                      </span>
                      <span className="text-[11px] text-ink-soft">PNG, JPG, WEBP up to 10MB</span>
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
              </div>
            )}

            {uploadError && (
              <p className="text-xs text-clay-500">{uploadError}</p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Improve your description</p>
                <button onClick={improveDescription} className="flex items-center gap-1 text-xs font-medium text-bazaar-600"><Sparkles size={13} /> Clean up wording</button>
              </div>
              <textarea value={form.description} onChange={set('description')} rows={4} className="mt-2 w-full rounded-md border border-line px-3 py-2 text-sm" />
              <p className="mt-1 text-xs text-ink-soft">AI only tightens your wording - it never adds brand, condition, or feature claims you didn't write.</p>
            </div>

            {form.listingType === 'sell' && (
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Price check</p>
                  <button onClick={runPriceCheck} className="flex items-center gap-1 text-xs font-medium text-bazaar-600"><Sparkles size={13} /> Check my price</button>
                </div>
                {analysis && (
                  <div className="mt-2 rounded-md bg-paper p-3 text-sm">
                    {analysis.status === 'insufficient_data' ? (
                      <p className="text-ink-soft">{analysis.message}</p>
                    ) : (
                      <>
                        <div className="mb-1"><DealBadge classification={analysis.classification} /></div>
                        <p className="text-ink-soft">
                          Similar listings: ₹{analysis.fairPriceRange.low.toLocaleString('en-IN')}–₹{analysis.fairPriceRange.high.toLocaleString('en-IN')} (from {analysis.sampleSize} comparable listings)
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
          <div>
            <p className="text-sm font-medium">Preview</p>
            <div className="mt-3 overflow-hidden rounded-lg border border-line">
              {form.images[0] && <img src={form.images[0]} alt="" className="aspect-video w-full object-cover" />}
              <div className="p-4">
                <p className="font-display text-lg font-semibold">{form.title || 'Untitled listing'}</p>
                <p className="text-bazaar-600 font-display font-semibold">
                  {form.listingType === 'sell' && form.price && `₹${Number(form.price).toLocaleString('en-IN')}`}
                  {form.listingType === 'rent' && form.rentalPrice && `₹${Number(form.rentalPrice).toLocaleString('en-IN')} ${form.rentalPeriod.replace('per-', '/ ')}`}
                  {form.listingType === 'exchange' && 'Exchange only'}
                </p>
                <p className="mt-2 text-sm text-ink-soft">{form.description}</p>
              </div>
            </div>
            {error && <p className="mt-3 text-sm text-clay-500">{error}</p>}
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-between">
        <button disabled={step === 0} onClick={() => setStep((s) => s - 1)} className="rounded-full border border-line px-4 py-2 text-sm font-medium disabled:opacity-40">
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button disabled={!canNext[step]} onClick={() => setStep((s) => s + 1)} className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper disabled:opacity-40">
            Continue
          </button>
        ) : (
          <button disabled={submitting} onClick={handlePublish} className="rounded-full bg-bazaar-500 px-5 py-2 text-sm font-medium text-paper hover:bg-bazaar-600 disabled:opacity-60">
            {submitting ? 'Publishing…' : 'Publish listing'}
          </button>
        )}
      </div>
    </div>
  );
}
