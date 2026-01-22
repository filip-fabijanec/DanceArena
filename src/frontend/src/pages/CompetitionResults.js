import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import PublicNavbar from '../components/PublicNavbar';
import './ComtetitionResults.css';

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

  if (loading) return (
    <div className="dashboard-container" style={{ paddingTop: 24, textAlign: 'center' }}>
      <div style={{ padding: '80px 20px' }}>
        <div style={{ 
          fontSize: '48px', 
          marginBottom: '20px',
          animation: 'pulse 1.5s infinite'
        }}>🏆</div>
        <p style={{ fontSize: '20px', color: '#6b7280' }}>Učitavanje rezultata...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="dashboard-container" style={{ paddingTop: 24 }}>
      <div className="results-error-state">
        <h3>Greška</h3>
        <p>{error}</p>
        <Link to="/" style={{
          display: 'inline-block',
          marginTop: '20px',
          padding: '12px 24px',
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '10px',
          fontWeight: '600',
          boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(79, 70, 229, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.3)';
        }}>
          ← Povratak na glavnu stranicu
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <PublicNavbar />
      <div className="dashboard-container" style={{ paddingTop: 24 }}>
        <Link to="/" role="button" className="back-button" aria-label="Natrag na glavnu stranicu" style={{
          textDecoration: 'none',
          color: '#4F46E5',
          fontSize: '16px',
          fontWeight: '500',
          display: 'inline-block',
          marginBottom: '24px',
          padding: '12px 24px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          background: 'white',
          transition: 'all 0.3s ease',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f3f4f6';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'white';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
        }}>
          ← Nazad na glavnu stranicu
        </Link>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 className="results-title">Rezultati: {competitionName}</h1>
          <p style={{ color: '#6b7280', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
            Konačni poredak nastupa po plesnim stilovima i kategorijama
          </p>
        </div>

        {results.length === 0 ? (
          <div className="results-empty-state">
            <h3>Nema rezultata</h3>
            <p>Za ovo natjecanje još nisu dostupni rezultati. Pokušajte kasnije.</p>
          </div>
        ) : (
          results.map(styleBlock => (
            <section key={styleBlock.danceStyle} className="results-style-block">
              {/* PLESNI STIL - Najviša razina */}
              <div className="results-style-header">
                <span>💃</span>
                <h2>
                  {styleBlock.danceStyle}
                </h2>
              </div>

              {/* DOBNE KATEGORIJE */}
              {styleBlock.ageCategories.map(ageBlock => (
                <div key={ageBlock.ageCategory} className="results-age-block">
                  <div className="results-age-header">
                    <span className="results-age-icon">🏆</span>
                    <h2 className="results-age-title">{ageBlock.ageCategory}</h2>
                  </div>

                  {/* VELIČINE GRUPA */}
                  {ageBlock.sizes.map(size => (
                    <div key={size.sizeLabel} className="results-size-block">
                      <div className="results-size-header">
                        <span className="results-size-badge">Veličina: {size.sizeLabel}</span>
                      </div>

                      <div className="results-group-list">
                        {size.items.map(item => (
                          <article 
                            key={item.performanceId} 
                            className={`results-group-item results-rank-${item.rank} ${item.rank <= 3 ? 'results-podium-item' : ''}`}
                          >
                            <div className="results-judges-badge">
                              {item.judgesCount} sudac{item.judgesCount !== 1 ? 'a' : ''}
                            </div>
                            <div className="results-group-left">
                              <div className="results-group-top">
                                <div className="results-medal-badge">
                                  {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : item.rank}
                                </div>
                                <div>
                                  <div className="results-group-name">
                                    {item.choreographyName}
                                  </div>
                                  {item.clubName && (
                                    <div className="results-group-club">
                                      {item.clubName}
                                    </div>
                                  )}
                                </div>
                              </div>
                             
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