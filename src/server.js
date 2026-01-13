const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/dbConn');
const cors = require('cors');
const path = require('path');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

// ⚠️ VAŽNO: Stripe webhook mora biti PRIJE express.json() middleware-a
app.use('/api/stripe/webhook', express.raw({type: 'application/json'}), require('./controllers/stripeController').stripeWebhook);

// Middleware
app.use(express.json());
app.use(cors());

// === API ROUTES ===
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/competitions', require('./routes/competitionRoutes'));
app.use('/api/scores', require('./routes/scoreRoutes'));
app.use('/api/performances', require('./routes/performanceRoutes'));
app.use('/api/stripe', require('./routes/stripeRoutes'));
app.use('/api/invites', require('./routes/inviteRoutes'));
app.use('/api/upload-song', require('./routes/uploadSongRoutes'));
app.use('/api/clanarine', require('./routes/clanarineRoutes'));




// === SERVE FRONTEND LAST ===
app.use(express.static(path.join(__dirname, 'frontend/build')));

// React fallback (catch-all AFTER API routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

// Connect DB
connectDB();

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

mongoose.connection.on('connected', () => console.log('Connected to MongoDB'));
mongoose.connection.on('error', (err) => console.error('MongoDB error:', err));