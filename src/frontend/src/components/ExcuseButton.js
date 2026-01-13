import React, { useState } from 'react';
import './ExcuseButton.css';

function ExcuseButton() {
  const [loading, setLoading] = useState(false);
  const [excuse, setExcuse] = useState('');
  const [showExcuse, setShowExcuse] = useState(false);

  const getExcuse = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://naas.isalman.dev/no');
      if (!response.ok) throw new Error('Failed to fetch excuse');
      const data = await response. json();
      setExcuse(data.reason);
      setShowExcuse(true);
    } catch (error) {
      console.error('Error fetching excuse:', error);
      setExcuse('Ups!  Izgovor je pobjegao...  Pokušajte ponovno!  😅');
      setShowExcuse(true);
    } finally {
      setLoading(false);
    }
  };

  const closeExcuse = () => {
    setShowExcuse(false);
  };

  return (
    <>
      <button 
        className="nav-link"  // <-- MAKNUTO "excuse-btn"
        onClick={getExcuse}
        disabled={loading}
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        {loading ? '⏳' : 'Izgovor'}
      </button>

      {showExcuse && (
        <div className="excuse-modal" onClick={closeExcuse}>
          <div className="excuse-content" onClick={(e) => e.stopPropagation()}>
            <span className="excuse-close" onClick={closeExcuse}>&times;</span>
            <div className="excuse-emoji">😅</div>
            <h2>Zašto nismo napravili progi prije? </h2>
            <p className="excuse-text">{excuse}</p>
            <button className="excuse-close-btn" onClick={closeExcuse}>
              Zatvori
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ExcuseButton;