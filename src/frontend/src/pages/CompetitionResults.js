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
        results.map(ageBlock => (
          <section key={ageBlock.ageCategory} className="age-block">
            <div className="age-header"><span className="age-icon">🏆</span><h2 className="age-title">{ageBlock.ageCategory}</h2></div>

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
                          <span className={`medal-badge rank-${item.rank}`} aria-hidden={item.rank <= 3}>{item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : item.rank}</span>
                          <div className="group-name">{item.choreographyName}{item.clubName ? ` (${item.clubName})` : ''}</div>
                        </div>

                        <div className="group-meta">
                          <span className="info-badge">{item.groupSize}</span>
                          <span className="info-badge">Sudaca: {item.judgesCount}</span>
                        </div>
                      </div>

                      <div className="group-right">
                        <span className="points-badge" aria-label={`Bodovi: ${item.totalScore} points`}>{item.totalScore} pts</span>
                      </div>
                    </article>
                  ))}
                </div>
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
