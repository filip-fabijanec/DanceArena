import React from 'react';
import Navbar from '../components/Navbar';
import './Dashboard.css';

function AdminDashboard() {
  return (
    <div>
      <Navbar />
      <div className="dashboard-container">
        <h1>Administrator Dashboard</h1>
        <p className="welcome-text">Dobrodošli! Ovdje možete upravljati sustavom.</p>
        
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>👥 Upravljanje korisnicima</h3>
            <p>Dodajte, uređujte ili brišite korisnike.</p>
            <button className="card-button">Upravljaj korisnicima</button>
          </div>

          <div className="dashboard-card">
            <h3>💰 Članarine</h3>
            <p>Postavljanje i upravljanje članarinama.</p>
            <button className="card-button">Postavi članarinu</button>
          </div>

          <div className="dashboard-card">
            <h3>📊 Pregled sustava</h3>
            <p>Pregledajte sve aktivnosti u sustavu.</p>
            <button className="card-button">Pregled aktivnosti</button>
          </div>

          <div className="dashboard-card">
            <h3>🎯 Sva natjecanja</h3>
            <p>Pregledajte sva natjecanja u sustavu.</p>
            <button className="card-button">Pregled natjecanja</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;