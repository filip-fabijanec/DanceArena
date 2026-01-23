import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import './Login.css';
import { GoogleLogin } from '@react-oauth/google';
import heroBanner from './hero-banner.jpg';
import { ReactComponent as UnderdogsLogo } from './underdogs.svg';

function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [secret, setSecret] = useState('');
  
  // ✅ NOVO STANJE: Prati čeka li korisnik odobrenje admina
  const [isPending, setIsPending] = useState(false);

  const { loginWithGoogle, loginWithSecret } = useAuth();
  const navigate = useNavigate();

  const reviews = useMemo(
    () => [
      { quote: 'Ma ovo je lagano najbolja stranica ikad, možda čak top 3 ikad', author: 'Bill Gates, Microsoft' },
      { quote: 'Ovakvo nešto nije izašlo iz Hrvatske ikada do sada, svi se trebaju ugledati na Underdogs ekipu! Fenomenalna stranica', author: 'Kolinda Grabar Kitarović' },
      { quote: 'Ako ova stranica ne dobije sve bodove na projektu onda mislim da cijela stvar nije pravedna!', author: 'Vrhovni Sud Republike Hrvatske' },
      { quote: 'Nikad nismo vidjeli ovako dobru stranicu. Savršena za moje potrebe kao sudac na plesnim natjecanjima, organizator istih te voditelj plesnog kluba', author: 'Testni user iz baze' },
      { quote: 'Molim Vas dajte bodove :(', author: 'Underdogs ekipa' }
    ],
    []
  );

  const [activeReview, setActiveReview] = useState(0);
  const [fadeTick, setFadeTick] = useState(0);

  const pauseUntilRef = useRef(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (Date.now() < pauseUntilRef.current) return;
      setActiveReview((i) => (i + 1) % reviews.length);
    }, 7000);

    return () => window.clearInterval(id);
  }, [reviews.length]);

  useEffect(() => {
    setFadeTick((t) => t + 1);
  }, [activeReview]);

  const handleSelectReview = (index) => {
    setActiveReview(index);
    pauseUntilRef.current = Date.now() + 6000;
  };

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const inviteToken = params.get('invite');

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setIsPending(false); // Resetiramo status čekanja
    setLoading(true);

    try {
      const user = await loginWithGoogle(credentialResponse.credential);
      redirectByRole(user.role);
    } catch (err) {
      const errorMessage = err.message || "Greška pri prijavi";

      // ✅ PROVJERA: Je li greška zbog neodobrenog računa?
      if (errorMessage.includes("čeka odobrenje") || errorMessage.includes("approved")) {
        setIsPending(true);
      } 
      // ✅ PROVJERA: Ako korisnik ne postoji, šalji na registraciju
      else if (errorMessage === "USER_NOT_FOUND") {
        try {
          const base64Url = credentialResponse.credential.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const payload = JSON.parse(jsonPayload);
          const email = payload.email;
          const providerId = payload.sub;

          navigate(`/registracija${inviteToken ? `?invite=${inviteToken}` : ''}`, {
            state: { email, providerId, provider: 'google' }
          });
        } catch (decodeError) {
          setError('Greška pri obradi Google prijave');
        }
      } else {
        // Ostale greške
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google prijava nije uspjela. Molimo pokušajte ponovo.');
  };

  const handleSecretSubmit = async (e) => {
    e.preventDefault();
    if (!secret) return;
    setError('');
    setIsPending(false); // Resetiramo status
    setLoading(true);

    try {
      const user = await loginWithSecret(secret);
      redirectByRole(user.role);
    } catch (err) {
      const errorMessage = err.message || 'Neispravna tajna riječ';
      
      // ✅ PROVJERA ZA TAJNU RIJEČ TAKOĐER
      if (errorMessage.includes("čeka odobrenje") || errorMessage.includes("approved")) {
        setIsPending(true);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

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

  const r = reviews[activeReview];

  return (
    <div className="login-container">
      <div
        className="login-split-bg"
        style={{ '--bg-image': `url(${heroBanner})` }}
        aria-hidden="true"
      />

      <div className="login-layout">
        <div className="login-side-content" aria-label="Testimonials">
          <div className="review-row">
            <div className="review-dots" aria-label="Odaberi testimonial">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`review-dot-btn ${i === activeReview ? 'active' : ''}`}
                  onClick={() => handleSelectReview(i)}
                  aria-label={`Prikaži testimonial ${i + 1}`}
                  aria-current={i === activeReview ? 'true' : 'false'}
                >
                  <span className="review-dot" />
                </button>
              ))}
            </div>

            <div className="review-card fade-in" key={fadeTick}>
              <p className="review-quote">“{r.quote}”</p>
              <p className="review-author">- {r.author}</p>
            </div>
          </div>
        </div>

        {/* ✅ Underdogs watermark behind the login box */}
        <UnderdogsLogo className="login-underdogs-bg" aria-hidden="true" />

        <div className="login-box">
          <Link to="/" className="back-to-home">
            ← Natrag na početnu
          </Link>

          <h1>DANCE ARENA</h1>
          <h2>Prijava u sustav</h2>

          {inviteToken && (
            <div className="info-message success">
              🎉 Pozvani ste kao sudac! Prijavite se s Google računom da dovršite registraciju.
            </div>
          )}

          {/* ✅ NOVI UI ELEMENT: Prikazuje se samo ako korisnik čeka odobrenje */}
          {isPending && (
            <div className="pending-approval-box fade-in">
              <div className="pending-icon">⏳</div>
              <h3>Račun čeka odobrenje</h3>
              <p>
                Vaša registracija je uspješna, ali administrator još mora odobriti vaš pristup.
              </p>
              <p className="pending-note">
                Molimo pokušajte ponovo kasnije ili kontaktirajte podršku.
              </p>
            </div>
          )}

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

          {/* Prikazujemo error samo ako NIJE pending (da ne bude duplih poruka) */}
          {error && !isPending && <div className="error-message">{error}</div>}
          
          {loading && <div className="loading-message">Prijava u tijeku...</div>}

          <div className="info-box">
            <p>Prijavite se pomoću vašeg Google računa.</p>
            <p>Ako nemate korisnički račun, bit ćete preusmjereni na registraciju.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;