const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const mongoose = require('mongoose');
const connectDB = require('./config/dbConn');
const cors = require('cors');
const path = require('path');

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/competitions', require('./routes/competitionRoutes'));
app.use('/api/scores', require('./routes/scoreRoutes'));
app.use('/api/performances', require('./routes/performanceRoutes'));

// Connect to DB
connectDB();

// Start server immediately
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Optional: log MongoDB connection status
mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB database');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});
