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
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const [formData, setFormData] = useState({
    choreographyName: '',
    performanceDuration: '',
    choreographer: '',
    musicFilePath: '',
    ageCategory: '',
    danceStyle: '',
    groupSize: '',
    paid: false
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
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setSubmitting(true);

    // Validacija
    if (!formData.ageCategory || !formData.danceStyle || !formData.groupSize) {
      setMessage('Morate odabrati sve kategorije!');
      setIsError(true);
      setSubmitting(false);
      return;
    }

    if (!formData.paid) {
      setMessage('Morate potvrditi plaćanje kotizacije!');
      setIsError(true);
      setSubmitting(false);
      return;
    }

    try {
      const performanceData = {
        competitionId: competitionId,
        clubId: currentUser._id,
        choreographyName: formData.choreographyName,
        performanceDuration: Number(formData.performanceDuration),
        choreographer: formData.choreographer,
        musicFilePath: formData.musicFilePath,
        ageCategory: formData.ageCategory,
        danceStyle: formData.danceStyle,
        groupSize: formData.groupSize,
        paid: formData.paid
      };

      const response = await fetch(`/performances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(performanceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Greška prilikom prijave');
      }

      const data = await response.json();
      console.log('Performance created:', data);

      setMessage('Nastup uspješno prijavljen!');
      setIsError(false);

      // Redirect nakon 2 sekunde
      setTimeout(() => {
        navigate('/voditelj');
      }, 2000);

    } catch (error) {
      console.error('Error submitting performance:', error);
      setMessage(`Greška: ${error.message}`);
      setIsError(true);
    } finally {
      setSubmitting(false);
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
              <span className="icon"></span>
              <span>Datum: {formatDate(competition.date)}</span>
            </div>
            <div className="info-item">
              <span className="icon"></span>
              <span>Lokacija: {competition.location}</span>
            </div>
            <div className="info-item">
              <span className="icon"></span>
              <span>Kotizacija: {competition.registrationFee} €</span>
            </div>
          </div>
        </div>

        {/* Forma */}
        <form onSubmit={handleSubmit} className="performance-form">
          
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
                Ovo je trenutno simulacija plaćanja. Stvarno plaćanje bit će implementirano kasnije.
              </p>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="paid"
                  checked={formData.paid}
                  onChange={handleChange}
                  required
                />
                <span>Potvrđujem da je kotizacija plaćena *</span>
              </label>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`message ${isError ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          {/* Submit button */}
          <button type="submit" className="submit-button" disabled={submitting}>
            {submitting ? 'Slanje prijave...' : 'Prijavi nastup'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PrijaviNastup;