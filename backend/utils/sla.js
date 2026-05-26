const SLA_HOURS = {
  urgent: 1,
  high: 4,
  medium: 24,
  low: 72,
};

const STATUS_ORDER = ['open', 'in_progress', 'resolved', 'closed'];

function getTargetMinutes(priority) {
  return (SLA_HOURS[priority] || 72) * 60;
}

function enrichTicket(ticket) {
  const doc = ticket.toObject ? ticket.toObject() : { ...ticket };
  const created = new Date(doc.createdAt);
  const isResolvedOrClosed =
    doc.status === 'resolved' || doc.status === 'closed';

  const ageEnd =
    isResolvedOrClosed && doc.resolvedAt
      ? new Date(doc.resolvedAt)
      : new Date();

  const ageMinutes = Math.max(
    0,
    Math.floor((ageEnd - created) / 60000)
  );

  const targetMinutes = getTargetMinutes(doc.priority);
  const isOpen = doc.status === 'open' || doc.status === 'in_progress';

  let slaBreached = false;
  if (isOpen) {
    slaBreached = ageMinutes > targetMinutes;
  } else if (doc.resolvedAt) {
    const resolveMinutes = Math.floor(
      (new Date(doc.resolvedAt) - created) / 60000
    );
    slaBreached = resolveMinutes > targetMinutes;
  }

  return { ...doc, ageMinutes, slaBreached };
}

function canTransition(fromStatus, toStatus) {
  const fromIdx = STATUS_ORDER.indexOf(fromStatus);
  const toIdx = STATUS_ORDER.indexOf(toStatus);
  if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return false;
  return Math.abs(toIdx - fromIdx) === 1;
}

function isForwardTransition(fromStatus, toStatus) {
  return (
    STATUS_ORDER.indexOf(toStatus) === STATUS_ORDER.indexOf(fromStatus) + 1
  );
}

module.exports = {
  SLA_HOURS,
  STATUS_ORDER,
  getTargetMinutes,
  enrichTicket,
  canTransition,
  isForwardTransition,
};
