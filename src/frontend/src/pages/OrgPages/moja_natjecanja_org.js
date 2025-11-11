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
  const [filter, setFilter] = useState('all'); // all, upcoming, ongoing, completed
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, name: '' });

  useEffect(() => {
    fetchMyCompetitions();
  }, [currentUser]);

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
      setCompetitions(data);
      setError('');
    } catch (err) {
      console.error('Error fetching competitions:', err);
      setError('Greška prilikom dohvaćanja natjecanja');
    } finally {
      setLoading(false);
    }
  };

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
      console.error('Error deleting competition:', err);
      alert('Greška prilikom brisanja natjecanja');
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
    return statusMap[status] || { text: status, class: '' };
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

  if (loading) {
    return (
      <div className="dashboard-container">
        <Link to="/organizator" className="back-link">← Natrag na Dashboard</Link>
        <h1>Moja natjecanja</h1>
        <div className="loading-spinner">Učitavanje...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Link to="/organizator" className="back-link">← Natrag na Dashboard</Link>
      
      <div className="page-header">
        <h1>Moja natjecanja</h1>
        <Link to="/organizator/kreiranje-natjecanja" className="btn-primary">
          + Novo natjecanje
        </Link>
      </div>

      {/* Statistika natjecanja */}
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

      {/* Filteri */}
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


      {/* Lista natjecanja */}
      {filteredCompetitions.length === 0 ? (
        <div className="empty-state">
          <h3>Nemate kreiranih natjecanja</h3>
          <p>Kliknite na "Novo natjecanje" da kreirate svoje prvo natjecanje.</p>
          <Link to="/organizator/kreiranje-natjecanja" className="btn-primary">
            Kreiraj natjecanje
          </Link>
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
                        {competition.ageCategories.map((cat, idx) => (
                          <span key={idx} className="tag">{cat}</span>
                        ))}
                      </div>
                    </div>
                    <div className="category-group">
                      <strong>Stilovi:</strong>
                      <div className="tags">
                        {competition.danceStyles.map((style, idx) => (
                          <span key={idx} className="tag">{style}</span>
                        ))}
                      </div>
                    </div>
                    <div className="category-group">
                      <strong>Veličine grupa:</strong>
                      <div className="tags">
                        {competition.groupSizes.map((size, idx) => (
                          <span key={idx} className="tag">{size}</span>
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

      {/* Brisanje natjecanja */}
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
    </div>
  );
}

export default MojaNatjecanja;