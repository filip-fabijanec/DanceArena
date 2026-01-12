import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
        const compsRes = await axios.get(`${process.env.REACT_APP_API_URL}/competitions/judge/${judgeId}`);
        setCompetitions(compsRes.data || []);
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
        const scoresRes = await axios.get(`${process.env.REACT_APP_API_URL}/scores/judge/${judgeId}`);
        setScores(scoresRes.data || []);
      } catch (err) {
        setError("Nije moguće dohvatiti ocjene.");
      }
    };
    fetchScores();
  }, [judgeId]);

  return (
    <div className="dashboard-container">
      <Link to="/sudac" className="back-link" style={{ textDecoration: 'none', marginBottom: '20px', display: 'inline-block' }}>
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
                {Array.isArray(scores) && scores.length > 0 ? (
                  (() => {
                    const scoresForComp = scores.filter(s => s.performanceId && s.performanceId.competitionId && String(s.performanceId.competitionId._id) === String(comp._id));
                    return scoresForComp.length > 0 ? (
                      <ul>
                        {scoresForComp.map(score => (
                          <li key={score._id}>
                            Nastup: {score.performanceId?.choreographyName || 'N/A'} <br />
                            Ocjena: {typeof score.score === 'number' ? score.score : ((Number(score.choreography)||0) + (Number(score.performance)||0) + (Number(score.rhythm)||0))} <br />
                            Datum: {score.performanceId?.competitionId?.date ? new Date(score.performanceId.competitionId.date).toLocaleDateString('hr-HR') : 'N/A'}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>Još niste ocijenili nastupe za ovo natjecanje.</p>
                    );
                  })()
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