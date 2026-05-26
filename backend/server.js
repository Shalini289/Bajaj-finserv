require('dotenv').config({ override: true });

const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const ticketRoutes = require('./routes/tickets');

const app = express();
const PORT = process.env.PORT || 5000;
const DB_URL = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/deskflow';

const allowedOrigins = (process.env.CLIENT_ORIGIN || process.env.FRONTEND_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// local dev — localhost and 127.0.0.1 on common Vite ports
const localDevOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      if (localDevOrigins.includes(origin)) return cb(null, true);
      if (allowedOrigins.length === 0) return cb(null, true);
      cb(null, false);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use('/tickets', ticketRoutes);

app.get('/health', (req, res) => {
  res.json({ ok: true, name: 'deskflow-api' });
});

// optional: host the built react app from the same service (handy on Render)
const staticDir = process.env.STATIC_DIR;
if (staticDir) {
  const dist = path.resolve(staticDir);
  app.use(express.static(dist));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/tickets')) {
      res.sendFile(path.join(dist, 'index.html'));
    }
  });
}

mongoose
  .connect(DB_URL)
  .then(() => {
    app.listen(PORT, () => {
      console.log('DeskFlow API listening on port', PORT);
    });
  })
  .catch((err) => {
    console.error('Mongo connection error:', err.message);
    process.exit(1);
  });
