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

  const [selectedAgeCategories, setSelectedAgeCategories] = useState([]);
  const [selectedGroupSizes, setSelectedGroupSizes] = useState([]);
  
  const [selectedReferees, setSelectedReferees] = useState([]);
  const [invitedRefereeEmails, setInvitedRefereeEmails] = useState([]);
  
  const [referees, setReferees] = useState([]);
  const [emailInput, setEmailInput] = useState("");
  
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const ageCategoryOptions = ['Cicibani (2-7 god.)', 'Djeca (8-11 god.)', 'Juniori (12-16 god.)', 'Seniori (17+ god.)'];
  const groupSizeOptions = ['Solo (1)', 'Duo (2)', 'Trio (3)', 'Kvartet (4)', 'Grupa (5-12)', 'Formacija (13+)'];

  useEffect(() => {
    const fetchReferees = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/users/referees`);
        if (res.ok) setReferees(await res.json());
        else setReferees([]);
      } catch { 
        setReferees([]); 
      }
    };
    fetchReferees();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const toggleCheckbox = (value, setFn, state) => {
    setFn(state.includes(value) ? state.filter(v => v !== value) : [...state, value]);
  };

  // ✅ POBOLJŠANA FUNKCIJA - Provjera prije dodavanja iz baze
  const handleRefereeToggle = (id) => {
    const referee = referees.find(ref => ref._id === id);
    
    // Ako deselektiramo, samo ukloni
    if (selectedReferees.includes(id)) {
      setSelectedReferees(prev => prev.filter(r => r !== id));
      return;
    }
    
    // ✅ NOVA PROVJERA: Je li email tog suca već u invitedRefereeEmails?
    if (referee && invitedRefereeEmails.some(email => email.toLowerCase() === referee.email.toLowerCase())) {
      alert(`❌ Sudac ${referee.name} ${referee.surname} (${referee.email}) je već dodan putem emaila!`);
      return;
    }

    // Dodaj suca
    setSelectedReferees(prev => [...prev, id]);
  };

  // helper: poziv backend endpointa za provjeru emaila u bazi
  const checkEmailExistsOnServer = async (email) => {
    const url = `${process.env.REACT_APP_API_URL}/users/check-email?email=${encodeURIComponent(email)}`;
    const res = await fetch(url);
    if (!res.ok) {
      // Vrati objekt s error-om za konzolnu poruku i downstream handling
      const text = await res.text().catch(() => "");
      throw new Error(`Provjera emaila vratila grešku: ${res.status} ${text}`);
    }
    return res.json(); // { exists, isReferee, userId, name, surname } ili { exists: false }
  };

  // ✅ POBOLJŠANA FUNKCIJA - Provjera prije dodavanja emaila (s pozivom serveru)
  // Promjena: ako korisnik postoji u bazi (check.exists === true) NE DOZVOLJAVAMO dodavanje putem pozivnice.
  // Umjesto toga korisnika treba odabrati iz baze (ako je sudac) ili eventualno promijeniti njegovu ulogu na serveru.
  const handleAddEmail = async () => {
    const email = emailInput.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) return;
    
    if (!emailRegex.test(email)) {
      alert("❌ Unesite ispravan format email adrese.");
      return;
    }

    // Provjera 1: Je li email već u listi pozivnica?
    if (invitedRefereeEmails.some(e => e.toLowerCase() === email)) {
      alert("❌ Ovaj email je već dodan u pozivnice!");
      return;
    }

    // Provjera 2: Je li taj email već odabran iz baze?
    const existingReferee = referees.find(ref => ref.email.toLowerCase() === email);
    if (existingReferee && selectedReferees.includes(existingReferee._id)) {
      alert(`❌ Sudac ${existingReferee.name} ${existingReferee.surname} (${email}) je već odabran iz baze!`);
      return;
    }

    // NOVO: provjeri postoji li taj email u bazi (server-side)
    try {
      const check = await checkEmailExistsOnServer(email);

      // Ako server kaže da postoji u bazi -> NE DOPUŠTAMO dodavanje putem pozivnice
      if (check && check.exists) {
        // Obavijesti organizatora da korisnik već postoji i da ga treba odabrati iz baze
        const displayName = `${check.name || ""} ${check.surname || ""}`.trim();
        if (displayName) {
          alert(`Korisnik ${displayName} (${email}) već postoji u bazi. Nemoguće je poslati pozivnicu ovom putem - ukoliko vjerujete da je ovo greška kontaktirajte korisnika ili admine`);
        }
        return;
      }

      // Ako NE postoji u bazi -> dodaj pozivnicu
      setInvitedRefereeEmails([...invitedRefereeEmails, emailInput.trim()]);
      setEmailInput("");
    } catch (err) {
      console.error("Greška pri provjeri emaila:", err);
      alert("Greška pri provjeri emaila na serveru. Pokušajte ponovno.");
    }
  };

  const handleRemoveEmail = (email) => {
    setInvitedRefereeEmails(invitedRefereeEmails.filter(e => e !== email));
  };

  const totalJudges = selectedReferees.length + invitedRefereeEmails.length;
  const isRefereesValid = totalJudges >= 3 && totalJudges % 2 !== 0;

  let validationText = "";
  if (totalJudges < 3) {
      validationText = `⚠️ Minimalno 3 suca (Trenutno: ${totalJudges})`;
  } else if (totalJudges % 2 === 0) {
      validationText = `⚠️ Broj sudaca mora biti neparan (Trenutno: ${totalJudges})`;
  } else {
      validationText = `✅ Odabrano ${totalJudges} sudaca`;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (emailInput.trim().length > 0) {
      alert("⚠️ Upisali ste email ali niste kliknuli 'Dodaj'! Kliknite gumb 'Dodaj' pa pokušajte ponovno.");
      setLoading(false);
      return;
    }

    if (!isRefereesValid) {
      setMessage(totalJudges < 3 ? "❌ Nedostaje sudaca!" : "❌ Broj sudaca mora biti neparan!");
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

      setMessage("✅ Natjecanje uspješno kreirano! Pozivnice se šalju...");
      setIsError(false);
      
      setTimeout(() => navigate("/organizator/natjecanja"), 2000);
      
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
        
        <div className="form-section">
             <div className="form-group">
                <label>Naziv natjecanja *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="npr. Zimski Kup" />
             </div>
             <div className="form-row">
                <div className="form-group">
                    <label>Datum *</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Lokacija *</label>
                    <input type="text" name="location" value={formData.location} onChange={handleChange} required placeholder="Grad, Adresa" />
                </div>
             </div>
             <div className="form-group">
                <label>Opis</label>
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Detalji natjecanja..." rows="3" />
             </div>
             <div className="form-row">
                <div className="form-group">
                    <label>Stilovi (odvojeni zarezom)</label>
                    <textarea name="danceStyles" value={formData.danceStyles} onChange={handleChange} placeholder="Jazz, Hip Hop, Show..." rows="2" />
                </div>
              <div className="form-group">
                <label>Kotizacija (€)</label>
                  <input
                    type="number"
                    name="registrationFee"
                    value={formData.registrationFee}
                    onChange={(e) => {
                      setFormData({ ...formData, registrationFee: e.target.value });
                    }}
                    onBlur={() => {
                      let val = parseFloat(formData.registrationFee);
                      if (isNaN(val) || val < 1) val = 1;
                      setFormData({ ...formData, registrationFee: val });
                    }}
                    placeholder="0.00"
                    step="1"
                    min="1"
                  />
                </div>
             </div>
        </div>

        <div className="form-section">
            <h3>Dobne kategorije</h3>
            <div className="checkbox-grid">
                {ageCategoryOptions.map(o => (
                    <label key={o} className="checkbox-label">
                        <input type="checkbox" checked={selectedAgeCategories.includes(o)} onChange={() => toggleCheckbox(o, setSelectedAgeCategories, selectedAgeCategories)} /> 
                        <span>{o}</span>
                    </label>
                ))}
            </div>
        </div>

        <div className="form-section">
            <h3>Veličine grupa</h3>
            <div className="checkbox-grid">
                {groupSizeOptions.map(o => (
                    <label key={o} className="checkbox-label">
                        <input type="checkbox" checked={selectedGroupSizes.includes(o)} onChange={() => toggleCheckbox(o, setSelectedGroupSizes, selectedGroupSizes)} /> 
                        <span>{o}</span>
                    </label>
                ))}
            </div>
        </div>

        <div className="form-section">
          <h3>Odabir sudaca (Ukupno: {totalJudges})</h3>
          
          <h4 style={{marginTop: '15px', marginBottom: '10px'}}>1. Odaberi iz baze ({selectedReferees.length})</h4>
          <div className="referees-grid">
            {referees.length > 0 ? referees.map(ref => (
              <div key={ref._id} className={`referee-card ${selectedReferees.includes(ref._id) ? 'selected' : ''}`} onClick={() => handleRefereeToggle(ref._id)}>
                <input type="checkbox" checked={selectedReferees.includes(ref._id)} onChange={() => {}} />
                <div className="referee-info">
                    <span className="referee-name">{ref.name} {ref.surname}</span>
                    <span className="referee-email">{ref.email}</span>
                </div>
              </div>
            )) : <p>Nema sudaca u bazi.</p>}
          </div>

          <h4 style={{marginTop: '20px', marginBottom: '10px'}}>2. Dodaj putem emaila ({invitedRefereeEmails.length})</h4>
          <div className="form-row" style={{alignItems: 'flex-end'}}>
            <div className="form-group" style={{flex: 1}}>
                <input 
                  type="email" 
                  placeholder="Unesi email suca (npr. sudac@mail.com)" 
                  value={emailInput} 
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddEmail(); }}} 
                />
            </div>
            <button type="button" onClick={handleAddEmail} className="add-email-btn" style={{marginBottom: '10px', height: '40px'}}>
                Dodaj
            </button>
          </div>

          {invitedRefereeEmails.length > 0 && (
            <div className="invited-list">
              {invitedRefereeEmails.map(email => (
                <div key={email} className="invited-item">
                  <span>{email}</span>
                  <button type="button" onClick={() => handleRemoveEmail(email)} className="remove-btn">✕</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ 
              marginTop: '20px', 
              padding: '10px', 
              borderRadius: '5px',
              textAlign: 'center',
              fontWeight: 'bold',
              backgroundColor: isRefereesValid ? '#d4edda' : '#fff3cd',
              color: isRefereesValid ? '#155724' : '#856404',
              border: `1px solid ${isRefereesValid ? '#c3e6cb' : '#ffeeba'}`
          }}>
            {validationText}
          </div>
        </div>

        {message && <div className={`message ${isError ? "error" : "success"}`}>{message}</div>}

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? "Slanje..." : "Kreiraj natjecanje"}
        </button>
      </form>
    </div>
  );
}

export default KreirajNatjecanje;