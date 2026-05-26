import { STATUSES, statusTitle } from '../utils';

export default function StatsStrip({ stats, loading }) {
  if (loading) {
    return <div className="stats-strip stats-strip--loading">Loading counts…</div>;
  }
  if (!stats) return null;

  return (
    <div className="stats-strip">
      {STATUSES.map((s) => (
        <div className="stat-pill" key={s}>
          <span className="stat-pill__label">{statusTitle[s]}</span>
          <span className="stat-pill__value">{stats.byStatus[s] ?? 0}</span>
        </div>
      ))}
      <div className="stat-pill stat-pill--breach">
        <span className="stat-pill__label">Breached (still open)</span>
        <span className="stat-pill__value">{stats.breachedOpen ?? 0}</span>
      </div>
    </div>
  );
}
