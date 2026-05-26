const express = require('express');
const validator = require('validator');
const Ticket = require('../models/Ticket');
const { PRIORITIES, STATUSES } = require('../models/Ticket');
const { buildTicketResponse, allowedToMove, FLOW } = require('../utils/sla');

const router = express.Router();

function checkNewTicket(body) {
  const problems = [];

  if (!body.subject || !String(body.subject).trim()) {
    problems.push('subject is required');
  }
  if (!body.description || !String(body.description).trim()) {
    problems.push('description is required');
  }

  const email = body.customerEmail ? String(body.customerEmail).trim() : '';
  if (!email) {
    problems.push('customerEmail is required');
  } else if (!validator.isEmail(email)) {
    problems.push('customerEmail must be a valid email address');
  }

  if (!body.priority) {
    problems.push('priority is required');
  } else if (!PRIORITIES.includes(body.priority)) {
    problems.push(
      'priority must be low, medium, high, or urgent — got "' + body.priority + '"'
    );
  }

  return problems;
}

function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

// stats has to be before /:id style routes
router.get('/stats', async (req, res) => {
  try {
    const all = await Ticket.find().lean();
    const rows = all.map(buildTicketResponse);

    const byStatus = {};
    const byPriority = {};
    STATUSES.forEach((s) => { byStatus[s] = 0; });
    PRIORITIES.forEach((p) => { byPriority[p] = 0; });

    let breachedOpen = 0;
    for (let i = 0; i < rows.length; i++) {
      const t = rows[i];
      byStatus[t.status]++;
      byPriority[t.priority]++;
      if ((t.status === 'open' || t.status === 'in_progress') && t.slaBreached) {
        breachedOpen++;
      }
    }

    res.json({ byStatus, byPriority, breachedOpen });
  } catch (e) {
    console.error('stats error', e);
    res.status(500).json({ error: 'Could not load stats right now' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { status, priority, breached } = req.query;
    const mongoFilter = {};

    if (status) {
      if (!STATUSES.includes(status)) {
        return badRequest(
          res,
          'Unknown status "' + status + '". Valid: ' + STATUSES.join(', ')
        );
      }
      mongoFilter.status = status;
    }

    if (priority) {
      if (!PRIORITIES.includes(priority)) {
        return badRequest(
          res,
          'Unknown priority "' + priority + '". Valid: ' + PRIORITIES.join(', ')
        );
      }
      mongoFilter.priority = priority;
    }

    const raw = await Ticket.find(mongoFilter).sort({ createdAt: -1 });
    let list = raw.map(buildTicketResponse);

    // breached is computed server-side so we filter after attaching sla flags
    if (breached === 'true') {
      list = list.filter((t) => t.slaBreached);
    }

    res.json(list);
  } catch (e) {
    console.error('list tickets', e);
    res.status(500).json({ error: 'Could not fetch tickets' });
  }
});

router.post('/', async (req, res) => {
  try {
    const problems = checkNewTicket(req.body || {});
    if (problems.length) {
      return res.status(400).json({
        error: problems[0],
        details: problems,
      });
    }

    const saved = await Ticket.create({
      subject: req.body.subject.trim(),
      description: req.body.description.trim(),
      customerEmail: req.body.customerEmail.trim().toLowerCase(),
      priority: req.body.priority,
    });

    res.status(201).json(buildTicketResponse(saved));
  } catch (e) {
    if (e.name === 'ValidationError') {
      const msg = Object.values(e.errors)
        .map((x) => x.message)
        .join('; ');
      return badRequest(res, msg);
    }
    console.error('create ticket', e);
    res.status(500).json({ error: 'Could not save ticket' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'No ticket with that id' });
    }

    const nextStatus = req.body && req.body.status;
    if (!nextStatus) {
      return badRequest(res, 'Send a status in the request body to update a ticket');
    }

    if (!STATUSES.includes(nextStatus)) {
      return badRequest(
        res,
        'Unknown status "' + nextStatus + '". Valid: ' + STATUSES.join(', ')
      );
    }

    const was = ticket.status;
    if (!allowedToMove(was, nextStatus)) {
      return badRequest(
        res,
        'Cannot jump from "' + was + '" to "' + nextStatus + '". ' +
          'Move one step along: ' + FLOW.join(' → ')
      );
    }

    ticket.status = nextStatus;

    if (nextStatus === 'resolved' && was !== 'resolved') {
      ticket.resolvedAt = new Date();
    }
    if (was === 'resolved' && nextStatus === 'in_progress') {
      ticket.resolvedAt = null;
    }

    await ticket.save();
    res.json(buildTicketResponse(ticket));
  } catch (e) {
    if (e.name === 'CastError') {
      return badRequest(res, 'That ticket id does not look valid');
    }
    console.error('patch ticket', e);
    res.status(500).json({ error: 'Update failed' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const removed = await Ticket.findByIdAndDelete(req.params.id);
    if (!removed) {
      return res.status(404).json({ error: 'No ticket with that id' });
    }
    res.json({ ok: true, ticket: buildTicketResponse(removed) });
  } catch (e) {
    if (e.name === 'CastError') {
      return badRequest(res, 'That ticket id does not look valid');
    }
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
