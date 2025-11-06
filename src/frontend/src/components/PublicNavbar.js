import React from 'react';
import { Link } from 'react-router-dom';
import './PublicNavbar.css';

function PublicNavbar() {
  return (
    <nav className="public-navbar">
      <div className="public-navbar-container">
        <Link to="/" className="navbar-logo">
          <h2>🕺 DANCE ARENA</h2>
        </Link>
        
        <div className="navbar-links">
          <Link to="/" className="nav-link">Početna</Link>
          <Link to="/natjecanja" className="nav-link">Natjecanja</Link>
          <Link to="/o-nama" className="nav-link">O nama</Link>
          <Link to="/login" className="nav-link login-link">Prijava</Link>
        </div>
      </div>
    </nav>
  );
}

export default PublicNavbar;