import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios'; // <--- 1. PROMJENA: Importiramo direktno 'axios'
import './placanje_clanarine.css';

function PlacanjeClanarine() {
  const { currentUser } = useAuth();
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState('');

  const SUBSCRIPTION_PRICE = 20; 

  const handleSubscriptionPayment = async (e) => {
    e.preventDefault();
    setError('');
    setProcessingPayment(true);

    try {
      // Dohvaćamo token direktno iz localStorage-a (jer nemamo api helper)
      const storedUser = JSON.parse(localStorage.getItem('user'));
      const token = storedUser?.token;

      // 2. PROMJENA: Koristimo puni URL i ručno šaljemo header
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/stripe/create-subscription-checkout-session`,
        {
          userId: currentUser._id,
          email: currentUser.email,
          price: SUBSCRIPTION_PRICE
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // <--- OVO JE BITNO da backend zna tko plaća
          }
        }
      );

      // Kod axiosa podaci su u .data
      const { url } = response.data;

      // Preusmjeravanje
      window.location.href = url;

    } catch (err) {
      console.error('Payment error:', err);
      // Axios greške su malo drugačije strukturirane
      const errorMsg = err.response?.data?.error || 'Došlo je do greške prilikom povezivanja sa sustavom naplate.';
      setError(errorMsg);
      setProcessingPayment(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="subscription-lock-container">
      <div className="subscription-card">
        
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

        <div className="price-display">
            <span className="currency">€</span>
            <span className="amount">{SUBSCRIPTION_PRICE}</span>
            <span className="period">/ mjesečno</span>
        </div>

        {error && <div className="error-message">{error}</div>}

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

        <button onClick={handleLogout} className="logout-link">
            Odustani i odjavi se
        </button>
      </div>
    </div>
  );
}

export default PlacanjeClanarine;