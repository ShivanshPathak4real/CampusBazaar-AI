import { Router } from 'express';
import db from '../db.js';
import { optionalAuth } from '../middleware/auth.js';
import { analyzePricing, buddyReplyForListing, cleanupDescription } from '../utils/ai.js';

const router = Router();

// POST /api/ai/price-check - used during listing creation (step 4) and on product pages
router.post('/price-check', optionalAuth, (req, res) => {
  const { categoryId, condition, price, excludeListingId } = req.body;
  if (!categoryId || !condition) {
    return res.status(400).json({ error: 'categoryId and condition are required' });
  }
  const analysis = analyzePricing({ categoryId, condition, price, excludeListingId });
  res.json({ analysis });
});

// POST /api/ai/improve-description - never invents facts, only tightens wording
router.post('/improve-description', (req, res) => {
  const { description } = req.body;
  if (!description) return res.status(400).json({ error: 'description is required' });
  res.json({ improved: cleanupDescription(description) });
});

// POST /api/ai/buddy - BazaarBuddy chat about a specific listing
router.post('/buddy', optionalAuth, (req, res) => {
  const { listingId } = req.body;
  if (!listingId) return res.status(400).json({ error: 'listingId is required' });

  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(listingId);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });

  const analysis = analyzePricing({
    categoryId: listing.category_id,
    condition: listing.condition,
    price: listing.price,
    excludeListingId: listing.id,
  });
  const reply = buddyReplyForListing(listing, analysis);
  res.json({ reply, analysis });
});

export default router;
