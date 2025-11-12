import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import '../Dashboard.css';

function OcjenjivanjePage() {
  const auth = useAuth();
  const judgeId = auth?.currentUser?._id;

  const [competitions, setCompetitions] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!judgeId) {
      setLoading(false);
      setError("Niste prijavljeni ili vaš korisnički profil nije potpun.");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // Dohvati sva natjecanja na kojima je sudac ocjenjivao
        const compsRes = await fetch(`${process.env.REACT_APP_API_URL}/competitions/judge/${judgeId}`);
        if (!compsRes.ok) throw new Error('Greška pri dohvaćanju natjecanja');
        const compsData = await compsRes.json();
        setCompetitions(compsData || []);
      } catch (err) {
        setError("Nije moguće dohvatiti podatke. Provjerite konzolu za detalje.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [judgeId]);

  useEffect(() => {
    if (!judgeId) return;
    const fetchScores = async () => {
      try {
        const scoresRes = await fetch(`${process.env.REACT_APP_API_URL}/scores/judge/${judgeId}`);
        if (!scoresRes.ok) throw new Error('Greška pri dohvaćanju ocjena');
        const scoresData = await scoresRes.json();
        setScores(scoresData || []);
      } catch (err) {
        setError("Nije moguće dohvatiti ocjene.");
      }
    };
    fetchScores();
  }, [judgeId]);

  return (
    <div className="dashboard-container">
      <Link to="/sudac" className="card-button" style={{ textDecoration: 'none', marginBottom: '20px', display: 'inline-block' }}>
        ← Nazad na Dashboard
      </Link>
      <h1>Moje Ocjene</h1>
      <p>Popis svih natjecanja i ocjena koje ste dali.</p>

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
                <h4>Ocjene:</h4>
                {scores.length > 0 ? (
                  <ul>
                    {scores.map(score => (
                      <li key={score._id}>
                        Natjecanje: {score.competitionId} <br />
                        Dob: {score.ageCategory}, Veličina grupe: {score.groupSize} <br />
                        Koreografija: {score.choreography}, Nastup: {score.performance}, Ritam: {score.rhythm}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Još niste ocijenili nastupe za ovo natjecanje.</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>Nema natjecanja na kojima ste ocjenjivali.</p>
        )
      )}
    </div>
  );
}

export default OcjenjivanjePage;