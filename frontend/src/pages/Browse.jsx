import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, Ticket, Home, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import ProductCard from '../components/ProductCard';
import { EmptyState, Spinner } from '../components/Bits';

const CONDITIONS = ['new', 'like-new', 'good', 'fair', 'worn'];
const TICKET_TYPES = ['Train Ticket', 'Bus Ticket', 'Flight Ticket', 'Other'];
const PROPERTY_TYPES = ['Single Room', 'Shared Room', '1 BHK', '2 BHK', '3 BHK', 'Other'];
const FURNISHING_TYPES = ['Furnished', 'Semi-furnished', 'Unfurnished'];

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

  // Travel Ticket filters
  const ticketType = params.get('ticketType') || '';
  const destination = params.get('destination') || '';
  const travelDate = params.get('travelDate') || '';

  // Room / Property Rental filters
  const propertyType = params.get('propertyType') || '';
  const bedrooms = params.get('bedrooms') || '';
  const furnishing = params.get('furnishing') || '';
  const city = params.get('city') || '';

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.categories || []));
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

    // Dynamic category params
    if (ticketType) qs.set('ticketType', ticketType);
    if (destination) qs.set('destination', destination);
    if (travelDate) qs.set('travelDate', travelDate);

    if (propertyType) qs.set('propertyType', propertyType);
    if (bedrooms) qs.set('bedrooms', bedrooms);
    if (furnishing) qs.set('furnishing', furnishing);
    if (city) qs.set('city', city);

    qs.set('sort', sort);
    qs.set('limit', '24');

    api
      .get(`/listings?${qs.toString()}`)
      .then((r) => {
        setListings(r.listings || []);
        setTotal(r.total || 0);
      })
      .finally(() => setLoading(false));
  }, [
    q, category, listingType, condition, sort, minPrice, maxPrice,
    ticketType, destination, travelDate, propertyType, bedrooms, furnishing, city,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  function updateParam(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  function toggleSave(id, saved) {
    setListings((ls) => ls.map((l) => (l.id === id ? { ...l, isSaved: saved } : l)));
  }

  const isTicketCategory = category === 'travel-tickets';
  const isRentalCategory = category === 'rent-accommodation';

  const activeFilterCount = [
    category, listingType, condition, minPrice, maxPrice,
    ticketType, destination, travelDate, propertyType, bedrooms, furnishing, city,
  ].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold">
              {q
                ? `Results for "${q}"`
                : isTicketCategory
                ? 'Travel Tickets (Buy & Sell)'
                : isRentalCategory
                ? 'Room & Property Rentals'
                : 'Browse the marketplace'}
            </h1>
            {isTicketCategory && (
              <span className="flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                <Ticket size={12} /> Second-hand & Transferable
              </span>
            )}
            {isRentalCategory && (
              <span className="flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                <Home size={12} /> Student Accommodation
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            {loading ? 'Searching…' : `${total} listing${total === 1 ? '' : 's'}`}
          </p>
        </div>
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="focus-ring mt-3 flex items-center gap-2 self-start rounded-full border border-line bg-white px-4 py-2 text-sm font-medium sm:mt-0"
        >
          <SlidersHorizontal size={15} /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </button>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[240px_1fr]">
        <aside className={`${filtersOpen ? 'block' : 'hidden'} space-y-6 md:block`}>
          <div className="rounded-lg border border-line bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Filters</p>
              <button onClick={() => setFiltersOpen(false)} className="md:hidden">
                <X size={16} />
              </button>
            </div>

            <FilterGroup title="Category">
              <select
                value={category}
                onChange={(e) => {
                  const val = e.target.value;
                  const next = new URLSearchParams(params);
                  if (val) next.set('category', val);
                  else next.delete('category');
                  // Clear category-specific params when switching category
                  next.delete('ticketType');
                  next.delete('destination');
                  next.delete('travelDate');
                  next.delete('propertyType');
                  next.delete('bedrooms');
                  next.delete('furnishing');
                  next.delete('city');
                  setParams(next);
                }}
                className="w-full rounded-md border border-line px-2 py-1.5 text-sm"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FilterGroup>

            {/* DEDICATED TRAVEL TICKETS FILTERS */}
            {isTicketCategory && (
              <>
                <FilterGroup title="Ticket Type">
                  <select
                    value={ticketType}
                    onChange={(e) => updateParam('ticketType', e.target.value)}
                    className="w-full rounded-md border border-line px-2 py-1.5 text-sm"
                  >
                    <option value="">All Ticket Types</option>
                    {TICKET_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </FilterGroup>

                <FilterGroup title="Destination Station / City">
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => updateParam('destination', e.target.value)}
                    placeholder="e.g. Mumbai, Jaipur, NDLS"
                    className="w-full rounded-md border border-line px-2 py-1.5 text-sm"
                  />
                </FilterGroup>

                <FilterGroup title="Travel Date (On or after)">
                  <input
                    type="date"
                    value={travelDate}
                    onChange={(e) => updateParam('travelDate', e.target.value)}
                    className="w-full rounded-md border border-line px-2 py-1.5 text-sm"
                  />
                </FilterGroup>
              </>
            )}

            {/* DEDICATED ROOM / ACCOMMODATION FILTERS */}
            {isRentalCategory && (
              <>
                <FilterGroup title="Property Type">
                  <select
                    value={propertyType}
                    onChange={(e) => updateParam('propertyType', e.target.value)}
                    className="w-full rounded-md border border-line px-2 py-1.5 text-sm"
                  >
                    <option value="">All Room Types</option>
                    {PROPERTY_TYPES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </FilterGroup>

                <FilterGroup title="Furnishing">
                  <select
                    value={furnishing}
                    onChange={(e) => updateParam('furnishing', e.target.value)}
                    className="w-full rounded-md border border-line px-2 py-1.5 text-sm"
                  >
                    <option value="">Any Furnishing</option>
                    {FURNISHING_TYPES.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </FilterGroup>

                <FilterGroup title="Min Bedrooms">
                  <div className="flex gap-1.5">
                    {['', '1', '2', '3'].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => updateParam('bedrooms', b)}
                        className={`flex-1 rounded border py-1 text-xs font-medium transition ${
                          bedrooms === b
                            ? 'border-emerald-700 bg-emerald-700 text-white'
                            : 'border-line bg-paper/50 text-ink hover:bg-paper'
                        }`}
                      >
                        {b ? `${b}+ BHK` : 'Any'}
                      </button>
                    ))}
                  </div>
                </FilterGroup>

                <FilterGroup title="City / Locality">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => updateParam('city', e.target.value)}
                    placeholder="e.g. North Campus, Delhi"
                    className="w-full rounded-md border border-line px-2 py-1.5 text-sm"
                  />
                </FilterGroup>
              </>
            )}

            {/* Standard Listing Type Filter (for general categories) */}
            {!isTicketCategory && !isRentalCategory && (
              <FilterGroup title="Listing type">
                <div className="space-y-1.5">
                  {[
                    ['', 'All'],
                    ['sell', 'Sell'],
                    ['rent', 'Rent'],
                    ['exchange', 'Exchange'],
                  ].map(([val, label]) => (
                    <label key={val} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="listingTypeFilter"
                        checked={listingType === val}
                        onChange={() => updateParam('listingType', val)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </FilterGroup>
            )}

            {!isTicketCategory && (
              <FilterGroup title="Condition">
                <select
                  value={condition}
                  onChange={(e) => updateParam('condition', e.target.value)}
                  className="w-full rounded-md border border-line px-2 py-1.5 text-sm capitalize"
                >
                  <option value="">Any condition</option>
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </FilterGroup>
            )}

            <FilterGroup title={isRentalCategory ? 'Monthly Rent range (₹)' : 'Price range (₹)'}>
              <div className="flex items-center gap-2">
                <input
                  value={minPrice}
                  onChange={(e) => updateParam('minPrice', e.target.value)}
                  placeholder="Min"
                  type="number"
                  className="w-full rounded-md border border-line px-2 py-1.5 text-sm"
                />
                <span className="text-ink-soft">–</span>
                <input
                  value={maxPrice}
                  onChange={(e) => updateParam('maxPrice', e.target.value)}
                  placeholder="Max"
                  type="number"
                  className="w-full rounded-md border border-line px-2 py-1.5 text-sm"
                />
              </div>
            </FilterGroup>

            {activeFilterCount > 0 && (
              <button
                onClick={() => setParams(q ? { q } : {})}
                className="mt-3 block w-full rounded border border-line bg-paper/60 py-1.5 text-center text-xs font-medium text-clay-600 hover:bg-paper"
              >
                Clear all filters ({activeFilterCount})
              </button>
            )}
          </div>
        </aside>

        <div>
          <div className="mb-4 flex justify-end">
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="rounded-md border border-line px-2 py-1.5 text-sm"
            >
              <option value="newest">Newest first</option>
              <option value="price_low">Price: low to high</option>
              <option value="price_high">Price: high to low</option>
              <option value="popular">Most popular</option>
            </select>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Spinner />
            </div>
          ) : listings.length === 0 ? (
            <EmptyState
              title={
                isTicketCategory
                  ? 'No travel tickets match your filters'
                  : isRentalCategory
                  ? 'No rental properties match your filters'
                  : 'No listings match your filters'
              }
              body={
                isTicketCategory
                  ? 'Try selecting a different date or clearing the destination filter.'
                  : 'Try widening your search or clearing a filter.'
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {listings.map((l) => (
                <ProductCard key={l.id} listing={l} onToggleSave={toggleSave} />
              ))}
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
