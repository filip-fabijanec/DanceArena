import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './Registracija.css';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3500";

function Registracija() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const inviteToken = params.get('invite');

  const emailFromLogin = location.state?.email || '';
  const providerIdFromLogin = location.state?.providerId || '';
  const providerFromLogin = location.state?.provider || 'google';

  const [formData, setFormData] = useState({
    role: "voditeljKluba",
    name: "",
    surname: "",
    provider: providerFromLogin,
    providerId: providerIdFromLogin,
    email: emailFromLogin,
    clubName: "",
    clubLocation: "",
    inviteToken: inviteToken || null,
  });

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteData, setInviteData] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(!! inviteToken);

  // Validacija invite tokena pri učitavanju
  useEffect(() => {
    if (inviteToken) {
      validateInvite();
    }
  }, [inviteToken]);

  const validateInvite = async () => {
    try {
      setInviteLoading(true);
      const res = await fetch(`${API_URL}/invites/validate/${inviteToken}`);

      if (!res.ok) {
        const errorData = await res.json();
        setMessage(errorData.error || "Neispravan poziv");
        setIsError(true);
        setInviteLoading(false);
        return;
      }

      const data = await res.json();
      setInviteData(data);

      // Automatski popuni email i role iz invite-a
      setFormData(prev => ({
        ...prev,
        email: data.email,
        role: data.role,
        inviteToken: inviteToken,
      }));

      setMessage("Poziv je validan! Molimo dovršite registraciju.");
      setIsError(false);
    } catch (error) {
      console.error("Error validating invite:", error);
      setMessage("Greška pri validaciji poziva");
      setIsError(true);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    if (inviteToken && inviteData) {
    if (formData.email. toLowerCase() !== inviteData.email.toLowerCase()) {
      setMessage(`Morate se prijaviti s emailom ${inviteData.email} na koji je poslan poziv. `);
      setIsError(true);
      setLoading(false);
      return;
    }
  }
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Greška pri kreiranju korisnika");
      }

      const data = await response.json();
      console.log("User created:", data);

      if (inviteToken) {
        setMessage(`Sudac uspješno kreiran! Preusmjeravanje... `);
      } else {
        setMessage(`Korisnik uspješno kreiran!  Preusmjeravanje na login...`);
      }
      setIsError(false);

      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      console.error("Error creating user:", error);
      setMessage(`Greška:  ${error.message}`);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  if (inviteLoading) {
    return (
      <div className="registracija-container">
        <div className="registracija-box">
          <p>Provjera poziva...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="registracija-container">
      <div className="registracija-box">
        <Link to="/login" className="back-to-login">
          ← Natrag na prijavu
        </Link>

        <h1>DANCE ARENA</h1>
        <h2>Registracija novog korisnika</h2>

        {emailFromLogin && ! inviteToken && (
          <div className="info-message">
            Korisnik s emailom <strong>{emailFromLogin}</strong> ne postoji u sustavu.
            Molimo ispunite formu za registraciju.
          </div>
        )}

        {inviteToken && inviteData && (
          <div className="info-message success">
            Pozvani ste kao sudac!  Molimo dovršite registraciju s emailom <strong>{inviteData.email}</strong>.
          </div>
        )}

        <form onSubmit={handleSubmit} className="registracija-form">
          {/* HIDDEN POLJA ZA PROVIDER I PROVIDER ID */}
          <input type="hidden" name="provider" value={formData.provider} />
          <input type="hidden" name="providerId" value={formData.providerId} />
          <input type="hidden" name="inviteToken" value={formData.inviteToken} />

          <div className="form-group">
            <label htmlFor="role">Uloga *</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              disabled={loading || inviteToken} // Ako je invite, uloga je zaključana
            >
              <option value="voditeljKluba">Voditelj kluba</option>
              <option value="organizator">Organizator</option>
              <option value="sudac">Sudac</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Ime *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Vaše ime"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="surname">Prezime *</label>
              <input
                type="text"
                id="surname"
                name="surname"
                value={formData.surname}
                onChange={handleChange}
                placeholder="Vaše prezime"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="vas. email@example.com"
              required
              disabled={loading || !!inviteToken}
              className={emailFromLogin || inviteToken ? "readonly-field" : ""}
              readOnly={! !(emailFromLogin || inviteToken)}
            />
          </div>

          {/* Prikaži club polja SAMO ako je role voditeljKluba i NIJE invite */}
          {formData.role === "voditeljKluba" && ! inviteToken && (
            <>
              <div className="form-group">
                <label htmlFor="clubName">Naziv kluba</label>
                <input
                  type="text"
                  id="clubName"
                  name="clubName"
                  value={formData.clubName}
                  onChange={handleChange}
                  placeholder="Naziv plesnog kluba (neobavezno)"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="clubLocation">Lokacija kluba</label>
                <input
                  type="text"
                  id="clubLocation"
                  name="clubLocation"
                  value={formData.clubLocation}
                  onChange={handleChange}
                  placeholder="Grad, Država (neobavezno)"
                  disabled={loading}
                />
              </div>
            </>
          )}

          <button type="submit" className="registracija-button" disabled={loading}>
            {loading ? 'Kreiranje računa...' : 'Registriraj se'}
          </button>
        </form>

        {message && (
          <div className={`message ${isError ? "error" : "success"}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default Registracija;