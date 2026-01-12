import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './PrijaviNastup. css';

function PrijaviNastup() {
  const { currentUser } = useAuth();
  const { competitionId } = useParams();
  const navigate = useNavigate();

  const [competition, setCompetition] = useState(null);
  const [formData, setFormData] = useState({
    choreographyName: '',
    ageCategory: '',
    danceStyle: '',
    groupSize: '',
    choreographer: '',
    performanceDuration: '',
    musicFilePath: '',
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Provjeri payment success/cancelled
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment_success') === 'true') {
      setMessage('✅ Plaćanje uspješno! Nastup je registriran.');
      setMessageType('success');
      window.history.replaceState({}, document.title, window.location. pathname);
      setTimeout(() => navigate('/voditelj/'), 3000);
    }
    if (params.get('payment_cancelled') === 'true') {
      setMessage('❌ Plaćanje je otkazano.  Pokušajte ponovno.');
      setMessageType('error');
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => setMessage(''), 5000);
    }

    fetchCompetition();
  }, [competitionId, navigate]);

  const fetchCompetition = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.REACT_APP_API_URL}/competitions/${competitionId}`);
      if (res.ok) {
        setCompetition(await res.json());
      } else {
        setMessage('Greška pri učitavanju natjecanja');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error fetching competition:', error);
      setMessage('Greška pri povezivanju');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      // 1. Prvo kreiraj Performance
      const perfRes = await fetch(`${process.env.REACT_APP_API_URL}/performances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionId,
          clubId: currentUser._id,
          ... formData,
          performanceDuration: parseInt(formData.performanceDuration),
        }),
      });

      if (! perfRes.ok) throw new Error('Greška pri kreiranju performanse');

      const performance = await perfRes.json();

      // 2. Kreiraj Stripe session za plaćanje
      const stripeRes = await fetch(`${process.env.REACT_APP_API_URL}/stripe/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionId,
          userId: currentUser._id,
          performanceId: performance._id,
        }),
      });

      if (!stripeRes.ok) throw new Error('Greška pri kreiranju plaćanja');

      const { url } = await stripeRes. json();

      // 3. Preusmjeri na Stripe
      window.location.href = url;
    } catch (error) {
      console.error('Error:', error);
      setMessage(error.message || 'Greška pri procesiranju');
      setMessageType('error');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="prijavi-nastup-container">
        <p>Učitavanje... </p>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="prijavi-nastup-container">
        <p>Natjecanje nije pronađeno</p>
      </div>
    );
  }

  return (
    <div className="prijavi-nastup-container">
      <h1>Prijavi nastup - {competition.name}</h1>

      {message && (
        <div className={`message-banner ${messageType}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="prijava-form">
        <div className="form-group">
          <label htmlFor="choreographyName">Naziv koreografije *</label>
          <input
            type="text"
            id="choreographyName"
            name="choreographyName"
            value={formData.choreographyName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="ageCategory">Dobna kategorija *</label>
            <select
              id="ageCategory"
              name="ageCategory"
              value={formData. ageCategory}
              onChange={handleChange}
              required
            >
              <option value="">Odaberi kategoriju</option>
              {competition. ageCategories && competition.ageCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="danceStyle">Plesni stil *</label>
            <select
              id="danceStyle"
              name="danceStyle"
              value={formData. danceStyle}
              onChange={handleChange}
              required
            >
              <option value="">Odaberi stil</option>
              {competition. danceStyles && competition.danceStyles.map(style => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="groupSize">Veličina grupe *</label>
            <select
              id="groupSize"
              name="groupSize"
              value={formData.groupSize}
              onChange={handleChange}
              required
            >
              <option value="">Odaberi veličinu</option>
              {competition.groupSizes && competition.groupSizes.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="choreographer">Koreograf</label>
            <input
              type="text"
              id="choreographer"
              name="choreographer"
              value={formData.choreographer}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="performanceDuration">Trajanje (sekunde) *</label>
          <input
            type="number"
            id="performanceDuration"
            name="performanceDuration"
            value={formData.performanceDuration}
            onChange={handleChange}
            min="1"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="musicFilePath">Glazba (URL ili putanja) *</label>
          <input
            type="text"
            id="musicFilePath"
            name="musicFilePath"
            value={formData.musicFilePath}
            onChange={handleChange}
            placeholder="https://..."
            required
          />
        </div>

        <div className="form-info">
          <p><strong>Kotizacija:</strong> {competition.registrationFee} €</p>
        </div>

        <button type="submit" className="btn-submit" disabled={submitting}>
          {submitting ? 'Obrađujem...' : 'Prijavi nastup i plati'}
        </button>
      </form>
    </div>
  );
}

export default PrijaviNastup;