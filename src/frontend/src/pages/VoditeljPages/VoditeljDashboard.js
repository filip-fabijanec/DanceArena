import React from 'react';
import Navbar from '../../components/Navbar';
import '../Dashboard.css';

function VoditeljDashboard() {
  return (
    <div>
      <Navbar />
      <div className="dashboard-container">
        <h1>Voditelj Kluba Dashboard</h1>
        <p className="welcome-text">Dobrodošli! Ovdje možete upravljati prijavama vaših grupa.</p>
        
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>👤 Moj profil</h3>
            <p>Uredite podatke vašeg plesnog kluba.</p>
            <button className="card-button">Uredi profil</button>
          </div>

          <div className="dashboard-card">
            <h3>🎭 Prijava nastupa</h3>
            <p>Prijavite svoju grupu na natjecanje.</p>
            <button className="card-button">Prijavi nastup</button>
          </div>

          <div className="dashboard-card">
            <h3>📝 Moje prijave</h3>
            <p>Pregledajte status vaših prijava.</p>
            <button className="card-button">Pregled prijava</button>
          </div>

          <div className="dashboard-card">
            <h3>🏆 Rezultati</h3>
            <p>Pogledajte rezultate natjecanja.</p>
            <button className="card-button">Pregled rezultata</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoditeljDashboard;