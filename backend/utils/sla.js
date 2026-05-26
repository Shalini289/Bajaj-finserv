// response targets in hours — from the assignment brief
const RESPONSE_TARGETS = {
  urgent: 1,
  high: 4,
  medium: 24,
  low: 72,
};

const FLOW = ['open', 'in_progress', 'resolved', 'closed'];

function targetMinutes(priority) {
  const hrs = RESPONSE_TARGETS[priority];
  return (hrs != null ? hrs : 72) * 60;
}

function buildTicketResponse(ticket) {
  const row = ticket.toObject ? ticket.toObject() : { ...ticket };
  const opened = new Date(row.createdAt);
  const stillActive = row.status === 'open' || row.status === 'in_progress';

  // once resolved, age is frozen at resolution time (not "now")
  let ageCutoff = new Date();
  if (row.status === 'resolved' && row.resolvedAt) {
    ageCutoff = new Date(row.resolvedAt);
  } else if (row.status === 'closed' && row.resolvedAt) {
    ageCutoff = new Date(row.resolvedAt);
  }

  const ageMinutes = Math.max(0, Math.floor((ageCutoff - opened) / 60000));
  const limit = targetMinutes(row.priority);

  let slaBreached = false;
  if (stillActive) {
    slaBreached = ageMinutes > limit;
  } else if (row.resolvedAt) {
    const minsToResolve = Math.floor(
      (new Date(row.resolvedAt) - opened) / 60000
    );
    slaBreached = minsToResolve > limit;
  }

  return { ...row, ageMinutes, slaBreached };
}

function allowedToMove(from, to) {
  const a = FLOW.indexOf(from);
  const b = FLOW.indexOf(to);
  if (a < 0 || b < 0 || a === b) return false;
  return Math.abs(b - a) === 1;
}

module.exports = {
  RESPONSE_TARGETS,
  FLOW,
  targetMinutes,
  buildTicketResponse,
  allowedToMove,
};
