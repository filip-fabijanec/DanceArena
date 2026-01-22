import React from 'react';
import ActiveCompetitions from './ActiveCompetitions';
import JudgeScoresOverview from './JudgeScoresOverview';
import '../Dashboard.css';

function SudacDashboard() {
  return (
    <div className="dashboard-container sudac-dashboard">
      <h1>Sudac Dashboard</h1>
      <p className="welcome-text">
        Pregled aktivnih natjecanja i vaših ocjena
      </p>

      {/* AKTIVNA NATJECANJA */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ marginBottom: 20 }}>Aktivna natjecanja</h2>
        <ActiveCompetitions />
      </section>

      {/* OCJENE */}
      <section>
        <h2 style={{ marginBottom: 20 }}>Moje ocjene</h2>
        <JudgeScoresOverview />
      </section>
    </div>
  );
}

export default SudacDashboard;
