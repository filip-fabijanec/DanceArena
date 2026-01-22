import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import '../Dashboard.css';
import './suci.css'; // Dodajte ovu liniju

function OcjenjivanjePage() {
  const auth = useAuth();
  const judgeId = auth?.currentUser?._id;

  const [competitions, setCompetitions] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openCompetitionId, setOpenCompetitionId] = useState(null);

  const toggleCompetition = (id) => {
    setOpenCompetitionId(prev => (prev === id ? null : id));
  };

  useEffect(() => {
    if (!judgeId) {
      setError('Niste prijavljeni.');
      setLoading(false);
      return;
    }

    const fetchCompetitions = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/competitions/judge/${judgeId}`
        );
        setCompetitions(Array.isArray(res.data) ? res.data : []);
      } catch {
        setError('Greška pri dohvaćanju natjecanja.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitions();
  }, [judgeId]);

  useEffect(() => {
    if (!judgeId) return;

    const fetchScores = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/scores/judge/${judgeId}`
        );
        setScores(Array.isArray(res.data) ? res.data : []);
      } catch {
        setError('Greška pri dohvaćanju ocjena.');
      }
    };

    fetchScores();
  }, [judgeId]);

  const calculateTotalScore = (score) => {
    if (typeof score.score === 'number') return score.score;
    return (
      (Number(score.choreography) || 0) +
      (Number(score.performance) || 0) +
      (Number(score.rhythm) || 0)
    );
  };

  if (loading) return <p>Učitavanje...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="dashboard-container">
      <Link to="/sudac" className="back-link">← Nazad na Dashboard</Link>

      <div className="page-header">
        <h1>Moje Ocjene</h1>
        <p className="subtitle">
          Popis svih natjecanja i ocjena koje ste dodijelili
        </p>
      </div>

      <div className="competition-list">
        {competitions.map(comp => {
          const scoresForComp = scores.filter(
            s =>
              s.performanceId &&
              s.performanceId.competitionId &&
              String(
                s.performanceId.competitionId._id ||
                s.performanceId.competitionId
              ) === String(comp._id)
          );

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
              <div
                className="comp-header clickable"
                onClick={() => toggleCompetition(comp._id)}
              >
                <div>
                  <h3>{comp.name}</h3>
                  <div className="comp-meta">
                    <span>📅 {new Date(comp.date).toLocaleDateString('hr-HR')}</span>
                    <span>📍 {comp.location}</span>
                  </div>
                </div>

                <div className="dropdown-icon">
                  {openCompetitionId === comp._id ? '▲' : '▼'}
                </div>
              </div>

              {openCompetitionId === comp._id && (
                <div className="comp-body">
                  {scoresForComp.length === 0 ? (
                    <p className="empty-state">
                      Još niste ocijenili nastupe za ovo natjecanje.
                    </p>
                  ) : (
                    <div className="scores-container">
                      {Object.entries(groupedScores).map(([style, ages]) => (
                        <div key={style} className="style-section">
                          <h4 className="style-title">{style}</h4>

                          {Object.entries(ages).map(([age, sizes]) => (
                            <div key={age} className="age-section">
                              <h5 className="age-title">• {age}</h5>

                              {Object.entries(sizes).map(([size, list]) => (
                                <div key={size} className="size-section">
                                  <div className="size-label">
                                    Kategorija: {size}
                                  </div>

                                  <div className="scores-grid">
                                    {list.map(score => (
                                      <div key={score._id} className="score-item-card">
                                        <div className="score-content">
                                          <div className="performance-info">
                                            <div className="performance-name">
                                              {score.performanceId?.choreographyName || 'Nepoznat nastup'}
                                            </div>
                                            {score.performanceId?.clubName && (
                                              <div className="club-name">
                                                {score.performanceId.clubName}
                                              </div>
                                            )}
                                            <div className="score-date">
                                              📅 Datum ocjene: {new Date(score.performanceId?.competitionId?.date || Date.now()).toLocaleDateString('hr-HR')}
                                            </div>
                                          </div>
                                          <div className="score-display">
                                            <div className="score-value">
                                              {calculateTotalScore(score)}
                                            </div>
                                            <div className="score-label-small">
                                              Ocjena
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default OcjenjivanjePage;