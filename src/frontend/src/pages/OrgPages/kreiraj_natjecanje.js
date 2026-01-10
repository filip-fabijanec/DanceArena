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

  // 🆕 invite email state
  const [invitedRefereeEmails, setInvitedRefereeEmails] = useState([]);
  const [emailInput, setEmailInput] = useState("");

  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const ageCategoryOptions = [
    'Cicibani (2-7 god. )',
    'Djeca (8-11 god.)',
    'Juniori (12-16 god.)',
    'Seniori (17 + god.)'
  ];

  const groupSizeOptions = [
    'Solo (1 plesač)',
    'Duo (2 plesača)',
    'Trio (3 plesača)',
    'Kvartet (4 plesača)',
    'Grupa (5-12 plesača)',
    'Formacija/produkcija (13 + plesača)'
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
    if (emailInput.trim() && !invitedRefereeEmails.includes(emailInput.trim())) {
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

    if (! refereesValidation.valid) {
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
        organizer: currentUser._id,
        referees: selectedReferees,
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

        {/* OSTATAK FORME OSTAVLJEN KAKAV JE BIO */}

        {/* SUCI */}
        <div className="form-section">
          <h3>Odabir sudaca</h3>

          <div className="referees-grid">
            {referees.map(ref => (
              <label key={ref._id} className={selectedReferees.includes(ref._id) ? "selected" : ""}>
                <input
                  type="checkbox"
                  checked={selectedReferees.includes(ref._id)}
                  onChange={() => handleRefereeToggle(ref._id)}
                />
                {ref.name} {ref.surname}
              </label>
            ))}
          </div>

          {/* 🆕 EMAIL INVITES */}
          <div className="form-section">
            <h4>Dodaj sudce putem emaila (opcionalno)</h4>

            <div className="form-row">
              <input
                type="email"
                placeholder="email sudca"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEmail())}
              />
              <button
                type="button"
                onClick={handleAddEmail}
              >
                Dodaj
              </button>
            </div>

            {invitedRefereeEmails. map(email => (
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

          <div className={refereesValidation.valid ? "valid" : "invalid"}>
            {refereesValidation.message}
          </div>
        </div>

        {message && <div className={isError ? "error" : "success"}>{message}</div>}

        <button type="submit" disabled={loading}>
          {loading ? "Kreiranje..." : "Kreiraj natjecanje"}
        </button>
      </form>
    </div>
  );
}

export default KreirajNatjecanje;