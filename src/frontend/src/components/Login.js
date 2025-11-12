import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';
import { GoogleLogin } from '@react-oauth/google';

function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);

    try {
      const user = await loginWithGoogle(credentialResponse.credential);
      // Korisnik postoji - redirect prema roli
      switch (user.role) {
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
    } catch (err) {
      // Izvuci email iz Google tokena za redirect na registraciju
      try {
        const base64Url = credentialResponse.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        const email = payload.email;
        
        // Korisnik ne postoji - redirect na registraciju s emailom
        navigate('/registracija', { state: { email } });
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

  return (
    <div className="login-container">
      <div className="login-box">
        <Link to="/" className="back-to-home">
          ← Natrag na početnu
        </Link>

        <h1>DANCE ARENA</h1>
        <h2>Prijava u sustav</h2>
        
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