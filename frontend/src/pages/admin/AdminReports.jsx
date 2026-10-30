import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { EmptyState, Spinner } from '../../components/Bits';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get('/admin/reports').then((r) => setReports(r.reports)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function setStatus(id, status) {
    await api.patch(`/reports/${id}/status`, { status });
    load();
  }

  if (loading) return <Spinner />;
  if (reports.length === 0) return <EmptyState title="No reports" body="Reported listings and users will appear here for review." />;

  return (
    <div className="space-y-3">
      {reports.map((r) => (
        <div key={r.id} className="rounded-lg border border-line bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium capitalize">{r.target_type} report · {r.reason}</p>
              {r.details && <p className="mt-1 text-sm text-ink-soft">{r.details}</p>}
              <p className="mt-1 text-xs text-ink-soft/70">{new Date(r.created_at).toLocaleString()}</p>
            </div>
            <span className="rounded-full bg-mustard-100 px-2 py-0.5 text-xs font-medium text-mustard-500 capitalize">{r.status}</span>
          </div>
          {r.status === 'open' && (
            <div className="mt-3 flex gap-2">
              <button onClick={() => setStatus(r.id, 'reviewed')} className="rounded-full border border-line px-3 py-1 text-xs font-medium">Mark reviewed</button>
              <button onClick={() => setStatus(r.id, 'dismissed')} className="rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft">Dismiss</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
