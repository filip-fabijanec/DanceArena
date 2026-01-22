import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import '../Dashboard.css';
import './VoditeljPages.css';

function VoditeljDashboard() {
  const { currentUser, token } = useAuth();

  const [competitions, setCompetitions] = useState([]);
  const [myPerformances, setMyPerformances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(null);

  /* ===== FILTER + SORT (DODANO) ===== */
  const [competitionFilter, setCompetitionFilter] = useState('all');
  const [perfFilter, setPerfFilter] = useState('all'); // all | pending | approved
  const [perfSort, setPerfSort] = useState('dateAsc'); // dateAsc | dateDesc
  const [perfAnimateIn, setPerfAnimateIn] = useState(false);

  const [scoresByPerformance, setScoresByPerformance] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('payment_success') === 'true') {
      setMessage('✅ Plaćanje uspješno! Vaš nastup je registriran.');
      setMessageType('success');
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => setMessage(''), 5000);
    }

    if (params.get('payment_cancelled') === 'true') {
      setMessage('❌ Plaćanje je otkazano. Pokušajte ponovno.');
      setMessageType('error');
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => setMessage(''), 5000);
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setPerfAnimateIn(false);

      const compResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/competitions/upcoming/after-2-days`
      );
      if (compResponse.ok) {
        setCompetitions(await compResponse.json());
      }

      const perfResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/performances?clubId=${currentUser._id}`
      );
      if (perfResponse.ok) {
      const perfs = await perfResponse.json();
      setMyPerformances(perfs);

      // povuci ocjene samo za locked + approved
      const needScores = perfs.filter(p => p.approved && p.competitionId?.isLocked);

      if (needScores.length > 0 && token) {
        const results = await Promise.all(
          needScores.map(async (p) => {
            try {
              const r = await fetch(
                `${process.env.REACT_APP_API_URL}/performances/${p._id}/scores`,
                { headers: { Authorization: `Bearer ${token}` } }
              );

              if (!r.ok) return [p._id, { error: true }];

              const data = await r.json();
              return [p._id, data];
            } catch {
              return [p._id, { error: true }];
            }
          })
        );

        const map = Object.fromEntries(results);
        setScoresByPerformance(map);
      }
    } else {
      setMyPerformances([]);
    }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => setPerfAnimateIn(true));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('hr-HR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadPdf = async (competitionId) => {
    if (!token) {
      alert('Token nije dostupan. Molimo prijavite se ponovno.');
      return;
    }

    try {
      setDownloadingPdf(competitionId);

      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/competitions/${competitionId}/pdf`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const text = await res.text();
        alert('Greška pri preuzimanju PDF-a: ' + text);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'startna_lista.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Greška pri preuzimanju PDF-a.');
    } finally {
      setDownloadingPdf(null);
    }
  };

  /* ===== DROPDOWN NATJECANJA (DODANO) ===== */
  const competitionOptions = useMemo(() => {
    const map = new Map();
    myPerformances.forEach((p) => {
      if (p.competitionId?._id) {
        map.set(p.competitionId._id, p.competitionId.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [myPerformances]);

  /* ===== SORT + FILTER (DODANO) ===== */
  const visiblePerformances = useMemo(() => {
    let list = [...myPerformances];

    if (competitionFilter !== 'all') {
      list = list.filter(
        (p) => p.competitionId?._id === competitionFilter
      );
    }

    if (perfFilter === 'pending') list = list.filter((p) => !p.approved);
    if (perfFilter === 'approved') list = list.filter((p) => p.approved);

    const getDate = (p) =>
      p?.competitionId?.date
        ? new Date(p.competitionId.date).getTime()
        : Number.POSITIVE_INFINITY;

    list.sort((a, b) =>
      perfSort === 'dateAsc' ? getDate(a) - getDate(b) : getDate(b) - getDate(a)
    );

    return list;
  }, [myPerformances, competitionFilter, perfFilter, perfSort]);


  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="dashboard-container">
          <h1>Voditelj Kluba Dashboard</h1>
          <p>Učitavanje...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="dashboard-container">
        <h1>Voditelj Kluba Dashboard</h1>
        <p className="welcome-text">
          Dobrodošli! Upravljajte prijavama i pratite natjecanja.
        </p>

        {message && (
          <div className={`message-banner ${messageType}`}>
            {message}
          </div>
        )}

        {/* ===== MOJ KLUB (NIJE DIRANO) ===== */}
        <section className="dashboard-section">
          <h2>Moj Klub</h2>
          <div className="club-info-card">
            <div className="club-info-row">
              <span className="info-label">Naziv kluba:</span>
              <span className="info-value">
                {currentUser.clubName || 'Nije postavljeno'}
              </span>
            </div>
            <div className="club-info-row">
              <span className="info-label">Lokacija:</span>
              <span className="info-value">
                {currentUser.clubLocation || 'Nije postavljeno'}
              </span>
            </div>
            <div className="club-info-row">
              <span className="info-label">Voditelj:</span>
              <span className="info-value">
                {currentUser.name} {currentUser.surname}
              </span>
            </div>
            <div className="club-info-row">
              <span className="info-label">Email Voditelja:</span>
              <span className="info-value">{currentUser.email}</span>
            </div>
          </div>
        </section>

        {/* ===== NADOLAZEĆA NATJECANJA (NIJE DIRANO) ===== */}
        <section className="dashboard-section">
          <h2>Nadolazeća natjecanja</h2>

          {competitions.length === 0 ? (
            <div className="empty-state">
              <p>Trenutno nema nadolazećih natjecanja.</p>
            </div>
          ) : (
            <div className="competitions-grid">
              {competitions.map((comp) => (
                <div key={comp._id} className="competition-card">
                  <div className="card-header">
                    <h3>{comp.name}</h3>
                  </div>
                  <div className="card-body">
                    <div className="info-item">
                      <span className="icon">📅</span>
                      <span>Datum: {formatDate(comp.date)}</span>
                    </div>
                    <div className="info-item">
                      <span className="icon">📍</span>
                      <span>Lokacija: {comp.location}</span>
                    </div>
                    <div className="info-item">
                      <span className="icon">💰</span>
                      <span>Kotizacija: {comp.registrationFee} €</span>
                    </div>

                    {comp.description && (
                      <p className="competition-description">
                        {comp.description}
                      </p>
                    )}

                    <div className="categories-summary">
                      <div className="category-item">
                        <strong>Dobne kategorije:</strong>
                        <span>{comp.ageCategories.length} dostupnih</span>
                      </div>
                      <div className="category-item">
                        <strong>Stilovi:</strong>
                        <span>{comp.danceStyles.length} dostupnih</span>
                      </div>
                      <div className="category-item">
                        <strong>Veličine:</strong>
                        <span>{comp.groupSizes.length} dostupnih</span>
                      </div>
                    </div>

                    {!comp.isLocked ? (
                      <Link
                        to={`/voditelj/prijavi-nastup/${comp._id}`}
                        className="btn-primary full-width"
                      >
                        Prijavi nastup
                      </Link>
                    ) : (
                      <button className="btn-disabled full-width" disabled>
                        🔒 Prijave su zaključane
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ===== MOJE PRIJAVE + SORT (DODANO) ===== */}
        <section className="dashboard-section">
          <h2>Moje prijave</h2>

          <div className="performance-toolbar">
            <label className="sort-select">
              Natjecanje:
              <select
                value={competitionFilter}
                onChange={(e) => setCompetitionFilter(e.target.value)}
              >
                <option value="all">Sva natjecanja</option>
                {competitionOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="filter-chips">
              <button
                className={`chip ${perfFilter === 'all' ? 'active' : ''}`}
                onClick={() => setPerfFilter('all')}
              >
                Sve
              </button>
              <button
                className={`chip ${perfFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setPerfFilter('pending')}
              >
                Na čekanju
              </button>
              <button
                className={`chip ${perfFilter === 'approved' ? 'active' : ''}`}
                onClick={() => setPerfFilter('approved')}
              >
                Prihvaćeno
              </button>
            </div>

            <label className="sort-select">
              Sortiraj:
              <select
                value={perfSort}
                onChange={(e) => setPerfSort(e.target.value)}
              >
                <option value="dateAsc">Najbliže prvo</option>
                <option value="dateDesc">Najdalje prvo</option>
              </select>
            </label>
          </div>

          <div className="performances-list">
            {visiblePerformances.map((perf, idx) => (
              <div
                key={perf._id}
                className={`performance-card ${perf.approved ? 'approved' : ''} ${
                  perfAnimateIn ? 'enter' : ''
                }`}
                style={{ '--i': idx }}
              >
                <div className="performance-header">
                  <div>
                    <h3>{perf.choreographyName}</h3>
                    <p className="competition-name">
                      Natjecanje: {perf.competitionId?.name}
                    </p>
                  </div>
                  <span
                    className={`status-badge ${
                      perf.approved ? 'approved' : 'pending'
                    }`}
                  >
                    {perf.approved ? '✓ Prihvaćeno' : '⏳ Na čekanju'}
                  </span>
                </div>

                <div className="performance-details">
                  <div className="detail-row">
                    <span className="detail-label">Kategorija:</span>
                    <span className="detail-value">
                      {perf.ageCategory} / {perf.danceStyle} /{' '}
                      {perf.groupSize}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Trajanje:</span>
                    <span className="detail-value">
                      {formatDuration(perf.performanceDuration)}
                    </span>
                  </div>
                </div>

                {perf.competitionId?.isLocked && perf.approved && (
                  <>
                    <button
                      className="btn-download-pdf"
                      onClick={() => downloadPdf(perf.competitionId._id)}
                      disabled={downloadingPdf === perf.competitionId._id}
                    >
                      Preuzmi startnu listu (PDF)
                    </button>

                    {(() => {
                      const scoreData = scoresByPerformance[perf._id];

                      // nije dohvaćeno još
                      if (!scoreData) return <p style={{ marginTop: 10 }}>Učitavam ocjene...</p>;

                      // greška ili nema prava
                      if (scoreData.error) return <p style={{ marginTop: 10 }}>Ocjene nisu dostupne.</p>;

                      const { summary, scores } = scoreData;

                      return (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <span><strong>Ukupno:</strong> {summary.totalScore}</span>
                            <span><strong>Prosjek:</strong> {summary.avgScore.toFixed(2)}</span>
                            <span><strong>Sudaca:</strong> {summary.judgesCount}</span>
                          </div>

                          {scores?.length > 0 && (
                            <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                              {scores.map((s) => (
                                <li key={s._id}>
                                  {s.judge?.name || 'Sudac'} {s.judge?.surname || ''}: {s.score}
                                </li>
                              ))}
                            </ul>
                          )}

                          {scores?.length === 0 && (
                            <p style={{ marginTop: 8 }}>Još nema unesenih ocjena.</p>
                          )}
                        </div>
                      );
                    })()}

                  </>
                )}

              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default VoditeljDashboard;
