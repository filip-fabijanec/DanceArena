import React from 'react';
import { Link } from 'react-router-dom';
import '../Dashboard.css';

function SudacDashboard() {
  return (
    <div>
      <div className="dashboard-container sudac-dashboard">
        <h1>Sudac Dashboard</h1>
        <p className="welcome-text">Dobrodošli! Odaberite jednu od opcija.</p>
        
        <div className="dashboard-grid">
          {/* Link vodi na "moja-natjecanja" unutar /sudac/* rute */}
          <Link to="moja-natjecanja" style={{ textDecoration: 'none' }}>
            <div className="dashboard-card">
              <div className="card-inner">
                <div className="card-icon">🏆</div>
                <div>
                  <h3>Moja natjecanja</h3>
                  <p>Pregledajte natjecanja na kojima ste sudac.</p>
                </div>
              </div>
            </div>
          </Link>

          <Link to="ocjenjeno" style={{ textDecoration: 'none' }}>
            <div className="dashboard-card">
              <div className="card-inner">
                <div className="card-icon">📊</div>
                <div>
                  <h3>Moje ocjene</h3>
                  <p>Pregledajte svoje prošle ocjene.</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SudacDashboard;