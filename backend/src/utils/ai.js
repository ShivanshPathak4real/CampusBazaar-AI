import db from '../db.js';

// --- Deterministic price intelligence -------------------------------------
// This is the core, always-available logic. It never invents facts about
// the item; it only compares numbers against other listings in the same
// category and condition band. An OpenAI call (if configured) is used only
// to phrase the explanation in friendlier language - never to invent numbers.

const CONDITION_WEIGHT = {
  new: 1.0,
  'like-new': 0.9,
  good: 0.78,
  fair: 0.6,
  worn: 0.45,
};

export function analyzePricing({ categoryId, condition, price, excludeListingId }) {
  const rows = db
    .prepare(
      `SELECT price FROM listings
       WHERE category_id = ? AND status = 'active' AND price IS NOT NULL
       AND id != ?`
    )
    .all(categoryId, excludeListingId || '');

  const comparablePrices = rows.map((r) => r.price).filter((p) => p > 0);

  if (comparablePrices.length < 3) {
    return {
      status: 'insufficient_data',
      message:
        "I don't have enough similar listings to confidently estimate this price yet.",
      sampleSize: comparablePrices.length,
    };
  }

  comparablePrices.sort((a, b) => a - b);
  const median = percentile(comparablePrices, 0.5);
  const low = percentile(comparablePrices, 0.25);
  const high = percentile(comparablePrices, 0.75);

  const weight = CONDITION_WEIGHT[condition] ?? 0.75;
  const adjustedLow = Math.round(low * weight);
  const adjustedHigh = Math.round(high * weight);
  const adjustedMedian = Math.round(median * weight);

  let classification = 'fair';
  let diffPct = 0;
  if (price != null && adjustedMedian > 0) {
    diffPct = Math.round(((price - adjustedMedian) / adjustedMedian) * 100);
    if (diffPct <= -15) classification = 'great_deal';
    else if (diffPct <= 8) classification = 'fair';
    else if (diffPct <= 25) classification = 'slightly_high';
    else classification = 'overpriced';
  }

  const negotiationLow = Math.round(adjustedMedian * 0.92);
  const negotiationHigh = Math.round(adjustedMedian * 1.02);

  return {
    status: 'ok',
    sampleSize: comparablePrices.length,
    fairPriceRange: { low: adjustedLow, high: adjustedHigh },
    medianComparable: adjustedMedian,
    listedPrice: price ?? null,
    percentDifference: price != null ? diffPct : null,
    classification, // great_deal | fair | slightly_high | overpriced
    negotiationRange: { low: negotiationLow, high: negotiationHigh },
  };
}

function percentile(sortedArr, p) {
  const idx = (sortedArr.length - 1) * p;
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sortedArr[lower];
  return sortedArr[lower] + (sortedArr[upper] - sortedArr[lower]) * (idx - lower);
}

export function classificationLabel(classification) {
  return (
    {
      great_deal: { emoji: '🟢', label: 'Great Deal' },
      fair: { emoji: '🔵', label: 'Fair Price' },
      slightly_high: { emoji: '🟡', label: 'Slightly High' },
      overpriced: { emoji: '🔴', label: 'Overpriced' },
    }[classification] || { emoji: '🔵', label: 'Fair Price' }
  );
}

// --- BazaarBuddy chat reply (deterministic, no invented facts) ------------
export function buddyReplyForListing(listing, analysis) {
  if (!listing) {
    return "I couldn't find that listing to compare. Try browsing similar items in the same category instead.";
  }
  if (analysis.status === 'insufficient_data') {
    return `Hey! I checked around, but ${analysis.message.toLowerCase()} Once a few more similar items are listed, I'll be able to give you a solid read.`;
  }
  const { emoji, label } = classificationLabel(analysis.classification);
  const range = `₹${analysis.fairPriceRange.low.toLocaleString('en-IN')}–₹${analysis.fairPriceRange.high.toLocaleString('en-IN')}`;
  let verdict = '';
  if (analysis.listedPrice != null) {
    const diff = analysis.percentDifference;
    if (analysis.classification === 'great_deal') {
      verdict = `₹${analysis.listedPrice.toLocaleString('en-IN')} is a steal - that's about ${Math.abs(diff)}% below similar listings.`;
    } else if (analysis.classification === 'fair') {
      verdict = `₹${analysis.listedPrice.toLocaleString('en-IN')} looks fair, right in line with similar listings.`;
    } else if (analysis.classification === 'slightly_high') {
      verdict = `₹${analysis.listedPrice.toLocaleString('en-IN')} looks slightly high - about ${diff}% above similar listings.`;
    } else {
      verdict = `₹${analysis.listedPrice.toLocaleString('en-IN')} looks overpriced - about ${diff}% above similar listings.`;
    }
  }
  return `Hey! I checked ${analysis.sampleSize} similar listings 👋 ${emoji} ${label}. ${verdict} Similar items are going for around ${range}. If you want to negotiate, ₹${analysis.negotiationRange.low.toLocaleString('en-IN')}–₹${analysis.negotiationRange.high.toLocaleString('en-IN')} is a reasonable ask.`;
}

// --- Description cleanup (deterministic fallback, never invents facts) ----
export function cleanupDescription(raw) {
  if (!raw) return raw;
  let text = raw.trim().replace(/\s+/g, ' ');
  text = text.charAt(0).toUpperCase() + text.slice(1);
  if (!/[.!?]$/.test(text)) text += '.';
  return text;
}
