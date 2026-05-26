import { formatAge, STATUS_LABELS, getAdjacentStatuses } from '../utils';

const PRIORITY_CLASS = {
  low: 'priority--low',
  medium: 'priority--medium',
  high: 'priority--high',
  urgent: 'priority--urgent',
};

export default function TicketCard({ ticket, onMove, onDelete, moving }) {
  const moves = getAdjacentStatuses(ticket.status);

  return (
    <article
      className={`ticket-card ${ticket.slaBreached ? 'ticket-card--breached' : ''}`}
    >
      {ticket.slaBreached && (
        <span className="breach-badge" title="SLA breached">
          SLA
        </span>
      )}
      <h3 className="ticket-card__subject">{ticket.subject}</h3>
      <div className="ticket-card__meta">
        <span className={`priority-badge ${PRIORITY_CLASS[ticket.priority]}`}>
          {ticket.priority}
        </span>
        <span className="ticket-card__age">{formatAge(ticket.ageMinutes)}</span>
      </div>
      <p className="ticket-card__email">{ticket.customerEmail}</p>
      <div className="ticket-card__actions">
        {moves.map(({ status, direction }) => (
          <button
            key={status}
            type="button"
            className={`btn btn--sm ${direction === 'back' ? 'btn--ghost' : 'btn--primary'}`}
            disabled={moving}
            onClick={() => onMove(ticket._id, status)}
            title={`Move to ${STATUS_LABELS[status]}`}
          >
            {direction === 'back' ? '←' : '→'} {STATUS_LABELS[status]}
          </button>
        ))}
        <button
          type="button"
          className="btn btn--sm btn--danger-outline"
          disabled={moving}
          onClick={() => onDelete(ticket._id)}
          title="Delete ticket"
        >
          Delete
        </button>
      </div>
    </article>
  );
}
