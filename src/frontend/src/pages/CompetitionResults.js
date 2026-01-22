import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import PublicNavbar from '../components/PublicNavbar';
import './SudacPages/suci.css';

function CompetitionResults() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [competitionName, setCompetitionName] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const [compRes, resRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/competitions/${id}`),
          axios.get(`${process.env.REACT_APP_API_URL}/competitions/${id}/results`)
        ].map(p => p.catch(e => e)));

        if (!(compRes instanceof Error)) {
          setCompetitionName(compRes.data.name);
        }

        if (resRes instanceof Error) {
          setError('Ne mogu dohvatiti rezultate.');
        } else {
          setResults(resRes.data || []);
        }
      } catch (err) {
        setError('Greška pri dohvaćanju rezultata.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [id]);

  if (loading) return <p>Učitavanje rezultata...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <>
      <PublicNavbar />
      <div className="dashboard-container" style={{ paddingTop: 24 }}>
        <Link to="/" role="button" className="back-button" aria-label="Natrag na glavnu stranicu">← Nazad</Link>
        <h1 className="results-title">Rezultati: {competitionName}</h1>

        {results.length === 0 ? (
          <p>Nema rezultata za ovo natjecanje.</p>
        ) : (
          results.map(styleBlock => (
            <section key={styleBlock.danceStyle} className="style-block" style={{ marginBottom: '48px' }}>
              {/* PLESNI STIL - Najviša razina */}
              <div className="style-header" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '24px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <span style={{ fontSize: '32px', marginRight: '12px' }}>💃</span>
                <h2 style={{ 
                  color: 'white', 
                  fontSize: '28px', 
                  fontWeight: 'bold',
                  margin: 0,
                  display: 'inline'
                }}>
                  {styleBlock.danceStyle}
                </h2>
              </div>

              {/* DOBNE KATEGORIJE */}
              {styleBlock.ageCategories.map(ageBlock => (
                <div key={ageBlock.ageCategory} className="age-block" style={{ marginLeft: '20px', marginBottom: '32px' }}>
                  <div className="age-header">
                    <span className="age-icon">🏆</span>
                    <h2 className="age-title">{ageBlock.ageCategory}</h2>
                  </div>

                  {/* VELIČINE GRUPA */}
                  {ageBlock.sizes.map(size => (
                    <div key={size.sizeLabel} className="size-block">
                      <div className="size-header">
                        <span className="size-badge">Veličina: {size.sizeLabel}</span>
                      </div>

                      <div className="group-list">
                        {size.items.map(item => (
                          <article key={item.performanceId} className="group-item">
                            <div className="group-left">
                              <div className="group-top">
                                <span className={`medal-badge rank-${item.rank}`} aria-hidden={item.rank <= 3}>
                                  {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : item.rank}
                                </span>
                                <div className="group-name">
                                  {item.choreographyName}
                                  {item.clubName ? ` (${item.clubName})` : ''}
                                </div>
                              </div>

                              <div className="group-meta">
                                <span className="info-badge">{item.groupSize}</span>
                                <span className="info-badge">Sudaca: {item.judgesCount}</span>
                              </div>
                            </div>

                            <div className="group-right">
                              <span className="points-badge" aria-label={`Bodovi: ${item.totalScore} points`}>
                                {item.totalScore} pts
                              </span>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </section>
          ))
        )}
      </div> 
    </>
  );
}

export default CompetitionResults;