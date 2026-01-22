import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './suci.css';

function OcjenjivanjeKategorija() {
  const { competitionId } = useParams();
  const auth = useAuth();
  const [competition, setCompetition] = useState(null);
  const [performances, setPerformances] = useState([]);
  const [scores, setScores] = useState({});
  const [existingScores, setExistingScores] = useState(new Set());
  const [status, setStatus] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [canJudge, setCanJudge] = useState(false);

  // Funkcija za određivanje veličine grupe
  const getGroupSizeLabel = (count) => {
    if (count === 1) return 'Solo (1)';
    if (count === 2) return 'Duo (2)';
    if (count >= 3 && count <= 7) return 'Mala grupa (3–7)';
    if (count >= 8 && count <= 12) return 'Velika grupa (8–12)';
    return `Produkcija (${count})`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [compRes, perfRes, scoresRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/competitions/${competitionId}`),
          axios.get(`${process.env.REACT_APP_API_URL}/performances/competition/${competitionId}`),
          auth?.currentUser?._id
            ? axios.get(`${process.env.REACT_APP_API_URL}/scores/judge/${auth.currentUser._id}`)
            : Promise.resolve({ data: [] })
        ].map(p => p.catch(e => e)));

        if (compRes instanceof Error) throw compRes;
        setCompetition(compRes.data);
        setIsCompleted(compRes.data?.autoStatus === 'completed');
        setCanJudge(compRes.data?.autoStatus === 'ongoing');

        let perfData = [];
        if (!(perfRes instanceof Error)) {
          // filtriraj samo prihvaćene nastupe
          perfData = (perfRes.data || []).filter(p => p.isAccepted);
          setPerformances(perfData);
        }

        if (!(scoresRes instanceof Error) && Array.isArray(scoresRes.data)) {
          const judgedSet = new Set();
          const loadedScores = {};
          scoresRes.data.forEach(s => {
            const perfId = typeof s.performanceId === 'object' ? s.performanceId._id : s.performanceId;
            if (perfData.some(p => p._id === perfId)) {
              judgedSet.add(perfId);
              loadedScores[perfId] = { choreography: s.score };
            }
          });
          setExistingScores(judgedSet);
          setScores(prev => ({ ...prev, ...loadedScores }));
        }

      } catch (err) {
        console.error('Greška pri učitavanju podataka:', err);
        setError("Nije moguće učitati podatke.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [competitionId, auth?.currentUser?._id]);

  const handleScoreChange = (key, criterion, value) => {
    if (existingScores.has(key)) return;
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
    if (!scoreData) {
      alert("Unesite ocjenu prije slanja.");
      return;
    }

    if (!canJudge) {
      alert('Ocjenjivanje nije dopušteno — natjecanje nije u tijeku.');
      return;
    }

    setStatus(prev => ({ ...prev, [key]: 'Slanje...' }));

    let totalScore;
    if (typeof scoreData.score === 'number') {
      totalScore = scoreData.score;
    } else if (typeof scoreData.choreography === 'number') {
      totalScore = scoreData.choreography;
    } else {
      alert("Unesite valjanu ocjenu (1-10).");
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
      setExistingScores(prev => new Set(prev).add(key));
    } catch (err) {
      setStatus(prev => ({ ...prev, [key]: 'Greška pri slanju.' }));
      console.error("Greška pri slanju ocjene:", err.response?.data || err.message);
    }
  };

  if (loading) return <p>Učitavanje...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!competition) return null;

  // Grupiranje: PLESNI STIL -> DOB -> VELIČINA GRUPE
  const grouped = {};
  performances.forEach(perf => {
    const style = perf.danceStyle || 'Nepoznati stil';
    const age = perf.ageCategory || 'Nepoznata kategorija';
    const groupCount = Array.isArray(perf.participants)
      ? perf.participants.length
      : Number(perf.groupSize) || 1;
    const sizeLabel = getGroupSizeLabel(groupCount);

    if (!grouped[style]) grouped[style] = {};
    if (!grouped[style][age]) grouped[style][age] = {};
    if (!grouped[style][age][sizeLabel]) grouped[style][age][sizeLabel] = [];
    grouped[style][age][sizeLabel].push(perf);
  });

  return (
    <div className="dashboard-container">
      <Link to="/sudac" className="back-link" style={{ textDecoration: 'none', marginBottom: '20px', display: 'inline-block' }}>
        ← Nazad na Dashboard
      </Link>
      <h1>Ocjenjivanje nastupa</h1>

      {!canJudge && (
        <p style={{ color: 'red' }}>Ocjenjivanje je moguće samo za natjecanja koja su u tijeku.</p>
      )}

      {isCompleted && (
        <p style={{ color: 'red' }}>Natjecanje je završeno. Ocjenjivanje nije dozvoljeno.</p>
      )}

      {Object.keys(grouped).sort().map(style => (
        <div key={style} className="dance-style-section" style={{ marginBottom: '80px', padding: '40px', background: '#F8FAFF', borderRadius: '20px' }}>
          <div className="dance-style-header" style={{
            background: '#4F46E5',
            color: 'white',
            padding: '24px',
            borderRadius: '12px',
            marginBottom: '32px',
            fontSize: '28px',
            fontWeight: 'bold',
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(79, 70, 229, 0.2)',
            paddingBottom: '30px',
          }}>{style}</div>

          {Object.keys(grouped[style]).sort().map(age => (
            <div key={age} className="age-category-section" style={{ marginBottom: '32px' }}>
              <div className="age-category-header" style={{
                background: '#F3E8FF',
                color: '#6D28D9',
                padding: '16px 24px',
                borderRadius: '10px',
                marginBottom: '24px',
                fontSize: '22px',
                fontWeight: '600',
                textAlign: 'center'
              }}>{age}</div>

              {Object.keys(grouped[style][age]).sort().map(sizeLabel => (
                <div key={sizeLabel} className="group-size-section" style={{ marginBottom: '24px' }}>
                  <div className="group-size-header" style={{
                    background: '#EDE9FE',
                    color: '#4F46E5',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    fontSize: '18px',
                    fontWeight: '600'
                  }}>{sizeLabel}</div>

                  <div className="choreography-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
                    gap: '24px'
                  }}>
                    {grouped[style][age][sizeLabel].map(perf => {
                      const perfStatus = status[perf._id];
                      const hasScore = scores[perf._id]?.choreography;
                      const isAlreadyJudged = existingScores.has(perf._id) || perfStatus === 'Uspješno poslano!';

                      return (
                        <div key={perf._id} className="choreography-card" style={{
                          background: '#FFFFFF',
                          borderRadius: '12px',
                          padding: '24px',
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
                          border: '1px solid #E5E7EB',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          cursor: 'pointer'
                        }}>
                          <div className="card-header" style={{ paddingBottom: '16px', marginBottom: '16px' }}>
                            <h3 style={{
                              display: 'flex',
                              justifyContent: 'center',
                              fontSize: '18px',
                              fontWeight: '600',
                              color: '#FFFFFF'
                            }}>{perf.choreographyName || 'Bez naziva'}</h3>
                            <div className="card-meta" style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '16px',
                              fontSize: '14px',
                              color: '#FFFFFF',
                              padding: '8px 16px',
                              borderRadius: '8px',
                              marginTop: '12px'
                            }}>
                              <div className="card-meta">
                                <strong>Broj plesača:</strong> {perf.groupSize || '-'}
                              </div>
                              {(perf.clubId?.clubName || perf.clubName) && (
                                <div className="card-meta">
                                  <strong>Klub:</strong> {perf.clubId?.clubName || perf.clubName}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="scoring-section">
                            <label style={{ display: 'block', fontWeight: '600', marginBottom: '12px', color: '#374151', fontSize: '16px' }}>
                              Ocjena (1-10):
                            </label>
                            <div className="radio-group compact-radio" style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(5, 1fr)',
                              gap: '12px',
                              marginBottom: '24px'
                            }}>
                              {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                                <label key={`${perf._id}-c-${n}`} className="radio-label small" style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  cursor: isAlreadyJudged ? 'default' : 'pointer',
                                  padding: '12px',
                                  borderRadius: '8px',
                                  background: 'white',
                                  transition: 'all 0.2s ease',
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  textAlign: 'center',
                                  minHeight: '44px',
                                  opacity: isAlreadyJudged ? 0.6 : 1
                                }}>
                                  <input
                                    type="radio"
                                    name={`${perf._id}-choreography`}
                                    value={n}
                                    checked={Number(scores[perf._id]?.choreography) === n}
                                    onChange={() => handleScoreChange(perf._id, 'choreography', n)}
                                    disabled={isCompleted || isAlreadyJudged}
                                    style={{ margin: 0 }}
                                  />
                                  <span className="radio-num">{n}</span>
                                </label>
                              ))}
                            </div>

                            <button
                              onClick={() => handleSubmit(perf._id)}
                              className="card-button btn-primary-blue"
                              disabled={isCompleted || perfStatus === 'Slanje...' || isAlreadyJudged || !hasScore}
                              style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: 'none',
                                background: isAlreadyJudged ? '#E5E7EB' : (hasScore ? '#4F46E5' : '#E5E7EB'),
                                color: isAlreadyJudged ? '#9CA3AF' : (hasScore ? 'white' : '#9CA3AF'),
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: (hasScore && !isAlreadyJudged) ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s ease',
                                height: '44px'
                              }}
                              onMouseEnter={(e) => {
                                if (hasScore && !isAlreadyJudged) {
                                  e.currentTarget.style.background = '#4338CA';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (hasScore && !isAlreadyJudged) {
                                  e.currentTarget.style.background = '#4F46E5';
                                  e.currentTarget.style.transform = 'translateY(0)';
                                }
                              }}
                            >
                              {isAlreadyJudged ? 'Nastup ocijenjen' : (perfStatus || 'Pošalji ocjenu')}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default OcjenjivanjeKategorija;
