import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import Board from './components/Board';
import CreateTicketPanel from './components/CreateTicketPanel';
import StatsStrip from './components/StatsStrip';
import './App.css';

const PRIORITIES = ['', 'low', 'medium', 'high', 'urgent'];

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [breachedOnly, setBreachedOnly] = useState(false);
  const [movingId, setMovingId] = useState(null);

  const loadData = useCallback(async () => {
    setError('');
    try {
      const params = {};
      if (priorityFilter) params.priority = priorityFilter;
      if (breachedOnly) params.breached = true;
      const [ticketList, statsData] = await Promise.all([
        api.getTickets(params),
        api.getStats(),
      ]);
      setTickets(ticketList);
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [priorityFilter, breachedOnly]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  async function handleMove(id, status) {
    setMovingId(id);
    setError('');
    try {
      const updated = await api.updateStatus(id, status);
      setTickets((prev) => prev.map((t) => (t._id === id ? updated : t)));
      const statsData = await api.getStats();
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setMovingId(null);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this ticket?')) return;
    setError('');
    try {
      await api.deleteTicket(id);
      setTickets((prev) => prev.filter((t) => t._id !== id));
      const statsData = await api.getStats();
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreate(body) {
    const created = await api.createTicket(body);
    if (!priorityFilter || created.priority === priorityFilter) {
      if (!breachedOnly || created.slaBreached) {
        setTickets((prev) => [created, ...prev]);
      }
    }
    const statsData = await api.getStats();
    setStats(statsData);
    return created;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>DeskFlow</h1>
          <p className="app-header__sub">
            Support ticket triage board · Shalini Bhadouriya · 0827RL231058
          </p>
        </div>
      </header>

      <StatsStrip stats={stats} loading={loading && !stats} />

      <div className="toolbar">
        <label className="toolbar__filter">
          Priority
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All priorities</option>
            {PRIORITIES.filter(Boolean).map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label className="toolbar__checkbox">
          <input
            type="checkbox"
            checked={breachedOnly}
            onChange={(e) => setBreachedOnly(e.target.checked)}
          />
          SLA breached only
        </label>
        <button type="button" className="btn btn--ghost" onClick={loadData}>
          Refresh
        </button>
      </div>

      {error && (
        <div className="banner banner--error" role="alert">
          {error}
        </div>
      )}

      <div className="main-layout">
        <div className="board-area">
          {loading ? (
            <p className="loading-state">Loading tickets…</p>
          ) : (
            <Board
              tickets={tickets}
              onMove={handleMove}
              onDelete={handleDelete}
              movingId={movingId}
            />
          )}
        </div>
        <CreateTicketPanel onCreated={handleCreate} />
      </div>
    </div>
  );
}
