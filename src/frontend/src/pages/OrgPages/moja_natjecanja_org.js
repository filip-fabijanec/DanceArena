import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../Dashboard.css';
import './moja_natjecanja_org.css';

function MojaNatjecanja() {
  const { currentUser } = useAuth();
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  
  // State za brisanje
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, name: '' });

  // State za uređivanje
  const [editModal, setEditModal] = useState({ show: false, competition: null });
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    date: '',
    location: '',
    registrationFee: ''
  });

  useEffect(() => {
    // 1. PROVJERA: Pokrećemo dohvat samo ako je korisnik logiran
    // Ako nema aktivnu članarinu, loading stavljamo na false da se prikaže Lock Screen
    if (currentUser) {
      if (currentUser.subscriptionStatus === 'active') {
        fetchMyCompetitions();
      } else {
        setLoading(false);
      }
    }
  }, [currentUser]);

  // Funkcija za automatsko ažuriranje statusa (upcoming -> ongoing -> completed)
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

  const fetchMyCompetitions = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/competitions?organizerId=${currentUser._id}`
      );
      
      if (response.status === 404) {
        setCompetitions([]);
        setError('');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch competitions');
      }

      const data = await response.json();
      const updatedData = await checkAndAutoUpdateStatus(data);
      
      setCompetitions(updatedData);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Greška prilikom dohvaćanja natjecanja');
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIKA ZA BRISANJE ---
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/competitions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok || response.status === 204) {
        setCompetitions(competitions.filter(comp => comp._id !== id));
        setDeleteModal({ show: false, id: null, name: '' });
        alert('Natjecanje uspješno obrisano!');
      } else {
        throw new Error('Failed to delete');
      }
    } catch (err) {
      console.error(err);
      alert('Greška prilikom brisanja natjecanja');
    }
  };

  // --- LOGIKA ZA UREĐIVANJE ---
  const handleEditClick = (competition) => {
    setEditModal({ show: true, competition });
    setEditForm({
      name: competition.name,
      description: competition.description || '',
      date: competition.date ? competition.date.split('T')[0] : '',
      location: competition.location,
      registrationFee: competition.registrationFee
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/competitions/${editModal.competition._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const updatedCompetition = await response.json();
        
        // Ažuriraj lokalno stanje
        setCompetitions(competitions.map(c => 
          c._id === editModal.competition._id ? { ...c, ...updatedCompetition } : c
        ));
        
        setEditModal({ show: false, competition: null });
        alert('Natjecanje uspješno ažurirano!');
      } else {
        throw new Error('Failed to update');
      }
    } catch (err) {
      console.error(err);
      alert('Greška prilikom ažuriranja natjecanja');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('hr-HR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      upcoming: { text: 'Nadolazeće', class: 'status-upcoming' },
      ongoing: { text: 'U tijeku', class: 'status-ongoing' },
      completed: { text: 'Završeno', class: 'status-completed' },
    };
    return statusMap[status] || { text: status, class: 'status-default' };
  };

  const filteredCompetitions = competitions.filter(comp => {
    if (filter === 'all') return true;
    return comp.status === filter;
  });

  const getStatistics = () => {
    return {
      total: competitions.length,
      upcoming: competitions.filter(c => c.status === 'upcoming').length,
      ongoing: competitions.filter(c => c.status === 'ongoing').length,
      completed: competitions.filter(c => c.status === 'completed').length,
    };
  };

  const stats = getStatistics();

  // --------------------------------------------------------
  // RETURN DIO (RENDERIRANJE)
  // --------------------------------------------------------

  if (loading) {
    return (
      <div className="dashboard-container">
        <Link to="/organizator" className="back-link">← Natrag na Dashboard</Link>
        <h1>Moja natjecanja</h1>
        <div className="loading-spinner">Učitavanje...</div>
      </div>
    );
  }

  // 2. BLOKADA: Ako korisnik nije aktivan, prikaži poruku i gumb za plaćanje
  if (currentUser && currentUser.subscriptionStatus !== 'active') {
    return (
      <div className="dashboard-container">
        <Link to="/organizator" className="back-link">← Natrag na Dashboard</Link>
        
        <div className="subscription-lock-screen">
          <div className="lock-icon">🔒</div>
          <h1>Pristup onemogućen</h1>
          <p>Nažalost, nemate aktivnu članarinu.</p>
          <p>Za pregled i kreiranje natjecanja potrebno je aktivirati pretplatu.</p>
          
          {/* Link vodi na profil ili stranicu za plaćanje */}
          <Link to="/organizator/profil" className="btn-primary btn-large">
            Aktiviraj članarinu
          </Link>
        </div>
      </div>
    );
  }

  // 3. GLAVNI PRIKAZ (Ako je sve OK)
  return (
    <div className="dashboard-container">
      <Link to="/organizator" className="back-link">← Natrag na Dashboard</Link>
      
      <div className="page-header">
        <h1>Moja natjecanja</h1>
        <Link to="/organizator/kreiranje-natjecanja" className="btn-primary">
          + Novo natjecanje
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Ukupno</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.upcoming}</div>
          <div className="stat-label">Nadolazeća</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.ongoing}</div>
          <div className="stat-label">U tijeku</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.completed}</div>
          <div className="stat-label">Završena</div>
        </div>
      </div>

      <div className="filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Sva
        </button>
        <button
          className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          Nadolazeća
        </button>
        <button
          className={`filter-btn ${filter === 'ongoing' ? 'active' : ''}`}
          onClick={() => setFilter('ongoing')}
        >
          U tijeku
        </button>
        <button
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Završena
        </button>
      </div>

      {filteredCompetitions.length === 0 ? (
        <div className="empty-state">
          <h3>
            {filter === 'all' 
              ? 'Nemate kreiranih natjecanja' 
              : `Nemate natjecanja u statusu "${filter}"`}
          </h3>
          {filter === 'all' && (
             <>
                <p>Kliknite na "Novo natjecanje" da kreirate svoje prvo natjecanje.</p>
                <Link to="/organizator/kreiranje-natjecanja" className="btn-primary">
                Kreiraj natjecanje
                </Link>
             </>
          )}
        </div>
      ) : (
        <div className="competitions-grid">
          {filteredCompetitions.map((competition) => {
            const statusBadge = getStatusBadge(competition.status);
            return (
              <div key={competition._id} className="competition-card">
                <div className="card-header">
                  <h3>{competition.name}</h3>
                  <span className={`status-badge ${statusBadge.class}`}>
                    {statusBadge.text}
                  </span>
                </div>

                <div className="card-body">
                  <div className="info-row">
                    <span>Datum: {formatDate(competition.date)}</span>
                  </div>
                  <div className="info-row">
                    <span>Lokacija: {competition.location}</span>
                  </div>
                  <div className="info-row">
                    <span>Kotizacija: {competition.registrationFee} €</span>
                  </div>
                  <div className="info-row">
                    <span>Suci: {competition.referees?.length || 0}</span>
                  </div>

                  {competition.description && (
                    <p className="description">{competition.description}</p>
                  )}

                  <div className="categories">
                    <div className="category-group">
                      <strong>Dobne kategorije:</strong>
                      <div className="tags">
                        {competition.ageCategories?.map((cat, idx) => (
                          <span key={idx} className="tag">{cat}</span>
                        ))}
                      </div>
                    </div>
                    <div className="category-group">
                      <strong>Stilovi:</strong>
                      <div className="tags">
                        {competition.danceStyles?.map((style, idx) => (
                          <span key={idx} className="tag">{style}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card-actions">
                  <Link 
                    to={`/organizator/prijave?competitionId=${competition._id}`}
                    className="btn-action btn-view"
                  >
                    Prijave
                  </Link>
                  <Link 
                    to={`/organizator/suci?competitionId=${competition._id}`}
                    className="btn-action btn-referees"
                  >
                    Suci
                  </Link>
                  <button
                    onClick={() => handleEditClick(competition)}
                    className="btn-action btn-edit"
                    style={{ backgroundColor: '#f39c12', color: 'white', marginRight: '5px' }}
                  >
                    Uredi
                  </button>
                  <button
                    onClick={() => setDeleteModal({ 
                      show: true, 
                      id: competition._id, 
                      name: competition.name 
                    })}
                    className="btn-action btn-delete"
                  >
                    Obriši
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- MODAL ZA BRISANJE --- */}
      {deleteModal.show && (
        <div className="modal-overlay" onClick={() => setDeleteModal({ show: false, id: null, name: '' })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Potvrda brisanja</h3>
            <p>Jeste li sigurni da želite obrisati natjecanje:</p>
            <p className="modal-competition-name">"{deleteModal.name}"?</p>
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

      {/* --- MODAL ZA UREĐIVANJE --- */}
      {editModal.show && (
        <div className="modal-overlay" onClick={() => setEditModal({ show: false, competition: null })}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Uredi natjecanje</h3>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>Naziv natjecanja</label>
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
                  <label>Kotizacija (€)</label>
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

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setEditModal({ show: false, competition: null })}
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

    </div>
  );
}

export default MojaNatjecanja;