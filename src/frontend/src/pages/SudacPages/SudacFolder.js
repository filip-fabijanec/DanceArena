import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import '../Dashboard.css';

function SudacFolder() {
  const auth = useAuth();
  const judgeId = auth?.currentUser?._id;
  const navigate = useNavigate();

  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!judgeId) {
      setLoading(false);
      setError("Niste prijavljeni ili vaš korisnički profil nije potpun.");
      return;
    }

    const fetchCompetitions = async () => {
      // --- DIJAGNOSTIČKI BLOK ---
      const urlToFetch = `${process.env.REACT_APP_API_URL}/api/competitions/judge/${judgeId}`;
      console.log("Pokušavam dohvatiti podatke s URL-a:", urlToFetch);
      // --- KRAJ DIJAGNOSTIČKOG BLOKA ---

      try {
        const res = await fetch(urlToFetch);
        if (!res.ok) throw new Error('Greška pri dohvaćanju podataka');
        const data = await res.json();
        setCompetitions(data || []);
      } catch (err) {
        console.error("Greška pri dohvaćanju natjecanja:", err);
        setError("Nije moguće dohvatiti natjecanja. Provjerite konzolu za detalje.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitions();
  }, [judgeId]);

  return (
    <div className="dashboard-container">
      <Link to="/sudac" className="card-button" style={{ textDecoration: 'none', marginBottom: '20px', display: 'inline-block' }}>
        ← Nazad na Dashboard
      </Link>
      
      <h1>Moja Natjecanja</h1>
      <p>Popis svih natjecanja na kojima ste dodijeljeni kao sudac.</p>

      {loading && <p>Učitavanje...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {!loading && !error && (
        competitions.length > 0 ? (
          <div className="competition-list">
            {competitions.map(comp => (
              <div key={comp._id} className="dashboard-card" style={{ marginBottom: 16 }}>
                <h3>{comp.name}</h3>
                <p>📅 Datum: {new Date(comp.date).toLocaleDateString('hr-HR')}</p>
                <p>📍 Lokacija: {comp.location}</p>
                <button
                  onClick={() => navigate(`/sudac/ocjenjivanje/${comp._id}`)}
                  className="card-button"
                >
                  Ocijeni nastupe
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>Nema natjecanja na kojima ste trenutno dodijeljeni kao sudac.</p>
        )
      )}
    </div>
  );
}

export default SudacFolder;