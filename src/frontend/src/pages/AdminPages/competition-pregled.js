import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../Dashboard.css';
import './AdminPages.css';

function CompetitionPregled() {
  const [competitions, setCompetitions] = useState([]);
  const [filteredCompetitions, setFilteredCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: 'all' });
  
  const [showEditModal, setShowEditModal] = useState({ show: false, competition: null });
  const [showDeleteModal, setShowDeleteModal] = useState({ show: false, competition: null });
  
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    date: '',
    location: '',
    status: 'upcoming',
    registrationFee: ''
  });

  useEffect(() => {
    fetchCompetitions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [competitions, filter]);

  const checkAndAutoUpdateStatus = async (competitionsList) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const updatedList = await Promise.all(competitionsList.map(async (comp) => {
      const compDate = new Date(comp.date);
      compDate.setHours(0, 0, 0, 0);

      let correctStatus = comp.status;

      if (compDate < today) {
        correctStatus = 'completed';
      } else if (compDate.getTime() === today.getTime()) {
        correctStatus = 'ongoing';
      } else {
        correctStatus = 'upcoming';
      }

      if (comp.status !== correctStatus) {
        try {
          await fetch(`${process.env.REACT_APP_API_URL}/competitions/${comp._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: correctStatus })
          });
          return { ...comp, status: correctStatus };
        } catch (err) {
          console.error(err);
          return comp;
        }
      }
      return comp;
    }));

    return updatedList;
  };

  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/competitions`);
      
      if (response.ok) {
        const data = await response.json();
        const updatedData = await checkAndAutoUpdateStatus(data);
        setCompetitions(updatedData);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...competitions];
    
    if (filter.status !== 'all') {
      filtered = filtered.filter(c => c.status === filter.status);
    }
    
    setFilteredCompetitions(filtered);
  };

  const handleEditClick = (competition) => {
    setShowEditModal({ show: true, competition });
    setEditForm({
      name: competition.name,
      description: competition.description || '',
      date: competition.date ? competition.date.split('T')[0] : '',
      location: competition.location,
      status: competition.status,
      registrationFee: competition.registrationFee
    });
  };

  const handleUpdateCompetition = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/competitions/${showEditModal.competition._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const updatedCompetition = await response.json();
        setCompetitions(competitions.map(c => 
          c._id === showEditModal.competition._id ? updatedCompetition : c
        ));
        setShowEditModal({ show: false, competition: null });
        alert('Ažurirano!');
      } else {
        const error = await response.json();
        alert(`Greška: ${error.error}`);
      }
    } catch (error) {
      alert('Greška prilikom ažuriranja');
    }
  };

  const handleDeleteCompetition = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/competitions/${showDeleteModal.competition._id}`, {
        method: 'DELETE'
      });

      if (response.ok || response.status === 204) {
        setCompetitions(competitions.filter(c => c._id !== showDeleteModal.competition._id));
        setShowDeleteModal({ show: false, competition: null });
        alert('Obrisano!');
      }
    } catch (error) {
      alert('Greška prilikom brisanja');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'upcoming': return 'status-upcoming'; // Možeš koristiti postojeći CSS ili 'approved'
      case 'ongoing': return 'status-ongoing';   // ili 'pending'
      case 'completed': return 'status-completed'; // ili neki treći class
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <Link to="/admin" className="back-link">← Natrag na Dashboard</Link>
        <h1>Pregled svih natjecanja</h1>
        <p>Učitavanje...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Link to="/admin" className="back-link">← Natrag na Dashboard</Link>
      
      <div className="page-header">
        <h1>Pregled svih natjecanja</h1>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>Filtriraj po statusu:</label>
          <select 
            value={filter.status} 
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="filter-select"
          >
            <option value="all">Svi statusi</option>
            <option value="upcoming">Nadolazeća (Upcoming)</option>
            <option value="ongoing">U tijeku (Ongoing)</option>
            <option value="completed">Završena (Completed)</option>
          </select>
        </div>

        <div className="filter-info">
          Prikazano: <strong>{filteredCompetitions.length}</strong> / {competitions.length}
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Naziv</th>
              <th>Datum</th>
              <th>Lokacija</th>
              <th>Cijena (€)</th>
              <th>Status</th>
              <th>Akcije</th>
            </tr>
          </thead>
          <tbody>
            {filteredCompetitions.map((comp) => (
              <tr key={comp._id}>
                <td>
                  <strong>{comp.name}</strong>
                </td>
                <td>{new Date(comp.date).toLocaleDateString('hr-HR')}</td>
                <td>{comp.location}</td>
                <td>{comp.registrationFee}</td>
                <td>
                  <span className={`status-badge ${getStatusBadgeClass(comp.status)}`}>
                    {comp.status}
                  </span>
                </td>
                <td className="table-actions">
                  <button
                    onClick={() => handleEditClick(comp)}
                    className="btn-table btn-approve"
                    title="Uredi"
                  >
                    Uredi
                  </button>
                  <button
                    onClick={() => setShowDeleteModal({ show: true, competition: comp })}
                    className="btn-table btn-delete-small"
                    title="Obriši"
                  >
                    Obriši
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCompetitions.length === 0 && (
          <div className="empty-state">
            <p>Nema natjecanja za prikaz.</p>
          </div>
        )}
      </div>

      {showEditModal.show && (
        <div className="modal-overlay" onClick={() => setShowEditModal({ show: false, competition: null })}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Uredi natjecanje</h3>
            <form onSubmit={handleUpdateCompetition}>
              <div className="form-group">
                <label>Naziv</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Opis</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows="4"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Datum</label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Cijena (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.registrationFee}
                    onChange={(e) => setEditForm({ ...editForm, registrationFee: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Lokacija</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  required
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal({ show: false, competition: null })} 
                  className="btn-cancel"
                >
                  Odustani
                </button>
                <button type="submit" className="btn-primary">
                  Spremi promjene
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal.show && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal({ show: false, competition: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Potvrda brisanja</h3>
            <p>Jeste li sigurni da želite obrisati natjecanje:</p>
            <p className="modal-user-name">
              <strong>{showDeleteModal.competition.name}</strong><br/>
              ({showDeleteModal.competition.location})
            </p>
            <p className="modal-warning">Ova radnja je trajna.</p>
            <div className="modal-actions">
              <button
                onClick={() => setShowDeleteModal({ show: false, competition: null })}
                className="btn-cancel"
              >
                Odustani
              </button>
              <button onClick={handleDeleteCompetition} className="btn-confirm-delete">
                Da, obriši
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompetitionPregled;