import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../Dashboard.css'; 
import './AdminPages.css'; 

// Ikone
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const TrophyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>;
const CreditCardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>;
const ArrowRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;

function Dashboard() {
  const [stats, setStats] = useState({
    users: { total: 0, approved: 0, pending: 0 },
    competitions: { total: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const [usersRes, compsRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL}/users`, { headers }),
        fetch(`${process.env.REACT_APP_API_URL}/competitions`, { headers })
      ]);

      let usersData = usersRes.ok ? await usersRes.json() : [];
      let compsData = compsRes.ok ? await compsRes.json() : [];

      if (!Array.isArray(usersData)) usersData = [];
      if (!Array.isArray(compsData)) compsData = [];

      setStats({
        users: {
          total: usersData.length,
          approved: usersData.filter(u => u.approved).length,
          pending: usersData.filter(u => !u.approved).length,
        },
        competitions: {
          total: compsData.length
        }
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Učitavanje podataka...</div>;
  }

  return (
    <div className="dashboard-wrapper">
      {/* DODANA admin-dashboard KLASA ZA SCOPING */}
      <div className="dashboard-container admin-dashboard">
        
        <div className="dashboard-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p className="welcome-text">Pregled statistike i upravljanje sustavom.</p>
          </div>
          <div className="date-badge">
            {new Date().toLocaleDateString('hr-HR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-icon"><UserIcon /></div>
            <div className="stat-info">
              <span className="stat-number">{stats.users.total}</span>
              <span className="stat-label">Ukupno korisnika</span>
            </div>
          </div>

          <div className="stat-card purple">
            <div className="stat-icon"><TrophyIcon /></div>
            <div className="stat-info">
              <span className="stat-number">{stats.competitions.total}</span>
              <span className="stat-label">Aktivna natjecanja</span>
            </div>
          </div>
        </div>
        
        <h2 className="section-title">Brzi pristup</h2>
        <div className="actions-grid">
          <Link to="/admin/korisnici" className="action-card">
            <div className="action-card-header">
              <UserIcon />
              <h3>Korisnici</h3>
            </div>
            <p>Pregled svih korisnika, odobravanje registracija i uređivanje profila.</p>
            <span className="btn-action">Otvori <ArrowRightIcon /></span>
          </Link>

          <Link to="/admin/članarine" className="action-card">
            <div className="action-card-header">
              <CreditCardIcon />
              <h3>Članarine</h3>
            </div>
            <p>Upravljanje statusima pretplate i provjera valjanosti članarina.</p>
            <span className="btn-action">Otvori <ArrowRightIcon /></span>
          </Link>
          
          <Link to="/admin/natjecanja" className="action-card">
            <div className="action-card-header">
              <TrophyIcon />
              <h3>Natjecanja</h3>
            </div>
            <p>Kreiranje novih natjecanja, pregled prijava i rezultata.</p>
            <span className="btn-action">Otvori <ArrowRightIcon /></span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;