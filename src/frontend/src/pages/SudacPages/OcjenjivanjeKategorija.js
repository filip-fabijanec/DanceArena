import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function OcjenjivanjeKategorija() {
  const { competitionId } = useParams();
  const auth = useAuth();
  const [competition, setCompetition] = useState(null);
  const [scores, setScores] = useState({});
  const [status, setStatus] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompetition = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${process.env.REACT_APP_API_URL}/competitions/${competitionId}`);
        if (!res.ok) throw new Error('Greška pri dohvaćanju podataka');
        const data = await res.json();
        setCompetition(data);
      } catch (err) {
        setError("Nije moguće učitati podatke za natjecanje.");
      } finally {
        setLoading(false);
      }
    };
    fetchCompetition();
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
    // Provjeri da su sve tri ocjene unesene
    if (
      !scoreData ||
      typeof scoreData.choreography !== 'number' ||
      typeof scoreData.performance !== 'number' ||
      typeof scoreData.rhythm !== 'number'
    ) {
      alert("Unesite sve ocjene od 1 do 10.");
      return;
    }
    setStatus(prev => ({ ...prev, [key]: 'Slanje...' }));

    // Zbroji ocjene
    const totalScore = scoreData.choreography + scoreData.performance + scoreData.rhythm;

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          performanceId: key,
          judgeId: auth?.currentUser?._id,
          score: totalScore
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Greška pri slanju');
      }
      
      setStatus(prev => ({ ...prev, [key]: 'Uspješno poslano!' }));
    } catch (err) {
      setStatus(prev => ({ ...prev, [key]: 'Greška pri slanju.' }));
      console.error("Greška pri slanju ocjene:", err.message);
    }
  };

  if (loading) return <p>Učitavanje...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!competition) return null;

  return (
    <div className="dashboard-container">
      <Link to="/sudac/moja-natjecanja" className="card-button" style={{ textDecoration: 'none', marginBottom: '20px', display: 'inline-block' }}>
        ← Nazad na Moja Natjecanja
      </Link>
      <h1>Ocjenjivanje po kategorijama i veličinama grupa</h1>
      {competition.ageCategories.map(cat => (
        <div key={cat}>
          <h2>{cat}</h2>
          {competition.groupSizes.map(size => {
            const key = `${cat}_${size}`;
            const perfStatus = status[key];
            if (perfStatus === 'Uspješno poslano!') return null; // Sakrij ocjenjeno
            const currentScores = scores[key] || {};
            return (
              <div key={size} style={{ marginLeft: '20px', marginBottom: '20px' }}>
                <h3>Veličina grupe: {size}</h3>
                <div className="score-form">
                  <div className="score-input-group">
                    <label>Koreografija (1-10):</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={currentScores.choreography || ''}
                      onChange={e => handleScoreChange(key, 'choreography', e.target.value)}
                      disabled={perfStatus === 'Uspješno poslano!'}
                    />
                  </div>
                  <div className="score-input-group">
                    <label>Nastup (1-10):</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={currentScores.performance || ''}
                      onChange={e => handleScoreChange(key, 'performance', e.target.value)}
                      disabled={perfStatus === 'Uspješno poslano!'}
                    />
                  </div>
                  <div className="score-input-group">
                    <label>Ritam (1-10):</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={currentScores.rhythm || ''}
                      onChange={e => handleScoreChange(key, 'rhythm', e.target.value)}
                      disabled={perfStatus === 'Uspješno poslano!'}
                    />
                  </div>
                  <button
                    onClick={() => handleSubmit(key)}
                    className="card-button"
                    disabled={perfStatus === 'Slanje...' || perfStatus === 'Uspješno poslano!'}
                  >
                    {perfStatus || 'Pošalji ocjenu'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ))}
      {competition.performances && (
        <div style={{ marginTop: '40px' }}>
          <h2>Ocjenjivanje nastupa</h2>
          {competition.performances.map(perf => {
            const currentScore = scores[perf._id]?.score || '';
            const perfStatus = status[perf._id];
            return (
              <div key={perf._id} className="dashboard-card">
                <h4>{perf.choreographyName}</h4>
                <div>
                  <label>Ocjena (0-30):</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={currentScore}
                    onChange={e => setScores(prev => ({
                      ...prev,
                      [perf._id]: { score: Number(e.target.value) }
                    }))}
                    disabled={perfStatus === 'Uspješno poslano!'}
                  />
                  <button
                    onClick={() => handleSubmit(perf._id)}
                    className="card-button"
                    disabled={perfStatus === 'Slanje...' || perfStatus === 'Uspješno poslano!'}
                  >
                    {perfStatus || 'Pošalji ocjenu'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OcjenjivanjeKategorija;