const STATUS_ORDER = ['open', 'in_progress', 'resolved', 'closed'];

const STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export function formatAge(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h < 24) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh > 0 ? `${d}d ${rh}h` : `${d}d`;
}

export function getAdjacentStatuses(status) {
  const idx = STATUS_ORDER.indexOf(status);
  const adjacent = [];
  if (idx > 0) adjacent.push({ status: STATUS_ORDER[idx - 1], direction: 'back' });
  if (idx < STATUS_ORDER.length - 1)
    adjacent.push({ status: STATUS_ORDER[idx + 1], direction: 'forward' });
  return adjacent;
}

export { STATUS_ORDER, STATUS_LABELS };
