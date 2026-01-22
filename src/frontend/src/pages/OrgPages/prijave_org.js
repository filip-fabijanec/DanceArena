import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import '../Dashboard.css';
import './prijave_org.css';
import { useAuth } from "../../context/AuthContext";
import { downloadCompetitionPdf } from "../../utils/downloadPdf";

function UpravljanjePrijavama() {
  const token = localStorage.getItem("token");
  const [searchParams] = useSearchParams();
  const competitionId = searchParams.get('competitionId');

  const [competition, setCompetition] = useState(null);
  const [performances, setPerformances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, name: '' });
  const [editModal, setEditModal] = useState({ 
    show: false, 
    id: null, 
    performance: null,
    formData: {
      choreographyName: '',
      ageCategory: '',
      danceStyle: '',
      groupSize: '',
      choreographer: '',
      performanceDuration: '',
      musicFile: null
    }
  });

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
      const compResponse = await fetch(`${process.env.REACT_APP_API_URL}/competitions/${competitionId}`);
      if (compResponse.ok) {
        const compData = await compResponse.json();
        setCompetition(compData);
      }

      // Dohvati prijave za to natjecanje
      const perfResponse = await fetch(`${process.env.REACT_APP_API_URL}/performances?competitionId=${competitionId}`);
      
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
      const response = await fetch(`${process.env.REACT_APP_API_URL}/performances/${performanceId}/approve`, {
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
      const response = await fetch(`${process.env.REACT_APP_API_URL}/performances/${performanceId}`, {
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

  const handleLock = async () => {
    if (!window.confirm("Zaključavanjem prijava više nema izmjena. Nastaviti?")) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/competitions/${competitionId}/lock`,
        { method: "PUT" }
      );

      const text = await response.text();
      console.log("STATUS:", response.status);
      console.log("RESPONSE:", text);

      if (response.ok) {
        alert("Prijave su zaključane");
        fetchData();
      } else {
        alert("Greška pri zaključavanju: " + text);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditClick = (performance) => {
    setEditModal({
      show: true,
      id: performance._id,
      performance: performance,
      formData: {
        choreographyName: performance.choreographyName,
        ageCategory: performance.ageCategory,
        danceStyle: performance.danceStyle,
        groupSize: performance.groupSize,
        choreographer: performance.choreographer || '',
        performanceDuration: performance.performanceDuration.toString(),
        musicFile: null
      }
    });
  };

  const handleEditChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'musicFile') {
      setEditModal({
        ...editModal,
        formData: {
          ...editModal.formData,
          musicFile: files[0]
        }
      });
    } else {
      setEditModal({
        ...editModal,
        formData: {
          ...editModal.formData,
          [name]: value
        }
      });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let musicFilePath = editModal.performance.musicFilePath;
      
      // Ako je odabran novi audio fajl, uploadaj ga
      if (editModal.formData.musicFile) {
        const uploadData = new FormData();
        uploadData.append('song', editModal.formData.musicFile);

        const uploadRes = await fetch(
          `${process.env.REACT_APP_API_URL}/upload-song`,
          { method: 'POST', body: uploadData }
        );

        if (!uploadRes.ok) throw new Error('Upload glazbe nije uspio');
        
        const { url } = await uploadRes.json();
        musicFilePath = url;
      }

      // Ažuriraj performance
      const response = await fetch(`${process.env.REACT_APP_API_URL}/performances/${editModal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editModal.formData,
          performanceDuration: parseInt(editModal.formData.performanceDuration),
          musicFilePath: musicFilePath
        })
      });

      if (response.ok) {
        const updatedPerformance = await response.json();
        
        // Ažuriraj state
        setPerformances(performances.map(perf =>
          perf._id === editModal.id ? updatedPerformance : perf
        ));
        
        setEditModal({ show: false, id: null, performance: null, formData: {} });
        alert('Prijava uspješno ažurirana!');
      } else {
        const errorText = await response.text();
        alert('Greška prilikom ažuriranja: ' + errorText);
      }
    } catch (error) {
      console.error('Error updating performance:', error);
      alert('Greška prilikom ažuriranja prijave');
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

      {/* 🔒 LOCK / PDF AKCIJE */}
      {competition && !competition.isLocked && (
        <button className="btn-lock" onClick={handleLock}>
          Zaključaj prijave
        </button>
      )}

      {competition?.isLocked && (
        <button
          className="btn-export"
          onClick={() =>
            downloadCompetitionPdf(competitionId, token)
              .catch(err => alert(err.message))
          }
        >
          Preuzmi startnu listu (PDF)
        </button>
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
                {/* PRIHVATI – samo ako je plaćeno i nije odobreno */}
                {!competition.isLocked && !perf.approved && perf.paid && (
                  <button
                    onClick={() => handleApprove(perf._id)}
                    className="btn-approve"
                  >
                    Prihvati
                  </button>
                )}

                {/* UREDI – omogućeno za sve prijave dok natjecanje nije zaključano */}
                {!competition.isLocked && (
                  <button
                    onClick={() => handleEditClick(perf)}
                    className="btn-edit"
                  >
                    Uredi
                  </button>
                )}

                {/* UPOZORENJE ako nije plaćeno */}
                {!perf.approved && !perf.paid && (
                  <span className="payment-warning">
                    Kotizacija nije plaćena
                  </span>
                )}

                {/* OBRIŠI – samo za neodobrene prijave */}
                {!competition.isLocked && !perf.approved && (
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
                    Prijava je prihvaćena. Možete je uređivati, ali ne i brisati.
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

      {/* Modal za uređivanje */}
      {editModal.show && competition && (
        <div className="modal-overlay" onClick={() => setEditModal({ show: false, id: null, performance: null, formData: {} })}>
          <div className="modal-content edit-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Uredi prijavu</h3>
            
            {/* Obavijest ako je prijava odobrena */}
            {editModal.performance?.approved && (
              <div className="edit-approved-notice">
                Ova prijava je već odobrena. Možete je uređivati, ali molimo vas da budete oprezni s promjenama.
              </div>
            )}
            
            <p className="modal-performance-name">{editModal.performance?.choreographyName}</p>
            
            <form onSubmit={handleEditSubmit} className="edit-form">
              <div className="form-group">
                <label>Naziv koreografije *</label>
                <input
                  type="text"
                  name="choreographyName"
                  value={editModal.formData.choreographyName}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Dobna kategorija *</label>
                  <select
                    name="ageCategory"
                    value={editModal.formData.ageCategory}
                    onChange={handleEditChange}
                    required
                  >
                    <option value="">Odaberi...</option>
                    {competition.ageCategories?.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Plesni stil *</label>
                  <select
                    name="danceStyle"
                    value={editModal.formData.danceStyle}
                    onChange={handleEditChange}
                    required
                  >
                    <option value="">Odaberi...</option>
                    {competition.danceStyles?.map((style) => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Veličina grupe *</label>
                  <select
                    name="groupSize"
                    value={editModal.formData.groupSize}
                    onChange={handleEditChange}
                    required
                  >
                    <option value="">Odaberi...</option>
                    {competition.groupSizes?.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Koreograf</label>
                  <input
                    type="text"
                    name="choreographer"
                    value={editModal.formData.choreographer}
                    onChange={handleEditChange}
                    placeholder="Ime koreografa (opcionalno)"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Trajanje (sekunde) *</label>
                  <input
                    type="number"
                    name="performanceDuration"
                    min="1"
                    value={editModal.formData.performanceDuration}
                    onChange={handleEditChange}
                    required
                  />
                  <span className="form-hint">npr. 180 sekundi = 3 minute</span>
                </div>

                <div className="form-group">
                  <label>Glazba (MP3)</label>
                  <input
                    type="file"
                    name="musicFile"
                    accept="audio/mpeg"
                    onChange={handleEditChange}
                  />
                  <span className="form-hint">Ostavite prazno ako ne želite mijenjati glazbu</span>
                  {editModal.performance?.musicFilePath && (
                    <span className="form-hint">
                      Trenutna glazba: <a href={editModal.performance.musicFilePath} target="_blank" rel="noopener noreferrer">Pregled</a>
                    </span>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setEditModal({ show: false, id: null, performance: null, formData: {} })}
                  className="btn-cancel"
                >
                  Odustani
                </button>
                <button
                  type="submit"
                  className="btn-save"
                >
                  Spremi promjene
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UpravljanjePrijavama;