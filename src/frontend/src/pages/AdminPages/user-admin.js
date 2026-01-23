import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../Dashboard.css';
import './AdminPages.css';

function PregledUser() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 1. FILTER: Maknut 'approved', ostao samo 'role'
  const [filter, setFilter] = useState({ role: 'all' });

  // Stanja za modale
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState({ show: false, user: null });
  
  // 2. NOVO: Stanje za Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [newUser, setNewUser] = useState({
    name: '',
    surname: '',
    email: '',
    role: 'organizator',
    clubName: '',
    clubLocation: ''
    // Maknut approved: true
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, filter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/users`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];
    
    // Filtriranje samo po ulozi
    if (filter.role !== 'all') {
      filtered = filtered.filter(u => u.role === filter.role);
    }
    
    setFilteredUsers(filtered);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newUser,
          provider: 'manual',
          providerId: `manual_${Date.now()}`
        })
      });

      if (response.ok) {
        const createdUser = await response.json();
        setUsers([createdUser, ...users]);
        setShowAddModal(false);
        setNewUser({
          name: '',
          surname: '',
          email: '',
          role: 'organizator',
          clubName: '',
          clubLocation: ''
        });
        alert('Korisnik uspješno dodan!');
      } else {
        const error = await response.json();
        alert(`Greška: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Greška prilikom dodavanja korisnika');
    }
  };

  const handleDeleteUser = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/users/${showDeleteModal.user._id}`, {
        method: 'DELETE'
      });

      if (response.ok || response.status === 204) {
        setUsers(users.filter(u => u._id !== showDeleteModal.user._id));
        setShowDeleteModal({ show: false, user: null });
        alert('Korisnik uspješno obrisan!');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Greška prilikom brisanja korisnika');
    }
  };

  // 3. NOVO: Funkcija za otvaranje Edit modala
  const openEditModal = (user) => {
    setEditingUser({ ...user }); // Kopiramo podatke usera u state za uređivanje
    setShowEditModal(true);
  };

  // 4. NOVO: Funkcija za spremanje promjena (UPDATE)
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/users/${editingUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingUser.name,
          surname: editingUser.surname,
          role: editingUser.role,
          clubName: editingUser.clubName,
          clubLocation: editingUser.clubLocation
        })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        // Ažuriraj lokalno stanje
        setUsers(users.map(u => u._id === updatedUser._id ? updatedUser : u));
        setShowEditModal(false);
        setEditingUser(null);
        alert('Podaci uspješno ažurirani!');
      } else {
        alert('Došlo je do greške pri ažuriranju.');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Greška na serveru.');
    }
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      organizator: 'Organizator',
      voditeljKluba: 'Voditelj kluba',
      sudac: 'Sudac',
      admin: 'Administrator'
    };
    return roleMap[role] || role;
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <Link to="/admin" className="back-link">← Natrag na Dashboard</Link>
        <h1>Upravljanje korisnicima</h1>
        <p>Učitavanje...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Link to="/admin" className="back-link">← Natrag na Dashboard</Link>
      
      <div className="page-header">
        <h1>Upravljanje korisnicima</h1>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          + Dodaj korisnika
        </button>
      </div>

      {/* FILTERI (Samo uloga) */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Uloga:</label>
          <select 
            value={filter.role} 
            onChange={(e) => setFilter({ ...filter, role: e.target.value })}
            className="filter-select"
          >
            <option value="all">Sve uloge</option>
            <option value="organizator">Organizator</option>
            <option value="voditeljKluba">Voditelj kluba</option>
            <option value="sudac">Sudac</option>
            <option value="admin">Administrator</option>
          </select>
        </div>

        <div className="filter-info">
          Prikazano: <strong>{filteredUsers.length}</strong> / {users.length}
        </div>
      </div>

      {/* TABLICA KORISNIKA */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Ime i prezime</th>
              <th>Email</th>
              <th>Uloga</th>
              {/* Maknut stupac Status */}
              <th>Klub</th>
              <th>Akcije</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user._id}>
                <td>
                  <strong>{user.name} {user.surname}</strong>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge role-${user.role}`}>
                    {getRoleDisplayName(user.role)}
                  </span>
                </td>
                <td>
                  {user.role === 'voditeljKluba' && user.clubName 
                    ? `${user.clubName} (${user.clubLocation})` 
                    : '-'}
                </td>
                <td className="table-actions">
                  {/* Gumb za Uređivanje */}
                  <button
                    onClick={() => openEditModal(user)}
                    className="btn-table btn-edit"
                    title="Uredi ulogu i podatke"
                    style={{ backgroundColor: '#007bff', color: 'white', marginRight: '5px' }}
                  >
                    Uredi
                  </button>

                  <button
                    onClick={() => setShowDeleteModal({ show: true, user })}
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

        {filteredUsers.length === 0 && (
          <div className="empty-state">
            <p>Nema korisnika za prikaz s odabranim filterima.</p>
          </div>
        )}
      </div>

      {/* MODAL ZA DODAVANJE (Add) */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Dodaj novog korisnika</h3>
            <form onSubmit={handleAddUser}>
              {/* ... Polja za unos (Ista kao prije, bez approved checkboxa) ... */}
              <div className="form-row">
                <div className="form-group">
                  <label>Ime *</label>
                  <input type="text" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Prezime *</label>
                  <input type="text" value={newUser.surname} onChange={(e) => setNewUser({ ...newUser, surname: e.target.value })} required />
                </div>
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
              </div>

              <div className="form-group">
                <label>Uloga *</label>
                <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} required>
                  <option value="organizator">Organizator</option>
                  <option value="voditeljKluba">Voditelj kluba</option>
                  <option value="sudac">Sudac</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {newUser.role === 'voditeljKluba' && (
                <>
                  <div className="form-group">
                    <label>Naziv kluba</label>
                    <input type="text" value={newUser.clubName} onChange={(e) => setNewUser({ ...newUser, clubName: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Lokacija kluba</label>
                    <input type="text" value={newUser.clubLocation} onChange={(e) => setNewUser({ ...newUser, clubLocation: e.target.value })} />
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-cancel">Odustani</button>
                <button type="submit" className="btn-primary">Dodaj korisnika</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. NOVO: MODAL ZA UREĐIVANJE (Edit) */}
      {showEditModal && editingUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Uredi korisnika: {editingUser.email}</h3>
            <form onSubmit={handleUpdateUser}>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Ime</label>
                  <input 
                    type="text" 
                    value={editingUser.name} 
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label>Prezime</label>
                  <input 
                    type="text" 
                    value={editingUser.surname} 
                    onChange={(e) => setEditingUser({ ...editingUser, surname: e.target.value })} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Promijeni ulogu</label>
                <select 
                  value={editingUser.role} 
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  style={{ border: '2px solid #007bff' }} // Istaknuto da se vidi da se može mijenjati
                >
                  <option value="organizator">Organizator</option>
                  <option value="voditeljKluba">Voditelj kluba</option>
                  <option value="sudac">Sudac</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {/* Polja za klub se prikazuju samo ako je voditeljKluba */}
              {editingUser.role === 'voditeljKluba' && (
                <>
                  <div className="form-group">
                    <label>Naziv kluba</label>
                    <input 
                      type="text" 
                      value={editingUser.clubName || ''} 
                      onChange={(e) => setEditingUser({ ...editingUser, clubName: e.target.value })} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Lokacija kluba</label>
                    <input 
                      type="text" 
                      value={editingUser.clubLocation || ''} 
                      onChange={(e) => setEditingUser({ ...editingUser, clubLocation: e.target.value })} 
                    />
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-cancel">
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

      {/* MODAL ZA BRISANJE (Delete) */}
      {showDeleteModal.show && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal({ show: false, user: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Potvrda brisanja</h3>
            <p>Jeste li sigurni da želite obrisati korisnika:</p>
            <p className="modal-user-name">
              <strong>{showDeleteModal.user.name} {showDeleteModal.user.surname}</strong><br/>
              ({showDeleteModal.user.email})
            </p>
            <p className="modal-warning">Ova radnja je trajna i ne može se poništiti.</p>
            <div className="modal-actions">
              <button onClick={() => setShowDeleteModal({ show: false, user: null })} className="btn-cancel">
                Odustani
              </button>
              <button onClick={handleDeleteUser} className="btn-confirm-delete">
                Da, obriši
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PregledUser;