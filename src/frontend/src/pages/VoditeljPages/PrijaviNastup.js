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
    const params = new URLSearchParams(window.location.search);

    if (params.get('payment_success') === 'true') {
      setMessage('✅ Plaćanje uspješno! Nastup je registriran.');
      setMessageType('success');
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => navigate('/voditelj/'), 3000);
    }

    if (params.get('payment_cancelled') === 'true') {
      setMessage('❌ Plaćanje je otkazano. Pokušajte ponovno.');
      setMessageType('error');
      window.history.replaceState({}, document.title, window.location.pathname);
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
            choreographyName: formData.choreographyName,
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

      const performance = await perfRes.json();

      // 3️⃣ Stripe checkout
      const stripeRes = await fetch(
        `${process.env.REACT_APP_API_URL}/stripe/checkout`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            competitionId,
            userId: currentUser._id,
            performanceId: performance._id,
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
    return <div className="prijavi-nastup-container">Učitavanje...</div>;
  }

  if (!competition) {
    return <div className="prijavi-nastup-container">Natjecanje nije pronađeno</div>;
  }

  return (
    <div className="prijavi-nastup-container">
      <h1>Prijavi nastup – {competition.name}</h1>

      {message && <div className={`message-banner ${messageType}`}>{message}</div>}

      <form onSubmit={handleSubmit} className="prijava-form">
        <div className="form-group">
          <label>Naziv koreografije *</label>
          <input
            name="choreographyName"
            value={formData.choreographyName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Dobna kategorija *</label>
            <select
              name="ageCategory"
              value={formData.ageCategory}
              onChange={handleChange}
              required
            >
              <option value="">Odaberi</option>
              {competition.ageCategories?.map((c) => (
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
              {competition.danceStyles?.map((s) => (
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
              value={formData.choreographer}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Trajanje (sekunde) *</label>
          <input
            type="number"
            name="performanceDuration"
            min="1"
            value={formData.performanceDuration}
            onChange={handleChange}
            required
          />
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
        </div>

        <p><strong>Kotizacija:</strong> {competition.registrationFee} €</p>

        <button disabled={submitting}>
          {submitting ? 'Obrađujem...' : 'Prijavi nastup i plati'}
        </button>
      </form>
    </div>
  );
}

export default PrijaviNastup;
