import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './kreiraj_natjecanje.css';

function KreirajNatjecanje() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '', date: '', location: '', description: '', danceStyles: '', registrationFee: '',
  });

  // State varijable
  const [selectedAgeCategories, setSelectedAgeCategories] = useState([]);
  const [selectedGroupSizes, setSelectedGroupSizes] = useState([]);
  
  // SUCI
  const [selectedReferees, setSelectedReferees] = useState([]); // ID-evi iz baze
  const [invitedRefereeEmails, setInvitedRefereeEmails] = useState([]); // Emailovi
  
  const [referees, setReferees] = useState([]);
  const [emailInput, setEmailInput] = useState("");
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Opcije (skraćeno radi preglednosti)
  const ageCategoryOptions = ['Cicibani (2-7 god.)', 'Djeca (8-11 god.)', 'Juniori (12-16 god.)', 'Seniori (17+ god.)'];
  const groupSizeOptions = ['Solo (1)', 'Duo (2)', 'Trio (3)', 'Kvartet (4)', 'Grupa (5-12)', 'Formacija (13+)'];

  useEffect(() => {
    fetchReferees();
  }, []);

  const fetchReferees = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/users/referees`);
      if (res.ok) setReferees(await res.json());
    } catch { setReferees([]); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const toggleCheckbox = (value, setFn, state) => {
    setFn(state.includes(value) ? state.filter(v => v !== value) : [...state, value]);
  };

  const handleRefereeToggle = (id) => {
    setSelectedReferees(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleAddEmail = () => {
    const email = emailInput.trim();
    if (email && !invitedRefereeEmails.includes(email)) {
      setInvitedRefereeEmails([...invitedRefereeEmails, email]);
      setEmailInput(""); // Očisti input
    }
  };

  const handleRemoveEmail = (email) => {
    setInvitedRefereeEmails(invitedRefereeEmails.filter(e => e !== email));
  };

  // --- VALIDACIJA SUDACA ---
  // Izračunavamo ukupan broj
  const totalJudges = selectedReferees.length + invitedRefereeEmails.length;
  
  const getValidationMessage = () => {
    if (totalJudges < 3) return { valid: false, text: `⚠️ Nedostaje sudaca! (Trenutno: ${totalJudges}, Min: 3)` };
    if (totalJudges % 2 === 0) return { valid: false, text: `⚠️ Broj sudaca mora biti neparan! (Trenutno: ${totalJudges})` };
    return { valid: true, text: `✅ Validno: ${totalJudges} sudaca` };
  };

  const validation = getValidationMessage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // 1. PROVJERA: Je li ostao mail u inputu koji nije dodan?
    if (emailInput.trim().length > 0) {
      alert("Upisali ste email ali niste kliknuli 'Dodaj'! Kliknite gumb 'Dodaj' pa pokušajte ponovno.");
      setLoading(false);
      return;
    }

    // 2. PROVJERA: Valjanost sudaca
    if (!validation.valid) {
      setMessage(validation.text);
      setIsError(true);
      setLoading(false);
      return;
    }

    try {
      const competitionData = {
        ...formData,
        ageCategories: selectedAgeCategories,
        groupSizes: selectedGroupSizes,
        danceStyles: formData.danceStyles.split(/[,\n]/).map(s => s.trim()).filter(Boolean),
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

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Greška pri kreiranju");
      }

      setMessage("Natjecanje uspješno kreirano!");
      setIsError(false);
      setTimeout(() => navigate("/organizator/natjecanja"), 1500);
      
    } catch (err) {
      console.error(err);
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
        {/* ... INPUTI ZA NAZIV, DATUM, LOKACIJU ISTI KAO PRIJE ... */}
        <div className="form-section">
             <div className="form-group">
                <label>Naziv natjecanja *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />
             </div>
             {/* Skraćujem ovaj dio jer je isti, kopiraj svoje inpute ovdje */}
             <div className="form-row">
                <input type="date" name="date" value={formData.date} onChange={handleChange} required />
                <input type="text" name="location" value={formData.location} onChange={handleChange} required placeholder="Lokacija" />
             </div>
             <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Opis..." />
             <div className="form-row">
                <textarea name="danceStyles" value={formData.danceStyles} onChange={handleChange} placeholder="Stilovi..." />
                <input type="number" name="registrationFee" value={formData.registrationFee} onChange={handleChange} placeholder="Cijena" />
             </div>
        </div>

        {/* ... CHECKBOXOVI ZA GODINE I GRUPE ISTI KAO PRIJE ... */}
        <div className="form-section">
            <h3>Dobne kategorije</h3>
            <div className="checkbox-grid">
                {ageCategoryOptions.map(o => (
                    <label key={o}><input type="checkbox" checked={selectedAgeCategories.includes(o)} onChange={() => toggleCheckbox(o, setSelectedAgeCategories, selectedAgeCategories)} /> {o}</label>
                ))}
            </div>
        </div>
        <div className="form-section">
            <h3>Veličine grupa</h3>
            <div className="checkbox-grid">
                {groupSizeOptions.map(o => (
                    <label key={o}><input type="checkbox" checked={selectedGroupSizes.includes(o)} onChange={() => toggleCheckbox(o, setSelectedGroupSizes, selectedGroupSizes)} /> {o}</label>
                ))}
            </div>
        </div>

        {/* --- SUCI SEKCIJA (POBOLJŠANA) --- */}
        <div className="form-section" style={{ border: validation.valid ? '2px solid green' : '2px solid red', padding: '15px' }}>
          <h3>Odabir sudaca (Ukupno: {totalJudges})</h3>
          
          {/* DIO 1: IZ BAZE */}
          <h4>1. Odaberi iz baze ({selectedReferees.length})</h4>
          <div className="referees-grid">
            {referees.map(ref => (
              <div key={ref._id} className={`referee-card ${selectedReferees.includes(ref._id) ? 'selected' : ''}`}>
                <input type="checkbox" checked={selectedReferees.includes(ref._id)} onChange={() => handleRefereeToggle(ref._id)} />
                <span>{ref.name} {ref.surname}</span>
              </div>
            ))}
          </div>

          {/* DIO 2: EMAIL */}
          <h4>2. Dodaj putem emaila ({invitedRefereeEmails.length})</h4>
          <div className="form-row">
            <input 
              type="email" 
              placeholder="email sudca" 
              value={emailInput} 
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddEmail(); }}} 
            />
            <button type="button" onClick={handleAddEmail} style={{backgroundColor: '#4CAF50', color: 'white'}}>Dodaj na listu</button>
          </div>

          {/* LISTA DODANIH EMAILOVA */}
          {invitedRefereeEmails.length > 0 && (
            <div style={{marginTop: '10px', background: '#f0f0f0', padding: '10px'}}>
              <strong>Lista za slanje pozivnica:</strong>
              <ul>
                {invitedRefereeEmails.map(email => (
                  <li key={email} style={{display: 'flex', justifyContent: 'space-between', width: '300px'}}>
                    {email} 
                    <span onClick={() => handleRemoveEmail(email)} style={{cursor: 'pointer', color: 'red', fontWeight: 'bold'}}> [Obriši]</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* PORUKA VALIDACIJE */}
          <div style={{ marginTop: '15px', fontWeight: 'bold', color: validation.valid ? 'green' : 'red' }}>
            {validation.text}
          </div>
        </div>

        {/* ERROR/SUCCESS MESSAGES */}
        {message && <div className={`message ${isError ? "error" : "success"}`}>{message}</div>}

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? "Kreiranje (šaljem mailove)..." : "Kreiraj natjecanje"}
        </button>
      </form>
    </div>
  );
}

export default KreirajNatjecanje;