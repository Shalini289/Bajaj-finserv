const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      data.error ||
      (Array.isArray(data.details) ? data.details.join(', ') : 'Request failed');
    throw new Error(message);
  }
  return data;
}

export const api = {
  getTickets: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.priority) qs.set('priority', params.priority);
    if (params.breached) qs.set('breached', 'true');
    const query = qs.toString();
    return request(`/tickets${query ? `?${query}` : ''}`);
  },
  getStats: () => request('/tickets/stats'),
  createTicket: (body) =>
    request('/tickets', { method: 'POST', body: JSON.stringify(body) }),
  updateStatus: (id, status) =>
    request(`/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteTicket: (id) => request(`/tickets/${id}`, { method: 'DELETE' }),
};
