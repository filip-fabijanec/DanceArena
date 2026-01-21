import React, { useEffect, useRef, useState } from 'react';
import PublicNavbar from '../components/PublicNavbar';
import './LandingPage.css';
import { Link } from 'react-router-dom';
import { ReactComponent as Logo } from './dancearena.svg';
import { ReactComponent as Cloud } from './cloud.svg';
import heroBanner from './hero-banner.jpg';
import { ReactComponent as UnderdogsLogoInv } from './underdogs_inv.svg';
import underdogsLogo from './underdogs.svg';
import dancearenaLogo from './dancearena.svg';

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

  const Event = ({ c, variant }) => (
    <Link
      to={`/competition/${c._id}/results`}
      className="event-panel-link"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div className={`event-panel ${variant === 'finished' ? 'is-finished' : ''}`} role="button">
        <div className="event-content">
          <span className="event-date">{formatDate(c.date)}</span>
          <h3>{c.name}</h3>
          <span className="event-location">{c.location}</span>
          {c.description && <p>{c.description}</p>}
        </div>

        {variant === 'finished' && (
          <div className="event-cta" aria-hidden="true">
            <span className="cta-pill">Pregled rezultata</span>
          </div>
        )}
      </div>
    </Link>
  );

  const Section = ({ title, data, refEl, variant }) => (
    <section className="events-section">
      <h2>{title}</h2>

      {loading ? (
        <p>Učitavanje...</p>
      ) : data.length > 0 ? (
        <div className="events-wrapper">
          <button className="scroll-btn" onClick={() => scroll(refEl, -1)}>←</button>
          <div className="events-strip" ref={refEl}>
            {data.map((c) => <Event key={c._id} c={c} variant={variant} />)}
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

      <section
        className="hero-section"
        style={{
          backgroundImage: `url(${heroBanner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="hero-logo">
          <Logo className="logo-svg" />
        </div>
      </section>

      <Section title="UPCOMING" data={upcoming} refEl={upcomingRef} variant="upcoming" />
      <Section title="FINISHED" data={finished} refEl={finishedRef} variant="finished" />

      {/* O NAMA SECTION */}
      <section className="about-section">
        <div className="about-container">
          <div className="about-logo">
            <img src={dancearenaLogo } alt="Dancearena logo" />
          </div>

          <div className="about-divider" />

          <div className="about-content">
            <h2>O nama</h2>
            <p>
              Underdogs ekipa se okupila pri početku zimskog semestra 2025. godine u sklopu projektnog zadatka. Ekipu je nastala samo s jednim ciljem - prolaz iz PROGI-a. 
              Međutim, tijekom izrade ove stranice smo shvatili da nas ovaj projekt uči o nečemu puno bitnijem - zajedništvu. 
              Kroz igru i rad smo stekli nezaboravna prijateljstva i uspomene.
            </p>
            <p>
              Naši članovi su Filip Fabijanec (vođa samo na papiru), Josip Petričević (uvijek nervozan), 
              Vito Cindori (popravit će suce sad svaki tren), Marija Jurić (Marija jesi ti pushala to), 
              Martin Tomišić (nije mu do zezanja, napravio je bazu), David Premuš(Kralj Dokumentacije) i 
              Ivona Gašparic (Kraljica Dokumentacije).
            </p>
          </div>
          <div className="about-logo">
            <img src={underdogsLogo} alt="Underdogs logo" />
          </div>
          <div className="about-divider" />
          <div className="about-content">
            <h2>Zašto baš underdogs?</h2>
            <p>
              Samo ime underdogs smo osmislili na našem prvom sastanku. Nismo se poznavali od prije, tako da je taj sastanak bio i svojstveno upoznavanje.
              Iako smo si dosta brzo klikli karakterno naletjeli smo na mali problem. Nitko od nas nije imao predznanja sa izradom web stranica.
              Filipa smo izabrali za vođu jer je imao najveću ocjenu iz WEB-a i to je bilo to. Moglo bi se reći da nismo imali nade.
            </p>
            <p>
              Međutim točno to nas je natjeralo da razmišljamo drugačije i odma smo shvatili da iako niko ne vjeruje u nas da uistinu možemo biti najbolji.
              Ta želja dokazati svima da grupa "misfita" bez ikakvog predznanja nas je definirala kao klasične "Underdogove".
              Ispred Vas se nalazi stranica napravljena krvlju, znojem, trudom i čistom željom biti najbolji. Nadamo se da se ta želja translatira i da uživate u ocjenjivanju ove stranice.
            </p>
          </div>

        </div>
      </section>


      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <UnderdogsLogoInv className="footer-logo" aria-hidden="true" />
          <p>Hvala na pažnji.</p>
          <p className="footer-sub">© Underdogs 2026</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
