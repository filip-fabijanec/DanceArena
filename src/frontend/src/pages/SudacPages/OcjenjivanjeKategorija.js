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
  const [scores, setScores] = useState({}); // Lokalno stanje za unos
  const [existingScores, setExistingScores] = useState(new Set()); // Stanje za već spremljene ocjene u bazi
  const [status, setStatus] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [canJudge, setCanJudge] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Dohvati natjecanje, nastupe i POSTOJEĆE OCJENE sudca
        const [compRes, perfRes, scoresRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/competitions/${competitionId}`),
          axios.get(`${process.env.REACT_APP_API_URL}/performances/competition/${competitionId}`),
          auth?.currentUser?._id 
            ? axios.get(`${process.env.REACT_APP_API_URL}/scores/judge/${auth.currentUser._id}`)
            : Promise.resolve({ data: [] })
        ].map(p => p.catch(e => e)));

        // Obrada natjecanja
        if (compRes instanceof Error) throw compRes;
        setCompetition(compRes.data);
        setIsCompleted(compRes.data?.autoStatus === 'completed');
        setCanJudge(compRes.data?.autoStatus === 'ongoing');

        // Obrada nastupa
        let perfData = [];
        if (perfRes instanceof Error) {
          if (perfRes.response && perfRes.response.status === 404) {
             // ok, nema nastupa
          } else {
            console.error('Greška pri dohvaćanju nastupa:', perfRes);
          }
        } else {
          perfData = perfRes.data || [];
          setPerformances(perfData);
        }

        // Obrada postojećih ocjena (kako bi gumbi bili onemogućeni odmah pri učitavanju)
        if (!(scoresRes instanceof Error) && Array.isArray(scoresRes.data)) {
          const judgedSet = new Set();
          const loadedScores = {};
          
          scoresRes.data.forEach(s => {
            // Provjeri pripada li ocjena nekom od nastupa s ovog natjecanja
            // (Ovisno o strukturi backend-a, s.performanceId može biti objekt ili string)
            const perfId = typeof s.performanceId === 'object' ? s.performanceId._id : s.performanceId;
            
            // Ako je ovaj nastup u listi nastupa ovog natjecanja
            if (perfData.some(p => p._id === perfId)) {
              judgedSet.add(perfId);
              // Učitaj vrijednost da se vidi na radio gumbima (pretpostavka da je 'score' glavna ocjena)
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
    // Ako je već ocijenjeno u bazi, ne daj promjenu (opcionalno, ali sigurnije)
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
      // Odmah dodaj u listu "postojećih" da se gumb zaključa bez refresha
      setExistingScores(prev => new Set(prev).add(key));

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

      {!canJudge && (
        <p style={{ color: 'red' }}>Ocjenjivanje je moguće samo za natjecanja koja su u tijeku.</p>
      )}

      {isCompleted && (
        <p style={{ color: 'red' }}>Natjecanje je završeno. Ocjenjivanje nije dozvoljeno.</p>
      )}

      <div style={{ marginTop: '20px' }}>
        {performances.length === 0 ? (
          <p>Nema prijavljenih nastupa za ovo natjecanje.</p>
        ) : (
          (() => {
            const grouped = {};
            performances.forEach(perf => {
              const danceStyle = perf.danceStyle || 'Nepoznati stil';
              const age = perf.ageCategory || 'Nepoznata kategorija';
              if (!grouped[danceStyle]) grouped[danceStyle] = {};
              if (!grouped[danceStyle][age]) grouped[danceStyle][age] = [];
              grouped[danceStyle][age].push(perf);
            });

            const danceStyles = Object.keys(grouped).sort();

            return danceStyles.map(danceStyle => (
              <div key={danceStyle} className="dance-style-section" style={{ marginBottom: '80px',
                                                                    padding: '40px',
                                                                    background: '#F8FAFF',
                                                                    borderRadius: '20px' }}>
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
                }}>
                  {danceStyle}
                </div>

                {Object.keys(grouped[danceStyle]).sort((a, b) => {
                  const na = Number(a), nb = Number(b);
                  if (!isNaN(na) && !isNaN(nb)) return na - nb;
                  return a.localeCompare(b);
                }).map(age => (
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
                    }}>
                      {age}
                    </div>

                    <div className="choreography-grid" style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
                      gap: '24px'
                    }}>
                      {grouped[danceStyle][age].map(perf => {
                        const perfStatus = status[perf._id];
                        const hasScore = scores[perf._id]?.choreography;
                        
                        // Provjera: Je li već u bazi (existingScores) ili je upravo uspješno poslano
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
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.06)';
                          }}>
                            <div className="card-header" style={{
                              paddingBottom: '16px',
                              marginBottom: '16px'
                            }}>
                              <h3 style={{
                                display: 'flex',
                                justifyContent: 'center',
                                fontSize: '18px',
                                fontWeight: '600',
                                color: '#FFFFFF'
                              }}>
                                {perf.choreographyName || 'Bez naziva'}
                              </h3>
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
                              <label style={{
                                display: 'block',
                                fontWeight: '600',
                                marginBottom: '12px',
                                color: '#374151',
                                fontSize: '16px'
                              }}>
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
                                    cursor: isAlreadyJudged ? 'default' : 'pointer', // Isključi pointer ako je ocijenjeno
                                    padding: '12px',
                                    borderRadius: '8px',
                                    background: 'white',
                                    transition: 'all 0.2s ease',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    textAlign: 'center',
                                    minHeight: '44px',
                                    opacity: isAlreadyJudged ? 0.6 : 1 // Malo prozirno ako je ocijenjeno
                                  }}>
                                    <input
                                      type="radio"
                                      name={`${perf._id}-choreography`}
                                      value={n}
                                      checked={Number(scores[perf._id]?.choreography) === n}
                                      onChange={() => handleScoreChange(perf._id, 'choreography', n)}
                                      disabled={isCompleted || isAlreadyJudged} // Onemogući radio ako je ocijenjeno
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
                                  // Ako je ocijenjeno -> Sivo, inače prema logici (Plavo ako ima ocjene, sivo ako nema)
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
            ));
          })()
        )}
      </div>
    </div>
  );
}

export default OcjenjivanjeKategorija;