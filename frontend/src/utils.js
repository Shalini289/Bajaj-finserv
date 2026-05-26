export const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

export const statusTitle = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export function showAge(mins) {
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm';
  const hours = Math.floor(mins / 60);
  const left = mins % 60;
  if (hours < 24) {
    return left ? hours + 'h ' + left + 'm' : hours + 'h';
  }
  const days = Math.floor(hours / 24);
  const remH = hours % 24;
  return remH ? days + 'd ' + remH + 'h' : days + 'd';
}

// only the next/previous column — nothing else (per assignment rules)
export function neighbourStatuses(current) {
  const i = STATUSES.indexOf(current);
  const out = [];
  if (i > 0) {
    out.push({ status: STATUSES[i - 1], back: true });
  }
  if (i < STATUSES.length - 1) {
    out.push({ status: STATUSES[i + 1], back: false });
  }
  return out;
}

export function ticketPassesFilters(ticket, filters) {
  if (filters.priority && ticket.priority !== filters.priority) return false;
  if (filters.breached && !ticket.slaBreached) return false;
  return true;
}
