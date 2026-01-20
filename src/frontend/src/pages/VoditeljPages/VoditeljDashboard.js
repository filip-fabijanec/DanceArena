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

  // filter + sort
  const [perfFilter, setPerfFilter] = useState('all'); // all | pending | approved
  const [perfSort, setPerfSort] = useState('dateAsc'); // dateAsc | dateDesc
  const [perfAnimateIn, setPerfAnimateIn] = useState(false);

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
  }, [currentUser]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setPerfAnimateIn(false);

      const compResponse = await fetch(`${process.env.REACT_APP_API_URL}/competitions/upcoming/after-2-days`);
      if (compResponse.ok) {
        const compData = await compResponse.json();
        setCompetitions(compData);
      }

      const perfResponse = await fetch(`${process.env.REACT_APP_API_URL}/performances?clubId=${currentUser._id}`);
      if (perfResponse.ok) {
        const perfData = await perfResponse.json();
        setMyPerformances(perfData);
      } else if (perfResponse.status === 404) {
        setMyPerformances([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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
      year: 'numeric'
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadPdf = async (competitionId) => {
    console.log("=== PDF DOWNLOAD DEBUG ===");
    console.log("Token iz context:", token);
    console.log("Token iz localStorage:", localStorage.getItem('token'));
    console.log("CurrentUser:", currentUser);
    console.log("==========================");

    if (!token) {
      alert("Token nije dostupan. Molimo prijavite se ponovno.");
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

      console.log("PDF response status:", res.status);

      if (!res.ok) {
        const text = await res.text();
        console.error("PDF error response:", text);
        alert("Greška pri preuzimanju PDF-a: " + text);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "startna_lista.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download error:", err);
      alert("Greška pri preuzimanju PDF-a: " + err.message);
    } finally {
      setDownloadingPdf(null);
    }
  };

  const visiblePerformances = useMemo(() => {
    const filtered = myPerformances.filter((p) => {
      if (perfFilter === 'pending') return !p.approved;
      if (perfFilter === 'approved') return !!p.approved;
      return true;
    });

    const getCompetitionDateMs = (p) => {
      const d = p?.competitionId?.date;
      if (!d) return Number.POSITIVE_INFINITY;
      return new Date(d).getTime();
    };

    filtered.sort((a, b) => {
      const da = getCompetitionDateMs(a);
      const db = getCompetitionDateMs(b);
      return perfSort === 'dateAsc' ? da - db : db - da;
    });

    return filtered;
  }, [myPerformances, perfFilter, perfSort]);

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
        <p className="welcome-text">Dobrodošli! Upravljajte prijavama i pratite natjecanja.</p>

        {message && (
          <div className={`message-banner ${messageType}`}>
            {message}
          </div>
        )}

        <section className="dashboard-section">
          <h2>Moj Klub</h2>
          <div className="club-info-card">
            <div className="club-info-row">
              <span className="info-label">Naziv kluba:</span>
              <span className="info-value">{currentUser.clubName || 'Nije postavljeno'}</span>
            </div>
            <div className="club-info-row">
              <span className="info-label">Lokacija:</span>
              <span className="info-value">{currentUser.clubLocation || 'Nije postavljeno'}</span>
            </div>
            <div className="club-info-row">
              <span className="info-label">Voditelj:</span>
              <span className="info-value">{currentUser.name} {currentUser.surname}</span>
            </div>
            <div className="club-info-row">
              <span className="info-label">Email Voditelja:</span>
              <span className="info-value">{currentUser.email}</span>
            </div>
          </div>
        </section>

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
                      <p className="competition-description">{comp.description}</p>
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

        <section className="dashboard-section">
          <h2>Moje prijave</h2>

          {myPerformances.length === 0 ? (
            <div className="empty-state">
              <p>Nemate prijavljenih nastupa.</p>
              <p style={{ fontSize: '14px', color: '#999' }}>
                Prijavite se na natjecanje iznad!
              </p>
            </div>
          ) : (
            <>
              <div className="performance-toolbar">
                <div className="filter-chips">
                  <button
                    type="button"
                    className={`chip ${perfFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setPerfFilter('all')}
                  >
                    Sve
                  </button>
                  <button
                    type="button"
                    className={`chip ${perfFilter === 'pending' ? 'active' : ''}`}
                    onClick={() => setPerfFilter('pending')}
                  >
                    Na čekanju
                  </button>
                  <button
                    type="button"
                    className={`chip ${perfFilter === 'approved' ? 'active' : ''}`}
                    onClick={() => setPerfFilter('approved')}
                  >
                    Prihvaćeno
                  </button>
                </div>

                <label className="sort-select">
                  Sortiraj:
                  <select value={perfSort} onChange={(e) => setPerfSort(e.target.value)}>
                    <option value="dateAsc">Datum natjecanja (najbliže prvo)</option>
                    <option value="dateDesc">Datum natjecanja (najdalje prvo)</option>
                  </select>
                </label>
              </div>

              <div className="performances-list">
                {visiblePerformances.map((perf, idx) => (
                  <div
                    key={perf._id}
                    className={`performance-card ${perf.approved ? 'approved' : ''} ${perfAnimateIn ? 'enter' : ''}`}
                    style={{ '--i': idx }}
                  >
                    <div className="performance-header">
                      <div>
                        <h3>{perf.choreographyName}</h3>
                        <p className="competition-name">
                          Natjecanje: {perf.competitionId?.name || 'N/A'}
                        </p>
                      </div>
                      <span className={`status-badge ${perf.approved ? 'approved' : 'pending'}`}>
                        {perf.approved ? '✓ Prihvaćeno' : '⏳ Na čekanju'}
                      </span>
                    </div>

                    <div className="performance-details">
                      <div className="detail-row">
                        <span className="detail-label">Datum natjecanja:</span>
                        <span className="detail-value">
                          {perf.competitionId?.date ? formatDate(perf.competitionId.date) : 'N/A'}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Lokacija:</span>
                        <span className="detail-value">
                          {perf.competitionId?.location || 'N/A'}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Kategorija:</span>
                        <span className="detail-value">
                          {perf.ageCategory} / {perf.danceStyle} / {perf.groupSize}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Koreograf:</span>
                        <span className="detail-value">{perf.choreographer || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Trajanje:</span>
                        <span className="detail-value">{formatDuration(perf.performanceDuration)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Glazba:</span>
                        <span className="detail-value">
                          <a href={perf.musicFilePath} target="_blank" rel="noopener noreferrer">
                            {perf.musicFilePath}
                          </a>
                        </span>
                      </div>
                    </div>

                    {perf.competitionId?.isLocked && perf.approved && (
                      <button
                        onClick={() => downloadPdf(perf.competitionId._id)}
                        disabled={downloadingPdf === perf.competitionId._id}
                        className="btn-download-pdf"
                      >
                        {downloadingPdf === perf.competitionId._id ? (
                          <>
                            <span className="spinner"></span>
                            <span>Preuzimanje...</span>
                          </>
                        ) : (
                          <>
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="7 10 12 15 17 10"></polyline>
                              <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            <span>Preuzmi startnu listu (PDF)</span>
                          </>
                        )}
                      </button>
                    )}

                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default VoditeljDashboard;