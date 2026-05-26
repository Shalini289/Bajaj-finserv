function apiBase() {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
  if (envUrl) return envUrl;
  if (import.meta.env.DEV) return 'http://localhost:5001';
  // same host when UI is served from Express (STATIC_DIR on Render)
  return '';
}

const base = apiBase();

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callApi(url, opts, attempt = 1) {
  const maxAttempts = 3;
  let res;

  try {
    res = await fetch(base + url, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    });
  } catch (err) {
    // Render free tier may be waking up — retry a couple times
    if (attempt < maxAttempts && base.startsWith('https://')) {
      await wait(2000 * attempt);
      return callApi(url, opts, attempt + 1);
    }
    const hint = base
      ? 'API at ' + base + ' did not respond. If using Render free tier, wait ~1 min and refresh.'
      : 'API not reachable. Check VITE_API_URL or serve UI from the same backend (STATIC_DIR).';
    throw new Error(hint);
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
