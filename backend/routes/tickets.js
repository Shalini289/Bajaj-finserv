const express = require('express');
const validator = require('validator');
const Ticket = require('../models/Ticket');
const { PRIORITIES, STATUSES } = require('../models/Ticket');
const { enrichTicket, canTransition, STATUS_ORDER } = require('../utils/sla');

const router = express.Router();

function validateCreateBody(body) {
  const errors = [];
  if (!body.subject?.trim()) errors.push('subject is required');
  if (!body.description?.trim()) errors.push('description is required');
  if (!body.customerEmail?.trim()) {
    errors.push('customerEmail is required');
  } else if (!validator.isEmail(body.customerEmail.trim())) {
    errors.push('customerEmail must be a valid email');
  }
  if (!body.priority) {
    errors.push('priority is required');
  } else if (!PRIORITIES.includes(body.priority)) {
    errors.push(`priority must be one of: ${PRIORITIES.join(', ')}`);
  }
  return errors;
}

router.get('/stats', async (_req, res) => {
  try {
    const tickets = await Ticket.find();
    const enriched = tickets.map(enrichTicket);

    const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    const byPriority = Object.fromEntries(PRIORITIES.map((p) => [p, 0]));
    let breachedOpen = 0;

    for (const t of enriched) {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
      if (
        (t.status === 'open' || t.status === 'in_progress') &&
        t.slaBreached
      ) {
        breachedOpen += 1;
      }
    }

    res.json({ byStatus, byPriority, breachedOpen });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status && STATUSES.includes(req.query.status)) {
      filter.status = req.query.status;
    }
    if (req.query.priority && PRIORITIES.includes(req.query.priority)) {
      filter.priority = req.query.priority;
    }

    const tickets = await Ticket.find(filter).sort({ createdAt: -1 });
    let enriched = tickets.map(enrichTicket);

    if (req.query.breached === 'true') {
      enriched = enriched.filter((t) => t.slaBreached);
    }

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const errors = validateCreateBody(req.body);
    if (errors.length) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const ticket = await Ticket.create({
      subject: req.body.subject.trim(),
      description: req.body.description.trim(),
      customerEmail: req.body.customerEmail.trim().toLowerCase(),
      priority: req.body.priority,
      status: 'open',
    });

    res.status(201).json(enrichTicket(ticket));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const { status } = req.body;
    if (status === undefined) {
      return res.status(400).json({ error: 'status is required for update' });
    }
    if (!STATUSES.includes(status)) {
      return res.status(400).json({
        error: `status must be one of: ${STATUSES.join(', ')}`,
      });
    }

    if (!canTransition(ticket.status, status)) {
      return res.status(400).json({
        error: `Invalid status transition from "${ticket.status}" to "${status}". Allowed flow: ${STATUS_ORDER.join(' → ')} (one step at a time).`,
      });
    }

    const previousStatus = ticket.status;
    ticket.status = status;

    if (status === 'resolved' && previousStatus !== 'resolved') {
      ticket.resolvedAt = new Date();
    } else if (previousStatus === 'resolved' && status === 'in_progress') {
      ticket.resolvedAt = null;
    }

    await ticket.save();
    res.json(enrichTicket(ticket));
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ticket id' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json({ message: 'Ticket deleted', ticket: enrichTicket(ticket) });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ticket id' });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
