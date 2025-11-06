import React from 'react';
import { Link } from 'react-router-dom';
import '../Dashboard.css';

function OdabirSudaca() {
  return (
    <div className="dashboard-container">
      <Link to="/organizator" className="back-link">← Natrag na Dashboard</Link>
      <h1>WORK IN PROGRESS</h1>
      <p>Omogućiti pregled sudaca, biranje sudaca za natjecanje, nekakav fetch ali samo ako je role sudac</p>
    </div>
  );
}

export default OdabirSudaca;