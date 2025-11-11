import React, { useState, useEffect } from 'react';
import PublicNavbar from '../components/PublicNavbar';
import './LandingPage.css';

function LandingPage() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicCompetitions();
  }, []);

  const fetchPublicCompetitions = async () => {
    try {
      console.log('Fetching from:', `${process.env.REACT_APP_API_URL}/competitions/upcoming`);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/competitions/upcoming`);

      const text = await response.text();
      console.log('Response text (first 100 chars):', text.slice(0, 100));

      const data = JSON.parse(text);
      setCompetitions(data);
    } catch (error) {
      console.error('Error fetching competitions:', error);
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

  return (
    <div className="landing-page">
      <PublicNavbar />
      
      <section className="hero-section">
        <div className="hero-content">
          <h1>Dobrodošli u Dance Arena</h1>
          <p>Platforma za organizaciju i praćenje plesnih natjecanja</p>
          <div className="hero-buttons">
            <a href="#competitions" className="btn btn-primary">Pregledaj natjecanja</a>
            <a href="/login" className="btn btn-secondary">Prijavi se</a>
          </div>
        </div>
      </section>

      <section id="competitions" className="competitions-section">
        <div className="section-container">
          <h2>Nadolazeća natjecanja</h2>
          
          {loading ? (
            <p>Učitavanje...</p>
          ) : competitions.length > 0 ? (
            <div className="competitions-grid">
              {competitions.map((comp) => (
                <div key={comp._id} className="competition-card">
                  <div className="card-header">
                    <h3>{comp.name}</h3>
                    <span className="status-badge">{comp.status === 'upcoming' ? 'Nadolazeće' : 'U tijeku'}</span>
                  </div>
                  <div className="card-body">
                    <p className="date">{formatDate(comp.date)}</p>
                    <p className="location">{comp.location}</p>
                    {comp.description && <p className="description">{comp.description}</p>}
                    <div className="card-details">
                      <span>Kotizacija: {comp.registrationFee} €</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-competitions">Trenutno nema nadolazećih natjecanja.</p>
          )}
        </div>
      </section>

      <section className="about-section">
        <div className="section-container">
          <h2>O Dance Arena platformi</h2>
          <div className="about-grid">
            <div className="about-card">
              <div className="about-icon"></div>
              <h3>Organizatorima</h3>
              <p>Jednostavno kreirajte natjecanja, upravljajte prijavama i odaberite suce.</p>
            </div>
            <div className="about-card">
              <div className="about-icon"></div>
              <h3>Voditelji klubova</h3>
              <p>Prijavite svoje grupe na natjecanja i pratite rezultate.</p>
            </div>
            <div className="about-card">
              <div className="about-icon"></div>
              <h3>Sucima</h3>
              <p>Ocjenjujte nastupe digitalno i pregledajte svoje ocjene.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-container">
          <p>&copy; 2025 Dance Arena. Sva prava pridržana.</p>
          <div className="footer-links">
            <a href="/o-nama">O nama</a>
            <a href="/kontakt">Kontakt</a>
            <a href="https://github.com/filip-fabijanec/DanceArena" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;