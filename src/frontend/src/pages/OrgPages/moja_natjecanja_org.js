import React from 'react';
import { Link } from 'react-router-dom';
import '../Dashboard.css';

function MojaNatjecanja() {
  return (
    <div className="dashboard-container">
      <Link to="/organizator" className="back-link">← Natrag na Dashboard</Link>
      <h1>WORK IN PROGRESS</h1>
      <p>Pregled natjecanje, možda spajanje na editanje ako nisu već javna? neznan</p>
    </div>
  );
}

export default MojaNatjecanja;