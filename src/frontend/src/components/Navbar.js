import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // ===== DODAJ OVO ZA DEBUG =====
  console.log('Navbar - currentUser:', currentUser);
  // ==============================

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      organizator: 'Organizator',
      voditeljKluba: 'Voditelj kluba',
      sudac: 'Sudac',
      admin: 'Administrator',
    };
    return roleNames[role] || role;
  };

  // ===== DODAJ PROVJERU PRIJE RENDERA =====
  if (!currentUser) {
    return <div>Loading...</div>;
  }
  // ========================================

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <h2>DANCE ARENA</h2>
        </div>
        
        <div className="navbar-user">
          <div className="user-info">
            <span className="user-name">
              {currentUser.name || 'N/A'} {currentUser.surname || 'N/A'}
            </span>
            <span className="user-role">
              {getRoleDisplayName(currentUser.role) || 'Nepoznata uloga'}
            </span>
          </div>
          <button onClick={handleLogout} className="logout-button">
            Odjavi se
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;