import React from 'react';
import { Link } from 'react-router-dom';
import '../Dashboard.css';

function Dashboard() {
  return (
    <div className="dashboard-container">
      <h1>Organizator Dashboard</h1>
      <p className="welcome-text">Dobrodošli! Ovdje možete upravljati natjecanjima.</p>
      
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>📋 Kreiranje natjecanja</h3>
          <p>Kreirajte novo natjecanje s kategorijama i detaljima.</p>
          <Link to="/organizator/kreiranje-natjecanja" className="card-button">
            Kreiraj natjecanje
          </Link>
        </div>

        <div className="dashboard-card">
          <h3>🏆 Moja natjecanja</h3>
          <p>Pregledajte i upravljajte svojim natjecanjima.</p>
          <Link to="/organizator/natjecanja" className="card-button">
            Moja natjecanja
          </Link>
        </div>

        <div className="dashboard-card">
          <h3>👥 Upravljanje prijavama</h3>
          <p>Pregledajte i upravljajte prijavama na natjecanja.</p>
          <Link to="/organizator/prijave" className="card-button">
            Pregled prijava
          </Link>
        </div>

        <div className="dashboard-card">
          <h3>⚖️ Odabir sudaca</h3>
          <p>Dodijelite suce za vaša natjecanja.</p>
          <Link to="/organizator/suci" className="card-button">
            Odaberi suce
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;