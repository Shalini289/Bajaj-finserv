import TicketCard from './TicketCard';
import { STATUSES, statusTitle } from '../utils';

export default function Board({ tickets, onMove, onDelete, busyId }) {
  const grouped = {};
  STATUSES.forEach((s) => { grouped[s] = []; });
  tickets.forEach((t) => {
    if (grouped[t.status]) grouped[t.status].push(t);
  });

  return (
    <div className="board">
      {STATUSES.map((col) => (
        <section className="board-column" key={col}>
          <header className="board-column__header">
            <h2>{statusTitle[col]}</h2>
            <span className="board-column__count">{grouped[col].length}</span>
          </header>
          <div className="board-column__cards">
            {grouped[col].length === 0 ? (
              <p className="board-column__empty">Nothing here</p>
            ) : (
              grouped[col].map((t) => (
                <TicketCard
                  key={t._id}
                  ticket={t}
                  onMove={onMove}
                  onDelete={onDelete}
                  busy={busyId === t._id}
                />
              ))
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
