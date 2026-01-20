import React from 'react';
import { Link } from 'react-router-dom';
import ExcuseButton from './ExcuseButton';
import './PublicNavbar.css';
import { ReactComponent as UnderdogsLogo } from './underdogs.svg';

function PublicNavbar() {
  return (
    <nav className="public-navbar">
      <div className="public-navbar-container">
        <Link to="/" className="navbar-logo">
          {/* ✅ Underdogs icon before "DANCE ARENA" */}
          <UnderdogsLogo className="navbar-underdogs-logo" aria-hidden="true" />
          <h2>DANCE ARENA</h2>
        </Link>

        <div className="navbar-links">
          <ExcuseButton />
          <Link to="/login" className="nav-link login-link">Prijava</Link>
        </div>
      </div>
    </nav>
  );
}

export default PublicNavbar;