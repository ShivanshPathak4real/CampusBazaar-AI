import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, ShieldCheck, Sparkles, Repeat } from 'lucide-react';
import { api } from '../lib/api';
import ProductCard from '../components/ProductCard';
import { SectionHeading, Spinner } from '../components/Bits';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/categories'),
      api.get('/listings?sort=popular&limit=4'),
      api.get('/listings?sort=newest&limit=8'),
    ])
      .then(([cats, pop, recentRes]) => {
        setCategories(cats.categories);
        setFeatured(pop.listings);
        setRecent(recentRes.listings);
      })
      .finally(() => setLoading(false));
  }, []);

  function onSearch(e) {
    e.preventDefault();
    navigate(`/browse?q=${encodeURIComponent(q)}`);
  }

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-content gap-8 px-4 py-14 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:py-20">
          <div className="flex flex-col justify-center">
            <h1 className="font-display text-4xl font-semibold leading-[1.1] sm:text-5xl">
              Buy smart.
              <br />
              Sell easy.
              <br />
              Trade better.
            </h1>
            <p className="mt-4 max-w-md text-ink-soft">
              The marketplace built by students, for students. Find what you need on campus,
              pass on what you don't - and let BazaarBuddy tell you if the price is fair.
            </p>
            <form onSubmit={onSearch} className="mt-6 flex max-w-md items-center gap-2 rounded-full border border-line bg-paper px-4 py-2.5">
              <Search size={18} className="text-ink-soft" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Textbooks, calculators, cycles…"
                className="w-full bg-transparent text-sm outline-none"
              />
              <button className="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-paper">Search</button>
            </form>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/browse" className="focus-ring rounded-full border border-line bg-white px-4 py-2 text-sm font-medium hover:border-ink/40">
                Browse marketplace
              </Link>
              <Link to="/sell" className="focus-ring rounded-full bg-bazaar-500 px-4 py-2 text-sm font-medium text-paper hover:bg-bazaar-600">
                Sell an item
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {['https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=500&fit=crop',
              'https://images.unsplash.com/photo-1517705008128-361805f42e86?w=400&h=300&fit=crop',
              'https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=400&h=300&fit=crop',
              'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=400&h=500&fit=crop'].map((src, i) => (
              <img
                key={src}
                src={src}
                alt=""
                className={`w-full rounded-lg object-cover ${i % 2 === 0 ? 'row-span-2 h-full' : 'h-full'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Categories strip */}
      <section className="mx-auto max-w-content px-4 py-8 sm:px-6">
        <div className="scroll-strip flex gap-3 overflow-x-auto pb-1">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/browse?category=${c.slug}`}
              className="focus-ring flex shrink-0 items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium hover:border-ink/40"
            >
              {c.name}
              <span className="text-ink-soft">{c.listing_count}</span>
            </Link>
          ))}
        </div>
      </section>

      {loading ? (
        <Spinner />
      ) : (
        <>
          {/* Featured */}
          <section className="mx-auto max-w-content px-4 py-6 sm:px-6">
            <SectionHeading
              title="Popular right now"
              subtitle="Most-viewed listings on campus this week"
              action={<Link to="/browse?sort=popular" className="flex items-center gap-1 text-sm font-medium text-bazaar-600">See all <ArrowRight size={14} /></Link>}
            />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {featured.map((l) => <ProductCard key={l.id} listing={l} />)}
            </div>
          </section>

          {/* How it works */}
          <section className="border-y border-line bg-white">
            <div className="mx-auto max-w-content px-4 py-12 sm:px-6">
              <h2 className="font-display text-xl font-semibold sm:text-2xl">How it works</h2>
              <div className="mt-6 grid gap-8 sm:grid-cols-3">
                <div>
                  <p className="font-display text-sm text-bazaar-500">1. List it</p>
                  <p className="mt-1 text-sm text-ink-soft">Snap a photo, add a few details, and choose to sell, rent, or exchange.</p>
                </div>
                <div>
                  <p className="font-display text-sm text-bazaar-500">2. Get a fair price</p>
                  <p className="mt-1 text-sm text-ink-soft">BazaarBuddy compares it against similar listings so you don't under- or overcharge.</p>
                </div>
                <div>
                  <p className="font-display text-sm text-bazaar-500">3. Connect on campus</p>
                  <p className="mt-1 text-sm text-ink-soft">Message the other student, agree on a spot, and hand it over.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Recently added */}
          <section className="mx-auto max-w-content px-4 py-10 sm:px-6">
            <SectionHeading
              title="Recently added"
              action={<Link to="/browse?sort=newest" className="flex items-center gap-1 text-sm font-medium text-bazaar-600">See all <ArrowRight size={14} /></Link>}
            />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {recent.map((l) => <ProductCard key={l.id} listing={l} />)}
            </div>
          </section>

          {/* Trust & safety */}
          <section className="mx-auto max-w-content px-4 pb-14 sm:px-6">
            <div className="grid gap-6 rounded-xl border border-line bg-white p-8 sm:grid-cols-3">
              <div className="flex items-start gap-3">
                <ShieldCheck size={20} className="mt-0.5 shrink-0 text-bazaar-500" />
                <div>
                  <p className="font-medium">Verified sellers</p>
                  <p className="mt-1 text-sm text-ink-soft">Students verify their campus email before listing.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Sparkles size={20} className="mt-0.5 shrink-0 text-bazaar-500" />
                <div>
                  <p className="font-medium">Honest pricing</p>
                  <p className="mt-1 text-sm text-ink-soft">BazaarBuddy flags listings that look over- or underpriced.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Repeat size={20} className="mt-0.5 shrink-0 text-bazaar-500" />
                <div>
                  <p className="font-medium">Buy, rent, or swap</p>
                  <p className="mt-1 text-sm text-ink-soft">Not every item needs a buyer - rent it out or trade it instead.</p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
