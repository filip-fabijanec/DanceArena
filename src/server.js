const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/dbConn');
const cors = require('cors');
const path = require('path');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(cors());

// === API ROUTES ===
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/competitions', require('./routes/competitionRoutes'));
app.use('/api/scores', require('./routes/scoreRoutes'));
app.use('/api/performances', require('./routes/performanceRoutes'));

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
