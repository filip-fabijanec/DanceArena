
const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3500;
const mongoose = require('mongoose');
const connectDB = require('./config/dbConn');

app.use(express.json());
const cors = require('cors');
app.use(cors());

//rute
const userRoutes = require('./routes/userRoutes');
const competitionRoutes = require('./routes/competitionRoutes');
const scoreRoutes = require('./routes/scoreRoutes');
const performanceRoutes = require('./routes/performanceRoutes');

//Povezivanje s bazom podataka
connectDB();

app.use('/users', userRoutes);
app.use('/competitions', competitionRoutes);
app.use('/scores', scoreRoutes);
app.use('/performances', performanceRoutes);

//Slusamo na portu samo ako se uspostavi veza s bazom podataka
mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB database');
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
