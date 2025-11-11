import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../Dashboard.css';
import './AdminPages.css';

function PregledUser() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ role: 'all', approved: 'all' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState({ show: false, user: null });
  const [newUser, setNewUser] = useState({
    name: '',
    surname: '',
    email: '',
    role: 'organizator',
    clubName: '',
    clubLocation: '',
    approved: true
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
    
    if (filter.role !== 'all') {
      filtered = filtered.filter(u => u.role === filter.role);
    }
    
    if (filter.approved !== 'all') {
      filtered = filtered.filter(u => u.approved === (filter.approved === 'true'));
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
          clubLocation: '',
          approved: true
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

  const handleApproveToggle = async (userId, currentStatus) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: !currentStatus })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map(u => u._id === userId ? updatedUser : u));
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Greška prilikom ažuriranja korisnika');
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



      {/*filteri*/}
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

        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={filter.approved} 
            onChange={(e) => setFilter({ ...filter, approved: e.target.value })}
            className="filter-select"
          >
            <option value="all">Svi</option>
            <option value="true">Odobreni</option>
            <option value="false">Na čekanju</option>
          </select>
        </div>

        <div className="filter-info">
          Prikazano: <strong>{filteredUsers.length}</strong> / {users.length}
        </div>
      </div>




      {/*tablica korisnika*/}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Ime i prezime</th>
              <th>Email</th>
              <th>Uloga</th>
              <th>Status</th>
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
                  <span className={`status-badge ${user.approved ? 'approved' : 'pending'}`}>
                    {user.approved ? 'Odobren' : 'Na čekanju'}
                  </span>
                </td>
                <td>
                  {user.role === 'voditeljKluba' && user.clubName 
                    ? `${user.clubName} (${user.clubLocation})` 
                    : '-'}
                </td>
                <td className="table-actions">
                  <button
                    onClick={() => handleApproveToggle(user._id, user.approved)}
                    className={`btn-table ${user.approved ? 'btn-unapprove' : 'btn-approve'}`}
                    title={user.approved ? 'Poništi odobrenje' : 'Odobri'}
                  >
                    {user.approved ? 'Poništi' : 'Odobri'}
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



      {/*dodavanje korisnika*/}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Dodaj novog korisnika</h3>
            <form onSubmit={handleAddUser}>
              <div className="form-row">
                <div className="form-group">
                  <label>Ime *</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Prezime *</label>
                  <input
                    type="text"
                    value={newUser.surname}
                    onChange={(e) => setNewUser({ ...newUser, surname: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Uloga *</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  required
                >
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
                    <input
                      type="text"
                      value={newUser.clubName}
                      onChange={(e) => setNewUser({ ...newUser, clubName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Lokacija kluba</label>
                    <input
                      type="text"
                      value={newUser.clubLocation}
                      onChange={(e) => setNewUser({ ...newUser, clubLocation: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="checkbox-label-inline">
                  <input
                    type="checkbox"
                    checked={newUser.approved}
                    onChange={(e) => setNewUser({ ...newUser, approved: e.target.checked })}
                  />
                  <span>Odmah odobri korisnika</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-cancel">
                  Odustani
                </button>
                <button type="submit" className="btn-primary">
                  Dodaj korisnika
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/*brisanje korisnika*/}
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
              <button
                onClick={() => setShowDeleteModal({ show: false, user: null })}
                className="btn-cancel"
              >
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