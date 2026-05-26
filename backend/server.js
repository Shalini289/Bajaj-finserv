require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const ticketsRouter = require('./routes/tickets');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/deskflow';

app.use(cors());
app.use(express.json());
app.use('/tickets', ticketsRouter);

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'DeskFlow API' });
});

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`DeskFlow API running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
