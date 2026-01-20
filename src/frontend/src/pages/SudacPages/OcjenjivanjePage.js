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

  // Pomoćna funkcija za izračun ukupne ocjene (zadržana iz originala)
  const calculateTotalScore = (score) => {
    if (typeof score.score === 'number') return score.score;
    return (Number(score.choreography) || 0) + (Number(score.performance) || 0) + (Number(score.rhythm) || 0);
  };

  return (
    <div className="dashboard-container">
      <Link to="/sudac" className="back-link">
        ← Nazad na Dashboard
      </Link>
      <div className="page-header">
        <h1>Moje Ocjene</h1>
        <p className="subtitle">Popis svih natjecanja i ocjena koje ste dodijelili, razvrstano po kategorijama.</p>
      </div>

      {loading && <p>Učitavanje...</p>}
      {error && <div className="error-message">{error}</div>}

      {!loading && !error && (
        competitions.length > 0 ? (
          <div className="competition-list">
            {competitions.map(comp => {
              // 1. Filtriraj ocjene samo za ovo natjecanje
              const scoresForComp = Array.isArray(scores) 
                ? scores.filter(s => s.performanceId && s.performanceId.competitionId && String(s.performanceId.competitionId._id || s.performanceId.competitionId) === String(comp._id))
                : [];

              // 2. Grupiraj ocjene: Stil -> Dob -> Grupa
              // Pretpostavljamo da performanceId ima polja danceStyle, ageCategory, groupCategory. 
              // Ako se zovu drugačije u bazi, prilagodi nazive ovdje.
              const groupedScores = scoresForComp.reduce((acc, score) => {
                const p = score.performanceId || {};
                const style = p.danceStyle || 'Ostali stilovi'; 
                const age = p.ageCategory || 'Ostale dobi';
                const size = p.groupCategory || 'Ostale grupe';

                if (!acc[style]) acc[style] = {};
                if (!acc[style][age]) acc[style][age] = {};
                if (!acc[style][age][size]) acc[style][age][size] = [];

                acc[style][age][size].push(score);
                return acc;
              }, {});

              return (
                <div key={comp._id} className="competition-card">
                  <div className="comp-header">
                    <h3>{comp.name}</h3>
                    <div className="comp-meta">
                      <span>📅 {new Date(comp.date).toLocaleDateString('hr-HR')}</span>
                      <span>📍 {comp.location}</span>
                    </div>
                  </div>
                  
                  <div className="comp-body">
                    {scoresForComp.length > 0 ? (
                      Object.entries(groupedScores).map(([style, ages]) => (
                        <div key={style} style={{ marginBottom: '30px' }}>
                          <h4 style={{ borderBottom: '2px solid #4F46E5', paddingBottom: '5px', marginBottom: '15px', color: '#2c3e50' }}>
                            {style}
                          </h4>
                          
                          {Object.entries(ages).map(([age, sizes]) => (
                            <div key={age} style={{ marginLeft: '10px', marginBottom: '20px' }}>
                              <h5 style={{ color: '#555', marginBottom: '10px', fontSize: '1.05rem' }}>• {age}</h5>
                              
                              {Object.entries(sizes).map(([size, scoreList]) => (
                                <div key={size} style={{ marginLeft: '15px', marginBottom: '15px' }}>
                                  <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: '8px', fontStyle: 'italic' }}>
                                    Kategorija: {size}
                                  </div>
                                  
                                  <div className="scores-grid">
                                    {scoreList.map(score => (
                                      <div key={score._id} className="score-item-card">
                                        <div className="score-top">
                                          <div className="performance-name">
                                            {score.performanceId?.choreographyName || 'Nepoznat nastup'}
                                          </div>
                                          <div className="score-badge">
                                            {calculateTotalScore(score)}
                                          </div>
                                        </div>
                                        <div className="score-bottom">
                                          Datum ocjene: {new Date(score.performanceId?.competitionId?.date || Date.now()).toLocaleDateString('hr-HR')}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      ))
                    ) : (
                      <p className="empty-state">Još niste ocijenili nastupe za ovo natjecanje.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p>Nema natjecanja na kojima ste ocjenjivali.</p>
        )
      )}
    </div>
  );
}

export default OcjenjivanjePage;