import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import '../Dashboard.css';
import './PrijaviNastup.css';

function PrijaviNastup() {
  const { competitionId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const [formData, setFormData] = useState({
    choreographyName: '',
    performanceDuration: '',
    choreographer: '',
    musicFilePath: '',
    ageCategory: '',
    danceStyle: '',
    groupSize: ''
  });

  useEffect(() => {
    fetchCompetition();
  }, [competitionId]);

  const fetchCompetition = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/competitions/${competitionId}`);
      
      if (!response.ok) {
        throw new Error('Natjecanje nije pronađeno');
      }

      const data = await response.json();
      setCompetition(data);
    } catch (error) {
      console.error('Error fetching competition:', error);
      setMessage('Greška: Natjecanje nije pronađeno');
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handlePaymentAndSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // Validacija
    if (!formData.ageCategory || !formData.danceStyle || !formData.groupSize) {
      setMessage('Morate odabrati sve kategorije!');
      setIsError(true);
      return;
    }

    if (!formData.choreographyName || !formData.performanceDuration || !formData.musicFilePath) {
      setMessage('Morate popuniti sve obavezne podatke!');
      setIsError(true);
      return;
    }

    try {
      setProcessingPayment(true);

      // 1️⃣ Prvo kreiraj prijavu nastupa (nepotvrđenu)
      const performanceData = {
        competitionId: competitionId,
        clubId: currentUser._id,
        choreographyName: formData.choreographyName,
        performanceDuration: Number(formData.performanceDuration),
        choreographer: formData.choreographer,
        musicFilePath: formData.musicFilePath,
        ageCategory: formData.ageCategory,
        danceStyle: formData.danceStyle,
        groupSize: formData.groupSize
      };

      const performanceResponse = await fetch(`${process.env.REACT_APP_API_URL}/performances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(performanceData),
      });

      if (!performanceResponse.ok) {
        const errorData = await performanceResponse.json();
        throw new Error(errorData.error || 'Greška prilikom prijave nastupa');
      }

      const createdPerformance = await performanceResponse.json();
      console.log('Performance created:', createdPerformance);

      // 2️⃣ Kreiraj Stripe Checkout Session
      const stripeResponse = await fetch(`${process.env.REACT_APP_API_URL}/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          competitionId: competitionId,
          userId: currentUser._id,
          performanceId: createdPerformance._id // Opcionalno - možeš spremiti i ID nastupa
        }),
      });

      if (!stripeResponse.ok) {
        const errorData = await stripeResponse.json();
        throw new Error(errorData.error || 'Greška prilikom kreiranja plaćanja');
      }

      const { url } = await stripeResponse.json();

      // 3️⃣ Preusmjeri na Stripe Checkout
      setMessage('Preusmjeravanje na stranicu za plaćanje...');
      setIsError(false);
      
      // Redirekcija na Stripe checkout
      window.location.href = url;

    } catch (error) {
      console.error('Error processing payment:', error);
      setMessage(`Greška: ${error.message}`);
      setIsError(true);
    } finally {
      setProcessingPayment(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('hr-HR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="dashboard-container">
          <Link to="/voditelj" className="back-link">← Natrag na Dashboard</Link>
          <h1>Prijavi nastup</h1>
          <p>Učitavanje...</p>
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div>
        <Navbar />
        <div className="dashboard-container">
          <Link to="/voditelj" className="back-link">← Natrag na Dashboard</Link>
          <h1>Prijavi nastup</h1>
          <p className="error-message">Natjecanje nije pronađeno.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="dashboard-container">
        <Link to="/voditelj" className="back-link">← Natrag na Dashboard</Link>

        <h1>Prijavi nastup</h1>
        <p className="subtitle">Popunite podatke o nastupu za natjecanje</p>

        {/* Info o natjecanju */}
        <div className="competition-info-banner">
          <h2>{competition.name}</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="icon">📅</span>
              <span>Datum: {formatDate(competition.date)}</span>
            </div>
            <div className="info-item">
              <span className="icon">📍</span>
              <span>Lokacija: {competition.location}</span>
            </div>
            <div className="info-item">
              <span className="icon">💰</span>
              <span>Kotizacija: {competition.registrationFee} €</span>
            </div>
          </div>
        </div>

        {/* Forma */}
        <form onSubmit={handlePaymentAndSubmit} className="performance-form">
          
          {/* Osnovni podaci */}
          <div className="form-section">
            <h3>Osnovni podaci</h3>

            <div className="form-group">
              <label htmlFor="choreographyName">Naziv koreografije *</label>
              <input
                type="text"
                id="choreographyName"
                name="choreographyName"
                value={formData.choreographyName}
                onChange={handleChange}
                placeholder="npr. Breaking Boundaries"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="performanceDuration">Trajanje (sekunde) *</label>
                <input
                  type="number"
                  id="performanceDuration"
                  name="performanceDuration"
                  value={formData.performanceDuration}
                  onChange={handleChange}
                  placeholder="npr. 180 (3 minute)"
                  min="1"
                  required
                />
                <small className="form-hint">
                  Unesite trajanje u sekundama (npr. 180 = 3 minute)
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="choreographer">Koreograf</label>
                <input
                  type="text"
                  id="choreographer"
                  name="choreographer"
                  value={formData.choreographer}
                  onChange={handleChange}
                  placeholder="Ime koreografa"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="musicFilePath">URL glazbe *</label>
              <input
                type="url"
                id="musicFilePath"
                name="musicFilePath"
                value={formData.musicFilePath}
                onChange={handleChange}
                placeholder="https://example.com/music.mp3"
                required
              />
              <small className="form-hint">
                Unesite link do glazbene datoteke (npr. Google Drive, Dropbox)
              </small>
            </div>
          </div>

          {/* Kategorije */}
          <div className="form-section">
            <h3>Kategorije</h3>

            <div className="form-group">
              <label htmlFor="ageCategory">Dobna kategorija *</label>
              <select
                id="ageCategory"
                name="ageCategory"
                value={formData.ageCategory}
                onChange={handleChange}
                required
              >
                <option value="">-- Odaberite dobnu kategoriju --</option>
                {competition.ageCategories.map((category, idx) => (
                  <option key={idx} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="danceStyle">Stil plesa *</label>
              <select
                id="danceStyle"
                name="danceStyle"
                value={formData.danceStyle}
                onChange={handleChange}
                required
              >
                <option value="">-- Odaberite stil plesa --</option>
                {competition.danceStyles.map((style, idx) => (
                  <option key={idx} value={style}>
                    {style}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="groupSize">Veličina grupe *</label>
              <select
                id="groupSize"
                name="groupSize"
                value={formData.groupSize}
                onChange={handleChange}
                required
              >
                <option value="">-- Odaberite veličinu grupe --</option>
                {competition.groupSizes.map((size, idx) => (
                  <option key={idx} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Plaćanje */}
          <div className="form-section">
            <h3>Plaćanje kotizacije</h3>
            <div className="payment-info">
              <p>
                Kotizacija za ovo natjecanje iznosi <strong>{competition.registrationFee} €</strong>.
              </p>
              <p className="payment-notice">
                ✓ Nakon pritiska gumba biti ćete preusmjereni na sigurnu Stripe stranicu za plaćanje.
              </p>
              <p className="payment-notice">
                ✓ Prihvaćamo sve veće kreditne i debitne kartice.
              </p>
              <p className="payment-notice">
                ✓ Vaša prijava bit će potvrđena tek nakon uspješnog plaćanja.
              </p>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`message ${isError ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          {/* Submit button */}
          <button 
            type="submit" 
            className="submit-button" 
            disabled={processingPayment || submitting}
          >
            {processingPayment ? (
              <>
                <span className="spinner"></span>
                Preusmjeravanje na plaćanje...
              </>
            ) : (
              <>
                🔒 Nastavi na plaćanje ({competition.registrationFee} €)
              </>
            )}
          </button>

          <p className="secure-notice">
            <span className="lock-icon">🔒</span>
            Sigurno plaćanje putem Stripe
          </p>
        </form>
      </div>
    </div>
  );
}

export default PrijaviNastup;