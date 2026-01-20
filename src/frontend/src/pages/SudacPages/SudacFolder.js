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

  const token = localStorage.getItem("token");

  const downloadPdf = async (competitionId) => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/competitions/${competitionId}/pdf`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const text = await res.text();
        alert("Greška: " + text);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "startna_lista.pdf";
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Greška pri preuzimanju PDF-a");
    }
  };


  useEffect(() => {
    if (!judgeId) {
      setLoading(false);
      setError("Niste prijavljeni ili vaš korisnički profil nije potpun.");
      return;
    }

    const fetchCompetitions = async () => {
      const urlToFetch = `${process.env.REACT_APP_API_URL}/competitions/judge/${judgeId}`;
      console.log("Pokušavam dohvatiti podatke s URL-a:", urlToFetch);

      try {
        const res = await fetch(urlToFetch);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        // sort so that 'ongoing' competitions appear first, then 'upcoming', then 'completed'
        const order = { ongoing: 0, upcoming: 1, completed: 2 };
        const sorted = (data || []).slice().sort((a, b) => {
          const sa = a.status || a.autoStatus || '';
          const sb = b.status || b.autoStatus || '';
          const diff = (order[sa] ?? 3) - (order[sb] ?? 3);
          if (diff !== 0) return diff;
          // fallback: earlier date first
          return new Date(a.date) - new Date(b.date);
        });

        setCompetitions(sorted);
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
      <Link to="/sudac" className="back-link" style={{ textDecoration: 'none', marginBottom: '20px', display: 'inline-block' }}>
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
                {comp.status === 'completed' ? (
                  <button className="card-button btn-danger"  style={{marginBottom : 10}} disabled>
                    Natjecanje završeno
                  </button>
                ) : comp.status === 'upcoming' ? (
                  <button className="card-button btn-danger"  style={{marginBottom : 10}} disabled>
                    Nadolazeće
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(`/sudac/ocjenjivanje/${comp._id}`)}
                    className="card-button btn-success" 
                    style={{marginBottom : 10}} 
                  >
                    Ocijeni nastupe
                  </button>
                )}
                {comp.isLocked && (
                  <button
                    className="card-button btn-secondary"
                    onClick={() => downloadPdf(comp._id)}
                  >
                    📄 Preuzmi startnu listu (PDF)
                  </button>
                )}

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