/**
 * DeskFlow API smoke tests — run: node test-api.js [baseUrl]
 * Default: http://localhost:5001
 */
const BASE = process.argv[2] || 'http://localhost:5001';

let passed = 0;
let failed = 0;

function ok(name) {
  passed++;
  console.log('  ✓', name);
}

function fail(name, detail) {
  failed++;
  console.log('  ✗', name);
  if (detail) console.log('    ', detail);
}

async function req(path, opts = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  let body = {};
  try {
    body = await res.json();
  } catch (_) {}
  return { res, body };
}

async function run() {
  console.log('\nDeskFlow API tests @', BASE, '\n');

  // health
  {
    const { res, body } = await req('/health');
    if (res.ok && body.ok) ok('GET /health');
    else fail('GET /health', res.status);
  }

  // create valid ticket
  let ticketId;
  {
    const { res, body } = await req('/tickets', {
      method: 'POST',
      body: JSON.stringify({
        subject: 'Test login issue',
        description: 'Cannot access account',
        customerEmail: 'test.user@example.com',
        priority: 'high',
      }),
    });
    if (res.status === 201 && body._id && body.status === 'open' && body.ageMinutes >= 0) {
      ok('POST /tickets — valid create');
      ticketId = body._id;
    } else fail('POST /tickets — valid create', JSON.stringify(body));
  }

  // missing subject
  {
    const { res, body } = await req('/tickets', {
      method: 'POST',
      body: JSON.stringify({
        description: 'x',
        customerEmail: 'a@b.com',
        priority: 'low',
      }),
    });
    if (res.status === 400 && body.error) ok('POST /tickets — missing subject → 400');
    else fail('POST /tickets — missing subject', res.status);
  }

  // bad email
  {
    const { res, body } = await req('/tickets', {
      method: 'POST',
      body: JSON.stringify({
        subject: 'x',
        description: 'x',
        customerEmail: 'not-an-email',
        priority: 'low',
      }),
    });
    if (res.status === 400 && body.error) ok('POST /tickets — bad email → 400');
    else fail('POST /tickets — bad email', res.status);
  }

  // unknown priority
  {
    const { res, body } = await req('/tickets', {
      method: 'POST',
      body: JSON.stringify({
        subject: 'x',
        description: 'x',
        customerEmail: 'a@b.com',
        priority: 'critical',
      }),
    });
    if (res.status === 400 && body.error) ok('POST /tickets — unknown priority → 400');
    else fail('POST /tickets — unknown priority', res.status);
  }

  // invalid transition open → resolved
  if (ticketId) {
    const { res, body } = await req('/tickets/' + ticketId, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'resolved' }),
    });
    if (res.status === 400 && body.error && body.error.includes('resolved')) {
      ok('PATCH — open → resolved rejected');
    } else fail('PATCH — open → resolved rejected', body.error);
  }

  // valid forward open → in_progress
  if (ticketId) {
    const { res, body } = await req('/tickets/' + ticketId, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'in_progress' }),
    });
    if (res.ok && body.status === 'in_progress') ok('PATCH — open → in_progress');
    else fail('PATCH — open → in_progress', body.error);
  }

  // in_progress → resolved sets resolvedAt
  if (ticketId) {
    const { res, body } = await req('/tickets/' + ticketId, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'resolved' }),
    });
    if (res.ok && body.status === 'resolved' && body.resolvedAt) {
      ok('PATCH — resolved sets resolvedAt');
    } else fail('PATCH — resolved sets resolvedAt', JSON.stringify(body));
  }

  // ageMinutes frozen on resolved (check field exists and resolvedAt used)
  if (ticketId) {
    const { res, body } = await req('/tickets/' + ticketId, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'resolved' }),
    });
    const { body: list } = await req('/tickets');
    const t = list.find((x) => x._id === ticketId);
    if (t && t.status === 'resolved' && typeof t.ageMinutes === 'number') {
      ok('GET list — resolved ticket has ageMinutes');
    } else fail('GET list — resolved ticket ageMinutes');
  }

  // resolved → in_progress clears resolvedAt
  if (ticketId) {
    const { res, body } = await req('/tickets/' + ticketId, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'in_progress' }),
    });
    if (res.ok && body.status === 'in_progress' && !body.resolvedAt) {
      ok('PATCH — back to in_progress clears resolvedAt');
    } else fail('PATCH — clears resolvedAt', body.resolvedAt);
  }

  // unknown status on patch
  if (ticketId) {
    const { res, body } = await req('/tickets/' + ticketId, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'pending' }),
    });
    if (res.status === 400 && body.error) ok('PATCH — unknown status → 400');
    else fail('PATCH — unknown status', res.status);
  }

  // unknown query priority
  {
    const { res, body } = await req('/tickets?priority=invalid');
    if (res.status === 400 && body.error) ok('GET — unknown priority filter → 400');
    else fail('GET — unknown priority filter', res.status);
  }

  // unknown query status
  {
    const { res, body } = await req('/tickets?status=done');
    if (res.status === 400 && body.error) ok('GET — unknown status filter → 400');
    else fail('GET — unknown status filter', res.status);
  }

  // stats
  {
    const { res, body } = await req('/tickets/stats');
    if (
      res.ok &&
      body.byStatus &&
      body.byPriority &&
      typeof body.breachedOpen === 'number'
    ) {
      ok('GET /tickets/stats');
    } else fail('GET /tickets/stats');
  }

  // combined filters
  {
    const { res, body } = await req('/tickets?priority=high&breached=true');
    if (res.ok && Array.isArray(body)) {
      const allMatch = body.every(
        (t) => t.priority === 'high' && t.slaBreached === true
      );
      if (allMatch) ok('GET — priority + breached filters combined');
      else fail('GET — combined filters', 'some rows mismatch');
    } else fail('GET — combined filters', res.status);
  }

  // delete
  if (ticketId) {
    const { res } = await req('/tickets/' + ticketId, { method: 'DELETE' });
    if (res.ok) ok('DELETE /tickets/:id');
    else fail('DELETE /tickets/:id', res.status);
  }

  // invalid id
  {
    const { res, body } = await req('/tickets/notvalid123', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'open' }),
    });
    if (res.status === 400 && body.error) ok('PATCH — invalid id → 400');
    else fail('PATCH — invalid id', res.status);
  }

  console.log('\n--- Results ---');
  console.log('Passed:', passed);
  console.log('Failed:', failed);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error('Test run crashed:', e.message);
  console.error('Is the server running at', BASE, '?');
  process.exit(1);
});
