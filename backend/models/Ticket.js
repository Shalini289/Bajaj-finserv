const mongoose = require('mongoose');

const priorities = ['low', 'medium', 'high', 'urgent'];
const statuses = ['open', 'in_progress', 'resolved', 'closed'];

const ticketSchema = new mongoose.Schema({
  subject: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  customerEmail: { type: String, required: true, trim: true, lowercase: true },
  priority: { type: String, required: true, enum: priorities },
  status: { type: String, enum: statuses, default: 'open' },
  resolvedAt: { type: Date, default: null },
}, {
  timestamps: { createdAt: true, updatedAt: true },
});

module.exports = mongoose.model('Ticket', ticketSchema);
module.exports.PRIORITIES = priorities;
module.exports.STATUSES = statuses;
