require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// --- Global middleware -------------------------------------------------
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' })); // parses JSON request bodies into req.body
app.use(morgan('dev')); // logs every request to the console, e.g. "POST /api/auth/login 200 45ms"

// --- Health check --------------------------------------------------------
// Useful to quickly confirm the server (and nothing else) is up.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'classquest-backend', time: new Date().toISOString() });
});

// --- Feature routes --------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// --- 404 handler ---------------------------------------------------------
// Runs only if no route above matched.
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// --- Central error handler ------------------------------------------------
// Any controller that does something like `throw new Error(...)` or an
// unhandled rejection inside an async route ends up here instead of
// crashing the whole server or leaking a stack trace to the client.
app.use((err, req, res, next) => {
  console.error(err); // full detail stays server-side, in the logs
  res.status(err.status || 500).json({ error: 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`ClassQuest API running on http://localhost:${PORT}`);
});
