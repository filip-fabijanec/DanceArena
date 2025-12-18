import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './placanje_clanarine.css';

function PlacanjeClanarine() {
  const { currentUser } = useAuth();
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState('');

  // Fiksna cijena članarine
  const SUBSCRIPTION_PRICE = 20; 

  const handleSubscriptionPayment = async (e) => {
    e.preventDefault();
    setError('');
    setProcessingPayment(true);

    try {
      // 1. Pozivamo backend da kreira Stripe Checkout Session za pretplatu
      // Napomena: Moraš imati rutu na backendu koja ovo obrađuje (slično kao za nastup)
      const response = await fetch(`${process.env.REACT_APP_API_URL}/stripe/create-subscription-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser._id,
          email: currentUser.email, // Stripeu treba email za račun
          price: SUBSCRIPTION_PRICE
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Greška prilikom kreiranja plaćanja');
      }

      const { url } = await response.json();

      // 2. Preusmjeravanje na Stripe
      window.location.href = url;

    } catch (err) {
      console.error('Payment error:', err);
      setError('Došlo je do greške prilikom povezivanja sa sustavom naplate. Pokušajte ponovno.');
      setProcessingPayment(false);
    }
  };

  const handleLogout = () => {
    // Obriši podatke i vrati na login
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="subscription-lock-container">
      <div className="subscription-card">
        
        {/* Header ikona */}
        <div className="icon-wrapper">
          🔒
        </div>

        <h1>Pristup Ograničen</h1>
        <p className="user-greeting">
            Pozdrav, <strong>{currentUser?.name || 'Korisniče'}</strong>!
        </p>
        
        <p className="description">
            Vaša organizatorska licenca nije aktivna. <br/>
            Kako biste mogli kreirati natjecanja i upravljati prijavama, potrebno je aktivirati mjesečnu članarinu.
        </p>

        {/* Info o cijeni */}
        <div className="price-display">
            <span className="currency">€</span>
            <span className="amount">{SUBSCRIPTION_PRICE}</span>
            <span className="period">/ mjesečno</span>
        </div>

        {/* Error poruka */}
        {error && <div className="error-message">{error}</div>}

        {/* Gumb za plaćanje (Stil iz tvog primjera) */}
        <button 
            onClick={handleSubscriptionPayment} 
            className="stripe-pay-button" 
            disabled={processingPayment}
        >
            {processingPayment ? (
              <>
                <span className="spinner"></span>
                Preusmjeravanje na Stripe...
              </>
            ) : (
              <>
                💳 Aktiviraj članarinu
              </>
            )}
        </button>

        <p className="secure-notice">
            <span className="lock-icon">🔒</span>
            Sigurno plaćanje putem Stripe platforme
        </p>

        <div className="divider"></div>

        {/* Gumb za odjavu */}
        <button onClick={handleLogout} className="logout-link">
            Odustani i odjavi se
        </button>
      </div>
    </div>
  );
}

export default PlacanjeClanarine;