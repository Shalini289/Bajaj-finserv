import TicketCard from './TicketCard';
import { STATUS_ORDER, STATUS_LABELS } from '../utils';

export default function Board({
  tickets,
  onMove,
  onDelete,
  movingId,
}) {
  const byStatus = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = tickets.filter((t) => t.status === s);
    return acc;
  }, {});

  return (
    <div className="board">
      {STATUS_ORDER.map((status) => (
        <section key={status} className="board-column">
          <header className="board-column__header">
            <h2>{STATUS_LABELS[status]}</h2>
            <span className="board-column__count">
              {byStatus[status].length}
            </span>
          </header>
          <div className="board-column__cards">
            {byStatus[status].length === 0 ? (
              <p className="board-column__empty">No tickets</p>
            ) : (
              byStatus[status].map((ticket) => (
                <TicketCard
                  key={ticket._id}
                  ticket={ticket}
                  onMove={onMove}
                  onDelete={onDelete}
                  moving={movingId === ticket._id}
                />
              ))
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
