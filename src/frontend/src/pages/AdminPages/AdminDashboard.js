import React from 'react';
import { Link } from 'react-router-dom';
import '../Dashboard.css';

function Dashboard() {
  return (
    <div>
      <div className="dashboard-container">
        <h1>Administrator Dashboard</h1>
        <p className="welcome-text">Dobrodošli! Ovdje možete upravljati sustavom.</p>
        
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>👥 Upravljanje korisnicima</h3>
            <p>Dodajte, uređujte ili brišite korisnike.</p>
            <Link to="/admin/korisnici" className="card-button">
                Upravljaj korisnicima
            </Link>
          </div>

          <div className="dashboard-card">
            <h3>💰 Članarine</h3>
            <p>Postavljanje i upravljanje članarinama.</p>
            <Link to="/admin/članarine" className="card-button">
                Upravljaj članarinama
            </Link>
          </div>

          <div className="dashboard-card">
            <h3>📊 Pregled sustava</h3>
            <p>Pregledajte sve aktivnosti u sustavu.</p>
             <Link to="/admin/sustav" className="card-button">
                Pregled aktivnosti
            </Link>
          </div>

          <div className="dashboard-card">
            <h3>🎯 Sva natjecanja</h3>
            <p>Pregledajte sva natjecanja u sustavu.</p>
            <Link to="/admin/natjecanja" className="card-button">
                Pregled natjecanja
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;