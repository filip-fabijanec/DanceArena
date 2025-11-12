import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import '../Dashboard.css';

function SudacDashboard() {
  return (
    <div>
      <Navbar />
      <div className="dashboard-container">
        <h1>Sudac Dashboard</h1>
        <p className="welcome-text">Dobrodošli! Odaberite jednu od opcija.</p>
        
        <div className="dashboard-grid">
          {/* Link vodi na "moja-natjecanja" unutar /sudac/* rute */}
          <Link to="moja-natjecanja" style={{ textDecoration: 'none' }}>
            <div className="dashboard-card">
              <h3>Moja natjecanja</h3>
              <p>Pregledajte natjecanja na kojima ste sudac.</p>
            </div>
          </Link>

          <Link to="ocjenjeno" style={{ textDecoration: 'none' }}>
            <div className="dashboard-card">
              <h3>Moje ocjene</h3>
              <p>Pregledajte svoje prošle ocjene.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SudacDashboard;