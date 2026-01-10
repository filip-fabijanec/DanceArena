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
    danceStyles: '',
    registrationFee: '',
  });

  const [selectedAgeCategories, setSelectedAgeCategories] = useState([]);
  const [selectedGroupSizes, setSelectedGroupSizes] = useState([]);
  const [selectedReferees, setSelectedReferees] = useState([]);
  const [referees, setReferees] = useState([]);
  const [refereesLoading, setRefereesLoading] = useState(true);

  const [invitedRefereeEmails, setInvitedRefereeEmails] = useState([]);
  const [emailInput, setEmailInput] = useState("");

  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const ageCategoryOptions = [
    'Cicibani (2-7 god. )',
    'Djeca (8-11 god.)',
    'Juniori (12-16 god.)',
    'Seniori (17+ god.)'
  ];

  const groupSizeOptions = [
    'Solo (1 plesač)',
    'Duo (2 plesača)',
    'Trio (3 plesača)',
    'Kvartet (4 plesača)',
    'Grupa (5-12 plesača)',
    'Formacija/produkcija (13+ plesača)'
  ];

  useEffect(() => {
    fetchReferees();
  }, []);

  const fetchReferees = async () => {
    try {
      setRefereesLoading(true);
      const res = await fetch(`${process.env.REACT_APP_API_URL}/users/referees`);
      if (res.ok) setReferees(await res.json());
      else setReferees([]);
    } catch {
      setReferees([]);
    } finally {
      setRefereesLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleCheckbox = (value, setFn, state) => {
    setFn(state. includes(value) ? state.filter(v => v !== value) : [...state, value]);
  };

  const handleRefereeToggle = (id) => {
    setSelectedReferees(
      selectedReferees.includes(id)
        ? selectedReferees.filter(r => r !== id)
        : [...selectedReferees, id]
    );
  };

  const validateReferees = () => {
    const count = selectedReferees.length;
    if (count < 3) return { valid: false, message: "Minimalno 3 suca" };
    if (count % 2 === 0) return { valid: false, message: "Broj sudaca mora biti neparan" };
    return { valid:  true, message: `✅ Odabrano ${count} sudaca` };
  };

  const refereesValidation = validateReferees();

  const handleAddEmail = () => {
    if (emailInput.trim() && !invitedRefereeEmails. includes(emailInput.trim())) {
      setInvitedRefereeEmails([...invitedRefereeEmails, emailInput.trim()]);
      setEmailInput("");
    }
  };

  const handleRemoveEmail = (email) => {
    setInvitedRefereeEmails(invitedRefereeEmails.filter(e => e !== email));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!refereesValidation.valid) {
      setMessage(refereesValidation.message);
      setIsError(true);
      setLoading(false);
      return;
    }

    try {
      const competitionData = {
        ... formData,
        ageCategories: selectedAgeCategories,
        groupSizes:  selectedGroupSizes,
        danceStyles: formData.danceStyles
          . split(/[,\n]/)
          .map(s => s.trim())
          .filter(Boolean),
        registrationFee: Number(formData.registrationFee),
        organizer:  currentUser._id,
        referees:  selectedReferees,
        invitedRefereeEmails,
      };

      const res = await fetch(`${process.env.REACT_APP_API_URL}/competitions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(competitionData),
      });

      if (!res.ok) throw new Error("Greška pri kreiranju natjecanja");

      setMessage("Natjecanje uspješno kreirano!");
      setIsError(false);

      setTimeout(() => navigate("/organizator/natjecanja"), 1500);
    } catch (err) {
      setMessage(err.message);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <Link to="/organizator/natjecanja">← Natrag</Link>

      <h1>Kreiraj natjecanje</h1>

      <form onSubmit={handleSubmit}>

        {/* NAZIV NATJECANJA */}
        <div className="form-section">
          <div className="form-group">
            <label htmlFor="name">Naziv natjecanja *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData. name}
              onChange={handleChange}
              placeholder="npr. Festival suvremenog plesa 2024"
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
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="location">Lokacija *</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData. location}
                onChange={handleChange}
                placeholder="Grad, Država"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Opis natjecanja</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detaljan opis natjecanja..."
              rows="4"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="danceStyles">Plesni stilovi (odvojeni zarezom)</label>
              <textarea
                id="danceStyles"
                name="danceStyles"
                value={formData. danceStyles}
                onChange={handleChange}
                placeholder="npr. Hip-Hop, Jazz, Contemporary"
                rows="2"
              />
            </div>
            <div className="form-group">
              <label htmlFor="registrationFee">Cijena registracije (€)</label>
              <input
                type="number"
                id="registrationFee"
                name="registrationFee"
                value={formData.registrationFee}
                onChange={handleChange}
                placeholder="0. 00"
                step="0.01"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* GODINE */}
        <div className="form-section">
          <h3>Odaberi dobne kategorije</h3>
          <div className="checkbox-grid">
            {ageCategoryOptions.map(option => (
              <label key={option} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedAgeCategories.includes(option)}
                  onChange={() => toggleCheckbox(option, setSelectedAgeCategories, selectedAgeCategories)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* VELIČINE GRUPA */}
        <div className="form-section">
          <h3>Odaberi veličine grupa</h3>
          <div className="checkbox-grid">
            {groupSizeOptions. map(option => (
              <label key={option} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedGroupSizes. includes(option)}
                  onChange={() => toggleCheckbox(option, setSelectedGroupSizes, selectedGroupSizes)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* SUCI - SEKCIJA 1:  ODABIR IZ BAZE */}
        <div className="form-section">
          <h3>Odabir sudaca *</h3>

          <div className="referees-grid">
            {referees.map(ref => (
              <div
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
                {selectedReferees.includes(ref._id) && <span className="checkmark">✓</span>}
              </div>
            ))}
          </div>

          <div className={`referee-validation ${refereesValidation.valid ? 'valid' : 'invalid'}`}>
            {refereesValidation.message}
          </div>
        </div>

        {/* EMAIL INVITES - SEKCIJA 2: POZIVANJE PUTEM EMAILA */}
        <div className="form-section">
          <h3>Dodaj sudce putem emaila (opcionalno)</h3>

          <div className="form-row">
            <input
              type="email"
              placeholder="email sudca"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target. value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEmail())}
            />
            <button
              type="button"
              onClick={handleAddEmail}
            >
              Dodaj
            </button>
          </div>

          {invitedRefereeEmails.length > 0 && (
            <div className="invited-emails-list">
              <h4>Pozvani sudci:</h4>
              {invitedRefereeEmails.map(email => (
                <div key={email} className="invited-email-item">
                  <span>{email}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(email)}
                    className="remove-btn"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {message && <div className={`message ${isError ? "error" : "success"}`}>{message}</div>}

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? "Kreiranje..." :  "Kreiraj natjecanje"}
        </button>
      </form>
    </div>
  );
}

export default KreirajNatjecanje;