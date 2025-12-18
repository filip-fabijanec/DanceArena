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
  // 1. KLJUČNA FUNKCIJA: STROGA PROVJERA NA FRONTENDU
  // ==================================================================
  // Ova funkcija ne čeka backend. Ona gleda na sat i blokira pristup ODMAH.
  const isSubscriptionValid = () => {
      // Ako nema korisnika ili nije organizator
      if (!currentUser) return false;
      if (currentUser.role !== 'organizator') return false;
      
      // Ako u bazi eksplicitno piše da nije aktivan
      if (currentUser.subscriptionStatus !== 'active') return false;

      // PROVJERA DATUMA (Ovo je ono što ti je falilo!)
      if (currentUser.subscriptionExpiry) {
          const expiryDate = new Date(currentUser.subscriptionExpiry);
          const now = new Date();
          
          // Ako je trenutno vrijeme veće od vremena isteka -> BLOKIRAJ
          if (now > expiryDate) {
              return false; 
          }
      } else {
          // Ako je status 'active', ali nema datuma isteka (greška u podacima)
          // Možeš vratiti false za svaki slučaj
          return false;
      }

      // Samo ako je sve prošlo, vraća true
      return true;
  };

  // ------------------------------------------------------------------
  // 2. DETEKCIJA POVRATKA S PLAĆANJA
  // ------------------------------------------------------------------
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    if (params.get('payment_refresh')) {
      console.log("Prepoznato plaćanje, osvježavam korisnika...");
      setLoading(true);
      refreshUser().then(() => {
        navigate('/organizator/natjecanja', { replace: true });
      });
    } else {
        // Ako samo dolazimo na stranicu, osvježi podatke za svaki slučaj
        if (currentUser) {
            refreshUser();
        }
    }
  }, [location, navigate, refreshUser]);


  // ------------------------------------------------------------------
  // 3. GLAVNI EFFECT ZA UČITAVANJE PODATAKA
  // ------------------------------------------------------------------
  // ------------------------------------------------------------------
  // 2. & 3. GLAVNI EFFECT: DETEKCIJA PLAĆANJA I UČITAVANJE PODATAKA
  // ------------------------------------------------------------------
  useEffect(() => {
    // Koristimo window.location ili postojeći location objekt, ali ga NE stavljamo u dependency array
    const params = new URLSearchParams(location.search);

    const initPage = async () => {
      // SCENARIJ A: Povratak s plaćanja
      if (params.get('payment_refresh')) {
        console.log("Prepoznato plaćanje, osvježavam korisnika...");
        setLoading(true);

        try {
          await refreshUser(); // Prvo osvježi usera
          // Zatim očisti URL da se ovo ne ponovi (replace mode)
          navigate('/organizator/natjecanja', { replace: true });
          // Na kraju povuci natjecanja
          await fetchMyCompetitions();
        } catch (error) {
          console.error("Greška pri osvježavanju:", error);
        }

      } 
      // SCENARIJ B: Normalan dolazak na stranicu
      else {
         // Ovdje moramo biti oprezni: ako user još nije učitan (null), možda nećemo dohvatiti podatke.
         // Ali budući da želiš "samo jednom na refresh", ovo je logika:
         if (currentUser) {
             fetchMyCompetitions();
         } else {
             setLoading(false);
         }
      }
    };

    initPage();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // <--- OVO JE KLJUČNO: Prazan niz znači "samo jednom pri montiranju"


  // Funkcija za automatsko ažuriranje statusa
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

  // --- LOGIKA ZA BRISANJE ---
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/competitions/${id}`, { method: 'DELETE' });
      if (response.ok || response.status === 204) {
        setCompetitions(competitions.filter(comp => comp._id !== id));
        setDeleteModal({ show: false, id: null, name: '' });
      } else {
        throw new Error('Failed to delete');
      }
    } catch (err) {
      console.error(err);
      alert('Greška prilikom brisanja natjecanja');
    }
  };

  // --- LOGIKA ZA UREĐIVANJE ---
  const handleEditClick = (c) => {
    setEditModal({ show: true, competition: c });
    setEditForm({ name: c.name, description: c.description || '', date: c.date ? c.date.split('T')[0] : '', location: c.location, registrationFee: c.registrationFee });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/competitions/${editModal.competition._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm)
      });
      if (response.ok) {
        const updatedCompetition = await response.json();
        setCompetitions(competitions.map(c => c._id === editModal.competition._id ? { ...c, ...updatedCompetition } : c));
        setEditModal({ show: false, competition: null });
        alert('Natjecanje uspješno ažurirano!');
      } else { throw new Error('Failed to update'); }
    } catch (err) {
      console.error(err);
      alert('Greška prilikom ažuriranja natjecanja');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('hr-HR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const map = { upcoming: { text: 'Nadolazeće', class: 'status-upcoming' }, ongoing: { text: 'U tijeku', class: 'status-ongoing' }, completed: { text: 'Završeno', class: 'status-completed' } };
    return map[status] || { text: status, class: 'status-default' };
  };

  const filteredCompetitions = competitions.filter(comp => filter === 'all' ? true : comp.status === filter);
  const stats = {
      total: competitions.length,
      upcoming: competitions.filter(c => c.status === 'upcoming').length,
      ongoing: competitions.filter(c => c.status === 'ongoing').length,
      completed: competitions.filter(c => c.status === 'completed').length,
  };

  // --------------------------------------------------------
  // RENDERIRANJE (PRIKAZ)
  // --------------------------------------------------------

  if (loading) {
    return (
      <div className="dashboard-container">
        <Link to="/organizator" className="back-link">← Natrag na Dashboard</Link>
        <h1>Moja natjecanja</h1>
        <div className="loading-spinner">Provjera statusa...</div>
      </div>
    );
  }

  // 4. STROGA BLOKADA PRIKAZA
  // Ovdje koristimo funkciju isSubscriptionValid() umjesto samo provjere stringa
  if (currentUser && !isSubscriptionValid()) {
    return (
      <div className="dashboard-container">
        <Link to="/organizator" className="back-link">← Natrag na Dashboard</Link>
        
        <div className="subscription-lock-screen">
          <div className="lock-icon">🔒</div>
          <h1>Pristup onemogućen</h1>
          <p>Vaša članarina je istekla ili nije aktivna.</p>
          
          {currentUser.subscriptionExpiry && (
             <p style={{fontSize: '0.9rem', color: '#666', marginBottom: '20px'}}>
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

  // 5. GLAVNI PRIKAZ (Samo ako je isSubscriptionValid == true)
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
        <div className="stat-card"><div className="stat-number">{stats.total}</div><div className="stat-label">Ukupno</div></div>
        <div className="stat-card"><div className="stat-number">{stats.upcoming}</div><div className="stat-label">Nadolazeća</div></div>
        <div className="stat-card"><div className="stat-number">{stats.ongoing}</div><div className="stat-label">U tijeku</div></div>
        <div className="stat-card"><div className="stat-number">{stats.completed}</div><div className="stat-label">Završena</div></div>
      </div>

      <div className="filters">
        <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Sva</button>
        <button className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`} onClick={() => setFilter('upcoming')}>Nadolazeća</button>
        <button className={`filter-btn ${filter === 'ongoing' ? 'active' : ''}`} onClick={() => setFilter('ongoing')}>U tijeku</button>
        <button className={`filter-btn ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>Završena</button>
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
                <div className="card-actions">
                  <Link to={`/organizator/prijave?competitionId=${competition._id}`} className="btn-action btn-view">Prijave</Link>
                  <Link to={`/organizator/suci?competitionId=${competition._id}`} className="btn-action btn-referees">Suci</Link>
                  <button onClick={() => handleEditClick(competition)} className="btn-action btn-edit" style={{ backgroundColor: '#f39c12', color: 'white' }}>Uredi</button>
                  <button onClick={() => setDeleteModal({ show: true, id: competition._id, name: competition.name })} className="btn-action btn-delete">Obriši</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODALI */}
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
              <div className="form-group"><label>Naziv</label><input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required /></div>
              <div className="form-group"><label>Opis</label><textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows="4" /></div>
              <div className="form-row">
                 <div className="form-group"><label>Datum</label><input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} required /></div>
                 <div className="form-group"><label>Kotizacija (€)</label><input type="number" step="0.01" value={editForm.registrationFee} onChange={(e) => setEditForm({ ...editForm, registrationFee: e.target.value })} required /></div>
              </div>
              <div className="form-group"><label>Lokacija</label><input value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} required /></div>
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