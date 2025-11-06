import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './kreiraj_natjecanje.css';

function KreirajNatjecanje() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    description: '',
    ageCategories: [],
    danceStyles: [],
    groupSizes: [],
    registrationFee: '',
  });

  const [selectedAgeCategories, setSelectedAgeCategories] = useState([]);
  const [selectedDanceStyles, setSelectedDanceStyles] = useState([]);
  const [selectedGroupSizes, setSelectedGroupSizes] = useState([]);
  
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Opcije za kategorije
  const ageCategoryOptions = ['Mini (6-8)', 'Djeca (9-11)', 'Juniori (12-15)', 'Seniori (16+)'];
  const danceStyleOptions = ['Hip Hop', 'Street Dance', 'Breaking', 'Jazz', 'Contemporary', 'Ballet'];
  const groupSizeOptions = ['Solo', 'Duo', 'Mali (3-7)', 'Srednji (8-15)', 'Veliki (16+)'];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCheckbox = (category, value, setter, currentValues) => {
    if (currentValues.includes(value)) {
      setter(currentValues.filter(item => item !== value));
    } else {
      setter([...currentValues, value]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    // Validacija
    if (selectedAgeCategories.length === 0) {
      setMessage('Morate odabrati barem jednu dobnu kategoriju');
      setIsError(true);
      setLoading(false);
      return;
    }
    if (selectedDanceStyles.length === 0) {
      setMessage('Morate odabrati barem jedan stil plesa');
      setIsError(true);
      setLoading(false);
      return;
    }
    if (selectedGroupSizes.length === 0) {
      setMessage('Morate odabrati barem jednu veličinu grupe');
      setIsError(true);
      setLoading(false);
      return;
    }

    try {
      const competitionData = {
        ...formData,
        ageCategories: selectedAgeCategories,
        danceStyles: selectedDanceStyles,
        groupSizes: selectedGroupSizes,
        registrationFee: Number(formData.registrationFee),
        organizer: currentUser._id, // ID trenutno prijavljenog organizatora
      };

      const response = await fetch('http://localhost:3500/competitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(competitionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create competition');
      }

      const data = await response.json();
      console.log('Natjecanje kreirano:', data);
      
      setMessage(`Natjecanje "${data.name}" uspješno kreirano!`);
      setIsError(false);

      // Preusmjeri na dashboard nakon 2 sekunde
      setTimeout(() => {
        navigate('/organizator/natjecanja');
      }, 2000);

    } catch (error) {
      console.error('Error creating competition:', error);
      setMessage(`Greška: ${error.message}`);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <Link to="/organizator" className="back-link">← Natrag na Dashboard</Link>
      
      <h1>Kreiraj novo natjecanje</h1>
      <p className="subtitle">Popunite podatke o natjecanju</p>

      <form onSubmit={handleSubmit} className="competition-form">
        
        {/* Osnovni podaci */}
        <div className="form-section">
          <h3>Osnovni podaci</h3>
          
          <div className="form-group">
            <label htmlFor="name">Naziv natjecanja *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="npr. Dance Arena 2025"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Datum *</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Lokacija *</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="npr. Split, Dvorana Gripe"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Opis (opciono)</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Kratki opis natjecanja..."
              rows="4"
            />
          </div>

          <div className="form-group">
            <label htmlFor="registrationFee">Kotizacija (€) *</label>
            <input
              type="number"
              id="registrationFee"
              name="registrationFee"
              value={formData.registrationFee}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>

        {/* Kategorije */}
        <div className="form-section">
          <h3>Dobne kategorije *</h3>
          <div className="checkbox-grid">
            {ageCategoryOptions.map((category) => (
              <label key={category} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedAgeCategories.includes(category)}
                  onChange={() => handleCheckbox('ageCategories', category, setSelectedAgeCategories, selectedAgeCategories)}
                />
                <span>{category}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h3>Stilovi plesa *</h3>
          <div className="checkbox-grid">
            {danceStyleOptions.map((style) => (
              <label key={style} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedDanceStyles.includes(style)}
                  onChange={() => handleCheckbox('danceStyles', style, setSelectedDanceStyles, selectedDanceStyles)}
                />
                <span>{style}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h3>Veličine grupa *</h3>
          <div className="checkbox-grid">
            {groupSizeOptions.map((size) => (
              <label key={size} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedGroupSizes.includes(size)}
                  onChange={() => handleCheckbox('groupSizes', size, setSelectedGroupSizes, selectedGroupSizes)}
                />
                <span>{size}</span>
              </label>
            ))}
          </div>
        </div>

        {message && (
          <div className={`message ${isError ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Kreiranje...' : 'Kreiraj natjecanje'}
        </button>
      </form>
    </div>
  );
}

export default KreirajNatjecanje;