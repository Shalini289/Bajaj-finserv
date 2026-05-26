function apiBase() {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
  if (envUrl) return envUrl;
  if (import.meta.env.DEV) return 'http://localhost:5001';
  return '';
}

const base = apiBase();

async function callApi(url, opts) {
  let res;
  try {
    res = await fetch(base + url, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    });
  } catch (err) {
    throw new Error(
      'Cannot reach API at ' + base + '. Run: npm run dev:backend (and keep MongoDB running)'
    );
  }

  let payload = {};
  try {
    payload = await res.json();
  } catch (_) {}

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
