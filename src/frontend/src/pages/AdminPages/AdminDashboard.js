import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState({
    users: { total: 0, approved: 0, pending: 0 },
    competitions: { total: 0 }
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const usersRes = await fetch(`${process.env.REACT_APP_API_URL}/users`);
      let usersData = [];
      if (usersRes.ok) {
        usersData = await usersRes.json();
      }
      const compsRes = await fetch(`${process.env.REACT_APP_API_URL}/competitions`);
      let compsData = [];
      if (compsRes.ok) {
        compsData = await compsRes.json();
      }
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
    }
  };

  return (
    <div>
      <div className="dashboard-container">
        <h1>Administrator Dashboard</h1>
        <p className="welcome-text">Dobrodošli! Ovdje možete upravljati sustavom.</p>
        
        <div className="stats-overview">
          <div className="stat-box">
            <div className="stat-number">{stats.users.total}</div>
            <div className="stat-label">Ukupno korisnika</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">{stats.users.pending}</div>
            <div className="stat-label">Na čekanju</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">{stats.competitions.total}</div>
            <div className="stat-label">Natjecanja</div>
          </div>
        </div>
        
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Upravljanje korisnicima</h3>
            <p>Dodavanje, brisanje, odobravanje korisnika</p>
            <Link to="/admin/korisnici" className="card-button">
                Pregled korisnika
            </Link>
          </div>
          
          <div className="dashboard-card">
            <h3>Članarine</h3>
            <p>Postavljanje i upravljanje članarinama.</p>
            <Link to="/admin/članarine" className="card-button">
                Upravljaj članarinama
            </Link>
          </div>
          
          {/* Sakrivena kartica - ostaje u kodu ali se ne prikazuje */}
          <div className="dashboard-card" style={{ display: 'none' }}>
            <h3>Pregled sustava</h3>
            <p>Pregledajte sve aktivnosti u sustavu.</p>
             <Link to="/admin/sustav" className="card-button">
                Pregled aktivnosti
            </Link>
          </div>
          
          <div className="dashboard-card">
            <h3>Sva natjecanja</h3>
            <p>Pregledajte sva natjecanja u sustavu.</p>
            <Link to="/admin/natjecanja" className="card-button">
                Pregled natjecanja
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;