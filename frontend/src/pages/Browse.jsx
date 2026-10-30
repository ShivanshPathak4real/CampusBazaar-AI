import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { api } from '../lib/api';
import ProductCard from '../components/ProductCard';
import { EmptyState, Spinner } from '../components/Bits';

const CONDITIONS = ['new', 'like-new', 'good', 'fair', 'worn'];

export default function Browse() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const listingType = params.get('listingType') || '';
  const condition = params.get('condition') || '';
  const sort = params.get('sort') || 'newest';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.categories));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (q) qs.set('q', q);
    if (category) qs.set('category', category);
    if (listingType) qs.set('listingType', listingType);
    if (condition) qs.set('condition', condition);
    if (minPrice) qs.set('minPrice', minPrice);
    if (maxPrice) qs.set('maxPrice', maxPrice);
    qs.set('sort', sort);
    qs.set('limit', '24');
    api
      .get(`/listings?${qs.toString()}`)
      .then((r) => { setListings(r.listings); setTotal(r.total); })
      .finally(() => setLoading(false));
  }, [q, category, listingType, condition, sort, minPrice, maxPrice]);

  useEffect(() => { load(); }, [load]);

  function updateParam(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next);
  }

  function toggleSave(id, saved) {
    setListings((ls) => ls.map((l) => (l.id === id ? { ...l, isSaved: saved } : l)));
  }

  const activeFilterCount = [category, listingType, condition, minPrice, maxPrice].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">
            {q ? `Results for "${q}"` : 'Browse the marketplace'}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">{loading ? 'Searching…' : `${total} listing${total === 1 ? '' : 's'}`}</p>
        </div>
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="focus-ring mt-3 flex items-center gap-2 self-start rounded-full border border-line bg-white px-4 py-2 text-sm font-medium sm:mt-0"
        >
          <SlidersHorizontal size={15} /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </button>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className={`${filtersOpen ? 'block' : 'hidden'} space-y-6 md:block`}>
          <div className="rounded-lg border border-line bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Filters</p>
              <button onClick={() => setFiltersOpen(false)} className="md:hidden"><X size={16} /></button>
            </div>

            <FilterGroup title="Category">
              <select value={category} onChange={(e) => updateParam('category', e.target.value)} className="w-full rounded-md border border-line px-2 py-1.5 text-sm">
                <option value="">All categories</option>
                {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
            </FilterGroup>

            <FilterGroup title="Listing type">
              <div className="space-y-1.5">
                {[['', 'All'], ['sell', 'Sell'], ['rent', 'Rent'], ['exchange', 'Exchange']].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2 text-sm">
                    <input type="radio" checked={listingType === val} onChange={() => updateParam('listingType', val)} />
                    {label}
                  </label>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup title="Condition">
              <select value={condition} onChange={(e) => updateParam('condition', e.target.value)} className="w-full rounded-md border border-line px-2 py-1.5 text-sm capitalize">
                <option value="">Any condition</option>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </FilterGroup>

            <FilterGroup title="Price range (₹)">
              <div className="flex items-center gap-2">
                <input value={minPrice} onChange={(e) => updateParam('minPrice', e.target.value)} placeholder="Min" type="number" className="w-full rounded-md border border-line px-2 py-1.5 text-sm" />
                <span className="text-ink-soft">–</span>
                <input value={maxPrice} onChange={(e) => updateParam('maxPrice', e.target.value)} placeholder="Max" type="number" className="w-full rounded-md border border-line px-2 py-1.5 text-sm" />
              </div>
            </FilterGroup>

            {activeFilterCount > 0 && (
              <button onClick={() => setParams(q ? { q } : {})} className="mt-2 text-sm font-medium text-clay-500">
                Clear filters
              </button>
            )}
          </div>
        </aside>

        <div>
          <div className="mb-4 flex justify-end">
            <select value={sort} onChange={(e) => updateParam('sort', e.target.value)} className="rounded-md border border-line px-2 py-1.5 text-sm">
              <option value="newest">Newest first</option>
              <option value="price_low">Price: low to high</option>
              <option value="price_high">Price: high to low</option>
              <option value="popular">Most popular</option>
            </select>
          </div>

          {loading ? (
            <Spinner />
          ) : listings.length === 0 ? (
            <EmptyState title="No listings match your filters" body="Try widening your search or clearing a filter." />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {listings.map((l) => <ProductCard key={l.id} listing={l} onToggleSave={toggleSave} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }) {
  return (
    <div className="border-t border-line py-3 first:border-t-0 first:pt-0">
      <p className="mb-2 text-xs font-semibold text-ink-soft">{title}</p>
      {children}
    </div>
  );
}
