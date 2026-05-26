import { STATUS_ORDER, STATUS_LABELS } from '../utils';

export default function StatsStrip({ stats, loading }) {
  if (loading) {
    return <div className="stats-strip stats-strip--loading">Loading stats…</div>;
  }
  if (!stats) return null;

  return (
    <div className="stats-strip">
      {STATUS_ORDER.map((status) => (
        <div key={status} className="stat-pill">
          <span className="stat-pill__label">{STATUS_LABELS[status]}</span>
          <span className="stat-pill__value">{stats.byStatus[status] ?? 0}</span>
        </div>
      ))}
      <div className="stat-pill stat-pill--breach">
        <span className="stat-pill__label">SLA Breached (open)</span>
        <span className="stat-pill__value">{stats.breachedOpen ?? 0}</span>
      </div>
    </div>
  );
}
