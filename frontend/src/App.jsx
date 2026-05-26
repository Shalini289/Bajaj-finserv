import { useEffect, useState } from 'react';
import {
  fetchTickets,
  fetchStats,
  createTicket,
  moveTicket,
  removeTicket,
} from './api';
import { ticketPassesFilters } from './utils';
import Board from './components/Board';
import CreateTicketPanel from './components/CreateTicketPanel';
import StatsStrip from './components/StatsStrip';
import './App.css';

const priorityOptions = ['low', 'medium', 'high', 'urgent'];

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bannerErr, setBannerErr] = useState('');
  const [prioFilter, setPrioFilter] = useState('');
  const [onlyBreached, setOnlyBreached] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const filters = {
    priority: prioFilter,
    breached: onlyBreached,
  };

  async function reload() {
    setBannerErr('');
    try {
      const [list, counts] = await Promise.all([
        fetchTickets(filters),
        fetchStats(),
      ]);
      setTickets(list);
      setStats(counts);
    } catch (err) {
      setBannerErr(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prioFilter, onlyBreached]);

  async function handleMove(id, newStatus) {
    setBusyId(id);
    setBannerErr('');
    try {
      const updated = await moveTicket(id, newStatus);
      setTickets((prev) => {
        const rest = prev.filter((t) => t._id !== id);
        if (ticketPassesFilters(updated, filters)) {
          return [updated, ...rest];
        }
        return rest;
      });
      setStats(await fetchStats());
    } catch (err) {
      setBannerErr(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this ticket permanently?')) return;
    setBannerErr('');
    try {
      await removeTicket(id);
      setTickets((prev) => prev.filter((t) => t._id !== id));
      setStats(await fetchStats());
    } catch (err) {
      setBannerErr(err.message);
    }
  }

  async function handleCreate(payload) {
    const fresh = await createTicket(payload);
    if (ticketPassesFilters(fresh, filters)) {
      setTickets((prev) => [fresh, ...prev]);
    }
    setStats(await fetchStats());
    return fresh;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>DeskFlow</h1>
        <p className="app-header__sub">
          Shalini Bhadouriya · shalinibhadouriya230308@acropolis.in · Roll 0827RL231058
        </p>
      </header>

      <StatsStrip stats={stats} loading={loading && !stats} />

      <div className="toolbar">
        <label className="toolbar__filter">
          Filter priority
          <select value={prioFilter} onChange={(e) => setPrioFilter(e.target.value)}>
            <option value="">All</option>
            {priorityOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className="toolbar__checkbox">
          <input
            type="checkbox"
            checked={onlyBreached}
            onChange={(e) => setOnlyBreached(e.target.checked)}
          />
          Show SLA breached only
        </label>

        <button type="button" className="btn btn--ghost" onClick={reload}>
          Refresh board
        </button>
      </div>

      {bannerErr ? (
        <div className="banner banner--error" role="alert">
          {bannerErr}
        </div>
      ) : null}

      <div className="main-layout">
        <div className="board-area">
          {loading ? (
            <p className="loading-state">Pulling tickets from server…</p>
          ) : (
            <Board
              tickets={tickets}
              onMove={handleMove}
              onDelete={handleDelete}
              busyId={busyId}
            />
          )}
        </div>

        <CreateTicketPanel onSubmit={handleCreate} />
      </div>
    </div>
  );
}
