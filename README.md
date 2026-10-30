# CampusBazaar AI

The student marketplace for buying, selling, renting and exchanging on campus —
with **BazaarBuddy**, a built-in AI assistant that checks whether a listing's
price is fair.

## What's actually implemented

This is a real, runnable full-stack app - not a mockup. A few honest notes on
scope and stack choices, since the original spec was very large:

- **Database: SQLite, not MongoDB.** The app uses `better-sqlite3` instead of
  MongoDB so it runs with zero external setup - no database server to install
  or connect to. One file (`backend/data/campusbazaar.db`) holds everything.
  The schema (`backend/src/schema.sql`) is a straightforward relational model
  covering the same entities the spec asked for (users, listings, categories,
  transactions, rentals, exchanges, messages, notifications, saved items,
  reports, reviews). Swapping to MongoDB/Mongoose later would mean rewriting
  the query layer in each route file, but the API shape wouldn't need to change.
- **AI: deterministic, not an LLM call.** BazaarBuddy's price intelligence
  compares a listing against similar active listings (same category,
  condition-weighted) using median/percentile math - no invented facts, and it
  says so explicitly when there isn't enough data. This matches the spec's own
  "AI fallback" requirement, and means the app works with zero API keys. If
  you add an `OPENAI_API_KEY`, you can extend `backend/src/utils/ai.js` to use
  it for phrasing - just don't let it invent the numbers.
- **Image uploads: sample gallery, not Cloudinary.** The "Sell" flow lets you
  pick from a small set of stock photos rather than uploading real files, to
  keep the demo self-contained. Wiring up real uploads means adding Cloudinary
  (or S3) credentials and a multer→cloud-upload step in
  `backend/src/routes/listings.js`.
- **Scope:** every page category from the brief exists (public marketplace,
  auth, dashboard with listings/saved/transactions/rentals/exchanges/messages/
  notifications, seller profile, admin panel with stats/user verification/
  listing moderation/reports). Some are intentionally simple (e.g. no
  drag-and-drop image upload, no push notifications) rather than fully
  fleshed out, to keep the whole thing working end-to-end.

Everything below has been tested by actually running the servers and hitting
the API - not just written and assumed correct.

## Features

- Browse, search, filter (category, type, condition, price, campus), and sort
- Buy, rent, or exchange listings; seller accepts/declines exchange offers
- Multi-step "Sell" flow with AI description cleanup and AI price check
- BazaarBuddy floating assistant - price-checks whatever listing you're viewing
- Saved items, in-app messaging, notifications
- Seller dashboard: listings, views/saves, transactions, rentals, exchanges
- Admin panel: marketplace stats, user verification, listing moderation, reports
- JWT auth with bcrypt password hashing; role-based admin routes

## Tech stack

**Frontend:** React 19, Vite, React Router, Tailwind CSS, lucide-react icons
**Backend:** Node.js, Express, better-sqlite3, JWT, bcryptjs
**AI:** deterministic price-comparison logic (see note above)

## Project structure

```
campusbazaar-ai/
├── backend/
│   ├── src/
│   │   ├── server.js          # Express app + route mounting
│   │   ├── db.js               # SQLite connection + schema bootstrap
│   │   ├── schema.sql           # Table definitions
│   │   ├── seed.js              # Demo data (categories, users, 39 listings)
│   │   ├── middleware/auth.js   # JWT auth, admin guard
│   │   ├── utils/ai.js          # Price intelligence + BazaarBuddy logic
│   │   └── routes/              # auth, users, listings, categories, ai,
│   │                             transactions, rentals, exchanges, messages,
│   │                             notifications, saved, reviews, reports, admin
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── main.jsx, App.jsx    # Entry + route tree
    │   ├── context/              # Auth + BazaarBuddy context
    │   ├── lib/api.js            # Fetch wrapper with JWT header
    │   ├── components/           # Navbar, Footer, ProductCard, BazaarBuddy…
    │   └── pages/                # Home, Browse, ProductDetails, Sell,
    │                              dashboard/*, admin/*, static pages
    ├── tailwind.config.js
    └── package.json
```

## Getting started

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # edit JWT_SECRET at minimum
npm run seed               # creates + seeds the SQLite database
npm start                  # runs on http://localhost:4000
```

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev                 # runs on http://localhost:5173
```

Open `http://localhost:5173`. The frontend's `.env` already points
`VITE_API_URL` at `http://localhost:4000/api`; change it if your backend runs
elsewhere.

### Demo accounts (after seeding)

| Role  | Email               | Password    |
|-------|---------------------|-------------|
| Admin | admin@campus.edu    | password123 |
| User  | ananya@campus.edu   | password123 |
| User  | rohan@campus.edu    | password123 |

(All seeded users share the password `password123`.)

## Environment variables (backend/.env)

```
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
DATABASE_FILE=./data/campusbazaar.db
OPENAI_API_KEY=            # optional, unused by default logic
OPENAI_MODEL=gpt-4o-mini
CLOUDINARY_CLOUD_NAME=     # optional, not wired up yet
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Never commit a real `.env` - `.gitignore` already excludes it.

## Deployment notes

- **Backend:** any Node host works (Render, Railway, Fly.io, a VPS). Because
  the database is a single SQLite file, make sure your host's filesystem
  persists between deploys (or migrate to a hosted Postgres/MongoDB and swap
  the query layer if you need a fully managed, horizontally-scaled DB).
- **Frontend:** `npm run build` in `frontend/` produces a static `dist/`
  folder deployable to Vercel, Netlify, or any static host. Set
  `VITE_API_URL` to your deployed backend's URL at build time.
- Set `CLIENT_ORIGIN` on the backend to your deployed frontend's origin so
  CORS allows it.

## Future improvements

- Real image uploads via Cloudinary/S3 instead of the sample gallery
- Optional LLM-backed phrasing for BazaarBuddy (numbers stay deterministic)
- Email/SMS notifications, not just in-app
- Rating/review flow triggered automatically after a completed transaction
- Migrate to Postgres/MongoDB for multi-instance horizontal scaling
- Real-time messaging via WebSockets instead of polling
