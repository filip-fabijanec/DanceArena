import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios'; 
import './placanje_clanarine.css';

function PlacanjeClanarine() {
  const { currentUser } = useAuth();
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState('');

  // STATE za dinamičku cijenu (po defaultu 0 ili null dok se ne učita)
  const [membershipPrice, setMembershipPrice] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. DOHVAĆANJE CIJENE IZ BAZE (tvoj settingsRoutes.js)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Pretpostavljam da je tvoja ruta montirana na /api/settings
        // Provjeri u server.js (npr. app.use('/api/settings', settingsRoutes))
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/settings`);
        
        // Postavljamo cijenu koju je vratio backend
        setMembershipPrice(response.data.membershipPrice);
      } catch (err) {
        console.error("Greška pri dohvatu postavki:", err);
        setError("Ne mogu dohvatiti cijenu članarine.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSubscriptionPayment = async (e) => {
    e.preventDefault();
    setError('');
    setProcessingPayment(true);

    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      const token = storedUser?.token;

      // Šaljemo zahtjev za plaćanje s DOHVAĆENOM cijenom
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/stripe/create-subscription-checkout-session`,
        {
          email: currentUser.email,
          price: membershipPrice, // <--- Šaljemo cijenu iz baze
          interval: 'year'        // <--- Godišnja pretplata
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const { url } = response.data;
      window.location.href = url;

    } catch (err) {
      console.error('Payment error:', err);
      const errorMsg = err.response?.data?.error || 'Došlo je do greške prilikom povezivanja sa sustavom naplate.';
      setError(errorMsg);
      setProcessingPayment(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Dok se učitava cijena, prikaži loading
  if (loading) {
    return (
      <div className="subscription-lock-container">
        <div className="subscription-card" style={{ textAlign: 'center' }}>
           <span className="spinner" style={{display: 'inline-block'}}></span>
           <p>Učitavanje cijene...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-lock-container">
      <div className="subscription-card">
        
        <div className="icon-wrapper">🔒</div>

        <h1>Pristup Ograničen</h1>
        <p className="user-greeting">
            Pozdrav, <strong>{currentUser?.name || 'Korisniče'}</strong>!
        </p>
        
        <p className="description">
            Vaša organizatorska licenca nije aktivna.<br/>
            Kako biste mogli kreirati natjecanja, potrebno je aktivirati godišnju članarinu.
        </p>

        {/* DINAMIČKI PRIKAZ CIJENE */}
        <div className="price-display">
            <span className="currency">€</span>
            <span className="amount">{membershipPrice}</span>
            <span className="period">/ godišnje</span>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button 
            onClick={handleSubscriptionPayment} 
            className="stripe-pay-button" 
            disabled={processingPayment || !membershipPrice}
        >
            {processingPayment ? (
              <>
                <span className="spinner"></span>
                Preusmjeravanje...
              </>
            ) : (
              <>
                💳 Aktiviraj članarinu ({membershipPrice}€)
              </>
            )}
        </button>

        <p className="secure-notice">
            <span className="lock-icon">🔒</span>
            Sigurno plaćanje putem Stripe platforme
        </p>

        <div className="divider"></div>

        <button onClick={handleLogout} className="logout-link">
            Odustani i odjavi se
        </button>
      </div>
    </div>
  );
}

export default PlacanjeClanarine;