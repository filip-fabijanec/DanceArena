const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const mongoose = require('mongoose');
const connectDB = require('./config/dbConn');
const cors = require('cors');

app.use(express.json());
app.use(cors());

// Routes
app.use('/users', require('./routes/userRoutes'));
app.use('/competitions', require('./routes/competitionRoutes'));
app.use('/scores', require('./routes/scoreRoutes'));
app.use('/performances', require('./routes/performanceRoutes'));

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
