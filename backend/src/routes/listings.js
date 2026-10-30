import { Router } from 'express';
import { nanoid } from 'nanoid';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import db from '../db.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'campusbazaar', resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

const router = Router();

function serialize(row, userId) {
  const saved = userId
    ? !!db.prepare('SELECT 1 FROM saved_items WHERE user_id = ? AND listing_id = ?').get(userId, row.id)
    : false;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    images: JSON.parse(row.images || '[]'),
    condition: row.condition,
    listingType: row.listing_type,
    price: row.price,
    rentalPrice: row.rental_price,
    rentalPeriod: row.rental_period,
    securityDeposit: row.security_deposit,
    originalPrice: row.original_price,
    purchaseYear: row.purchase_year,
    exchangeFor: row.exchange_for,
    campus: row.campus,
    status: row.status,
    views: row.views,
    saves: row.saves,
    createdAt: row.created_at,
    categoryId: row.category_id,
    categoryName: row.category_name,
    seller: {
      id: row.seller_id,
      name: row.seller_name,
      avatarUrl: row.seller_avatar,
      isVerified: !!row.seller_verified,
      ratingAvg: row.seller_rating_avg,
      ratingCount: row.seller_rating_count,
    },
    isSaved: saved,
  };
}

const BASE_SELECT = `
  SELECT l.*, c.name as category_name,
         u.name as seller_name, u.avatar_url as seller_avatar,
         u.is_verified as seller_verified, u.rating_avg as seller_rating_avg,
         u.rating_count as seller_rating_count
  FROM listings l
  LEFT JOIN categories c ON c.id = l.category_id
  LEFT JOIN users u ON u.id = l.seller_id
`;

// GET /api/listings - browse/search/filter
router.get('/', optionalAuth, (req, res) => {
  const {
    q, category, listingType, minPrice, maxPrice, condition, campus,
    sort = 'newest', page = 1, limit = 20,
  } = req.query;

  const where = [`l.status = 'active'`];
  const params = [];

  if (q) {
    where.push(`(l.title LIKE ? OR l.description LIKE ?)`);
    params.push(`%${q}%`, `%${q}%`);
  }
  if (category) { where.push(`c.slug = ?`); params.push(category); }
  if (listingType) { where.push(`l.listing_type = ?`); params.push(listingType); }
  if (condition) { where.push(`l.condition = ?`); params.push(condition); }
  if (campus) { where.push(`l.campus = ?`); params.push(campus); }
  if (minPrice) { where.push(`COALESCE(l.price, l.rental_price) >= ?`); params.push(Number(minPrice)); }
  if (maxPrice) { where.push(`COALESCE(l.price, l.rental_price) <= ?`); params.push(Number(maxPrice)); }

  let orderBy = 'l.created_at DESC';
  if (sort === 'price_low') orderBy = 'COALESCE(l.price, l.rental_price) ASC';
  if (sort === 'price_high') orderBy = 'COALESCE(l.price, l.rental_price) DESC';
  if (sort === 'popular') orderBy = 'l.views DESC';

  const offset = (Number(page) - 1) * Number(limit);
  const sql = `${BASE_SELECT} WHERE ${where.join(' AND ')} ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
  const rows = db.prepare(sql).all(...params, Number(limit), offset);

  const countRow = db
    .prepare(`SELECT COUNT(*) as total FROM listings l LEFT JOIN categories c ON c.id = l.category_id WHERE ${where.join(' AND ')}`)
    .get(...params);

  res.json({
    listings: rows.map((r) => serialize(r, req.user?.id)),
    total: countRow.total,
    page: Number(page),
    limit: Number(limit),
  });
});

// GET /api/listings/:id
router.get('/:id', optionalAuth, (req, res) => {
  const row = db.prepare(`${BASE_SELECT} WHERE l.id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Listing not found' });

  db.prepare('UPDATE listings SET views = views + 1 WHERE id = ?').run(row.id);
  row.views += 1;

  const similar = db
    .prepare(
      `${BASE_SELECT} WHERE l.category_id = ? AND l.id != ? AND l.status = 'active' LIMIT 4`
    )
    .all(row.category_id, row.id);

  res.json({
    listing: serialize(row, req.user?.id),
    similar: similar.map((r) => serialize(r, req.user?.id)),
  });
});

// POST /api/listings/upload-images - upload images to Cloudinary
router.post('/upload-images', requireAuth, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }
    const uploadPromises = req.files.map((file) => uploadToCloudinary(file.buffer));
    const urls = await Promise.all(uploadPromises);
    res.json({ urls });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    res.status(500).json({ error: err.message || 'Failed to upload images' });
  }
});

// POST /api/listings - create
router.post('/', requireAuth, (req, res) => {
  const {
    title, description, images = [], condition, listingType,
    price, rentalPrice, rentalPeriod, securityDeposit,
    originalPrice, purchaseYear, exchangeFor, campus, categoryId,
    status = 'active',
  } = req.body;

  if (!title || !description || !condition || !listingType) {
    return res.status(400).json({ error: 'title, description, condition and listingType are required' });
  }
  if (listingType === 'sell' && !price) {
    return res.status(400).json({ error: 'price is required for sell listings' });
  }
  if (listingType === 'rent' && !rentalPrice) {
    return res.status(400).json({ error: 'rentalPrice is required for rent listings' });
  }

  const id = nanoid();
  db.prepare(
    `INSERT INTO listings
      (id, seller_id, category_id, title, description, images, condition, listing_type,
       price, rental_price, rental_period, security_deposit, original_price, purchase_year,
       exchange_for, campus, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, req.user.id, categoryId || null, title, description, JSON.stringify(images),
    condition, listingType, price || null, rentalPrice || null, rentalPeriod || null,
    securityDeposit || null, originalPrice || null, purchaseYear || null,
    exchangeFor || null, campus || req.user.campus || null, status
  );

  const row = db.prepare(`${BASE_SELECT} WHERE l.id = ?`).get(id);
  res.status(201).json({ listing: serialize(row, req.user.id) });
});

// PATCH /api/listings/:id - update (owner only)
router.patch('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Listing not found' });
  if (existing.seller_id !== req.user.id) return res.status(403).json({ error: 'Not your listing' });

  const fields = {
    title: req.body.title, description: req.body.description,
    images: req.body.images ? JSON.stringify(req.body.images) : undefined,
    condition: req.body.condition, listing_type: req.body.listingType,
    price: req.body.price, rental_price: req.body.rentalPrice,
    rental_period: req.body.rentalPeriod, security_deposit: req.body.securityDeposit,
    original_price: req.body.originalPrice, purchase_year: req.body.purchaseYear,
    exchange_for: req.body.exchangeFor, campus: req.body.campus,
    category_id: req.body.categoryId, status: req.body.status,
  };
  const sets = [];
  const params = [];
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) { sets.push(`${k} = ?`); params.push(v); }
  }
  if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });
  sets.push(`updated_at = datetime('now')`);
  params.push(req.params.id);
  db.prepare(`UPDATE listings SET ${sets.join(', ')} WHERE id = ?`).run(...params);

  const row = db.prepare(`${BASE_SELECT} WHERE l.id = ?`).get(req.params.id);
  res.json({ listing: serialize(row, req.user.id) });
});

// DELETE /api/listings/:id
router.delete('/:id', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Listing not found' });
  if (existing.seller_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not your listing' });
  }
  db.prepare('DELETE FROM listings WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// POST /api/listings/:id/save - toggle save
router.post('/:id/save', requireAuth, (req, res) => {
  const listing = db.prepare('SELECT id FROM listings WHERE id = ?').get(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });

  const existing = db.prepare('SELECT 1 FROM saved_items WHERE user_id = ? AND listing_id = ?').get(req.user.id, req.params.id);
  if (existing) {
    db.prepare('DELETE FROM saved_items WHERE user_id = ? AND listing_id = ?').run(req.user.id, req.params.id);
    db.prepare('UPDATE listings SET saves = MAX(0, saves - 1) WHERE id = ?').run(req.params.id);
    return res.json({ saved: false });
  }
  db.prepare('INSERT INTO saved_items (user_id, listing_id) VALUES (?, ?)').run(req.user.id, req.params.id);
  db.prepare('UPDATE listings SET saves = saves + 1 WHERE id = ?').run(req.params.id);
  res.json({ saved: true });
});

export default router;
