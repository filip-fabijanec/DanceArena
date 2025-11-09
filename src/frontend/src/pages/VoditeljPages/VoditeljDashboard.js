import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import '../Dashboard.css';
import './VoditeljPages.css';

function VoditeljDashboard() {
  const { currentUser } = useAuth();
  const [competitions, setCompetitions] = useState([]);
  const [myPerformances, setMyPerformances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Dohvati nadolazeća natjecanja
      const compResponse = await fetch('http://localhost:3500/competitions/upcoming');
      if (compResponse.ok) {
        const compData = await compResponse.json();
        setCompetitions(compData);
      }

      // Dohvati moje prijave
      const perfResponse = await fetch(`http://localhost:3500/performances?clubId=${currentUser._id}`);
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

        {/* ========== SEKCIJA 1: MOJ KLUB ========== */}
        <section className="dashboard-section">
          <h2>📋 Moj Klub</h2>
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
            {/* <button className="btn-edit-club" disabled>✏️ Uredi podatke (uskoro)</button> */}
          </div>
        </section>

        {/* ========== SEKCIJA 2: NADOLAZEĆA NATJECANJA ========== */}
        <section className="dashboard-section">
          <h2>🏆 Nadolazeća natjecanja</h2>
          
          {competitions.length === 0 ? (
            <div className="empty-state">
              <p>📅 Trenutno nema nadolazećih natjecanja.</p>
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
                      <span>{formatDate(comp.date)}</span>
                    </div>
                    <div className="info-item">
                      <span className="icon">📍</span>
                      <span>{comp.location}</span>
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

                    <Link 
                      to={`/voditelj/prijavi-nastup/${comp._id}`} 
                      className="btn-primary full-width"
                    >
                      Prijavi nastup
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ========== SEKCIJA 3: MOJE PRIJAVE ========== */}
        <section className="dashboard-section">
          <h2>📝 Moje prijave</h2>
          
          {myPerformances.length === 0 ? (
            <div className="empty-state">
              <p>📋 Nemate prijavljenih nastupa.</p>
              <p style={{ fontSize: '14px', color: '#999' }}>
                Prijavite se na natjecanje iznad!
              </p>
            </div>
          ) : (
            <div className="performances-list">
              {myPerformances.map((perf) => (
                <div key={perf._id} className="performance-card">
                  <div className="performance-header">
                    <div>
                      <h3>{perf.choreographyName}</h3>
                      <p className="competition-name">
                        Natjecanje: {perf.competitionId?.name || 'N/A'}
                      </p>
                    </div>
                    <span className={`status-badge ${perf.approved ? 'approved' : 'pending'}`}>
                      {perf.approved ? '✅ Prihvaćeno' : '⏳ Na čekanju'}
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
                    <div className="detail-row">
                      <span className="detail-label">Plaćeno:</span>
                      <span className="detail-value">{perf.paid ? '✅ Da' : '❌ Ne'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default VoditeljDashboard;