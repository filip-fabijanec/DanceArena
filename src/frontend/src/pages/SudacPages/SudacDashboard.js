import React from 'react';
import Navbar from '../../components/Navbar';
import '../Dashboard.css';

function SudacDashboard() {
  return (
    <div>
      <Navbar />
      <div className="dashboard-container">
        <h1>Sudac Dashboard</h1>
        <p className="welcome-text">Dobrodošli! Ovdje možete ocjenjivati nastupe.</p>
        
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Moja natjecanja</h3>
            <p>Pregledajte natjecanja na kojima ste sudac.</p>
            <button className="card-button">Pregled natjecanja</button>
          </div>

          <div className="dashboard-card">
            <h3>Ocjenjivanje</h3>
            <p>Ocjenite nastupe na natjecanjima.</p>
            <button className="card-button">Ocijeni nastupe</button>
          </div>

          <div className="dashboard-card">
            <h3>Moje ocjene</h3>
            <p>Pregledajte svoje ocjene.</p>
            <button className="card-button">Pregled ocjena</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SudacDashboard;