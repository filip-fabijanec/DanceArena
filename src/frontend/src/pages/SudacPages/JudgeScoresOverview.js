import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './suci.css';

function JudgeScoresOverview() {
  const auth = useAuth();
  const judgeId = auth?.currentUser?._id;

  const [competitions, setCompetitions] = useState([]);
  const [scores, setScores] = useState([]);
  const [openCompetitionId, setOpenCompetitionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const toggleCompetition = id => {
    setOpenCompetitionId(prev => (prev === id ? null : id));
  };

  useEffect(() => {
    if (!judgeId) {
      setError('Niste prijavljeni.');
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      try {
        const [compRes, scoreRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/competitions/judge/${judgeId}`),
          axios.get(`${process.env.REACT_APP_API_URL}/scores/judge/${judgeId}`)
        ]);

        setCompetitions(compRes.data || []);
        setScores(scoreRes.data || []);
      } catch {
        setError('Greška pri dohvaćanju ocjena.');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [judgeId]);

  const calculateTotalScore = score => {
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

        if (scoresForComp.length === 0) return null;

        /* === GRUPIRANJE: stil → dob → kategorija === */
        const groupedScores = scoresForComp.reduce((acc, score) => {
          const p = score.performanceId || {};

          const style = p.danceStyle || 'Ostali stilovi';
          const age = p.ageCategory || 'Ostale dobi';
          const size = p.groupCategory || 'Ostale kategorije';

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
                {Object.entries(groupedScores).map(([style, ages]) => (
                  <div key={style} style={{ marginBottom: 30 }}>
                    <h4
                      style={{
                        borderBottom: '2px solid #4F46E5',
                        paddingBottom: 6,
                        marginBottom: 16,
                        color: '#2c3e50'
                      }}
                    >
                      {style}
                    </h4>

                    {Object.entries(ages).map(([age, sizes]) => (
                      <div key={age} style={{ marginLeft: 10, marginBottom: 20 }}>
                        <h5
                          style={{
                            color: '#555',
                            marginBottom: 10,
                            fontSize: '1.05rem'
                          }}
                        >
                          • {age}
                        </h5>

                        {Object.entries(sizes).map(([size, list]) => (
                          <div
                            key={size}
                            style={{ marginLeft: 15, marginBottom: 16 }}
                          >
                            <div
                              style={{
                                fontSize: '0.9rem',
                                color: '#888',
                                marginBottom: 8,
                                fontStyle: 'italic'
                              }}
                            >
                              Kategorija: {size}
                            </div>

                            <div className="scores-grid">
                              {list.map(score => (
                                <div
                                  key={score._id}
                                  className="score-item-card"
                                >
                                  <div className="score-top">
                                    <div className="performance-name">
                                      {score.performanceId?.choreographyName ||
                                        'Nepoznat nastup'}
                                    </div>
                                    <div className="score-badge">
                                      {calculateTotalScore(score)}
                                    </div>
                                  </div>

                                  <div className="score-bottom">
                                    Datum ocjene:{' '}
                                    {new Date(
                                      score.performanceId?.competitionId?.date ||
                                        Date.now()
                                    ).toLocaleDateString('hr-HR')}
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
        );
      })}
    </div>
  );
}

export default JudgeScoresOverview;
