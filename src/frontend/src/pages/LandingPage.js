import React, { useEffect, useRef, useState } from 'react';
import PublicNavbar from '../components/PublicNavbar';
import './LandingPage.css';
import { ReactComponent as Logo } from './dancearena.svg';
import { ReactComponent as Cloud } from './cloud.svg';

function LandingPage() {
  const [finished, setFinished] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);

  const finishedRef = useRef(null);
  const upcomingRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [f, u] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL}/competitions/finished`),
        fetch(`${process.env.REACT_APP_API_URL}/competitions/upcoming`)
      ]);

      const finishedData = await f.json();
      const upcomingData = await u.json();

      setFinished(Array.isArray(finishedData) ? finishedData : []);
      setUpcoming(Array.isArray(upcomingData) ? upcomingData : []);
    } catch (e) {
      console.error(e);
      setFinished([]);
      setUpcoming([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('hr-HR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

  const scroll = (ref, dir) => {
    ref.current?.scrollBy({ left: dir * 420, behavior: 'smooth' });
  };

  const Event = ({ c }) => (
    <div className="event-panel">
      <div className="event-content">
        <span className="event-date">{formatDate(c.date)}</span>
        <h3>{c.name}</h3>
        <span className="event-location">{c.location}</span>
        {c.description && <p>{c.description}</p>}
      </div>
    </div>
  );

  const Section = ({ title, data, refEl }) => (
    <section className="events-section">
        <h2>{title}</h2>

      {loading ? (
        <p>Učitavanje...</p>
      ) : data.length > 0 ? (
        <div className="events-wrapper">
          <button className="scroll-btn" onClick={() => scroll(refEl, -1)}>←</button>
          <div className="events-strip" ref={refEl}>
            {data.map(c => <Event key={c._id} c={c} />)}
          </div>
          <button className="scroll-btn" onClick={() => scroll(refEl, 1)}>→</button>
        </div>
      ) : (
        <p className="no-events">Trenutno nema događaja.</p>
      )}
    </section>
  );

  return (
    <div className="landing-page">
      <PublicNavbar />

      <section className="hero-section">
        <div className="hero-logo">
          <Logo className="logo-svg" />
        </div>
        <p className="hero-subtitle">Mjesto gdje natjecanja postaju događaji</p>
      </section>

      <Section title="UPCOMING" data={upcoming} refEl={upcomingRef} />
      <Section title="FINISHED" data={finished} refEl={finishedRef} />
    </div>
  );
}

export default LandingPage;
