require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const questionRoutes = require('./routes/questionRoutes');
const challengeRoutes = require('./routes/challengerRoutes'); // Match your exact file name
const examRoutes = require('./routes/examRoutes');
const submissionRoutes = require('./routes/submissionRoutes');

const app = express();
app.set("trust proxy", 1);

// --- Global middleware -------------------------------------------------
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// --- Health check --------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'classquest-backend', time: new Date().toISOString() });
});

// --- Feature routes --------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/submissions', submissionRoutes);

// --- 404 handler ---------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// --- Central error handler ------------------------------------------------
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`ClassQuest API running on http://localhost:${PORT}`);
});