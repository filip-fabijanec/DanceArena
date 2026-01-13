import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../Dashboard.css';
import './AdminPages.css';

function Članarine() {
  // --- STATE ZA KORISNIKE ---
  const [clanarine, setClanarine] = useState([]);
  const [filteredClanarine, setFilteredClanarine] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- STATE ZA CIJENU (NOVO) ---
  const [priceSettings, setPriceSettings] = useState({ membershipPrice: 0, currency: 'EUR' });
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [newPrice, setNewPrice] = useState('');

  // --- FILTER STATE ---
  const [filter, setFilter] = useState({ status: 'all', search: '' });

  // --- MODALS STATE ---
  const [showEditModal, setShowEditModal] = useState({ show: false, user: null });
  const [showDeleteModal, setShowDeleteModal] = useState({ show: false, user: null });

  // --- EDIT FORM STATE ---
  const [editForm, setEditForm] = useState({
    subscriptionStatus: 'inactive',
    subscriptionExpiry: ''
  });

  // 1. Fetch data on mount
  useEffect(() => {
    fetchClanarine();
    fetchPrice(); // <--- DOHVATI CIJENU PRI UČITAVANJU
  }, []);

  // 2. Apply filters whenever data or filter state changes
  useEffect(() => {
    applyFilters();
  }, [clanarine, filter]);

  // --- API POZIVI ---

  const fetchClanarine = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/clanarine`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Osiguravamo da je data niz, čak i ako backend vrati nešto čudno
        setClanarine(Array.isArray(data) ? data : []);
      } else {
        console.error("Greška, status:", response.status);
      }
    } catch (error) {
      console.error("Greška pri dohvatu članarina:", error);
    } finally {
      setLoading(false);
    }
  };

  // NOVO: Dohvat cijene
  const fetchPrice = async () => {
    try {
        const token = localStorage.getItem('token');
        // Pazi da ruta odgovara onoj u backendu (vjerojatno /settings ili /api/settings)
        const response = await fetch(`${process.env.REACT_APP_API_URL}/settings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            setPriceSettings(data);
            setNewPrice(data.membershipPrice); // Postavi početnu vrijednost za input
        }
    } catch (err) { 
        console.error("Greška pri dohvatu cijene:", err); 
    }
  };

  // NOVO: Ažuriranje cijene
  const handleUpdatePrice = async (e) => {
    e.preventDefault();
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_URL}/settings`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ membershipPrice: newPrice })
        });
        
        if (response.ok) {
            const data = await response.json();
            setPriceSettings(data);
            setShowPriceModal(false);
            alert("Nova cijena uspješno postavljena!");
        } else {
            alert("Greška pri spremanju cijene.");
        }
    } catch (err) { 
        console.error(err);
        alert("Greška servera.");
    }
  };

  // --- FILTRIRANJE ---

  const applyFilters = () => {
    let filtered = Array.isArray(clanarine) ? [...clanarine] : [];

    // Filter po statusu
    if (filter.status !== 'all') {
      filtered = filtered.filter(u => u.subscriptionStatus === filter.status);
    }

    // Filter po imenu, prezimenu ili emailu
    if (filter.search) {
      const term = filter.search.toLowerCase();
      filtered = filtered.filter(u => 
        (u.name && u.name.toLowerCase().includes(term)) || 
        (u.surname && u.surname.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term))
      );
    }

    setFilteredClanarine(filtered);
  };

  // --- HANDLERS ZA KORISNIKE ---

  const handleEditClick = (user) => {
    setShowEditModal({ show: true, user });
    
    let formattedDate = '';
    if (user.subscriptionExpiry) {
        formattedDate = new Date(user.subscriptionExpiry).toISOString().split('T')[0];
    }

    setEditForm({
      subscriptionStatus: user.subscriptionStatus || 'inactive',
      subscriptionExpiry: formattedDate
    });
  };

  const handleUpdateClanarina = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/clanarine/${showEditModal.user._id}`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setClanarine(clanarine.map(c => 
          c._id === showEditModal.user._id ? updatedUser : c
        ));
        setShowEditModal({ show: false, user: null });
        alert('Status pretplate ažuriran!');
      } else {
        alert('Greška pri ažuriranju.');
      }
    } catch (error) {
      console.error(error);
      alert('Greška servera.');
    }
  };

  const handleDeleteClanarina = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/clanarine/${showDeleteModal.user._id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setClanarine(clanarine.map(c => {
            if (c._id === showDeleteModal.user._id) {
                return { ...c, subscriptionStatus: 'inactive', subscriptionExpiry: null };
            }
            return c;
        }));
        setShowDeleteModal({ show: false, user: null });
        alert('Pretplata poništena!');
      }
    } catch (error) {
      console.error(error);
      alert('Greška pri brisanju.');
    }
  };

  const getStatusBadgeClass = (status) => {
    return status === 'active' ? 'status-completed' : 'status-pending'; 
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <Link to="/admin" className="back-link">← Natrag na Dashboard</Link>
        <h1>Pregled Organizatora</h1>
        <p>Učitavanje...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Link to="/admin" className="back-link">← Natrag na Dashboard</Link>
      
      <div className="page-header">
        <div>
            <h1>Upravljanje članarinama</h1>
            <p style={{color: '#666', marginTop: '5px'}}>Pregled pretplata organizatora</p>
        </div>
        
        {/* NOVO: Gumb za promjenu cijene */}
        <button 
            className="btn-primary" 
            onClick={() => setShowPriceModal(true)}
            style={{ display: 'flex', gap: '10px', alignItems: 'center', height: 'fit-content' }}
        >
            <span>Cijena: <strong>{priceSettings.membershipPrice} {priceSettings.currency}</strong></span>
            <span style={{background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px'}}>Uredi</span>
        </button>
      </div>

      {/* FILTERI */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={filter.status} 
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="filter-select"
          >
            <option value="all">Svi</option>
            <option value="active">Aktivni</option>
            <option value="inactive">Neaktivni</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Pretraga (Ime/Email):</label>
          <input 
            type="text" 
            placeholder="Traži..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="filter-input"
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        <div className="filter-info">
          Prikazano: <strong>{filteredClanarine.length}</strong> / {clanarine.length}
        </div>
      </div>

      {/* TABLICA */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Organizator</th>
              <th>Email</th>
              <th>Status Pretplate</th>
              <th>Vrijedi do</th>
              <th>Akcije</th>
            </tr>
          </thead>
          <tbody>
            {filteredClanarine.map((user) => (
              <tr key={user._id}>
                <td>
                  <strong>{user.name} {user.surname}</strong>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`status-badge ${getStatusBadgeClass(user.subscriptionStatus)}`}>
                    {user.subscriptionStatus === 'active' ? "AKTIVAN" : "NEAKTIVAN"}
                  </span>
                </td>
                <td>
                  {user.subscriptionExpiry 
                    ? new Date(user.subscriptionExpiry).toLocaleDateString('hr-HR') 
                    : '-'}
                </td>
                <td className="table-actions">
                  <button
                    onClick={() => handleEditClick(user)}
                    className="btn-table btn-approve"
                  >
                    Uredi
                  </button>
                  <button
                    onClick={() => setShowDeleteModal({ show: true, user: user })}
                    className="btn-table btn-delete-small"
                    title="Poništi pretplatu"
                  >
                    Poništi
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredClanarine.length === 0 && (
          <div className="empty-state">
            <p>Nema organizatora za odabrani filter.</p>
          </div>
        )}
      </div>

      {/* --- MODALI --- */}

      {/* 1. EDIT MODAL (KORISNIK) */}
      {showEditModal.show && (
        <div className="modal-overlay" onClick={() => setShowEditModal({ show: false, user: null })}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Uredi status pretplate</h3>
            <p>Korisnik: <strong>{showEditModal.user.name} {showEditModal.user.surname}</strong></p>
            
            <form onSubmit={handleUpdateClanarina}>
              
              <div className="form-group">
                <label>Status pretplate</label>
                <select
                    value={editForm.subscriptionStatus}
                    onChange={(e) => setEditForm({ ...editForm, subscriptionStatus: e.target.value })}
                >
                    <option value="active">Active (Plaćeno)</option>
                    <option value="inactive">Inactive (Nije plaćeno)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Datum isteka</label>
                <input
                  type="date"
                  value={editForm.subscriptionExpiry}
                  onChange={(e) => setEditForm({ ...editForm, subscriptionExpiry: e.target.value })}
                />
                <small style={{display:'block', marginTop:'5px', color:'#666'}}>
                    Ako je status "active", ovdje postavi do kada vrijedi.
                </small>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal({ show: false, user: null })} 
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

      {/* 2. DELETE MODAL (KORISNIK) */}
      {showDeleteModal.show && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal({ show: false, user: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Potvrda poništavanja</h3>
            <p>Jeste li sigurni da želite <strong>poništiti pretplatu</strong> za:</p>
            <p className="modal-user-name">
              <strong>{showDeleteModal.user.name} {showDeleteModal.user.surname}</strong>
            </p>
            <p>Ovo će postaviti status na "inactive". Korisnik neće biti obrisan.</p>
            
            <div className="modal-actions">
              <button
                onClick={() => setShowDeleteModal({ show: false, user: null })}
                className="btn-cancel"
              >
                Odustani
              </button>
              <button onClick={handleDeleteClanarina} className="btn-confirm-delete">
                Da, poništi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. PRICE MODAL (NOVO - CIJENA) */}
      {showPriceModal && (
        <div className="modal-overlay" onClick={() => setShowPriceModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Postavi cijenu članarine</h3>
            <p>Ova cijena će biti prikazana svim organizatorima pri plaćanju.</p>
            
            <form onSubmit={handleUpdatePrice}>
                <div className="form-group">
                    <label>Cijena (EUR)</label>
                    <input 
                        type="number" 
                        value={newPrice} 
                        onChange={(e) => setNewPrice(e.target.value)}
                        min="0"
                        step="0.01"
                    />
                </div>
                <div className="modal-actions">
                    <button type="button" className="btn-cancel" onClick={() => setShowPriceModal(false)}>Odustani</button>
                    <button type="submit" className="btn-primary">Spremi cijenu</button>
                </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Članarine;