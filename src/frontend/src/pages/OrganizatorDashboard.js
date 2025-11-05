import React from 'react';
import Navbar from '../components/Navbar';
import './Dashboard.css';

function OrganizatorDashboard() {
  return (
    <div>
      <Navbar />
      <div className="dashboard-container">
        <h1>Organizator Dashboard</h1>
        <p className="welcome-text">Dobrodošli! Ovdje možete upravljati natjecanjima.</p>
        
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>📋 Kreiranje natjecanja</h3>
            <p>Kreirajte novo natjecanje s kategorijama i detaljima.</p>
            <button className="card-button">Kreiraj natjecanje</button>
          </div>

          <div className="dashboard-card">
            <h3>👥 Upravljanje prijavama</h3>
            <p>Pregledajte i upravljajte prijavama na natjecanja.</p>
            <button className="card-button">Pregled prijava</button>
          </div>

          <div className="dashboard-card">
            <h3>⚖️ Odabir sudaca</h3>
            <p>Dodijelite suce za vaša natjecanja.</p>
            <button className="card-button">Odaberi suce</button>
          </div>

          <div className="dashboard-card">
            <h3>📄 PDF dokumenti</h3>
            <p>Generirajte i preuzmite PDF dokumente.</p>
            <button className="card-button">Generiraj PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrganizatorDashboard;