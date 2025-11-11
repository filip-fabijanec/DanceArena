import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './Registracija.css';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3500";

function Registracija() {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromLogin = location.state?.email || '';

  const [formData, setFormData] = useState({
    role: "voditeljKluba",
    name: "",
    surname: "",
    provider: "google",
    providerId: "",
    email: emailFromLogin,
    clubName: "",
    clubLocation: "",
  });

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

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
      
      setMessage(`Korisnik uspješno kreiran! Preusmjeravanje na login...`);
      setIsError(false);

      // Redirect na login nakon 2 sekunde
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      console.error("Error creating user:", error);
      setMessage(`Greška: ${error.message}`);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registracija-container">
      <div className="registracija-box">
        <Link to="/login" className="back-to-login">
          ← Natrag na prijavu
        </Link>

        <h1>DANCE ARENA</h1>
        <h2>Registracija novog korisnika</h2>
        
        {emailFromLogin && (
          <div className="info-message">
            Korisnik s emailom <strong>{emailFromLogin}</strong> ne postoji u sustavu.
            Molimo ispunite formu za registraciju.
          </div>
        )}

        <form onSubmit={handleSubmit} className="registracija-form">
          <div className="form-group">
            <label htmlFor="role">Uloga *</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              disabled={loading}
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
                placeholder="Unesite ime"
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
                placeholder="Unesite prezime"
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
              placeholder="korisnik@example.com"
              required
              disabled={true}
              className="readonly-field"
            />
          </div>

          <div className="form-group">
            <label htmlFor="provider">Provider *</label>
            <input
              type="text"
              id="provider"
              name="provider"
              value={formData.provider}
              onChange={handleChange}
              placeholder="npr. google"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="providerId">Provider ID *</label>
            <input
              type="text"
              id="providerId"
              name="providerId"
              value={formData.providerId}
              onChange={handleChange}
              placeholder="Google ID korisnika"
              required
              disabled={loading}
            />
          </div>

          {/* Prikaži club polja SAMO ako je role voditeljKluba */}
          {formData.role === "voditeljKluba" && (
            <>
              <div className="form-group">
                <label htmlFor="clubName">Naziv kluba</label>
                <input
                  type="text"
                  id="clubName"
                  name="clubName"
                  value={formData.clubName}
                  onChange={handleChange}
                  placeholder="Naziv plesnog kluba (opciono)"
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
                  placeholder="Grad, Država (opciono)"
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