import React from 'react';
// import Navbar from '../components/Navbar'; // ZAKOMENTIRAJ OVO
import './Dashboard.css';

function AdminDashboard() {
  return (
    <div>
      {/* <Navbar /> */}
      <div className="dashboard-container">
        <h1>Administrator Dashboard - TEST</h1>
        <p className="welcome-text">Ako vidiš ovo, problem je u Navbar komponenti</p>
      </div>
    </div>
  );
}

export default AdminDashboard;