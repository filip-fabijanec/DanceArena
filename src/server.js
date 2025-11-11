const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/dbConn');
 
// Učitavanje .env varijabli
dotenv.config();
 
// Inicijalizacija Express aplikacije
const app = express();
const PORT = process.env.PORT || 8080;
 
// Spajanje na bazu podataka
connectDB();
 
// === MIDDLEWARE ===
// Dopusti CORS zahtjeve (jednostavna konfiguracija koja sve dopušta)
app.use(cors());
// Omogući čitanje JSON-a iz tijela zahtjeva
app.use(express.json());
 
// === API RUTE ===
// Sve API rute su prefiksirane s '/api' da se izbjegne konflikt s frontend rutama
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/competitions', require('./routes/competitionRoutes'));
app.use('/api/scores', require('./routes/scoreRoutes')); // Koristim 'scores' kako ste naveli
app.use('/api/performances', require('./routes/performanceRoutes'));
 
// === SERVIRANJE FRONTENDA ZA PRODUKCIJU ===
// Ovaj dio se izvršava samo u produkcijskom okruženju (npr. na Renderu)
if (process.env.NODE_ENV === 'production') {
  // Postavi putanju do build direktorija React aplikacije
  const frontendBuildPath = path.resolve(__dirname, '..', '..', 'frontend', 'build');
 
  // Serviraj statičke datoteke (CSS, JS, slike) iz build direktorija
  app.use(express.static(frontendBuildPath));
 
  // "Catch-all" ruta: za sve ostale GET zahtjeve koji nisu API,
  // pošalji 'index.html' kako bi React Router preuzeo kontrolu
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}
 
// Listeneri za status konekcije s bazom
mongoose.connection.on('connected', () => {
  console.log('Uspješno spojeno na MongoDB.');
  // Pokreni server tek nakon uspješnog spajanja na bazu
  app.listen(PORT, () => console.log(`Server pokrenut na portu ${PORT}`));
});
 
mongoose.connection.on('error', (err) => {
  console.error('Greška prilikom spajanja na MongoDB:', err);
});
