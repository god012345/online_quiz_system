const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

/* =========================
   RATE LIMITING
========================= */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});

// Higher limit for admin operations (less strict)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  skip: (req) => !req.path.startsWith('/api/admin') // Only apply to admin routes
});

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}));
app.use(adminLimiter);
app.use(limiter);
app.use(express.static('public'));

/* =========================
   IMPORT ROUTES
========================= */
const userRoutes = require('./routes/userRoutes');
const quizRoutes = require('./routes/quizRoutes');
const adminRoutes = require('./routes/adminRoutes');

/* =========================
   API ROUTES
========================= */
app.use('/api/users', userRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/admin', adminRoutes);

/* =========================
   TEST ROUTES (DEBUG)
========================= */
app.get('/api/test', (req, res) => {
  console.log('✅ Test GET endpoint hit');
  res.json({
    message: 'API is working!',
    timestamp: new Date()
  });
});

app.post('/api/test-post', (req, res) => {
  console.log('✅ Test POST endpoint hit');
  console.log('Request body:', req.body);
  res.json({
    message: 'POST is working!',
    received: req.body,
    timestamp: new Date()
  });
});

/* =========================
   PAGE ROUTES
========================= */
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/quiz', (req, res) => {
  res.sendFile(__dirname + '/public/quiz.html');
});

app.get('/leaderboard', (req, res) => {
  res.sendFile(__dirname + '/public/leaderboard.html');
});

app.get('/admin', (req, res) => {
  res.sendFile(__dirname + '/public/admin.html');
});

/* =========================
   404 HANDLER (MUST BE LAST)
========================= */
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

/* =========================
   ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app; 
