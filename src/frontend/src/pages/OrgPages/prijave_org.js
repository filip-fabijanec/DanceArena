import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import '../Dashboard.css';
import './prijave_org.css';

function UpravljanjePrijavama() {
  const [searchParams] = useSearchParams();
  const competitionId = searchParams.get('competitionId');

  const [competition, setCompetition] = useState(null);
  const [performances, setPerformances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, name: '' });

  useEffect(() => {
    if (competitionId) {
      fetchData();
    } else {
      setError('Nedostaje ID natjecanja');
      setLoading(false);
    }
  }, [competitionId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Dohvati podatke o natjecanju
      const compResponse = await fetch(`http://localhost:3500/competitions/${competitionId}`);
      if (compResponse.ok) {
        const compData = await compResponse.json();
        setCompetition(compData);
      }

      // Dohvati prijave za to natjecanje
      const perfResponse = await fetch(`http://localhost:3500/performances?competitionId=${competitionId}`);
      
      if (perfResponse.status === 404) {
        setPerformances([]);
      } else if (perfResponse.ok) {
        const perfData = await perfResponse.json();
        setPerformances(perfData);
      } else {
        throw new Error('Greška pri dohvaćanju prijava');
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Greška prilikom dohvaćanja podataka');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (performanceId) => {
    try {
      const response = await fetch(`http://localhost:3500/performances/${performanceId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const updatedPerformance = await response.json();
        
        // Ažuriraj state
        setPerformances(performances.map(perf =>
          perf._id === performanceId ? updatedPerformance : perf
        ));
      } else {
        alert('Greška prilikom odobravanja prijave');
      }
    } catch (error) {
      console.error('Error approving performance:', error);
      alert('Greška prilikom odobravanja prijave');
    }
  };

  const handleDelete = async (performanceId) => {
    try {
      const response = await fetch(`http://localhost:3500/performances/${performanceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Ukloni prijavu iz state-a
        setPerformances(performances.filter(perf => perf._id !== performanceId));
        setDeleteModal({ show: false, id: null, name: '' });
        alert('Prijava uspješno obrisana!');
      } else {
        alert('Greška prilikom brisanja prijave');
      }
    } catch (error) {
      console.error('Error deleting performance:', error);
      alert('Greška prilikom brisanja prijave');
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
      <div className="dashboard-container">
        <Link to="/organizator/natjecanja" className="back-link">← Natrag na pregled natjecanja</Link>
        <h1>Pregled prijava</h1>
        <p>Učitavanje...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <Link to="/organizator/natjecanja" className="back-link">← Natrag na pregled natjecanja</Link>
        <h1>Pregled prijava</h1>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Link to="/organizator/natjecanja" className="back-link">← Natrag na pregled natjecanja</Link>

      {/* Info o natjecanju */}
      {competition && (
        <div className="competition-info">
          <h1>Prijave za: {competition.name}</h1>
          <div className="info-details">
            <span>Datum: {formatDate(competition.date)}</span>
            <span>Lokacija: {competition.location}</span>
            <span>Ukupno prijava: {performances.length}</span>
            <span>Prihvaćeno: {performances.filter(p => p.approved).length}</span>
            <span>Na čekanju: {performances.filter(p => !p.approved).length}</span>
          </div>
        </div>
      )}

      {/* Lista prijava */}
      {performances.length === 0 ? (
        <div className="empty-state">
          <h3>Nema prijava za ovo natjecanje</h3>
          <p>Još nema prijavljenih nastupa.</p>
        </div>
      ) : (
        <div className="performances-list">
          {performances.map((perf) => (
            <div key={perf._id} className={`performance-card ${perf.approved ? 'approved' : ''}`}>
              <div className="performance-header">
                <div>
                  <h3>{perf.choreographyName}</h3>
                  <p className="club-name">
                    {perf.clubId?.clubName || 'N/A'} - {perf.clubId?.name} {perf.clubId?.surname}
                  </p>
                </div>
                <span className={`status-badge ${perf.approved ? 'approved' : 'pending'}`}>
                  {perf.approved ? 'Prihvaćeno' : 'Na čekanju'}
                </span>
              </div>

              <div className="performance-body">
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Kategorija:</span>
                    <span className="value">{perf.ageCategory}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Stil:</span>
                    <span className="value">{perf.danceStyle}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Veličina grupe:</span>
                    <span className="value">{perf.groupSize}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Trajanje:</span>
                    <span className="value">{formatDuration(perf.performanceDuration)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Koreograf:</span>
                    <span className="value">{perf.choreographer || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Plaćeno:</span>
                    <span className="value">{perf.paid ? 'Da' : 'Ne'}</span>
                  </div>
                </div>

                <div className="music-info">
                  <span className="label">Glazba:</span>
                  <a href={perf.musicFilePath} target="_blank" rel="noopener noreferrer" className="music-link">
                    {perf.musicFilePath}
                  </a>
                </div>
              </div>

              <div className="performance-actions">
                {!perf.approved && (
                  <button
                    onClick={() => handleApprove(perf._id)}
                    className="btn-approve"
                  >
                    Prihvati
                  </button>
                )}
                {!perf.approved && (
                  <button
                    onClick={() => setDeleteModal({
                      show: true,
                      id: perf._id,
                      name: perf.choreographyName
                    })}
                    className="btn-delete"
                  >
                    Obriši
                  </button>
                )}
                {perf.approved && (
                  <span className="approved-message">
                    Prijava je prihvaćena i ne može se obrisati
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal za brisanje */}
      {deleteModal.show && (
        <div className="modal-overlay" onClick={() => setDeleteModal({ show: false, id: null, name: '' })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Potvrda brisanja</h3>
            <p>Jeste li sigurni da želite obrisati prijavu:</p>
            <p className="modal-performance-name">"{deleteModal.name}"?</p>
            <p className="modal-warning">Ova radnja je trajna i ne može se poništiti.</p>
            <div className="modal-actions">
              <button
                onClick={() => setDeleteModal({ show: false, id: null, name: '' })}
                className="btn-cancel"
              >
                Odustani
              </button>
              <button
                onClick={() => handleDelete(deleteModal.id)}
                className="btn-confirm-delete"
              >
                Da, obriši
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UpravljanjePrijavama;