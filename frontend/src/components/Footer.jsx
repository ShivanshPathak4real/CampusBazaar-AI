import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto max-w-content px-4 py-10 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 font-display text-lg font-semibold">
              <span className="flex h-7 w-7 items-center justify-center rounded bg-bazaar-500 text-sm text-paper">CB</span>
              CampusBazaar
            </div>
            <p className="mt-3 max-w-xs text-sm text-ink-soft">
              The marketplace built for students - buy, sell, rent and swap what you don't need anymore.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Marketplace</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              <li><Link to="/browse" className="hover:text-ink">Browse all</Link></li>
              <li><Link to="/browse?listingType=rent" className="hover:text-ink">Rentals</Link></li>
              <li><Link to="/browse?listingType=exchange" className="hover:text-ink">Exchanges</Link></li>
              <li><Link to="/sell" className="hover:text-ink">Sell an item</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Support</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              <li><Link to="/help" className="hover:text-ink">Help &amp; contact</Link></li>
              <li><Link to="/safety" className="hover:text-ink">Trust &amp; safety</Link></li>
              <li><Link to="/about" className="hover:text-ink">About</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Legal</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              <li><Link to="/terms" className="hover:text-ink">Terms</Link></li>
              <li><Link to="/privacy" className="hover:text-ink">Privacy</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-line pt-6 text-xs text-ink-soft">
          © {new Date().getFullYear()} CampusBazaar. Built by students, for students.
        </div>
      </div>
    </footer>
  );
}
