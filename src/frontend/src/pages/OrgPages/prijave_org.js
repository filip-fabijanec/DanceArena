import React from 'react';
import { Link } from 'react-router-dom';
import '../Dashboard.css';

function UpravljanjePrijavama() {
  return (
    <div className="dashboard-container">
      <Link to="/organizator/natjecanja" className="back-link">← Natrag na pregled natjecanja</Link>
      <h1>WORK IN PROGRESS</h1>
      <p>Lista prijava, pregled, odobravanje, odbijanje i sl.</p>
    </div>
  );
}

export default UpravljanjePrijavama;