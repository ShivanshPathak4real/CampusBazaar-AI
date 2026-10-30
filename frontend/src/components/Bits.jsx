export function EmptyState({ title, body, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line bg-white px-6 py-16 text-center">
      <p className="font-display text-base font-semibold">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-ink-soft">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ label = 'Loading…' }) {
  return <div className="py-16 text-center text-sm text-ink-soft">{label}</div>;
}

export function SectionHeading({ title, subtitle, action }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-xl font-semibold sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const CLASSIFICATION_STYLE = {
  great_deal: 'bg-bazaar-50 text-bazaar-600',
  fair: 'bg-blue-50 text-blue-700',
  slightly_high: 'bg-mustard-100 text-mustard-500',
  overpriced: 'bg-red-50 text-clay-500',
};
const CLASSIFICATION_LABEL = {
  great_deal: '🟢 Great deal',
  fair: '🔵 Fair price',
  slightly_high: '🟡 Slightly high',
  overpriced: '🔴 Overpriced',
};

export function DealBadge({ classification }) {
  if (!classification) return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${CLASSIFICATION_STYLE[classification]}`}>
      {CLASSIFICATION_LABEL[classification]}
    </span>
  );
}
