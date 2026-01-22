import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../Dashboard.css';
import './moja_natjecanja_org.css';

function MojaNatjecanja() {
  const { currentUser, refreshUser } = useAuth();

  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const location = useLocation();
  const navigate = useNavigate();

  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, name: '' });
  const [editModal, setEditModal] = useState({ show: false, competition: null });
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    date: '',
    location: '',
    registrationFee: ''
  });

  // ==================================================================
  // 1. PROVJERA PRETPLATE (Blokira prikaz ako nije active)
  // ==================================================================
  const isSubscriptionValid = () => {
    if (!currentUser) return false;
    if (currentUser.role !== 'organizator') return false;

    if (currentUser.subscriptionStatus !== 'active') return false;

    if (currentUser.subscriptionExpiry) {
      const expiryDate = new Date(currentUser.subscriptionExpiry);
      const now = new Date();
      if (now > expiryDate) return false;
    } else {
      return false;
    }

    return true;
  };

  // ==================================================================
  // 2. GLAVNI EFFECT: DETEKCIJA PLAĆANJA I UČITAVANJE
  // ==================================================================
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const justPaid = params.get('payment_success') === 'true';

    const initPage = async () => {
      if (justPaid) {
        console.log('💰 Plaćanje detektirano! Osvježavam podatke...');
        setLoading(true);

        try {
          await refreshUser();
          navigate('/organizator/natjecanja', { replace: true });
          await fetchMyCompetitions();
        } catch (error) {
          console.error('Greška nakon plaćanja:', error);
        }
      } else {
        if (currentUser) {
          if (currentUser.subscriptionStatus !== 'active') {
            await refreshUser();
          }
          fetchMyCompetitions();
        } else {
          setLoading(false);
        }
      }
    };

    initPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAndAutoUpdateStatus = async (competitionsList) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const updatedList = await Promise.all(
      competitionsList.map(async (comp) => {
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
            return comp;
          }
        }
        return comp;
      })
    );
    return updatedList;
  };

  const fetchMyCompetitions = async () => {
    try {
      setLoading(true);
      if (!currentUser) return;

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/competitions?organizerId=${currentUser._id}`
      );

      if (response.status === 404) {
        setCompetitions([]);
        setError('');
        return;
      }
      if (!response.ok) throw new Error('Failed');

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

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/competitions/${id}`, {
        method: 'DELETE'
      });
      if (response.ok || response.status === 204) {
        setCompetitions(competitions.filter((comp) => comp._id !== id));
        setDeleteModal({ show: false, id: null, name: '' });
      } else {
        throw new Error('Failed to delete');
      }
    } catch (err) {
      alert('Greška prilikom brisanja');
    }
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
        setCompetitions(
          competitions.map((c) =>
            c._id === editModal.competition._id ? { ...c, ...updatedCompetition } : c
          )
        );
        setEditModal({ show: false, competition: null });
        alert('Natjecanje uspješno ažurirano!');
      } else {
        throw new Error('Failed to update');
      }
    } catch (err) {
      alert('Greška prilikom ažuriranja');
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('hr-HR', { day: 'numeric', month: 'long', year: 'numeric' });

  const getStatusBadge = (status) => {
    const map = {
      upcoming: { text: 'Nadolazeće', class: 'status-upcoming' },
      ongoing: { text: 'U tijeku', class: 'status-ongoing' },
      completed: { text: 'Završeno', class: 'status-completed' }
    };
    return map[status] || { text: status, class: 'status-default' };
  };

  const filteredCompetitions = competitions.filter((comp) =>
    filter === 'all' ? true : comp.status === filter
  );

  const stats = {
    total: competitions.length,
    upcoming: competitions.filter((c) => c.status === 'upcoming').length,
    ongoing: competitions.filter((c) => c.status === 'ongoing').length,
    completed: competitions.filter((c) => c.status === 'completed').length
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <Link to="/organizator" className="back-link">← Natrag na Dashboard</Link>
        <h1>Moja natjecanja</h1>
        <div className="loading-spinner">Osvježavanje podataka...</div>
      </div>
    );
  }

  if (currentUser && !isSubscriptionValid()) {
    return (
      <div className="dashboard-container">
        <Link to="/organizator" className="back-link">← Natrag na Dashboard</Link>

        <div className="subscription-lock-screen">
          <div className="lock-icon">🔒</div>
          <h1>Pristup onemogućen</h1>
          <p>Vaša članarina je istekla ili nije aktivna.</p>

          {currentUser.subscriptionExpiry && (
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '20px' }}>
              Datum isteka: {formatDate(currentUser.subscriptionExpiry)}
            </p>
          )}

          <p>Za nastavak korištenja sustava, molimo obnovite pretplatu.</p>

          <Link to="/organizator/placanje-clanarine" className="btn-primary btn-large">
            Obnovi članarinu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <h1>Moja natjecanja</h1>
        <Link to="/organizator/kreiranje-natjecanja" className="btn-primary">
          + Novo natjecanje
        </Link>
      </div>

      {/* ✅ Stats cards are now the filters */}
      <div className="stats-grid">
        <button
          type="button"
          className={`stat-card ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
          aria-pressed={filter === 'all'}
        >
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Ukupno</div>
          <div className="stat-cta">Prikaz <span className="arrow">→</span></div>
        </button>

        <button
          type="button"
          className={`stat-card ${filter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setFilter('upcoming')}
          aria-pressed={filter === 'upcoming'}
        >
          <div className="stat-number">{stats.upcoming}</div>
          <div className="stat-label">Nadolazeća</div>
          <div className="stat-cta">Prikaz <span className="arrow">→</span></div>
        </button>

        <button
          type="button"
          className={`stat-card ${filter === 'ongoing' ? 'active' : ''}`}
          onClick={() => setFilter('ongoing')}
          aria-pressed={filter === 'ongoing'}
        >
          <div className="stat-number">{stats.ongoing}</div>
          <div className="stat-label">U tijeku</div>
          <div className="stat-cta">Prikaz <span className="arrow">→</span></div>
        </button>

        <button
          type="button"
          className={`stat-card ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
          aria-pressed={filter === 'completed'}
        >
          <div className="stat-number">{stats.completed}</div>
          <div className="stat-label">Završena</div>
          <div className="stat-cta">Prikaz <span className="arrow">→</span></div>
        </button>
      </div>

      {filteredCompetitions.length === 0 ? (
        <div className="empty-state">
          <h3>{filter === 'all' ? 'Nemate kreiranih natjecanja' : `Nemate natjecanja u statusu "${filter}"`}</h3>
          {filter === 'all' && (
            <>
              <p>Kliknite na "Novo natjecanje" da kreirate svoje prvo natjecanje.</p>
              <Link to="/organizator/kreiranje-natjecanja" className="btn-primary">Kreiraj natjecanje</Link>
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
                  <span className={`status-badge ${statusBadge.class}`}>{statusBadge.text}</span>
                </div>
                <div className="card-body">
                  <div className="info-row"><span>Datum: {formatDate(competition.date)}</span></div>
                  <div className="info-row"><span>Lokacija: {competition.location}</span></div>
                  <div className="info-row"><span>Kotizacija: {competition.registrationFee} €</span></div>
                </div>
                <div className="card-actions-org">
                  <Link to={`/organizator/prijave?competitionId=${competition._id}`} className="btn-action-org btn-view">Prijave</Link>
                  <button
                    onClick={() => setDeleteModal({ show: true, id: competition._id, name: competition.name })}
                    className="btn-action-org btn-delete"
                  >
                    Obriši
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deleteModal.show && (
        <div className="modal-overlay" onClick={() => setDeleteModal({ show: false, id: null, name: '' })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Potvrda brisanja</h3>
            <p>Jeste li sigurni da želite obrisati natjecanje "{deleteModal.name}"?</p>
            <div className="modal-actions">
              <button onClick={() => setDeleteModal({ show: false, id: null, name: '' })} className="btn-cancel">Odustani</button>
              <button onClick={() => handleDelete(deleteModal.id)} className="btn-confirm-delete">Da, obriši</button>
            </div>
          </div>
        </div>
      )}

      {editModal.show && (
        <div className="modal-overlay" onClick={() => setEditModal({ show: false, competition: null })}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Uredi natjecanje</h3>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>Naziv</label>
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Opis</label>
                <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows="4" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Datum</label>
                  <input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Kotizacija (€)</label>
                  <input type="number" step="0.01" value={editForm.registrationFee} onChange={(e) => setEditForm({ ...editForm, registrationFee: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label>Lokacija</label>
                <input value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} required />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setEditModal({ show: false, competition: null })} className="btn-cancel">Odustani</button>
                <button type="submit" className="btn-primary">Spremi promjene</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MojaNatjecanja;