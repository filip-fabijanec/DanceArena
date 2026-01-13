import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './PrijaviNastup.css';

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
    musicFile: null,
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location. search);

    if (params.get('payment_success') === 'true') {
      setMessage('✅ Plaćanje uspješno! Nastup je registriran.');
      setMessageType('success');
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => navigate('/voditelj/'), 3000);
    }

    if (params.get('payment_cancelled') === 'true') {
      setMessage('❌ Plaćanje je otkazano. Pokušajte ponovno.');
      setMessageType('error');
      window.history.replaceState({}, document.title, window.location. pathname);
      setTimeout(() => setMessage(''), 5000);
    }

    fetchCompetition();
  }, [competitionId, navigate]);

  const fetchCompetition = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/competitions/${competitionId}`
      );

      if (!res.ok) throw new Error();

      setCompetition(await res.json());
    } catch {
      setMessage('Greška pri učitavanju natjecanja');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ... formData, [e.target. name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      // 1️⃣ Upload MP3 na Cloudflare R2
      const uploadData = new FormData();
      uploadData.append('song', formData.musicFile);

      const uploadRes = await fetch(
        `${process.env.REACT_APP_API_URL}/upload-song`,
        {
          method: 'POST',
          body: uploadData,
        }
      );

      if (!uploadRes.ok) throw new Error('Upload glazbe nije uspio');

      const { url: musicFilePath } = await uploadRes.json();

      // 2️⃣ Kreiraj performance
      const perfRes = await fetch(
        `${process.env.REACT_APP_API_URL}/performances`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            competitionId,
            clubId: currentUser._id,
            choreographyName:  formData.choreographyName,
            ageCategory: formData.ageCategory,
            danceStyle: formData.danceStyle,
            groupSize: formData.groupSize,
            choreographer: formData.choreographer,
            performanceDuration: parseInt(formData.performanceDuration),
            musicFilePath,
          }),
        }
      );

      if (!perfRes.ok) throw new Error('Greška pri kreiranju nastupa');

      const performance = await perfRes. json();

      // 3️⃣ Stripe checkout
      const stripeRes = await fetch(
        `${process.env.REACT_APP_API_URL}/stripe/checkout`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            competitionId,
            userId: currentUser._id,
            performanceId:  performance._id,
          }),
        }
      );

      if (!stripeRes.ok) throw new Error('Greška pri kreiranju plaćanja');

      const { url } = await stripeRes.json();
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setMessage(err.message || 'Greška pri prijavi');
      setMessageType('error');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="performance-form" style={{ textAlign: 'center', padding: '40px' }}>Učitavanje...</div>;
  }

  if (!competition) {
    return <div className="performance-form" style={{ textAlign: 'center', padding: '40px' }}>Natjecanje nije pronađeno</div>;
  }

  return (
    <div>
      {/* Competition Info Banner */}
      <div className="competition-info-banner">
        <h2>{competition.name}</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="icon">📅</span>
            <span>{new Date(competition.date).toLocaleDateString('hr-HR')}</span>
          </div>
          <div className="info-item">
            <span className="icon">📍</span>
            <span>{competition.location}</span>
          </div>
          <div className="info-item">
            <span className="icon">💰</span>
            <span>Kotizacija: {competition.registrationFee} €</span>
          </div>
        </div>
      </div>

      {message && <div className={`message ${messageType}`}>{message}</div>}

      <form onSubmit={handleSubmit} className="performance-form">
        <div className="form-section">
          <h3>Podaci o nastupu</h3>
          
          <div className="form-group">
            <label>Naziv koreografije *</label>
            <input
              name="choreographyName"
              value={formData.choreographyName}
              onChange={handleChange}
              placeholder="Unesite naziv koreografije"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Dobna kategorija *</label>
              <select
                name="ageCategory"
                value={formData. ageCategory}
                onChange={handleChange}
                required
              >
                <option value="">Odaberi</option>
                {competition.ageCategories?. map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Plesni stil *</label>
              <select
                name="danceStyle"
                value={formData.danceStyle}
                onChange={handleChange}
                required
              >
                <option value="">Odaberi</option>
                {competition.danceStyles?. map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Veličina grupe *</label>
              <select
                name="groupSize"
                value={formData.groupSize}
                onChange={handleChange}
                required
              >
                <option value="">Odaberi</option>
                {competition.groupSizes?.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Koreograf</label>
              <input
                name="choreographer"
                value={formData. choreographer}
                onChange={handleChange}
                placeholder="Ime koreografa (opcionalno)"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Glazba i trajanje</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Trajanje (sekunde) *</label>
              <input
                type="number"
                name="performanceDuration"
                min="1"
                value={formData.performanceDuration}
                onChange={handleChange}
                placeholder="npr. 180"
                required
              />
              <span className="form-hint">Unesite trajanje u sekundama (npr. 180 = 3 minute)</span>
            </div>

            <div className="form-group">
              <label>Glazba (MP3) *</label>
              <input
                type="file"
                accept="audio/mpeg"
                onChange={(e) =>
                  setFormData({ ...formData, musicFile: e.target.files[0] })
                }
                required
              />
              <span className="form-hint">Maksimalna veličina: 10MB</span>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Plaćanje</h3>
          <div className="payment-info">
            <p>💳 Kotizacija za nastup: <strong>{competition.registrationFee} €</strong></p>
            <p className="payment-notice">⚡ Nakon prijave bit ćete preusmjereni na sigurno plaćanje putem Stripe-a</p>
          </div>
        </div>

        <button type="submit" className="submit-button" disabled={submitting}>
          {submitting ?  (
            <>
              <span className="spinner"></span>
              Obrađujem...
            </>
          ) : (
            '💳 Prijavi nastup i plati'
          )}
        </button>

        <p className="secure-notice">
          <span className="lock-icon">🔒</span>
          Sigurno plaćanje putem Stripe-a
        </p>
      </form>
    </div>
  );
}

export default PrijaviNastup;