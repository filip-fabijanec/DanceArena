import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';
import { GoogleLogin } from '@react-oauth/google';

function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [secret, setSecret] = useState('');
  const { loginWithGoogle, loginWithSecret } = useAuth();
  const navigate = useNavigate();

  // --- GOOGLE LOGIN ---
  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);

    try {
      const user = await loginWithGoogle(credentialResponse.credential);
      redirectByRole(user.role);
    } catch (err) {
      try {
        // Ako korisnik ne postoji → parsiraj Google token i redirect na registraciju
        const base64Url = credentialResponse.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        const email = payload.email;
        const providerId = payload.sub;

        navigate('/registracija', {
          state: { email, providerId, provider: 'google' }
        });
      } catch (decodeError) {
        setError('Greška pri obradi Google prijave');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google prijava nije uspjela. Molimo pokušajte ponovo.');
  };

  // --- BACKDOOR LOGIN ---
  const handleSecretSubmit = async (e) => {
    e.preventDefault();
    if (!secret) return;
    setError('');
    setLoading(true);

    try {
      const user = await loginWithSecret(secret); // poziva backend /auth/secret-login
      redirectByRole(user.role);
    } catch (err) {
      setError(err.message || 'Neispravna tajna riječ');
    } finally {
      setLoading(false);
    }
  };

  // --- REDIRECT PO ULOGI ---
  const redirectByRole = (role) => {
    switch (role) {
      case 'organizator':
        navigate('/organizator/natjecanja');
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
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <Link to="/" className="back-to-home">
          ← Natrag na početnu
        </Link>

        <h1>DANCE ARENA</h1>
        <h2>Prijava u sustav</h2>

        {/* --- Tajna riječ / backdoor login --- */}
        <div className="secret-section">
          <h3 className="secret-title">Prijava preko šifre</h3>

          <form onSubmit={handleSecretSubmit} className="secret-login-form">
            <input
              type="password"
              className="secret-input"
              placeholder="Upišite šifru..."
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              disabled={loading}
            />

            <button
              type="submit"
              className="secret-button"
              disabled={loading || !secret}
            >
              🔐 Prijavi se
            </button>
          </form>
        </div>


        <div className="google-login-wrapper">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            text="signin_with"
            shape="rectangular"
            size="large"
            width="100%"
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading && (
          <div className="loading-message">
            Prijava u tijeku...
          </div>
        )}

        <div className="info-box">
          <p>Prijavite se pomoću vašeg Google računa.</p>
          <p>Ako nemate korisnički račun, bit ćete preusmjereni na registraciju.</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
