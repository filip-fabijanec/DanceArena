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
    danceStyles: '',
    groupSizes: [],
    registrationFee: '',
  });

  const [selectedAgeCategories, setSelectedAgeCategories] = useState([]);
  const [selectedGroupSizes, setSelectedGroupSizes] = useState([]);
  
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Opcije za kategorije
  const ageCategoryOptions = ['Cicibani (2-7 god.)', 'Djeca (8-11 god.)', 'Juniori (12-16 god.)', 'Seniori (17 + god.)'];
  const groupSizeOptions = ['Solo (1 plesač)', 'Duo (2 plesača)','Trio (3 plesača)', 'Kvartet  (4 plesača)','Grupa (5-12 plesača)', 'Formacija/produkcija (13 + plesača)'];

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

    // Validacija, ovo je možda ekstra ali ako sam ja išta ja sam performativan
    if (selectedAgeCategories.length === 0) {
      setMessage('Morate odabrati barem jednu dobnu kategoriju');
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

    if (!formData.danceStyles.trim()) {
      setMessage('Morate unijeti stilove plesa');
      setIsError(true);
      setLoading(false);
      return;
    }

    try {
      // Pretvori danceStyles string u array
      const danceStylesArray = formData.danceStyles
      .split(/[,\n]/)
      .map(style => style.trim())
      .filter(style => style.length > 0);

      const competitionData = {
        name: formData.name,
        date: formData.date,
        location: formData.location,
        description: formData.description,
        ageCategories: selectedAgeCategories,
        danceStyles: danceStylesArray, // ← Šalji kao array
        groupSizes: selectedGroupSizes,
        registrationFee: Number(formData.registrationFee),
        organizer: currentUser._id,
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

      // Preusmjeri na dashboard nakon 2 sekunde, isto ekstra ali kažem... performativno
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
      <Link to="/organizator/natjecanja" className="back-link">← Natrag na pregled natjecanja</Link>
      
      <h1>Kreiraj novo natjecanje</h1>
      <p className="subtitle">Popunite podatke o natjecanju</p>

      <form onSubmit={handleSubmit} className="competition-form">
        
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
            <label htmlFor="description">Opis (opcionalno)</label>
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
        
        <div className="form-section">
          <h3>Stilovi plesa *</h3>
          <div className="form-group">
            <label htmlFor="danceStyles">Unesite stilove plesa (odvojite zarezom)</label>
            <textarea
              id="danceStyles"
              name="danceStyles"
              value={formData.danceStyles}
              onChange={handleChange}
              placeholder="Hip Hop, Breaking, Contemporary, Jazz, Street Dance"
              rows="4"
              required
            />
            <small className="form-hint">
              Primjer: Hip Hop, Breaking, Contemporary
            </small>
          </div>


          <div className="info-footnote">
            <p>
              Za više informacija o službenim kategorijama posjetite{' '}
              <a 
                href="https://superdance.hr/pravila-natjecanja/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="external-link"
              >
                Croatia Dance International - Pravila natjecanja
              </a>
            </p>
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