import React, { useState, useEffect } from 'react';
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
  const [selectedReferees, setSelectedReferees] = useState([]);
  const [referees, setReferees] = useState([]);
  const [refereesLoading, setRefereesLoading] = useState(true);
  
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Opcije za kategorije
  const ageCategoryOptions = ['Cicibani (2-7 god.)', 'Djeca (8-11 god.)', 'Juniori (12-16 god.)', 'Seniori (17 + god.)'];
  const groupSizeOptions = ['Solo (1 plesač)', 'Duo (2 plesača)','Trio (3 plesača)', 'Kvartet  (4 plesača)','Grupa (5-12 plesača)', 'Formacija/produkcija (13 + plesača)'];

  useEffect(() => {
    fetchReferees();
  }, []);

  const fetchReferees = async () => {
    try {
      setRefereesLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/users/referees`);
      
      if (response.ok) {
        const data = await response.json();
        setReferees(data);
      } else if (response.status === 404) {
        setReferees([]);
      }
    } catch (error) {
      console.error('Error fetching referees:', error);
      setReferees([]);
    } finally {
      setRefereesLoading(false);
    }
  };

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

  // ← Handle checkbox za suce
  const handleRefereeToggle = (refereeId) => {
    if (selectedReferees.includes(refereeId)) {
      setSelectedReferees(selectedReferees.filter(id => id !== refereeId));
    } else {
      setSelectedReferees([...selectedReferees, refereeId]);
    }
  };

  // Validacija sudaca
  const validateReferees = () => {
    const count = selectedReferees.length;
    
    if (count === 0) {
      return { valid: false, message: 'Morate odabrati barem 3 suca' };
    }
    if (count < 3) {
      return { valid: false, message: `Odabrano: ${count} sudac(a). Minimalno je potrebno 3 suca.` };
    }
    if (count % 2 === 0) {
      return { valid: false, message: `Odabrano: ${count} sudaca. Mora biti neparan broj sudaca.` };
    }
    return { valid: true, message: `✅ Odabrano: ${count} sudaca` };
  };

  const refereesValidation = validateReferees();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    // Validacija kategorija
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

    // Validacija sudaca
    if (!refereesValidation.valid) {
      setMessage(refereesValidation.message);
      setIsError(true);
      setLoading(false);
      return;
    }

    try {
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
        danceStyles: danceStylesArray,
        groupSizes: selectedGroupSizes,
        registrationFee: Number(formData.registrationFee),
        organizer: currentUser._id,
        referees: selectedReferees,
      };

      const response = await fetch(`${process.env.REACT_APP_API_URL}/competitions`, {
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

        {/* Dobne kategorije */}
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

        {/* Veličine grupa */}
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
        
        {/* Stilovi plesa */}
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

        {/* ← NOVO: Odabir sudaca s karticama */}
        <div className="form-section">
          <h3>Odabir sudaca *</h3>
          
          {refereesLoading ? (
            <p>Učitavanje sudaca...</p>
          ) : referees.length === 0 ? (
            <div className="warning-box">
              <p>⚠️ Nema dostupnih sudaca u sustavu.</p>
              <p>Kontaktirajte administratora da doda suce prije kreiranja natjecanja.</p>
            </div>
          ) : (
            <>
              <p className="section-description">
                Odaberite najmanje 3 suca (mora biti neparan broj).
              </p>

              <div className="referees-grid">
                {referees.map((ref) => (
                  <label 
                    key={ref._id} 
                    className={`referee-card ${selectedReferees.includes(ref._id) ? 'selected' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedReferees.includes(ref._id)}
                      onChange={() => handleRefereeToggle(ref._id)}
                    />
                    <div className="referee-info">
                      <span className="referee-name">{ref.name} {ref.surname}</span>
                      <span className="referee-email">{ref.email}</span>
                    </div>
                    <div className="checkmark">✓</div>
                  </label>
                ))}
              </div>

              {/* Validation feedback */}
              <div className={`referee-validation ${refereesValidation.valid ? 'valid' : 'invalid'}`}>
                {refereesValidation.message}
              </div>
            </>
          )}
        </div>

        {message && (
          <div className={`message ${isError ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <button 
          type="submit" 
          className="submit-button" 
          disabled={loading || refereesLoading || referees.length === 0}
        >
          {loading ? 'Kreiranje...' : 'Kreiraj natjecanje'}
        </button>
      </form>
    </div>
  );
}

export default KreirajNatjecanje;