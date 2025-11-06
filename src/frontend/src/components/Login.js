import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email);
      console.log('Prijavljen korisnik:', user);
      
      // Preusmjeri korisnika na odgovarajući dashboard ovisno o ulozi
      switch (user.role) {
        case 'organizator':
          navigate('/organizator');
          break;
        case 'voditeljKluba':
          navigate('/voditelj');
          break;
        case 'sudac':
          navigate('/sudac');
          break;
        case 'admin':
          navigate('/admin');
          break;
        default:
          navigate('/');
      }
    } catch (err) {
      setError('Korisnik s tim emailom ne postoji. Provjerite email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {/* ========== DODAJ OVO ========== */}
        <Link to="/" className="back-to-home">
          ← Natrag na početnu
        </Link>
        {/* =============================== */}

        <h1>DANCE ARENA</h1>
        <h2>Prijava u sustav</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email adresa</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="korisnik@example.com"
              required
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Prijava...' : 'Prijavi se'}
          </button>
        </form>

        <div className="info-box">
          <p>ℹ️ Za testiranje koristi email postojećeg korisnika iz baze.</p>
        </div>
      </div>
    </div>
  );
}

export default Login;