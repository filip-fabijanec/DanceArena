import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../Dashboard.css';
import './AdminPages.css';

function CompetitionPregled() {
  const [competitions, setCompetitions] = useState([]);
  const [filteredCompetitions, setFilteredCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: 'all', search: '' });
  const [showEditModal, setShowEditModal] = useState({ show: false, competition: null });
  const [showDeleteModal, setShowDeleteModal] = useState({ show: false, competition: null });
  const [editForm, setEditForm] = useState({
    naziv: '',
    opis: '',
    datum_pocetka: '',
    datum_zavrsetka: '',
    lokacija: '',
    status: 'aktivno',
    max_timova: '',
    cijena_pristupnice: ''
  });

  useEffect(() => {
    fetchCompetitions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [competitions, filter]);

  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId'); // ili iz contexta
      const response = await fetch(`${process.env.REACT_APP_API_URL}/competitions/organizator/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setCompetitions(data);
      }
    } catch (error) {
      console.error('Error fetching competitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...competitions];
    
    if (filter.status !== 'all') {
      filtered = filtered.filter(c => c.status === filter.status);
    }
    
    if (filter.search) {
      filtered = filtered.filter(c => 
        c.naziv.toLowerCase().includes(filter.search.toLowerCase()) ||
        c.lokacija.toLowerCase().includes(filter.search.toLowerCase())
      );
    }
    
    setFilteredCompetitions(filtered);
  };

  const handleEditClick = (competition) => {
    setShowEditModal({ show: true, competition });
    setEditForm({
      naziv: competition.naziv,
      opis: competition.opis,
      datum_pocetka: competition.datum_pocetka?.split('T')[0] || '',
      datum_zavrsetka: competition.datum_zavrsetka?.split('T')[0] || '',
      lokacija: competition.lokacija,
      status: competition.status,
      max_timova: competition.max_timova,
      cijena_pristupnice: competition.cijena_pristupnice
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
        alert('Natjecanje uspješno ažurirano!');
      } else {
        const error = await response.json();
        alert(`Greška: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating competition:', error);
      alert('Greška prilikom ažuriranja natjecanja');
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
        alert('Natjecanje uspješno obrisano!');
      }
    } catch (error) {
      console.error('Error deleting competition:', error);
      alert('Greška prilikom brisanja natjecanja');
    }
  };

  const handleStatusToggle = async (competitionId, currentStatus) => {
    const newStatus = currentStatus === 'aktivno' ? 'neaktivno' : 'aktivno';
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/competitions/${competitionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const updatedCompetition = await response.json();
        setCompetitions(competitions.map(c => c._id === competitionId ? updatedCompetition : c));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Greška prilikom promjene statusa');
    }
  };

  const getStatusDisplayName = (status) => {
    const statusMap = {
      aktivno: 'Aktivno',
      neaktivno: 'Neaktivno',
      zavreno: 'Završeno'
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <Link to="/admin" className="back-link">← Natrag na Dashboard</Link>
        <h1>Moja natjecanja</h1>
        <p>Učitavanje...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Link to="/admin" className="back-link">← Natrag na Dashboard</Link>
      
      <div className="page-header">
        <h1>Moja natjecanja</h1>
        <Link to="/admin/natjecanja/novo" className="btn-primary">
          + Novo natjecanje
        </Link>
      </div>

      {/* Filteri */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Pretraga:</label>
          <input
            type="text"
            placeholder="Pretraži po nazivu ili lokaciji..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="filter-select"
            style={{ minWidth: '300px' }}
          />
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={filter.status} 
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="filter-select"
          >
            <option value="all">Svi statusi</option>
            <option value="aktivno">Aktivno</option>
            <option value="neaktivno">Neaktivno</option>
            <option value="zavreno">Završeno</option>
          </select>
        </div>

        <div className="filter-info">
          Prikazano: <strong>{filteredCompetitions.length}</strong> / {competitions.length}
        </div>
      </div>

      {/* Tablica natjecanja */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Naziv</th>
              <th>Datum početka</th>
              <th>Datum završetka</th>
              <th>Lokacija</th>
              <th>Max timova</th>
              <th>Status</th>
              <th>Akcije</th>
            </tr>
          </thead>
          <tbody>
            {filteredCompetitions.map((comp) => (
              <tr key={comp._id}>
                <td>
                  <strong>{comp.naziv}</strong>
                </td>
                <td>{new Date(comp.datum_pocetka).toLocaleDateString('hr-HR')}</td>
                <td>{new Date(comp.datum_zavrsetka).toLocaleDateString('hr-HR')}</td>
                <td>{comp.lokacija}</td>
                <td>{comp.max_timova}</td>
                <td>
                  <span className={`status-badge ${comp.status === 'aktivno' ? 'approved' : 'pending'}`}>
                    {getStatusDisplayName(comp.status)}
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
                    onClick={() => handleStatusToggle(comp._id, comp.status)}
                    className="btn-table btn-unapprove"
                    title="Promijeni status"
                  >
                    {comp.status === 'aktivno' ? 'Deaktiviraj' : 'Aktiviraj'}
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
            <p>
              {filter.search || filter.status !== 'all' 
                ? 'Nema natjecanja za prikaz s odabranim filterima.' 
                : 'Još niste kreirali nijedno natjecanje.'}
            </p>
          </div>
        )}
      </div>

      {/* Modal za uređivanje */}
      {showEditModal.show && (
        <div className="modal-overlay" onClick={() => setShowEditModal({ show: false, competition: null })}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Uredi natjecanje</h3>
            <form onSubmit={handleUpdateCompetition}>
              <div className="form-group">
                <label>Naziv *</label>
                <input
                  type="text"
                  value={editForm.naziv}
                  onChange={(e) => setEditForm({ ...editForm, naziv: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Opis</label>
                <textarea
                  value={editForm.opis}
                  onChange={(e) => setEditForm({ ...editForm, opis: e.target.value })}
                  rows="4"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Datum početka *</label>
                  <input
                    type="date"
                    value={editForm.datum_pocetka}
                    onChange={(e) => setEditForm({ ...editForm, datum_pocetka: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Datum završetka *</label>
                  <input
                    type="date"
                    value={editForm.datum_zavrsetka}
                    onChange={(e) => setEditForm({ ...editForm, datum_zavrsetka: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Lokacija *</label>
                <input
                  type="text"
                  value={editForm.lokacija}
                  onChange={(e) => setEditForm({ ...editForm, lokacija: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Max broj timova *</label>
                  <input
                    type="number"
                    value={editForm.max_timova}
                    onChange={(e) => setEditForm({ ...editForm, max_timova: e.target.value })}
                    required
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Cijena pristupnice (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.cijena_pristupnice}
                    onChange={(e) => setEditForm({ ...editForm, cijena_pristupnice: e.target.value })}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Status *</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  required
                >
                  <option value="aktivno">Aktivno</option>
                  <option value="neaktivno">Neaktivno</option>
                  <option value="zavreno">Završeno</option>
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

      {/* Modal za brisanje */}
      {showDeleteModal.show && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal({ show: false, competition: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Potvrda brisanja</h3>
            <p>Jeste li sigurni da želite obrisati natjecanje:</p>
            <p className="modal-user-name">
              <strong>{showDeleteModal.competition.naziv}</strong><br/>
              ({showDeleteModal.competition.lokacija})
            </p>
            <p className="modal-warning">Ova radnja je trajna i ne može se poništiti.</p>
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