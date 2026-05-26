import { showAge, statusTitle, neighbourStatuses } from '../utils';

const badgeClass = {
  low: 'priority--low',
  medium: 'priority--medium',
  high: 'priority--high',
  urgent: 'priority--urgent',
};

export default function TicketCard({ ticket, onMove, onDelete, busy }) {
  const neighbours = neighbourStatuses(ticket.status);

  return (
    <article className={'ticket-card' + (ticket.slaBreached ? ' ticket-card--breached' : '')}>
      {ticket.slaBreached ? (
        <span className="breach-badge" title="Past SLA target">
          SLA
        </span>
      ) : null}

      <h3 className="ticket-card__subject">{ticket.subject}</h3>

      <div className="ticket-card__meta">
        <span className={'priority-badge ' + (badgeClass[ticket.priority] || '')}>
          {ticket.priority}
        </span>
        <span className="ticket-card__age">{showAge(ticket.ageMinutes)}</span>
      </div>

      <p className="ticket-card__email">{ticket.customerEmail}</p>

      <div className="ticket-card__actions">
        {neighbours.map((n) => (
          <button
            key={n.status}
            type="button"
            disabled={busy}
            className={'btn btn--sm ' + (n.back ? 'btn--ghost' : 'btn--primary')}
            onClick={() => onMove(ticket._id, n.status)}
          >
            {n.back ? '← ' : '→ '}
            {statusTitle[n.status]}
          </button>
        ))}
        <button
          type="button"
          className="btn btn--sm btn--danger-outline"
          disabled={busy}
          onClick={() => onDelete(ticket._id)}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
