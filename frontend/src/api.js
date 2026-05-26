// in production set VITE_API_URL to your live backend (Render/Railway etc.)
const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function callApi(url, opts) {
  const res = await fetch(base + url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });

  let payload = {};
  try {
    payload = await res.json();
  } catch (_) {
    // non-json body
  }

  if (!res.ok) {
    let msg = payload.error || 'Something went wrong';
    if (payload.details && Array.isArray(payload.details)) {
      msg = payload.details.join(', ');
    }
    throw new Error(msg);
  }

  return payload;
}

export function fetchTickets(filters) {
  const q = new URLSearchParams();
  if (filters.priority) q.set('priority', filters.priority);
  if (filters.breached) q.set('breached', 'true');
  if (filters.status) q.set('status', filters.status);
  const tail = q.toString();
  return callApi('/tickets' + (tail ? '?' + tail : ''));
}

export function fetchStats() {
  return callApi('/tickets/stats');
}

export function createTicket(data) {
  return callApi('/tickets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function moveTicket(id, status) {
  return callApi('/tickets/' + id, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function removeTicket(id) {
  return callApi('/tickets/' + id, { method: 'DELETE' });
}
