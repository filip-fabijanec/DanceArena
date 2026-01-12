import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './suci.css';

function OcjenjivanjeKategorija() {
  const { competitionId } = useParams();
  const auth = useAuth(); // Dodaj ovu liniju
  const [competition, setCompetition] = useState(null);
  const [performances, setPerformances] = useState([]);
  const [scores, setScores] = useState({});
  const [status, setStatus] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [canJudge, setCanJudge] = useState(false); // only true when competition is 'ongoing'

  useEffect(() => {
    const fetchCompetitionAndPerformances = async () => {
      try {
        setLoading(true);
        const [compRes, perfRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/competitions/${competitionId}`),
          axios.get(`${process.env.REACT_APP_API_URL}/performances?competitionId=${competitionId}`)
        ].map(p => p.catch(e => e)));

        if (compRes instanceof Error) {
          throw compRes;
        }
        setCompetition(compRes.data);
        setIsCompleted(compRes.data?.autoStatus === 'completed');
        // only allow judging when competition is currently ongoing
        setCanJudge(compRes.data?.autoStatus === 'ongoing');

        if (perfRes instanceof Error) {
          // 404 for no performances is okay — set empty array
          if (perfRes.response && perfRes.response.status === 404) {
            setPerformances([]);
          } else {
            console.error('Greška pri dohvaćanju nastupa:', perfRes);
            setPerformances([]);
          }
        } else {
          if (Array.isArray(perfRes.data)) {
            setPerformances(perfRes.data);
          } else {
            console.warn('Neočekivan odgovor za nastupe:', perfRes.data);
            setPerformances([]);
          }
        }
      } catch (err) {
        console.error('Greška pri učitavanju natjecanja ili nastupa:', err);
        setError("Nije moguće učitati podatke za natjecanje.");
      } finally {
        setLoading(false);
      }
    };
    fetchCompetitionAndPerformances();
  }, [competitionId]);

  const handleScoreChange = (key, criterion, value) => {
    const numValue = criterion === 'score'
      ? Math.max(0, Math.min(30, Number(value)))
      : Math.max(1, Math.min(10, Number(value)));
    setScores(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [criterion]: numValue,
      }
    }));
  };

  const handleSubmit = async (key) => {
    const scoreData = scores[key];
    // Allow submitting a single 'choreography' score, a single 'score', or all three criteria
    if (!scoreData) {
      alert("Unesite ocjenu prije slanja.");
      return;
    }

    // Prevent submitting if competition is not ongoing
    if (!canJudge) {
      alert('Ocjenjivanje nije dopušteno — natjecanje nije u tijeku.');
      return;
    }

    setStatus(prev => ({ ...prev, [key]: 'Slanje...' }));

    // Odredi totalScore (prioritet: score -> single choreography -> sum of three)
    let totalScore;
    if (typeof scoreData.score === 'number') {
      totalScore = scoreData.score;
    } else if (typeof scoreData.choreography === 'number' && typeof scoreData.performance !== 'number' && typeof scoreData.rhythm !== 'number') {
      totalScore = scoreData.choreography;
    } else if (
      typeof scoreData.choreography === 'number' &&
      typeof scoreData.performance === 'number' &&
      typeof scoreData.rhythm === 'number'
    ) {
      totalScore = scoreData.choreography + scoreData.performance + scoreData.rhythm;
    } else {
      alert("Unesite valjanu ocjenu (1-10) ili sve kriterije od 1 do 10.");
      setStatus(prev => ({ ...prev, [key]: 'Greška pri slanju.' }));
      return;
    }

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/scores`, {
        performanceId: key,
        judgeId: auth?.currentUser?._id,
        score: totalScore
      });
      setStatus(prev => ({ ...prev, [key]: 'Uspješno poslano!' }));
    } catch (err) {
      setStatus(prev => ({ ...prev, [key]: 'Greška pri slanju.' }));
      console.error("Greška pri slanju ocjene:", err.response?.data || err.message);
    }
  };

  if (loading) return <p>Učitavanje...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!competition) return null;

  return (
    <div className="dashboard-container">
      <Link to="/sudac/moja-natjecanja" className="back-link" style={{ textDecoration: 'none', marginBottom: '20px', display: 'inline-block' }}>
        ← Nazad na Moja Natjecanja
      </Link>
      <h1>Ocjenjivanje nastupa</h1>

      {/* show message when not ongoing */}
      {!canJudge && (
        <p style={{ color: 'red' }}>Ocjenjivanje je moguće samo za natjecanja koja su u tijeku.</p>
      )}

      {isCompleted && (
        <p style={{ color: 'red' }}>Natjecanje je završeno. Ocjenjivanje nije dozvoljeno.</p>
      )}

 

      {/* Grupiraj izvedbe prema dobnoj kategoriji (godine) i sortiraj unutar kategorije po veličini grupe (solo prvo) */}
      <div style={{ marginTop: '20px' }}>
        {performances.length === 0 ? (
          <p>Nema prijavljenih nastupa za ovo natjecanje.</p>
        ) : (
          (() => {
            const groupedByAge = {};
            performances.forEach(perf => {
              const age = perf.ageCategory || 'Nepoznata kategorija';
              if (!groupedByAge[age]) groupedByAge[age] = [];
              groupedByAge[age].push(perf);
            });

            // sortiraj kategorije numerički ako je moguće, inače leksički
            const ageKeys = Object.keys(groupedByAge).sort((a, b) => {
              const na = Number(a), nb = Number(b);
              if (!isNaN(na) && !isNaN(nb)) return na - nb;
              return a.localeCompare(b);
            });

            return ageKeys.map(age => {
              const perfs = groupedByAge[age].slice().sort((p1, p2) => {
                // solo (groupSize === 1) prvo, pa rastuće prema veličini
                return (p1.groupSize || 0) - (p2.groupSize || 0);
              });

              return (
                <div key={age} className="age-category-container judging-container" style={{ marginBottom: 24 }}>
                  <div className="age-header"><span className="age-icon">🎯</span>{age}</div>
                  <div className="group-list">
                    {perfs.map(perf => {
                      const perfStatus = status[perf._id];
                      return (
                        <div key={perf._id} className="group-item" style={{ marginBottom: 12 }}>
                          <div className="group-left">
                            <div className="group-name">{perf.choreographyName || 'Bez naziva'}</div>
                            <div className="group-meta">Veličina: {perf.groupSize || '-'}{perf.participants ? ` • Sudionici: ${perf.participants.length}` : ''}</div>

                            <div className="score-form" style={{ marginTop: 8 }}>
                              <label className="score-label">Ocjena (1-10):</label>
                              <div className="radio-group compact-radio">
                                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                                  <label key={`${perf._id}-c-${n}`} className="radio-label small">
                                    <input
                                      type="radio"
                                      name={`${perf._id}-choreography`}
                                      value={n}
                                      checked={Number(scores[perf._id]?.choreography) === n}
                                      onChange={() => handleScoreChange(perf._id, 'choreography', n)}
                                      disabled={isCompleted || perfStatus === 'Uspješno poslano!'}
                                    />
                                    <span className="radio-num">{n}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="group-right">
                            <button
                              onClick={() => handleSubmit(perf._id)}
                              className="card-button btn-primary-blue"
                              disabled={isCompleted || perfStatus === 'Slanje...' || perfStatus === 'Uspješno poslano!'}
                            >
                              {perfStatus || 'Pošalji ocjenu'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()
        )}
      </div>
    </div>
  );
}

export default OcjenjivanjeKategorija;