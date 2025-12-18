import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../Dashboard.css';
import './AdminPages.css'; // Pretpostavljam da ovdje držiš stilove za tablice i modale

function Članarine() {
  const [clanarine, setClanarine] = useState([]);
  const [filteredClanarine, setFilteredClanarine] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [filter, setFilter] = useState({ status: 'all', mjesec: '' });

  // Modals state
  const [showEditModal, setShowEditModal] = useState({ show: false, clanarina: null });
  const [showDeleteModal, setShowDeleteModal] = useState({ show: false, clanarina: null });

  // Edit form state
  const [editForm, setEditForm] = useState({
    iznos: '',
    jePlaceno: false,
    datumUplate: '',
    mjesec: ''
  });

  // 1. Fetch data on mount
  useEffect(() => {
    fetchClanarine();
  }, []);

  // 2. Apply filters whenever data or filter state changes
  useEffect(() => {
    applyFilters();
  }, [clanarine, filter]);

  const fetchClanarine = async () => {
    try {
      setLoading(true);
      
      // 1. Dohvati token (prilagodi ključ 'token' onome kako ga ti spremaš pri loginu)
      const token = localStorage.getItem('token'); 

      const response = await fetch(`${process.env.REACT_APP_API_URL}/clanarine`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // 2. OVO NEDOSTAJE: Šaljemo token backendu
          'Authorization': `Bearer ${token}` 
        }
      });
      
      // 3. Debugiranje - ispiši što backend vraća
      console.log("Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Dohvaćeni podaci:", data); // Provjeri strukturu ovdje!
        
        // Provjera je li data niz ili objekt
        if (Array.isArray(data)) {
            setClanarine(data);
        } else {
            console.error("Backend nije vratio niz! Vratio je:", data);
            // Ako backend vraća { clanarine: [...] }, onda koristi setClanarine(data.clanarine)
        }
      } else {
        console.error("Greška pri dohvatu. Status:", response.status);
      }
    } catch (error) {
      console.error("Greška pri dohvatu članarina:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...clanarine];

    // Filter po statusu plaćanja
    if (filter.status !== 'all') {
      const isPaid = filter.status === 'paid';
      filtered = filtered.filter(c => c.jePlaceno === isPaid);
    }

    // Filter po mjesecu (opcionalno, ako želiš pretragu po tekstu mjeseca)
    if (filter.mjesec) {
      filtered = filtered.filter(c => 
        c.mjesec.toLowerCase().includes(filter.mjesec.toLowerCase())
      );
    }

    setFilteredClanarine(filtered);
  };

  // --- HANDLERS ZA MODALE ---

  const handleEditClick = (clanarina) => {
    setShowEditModal({ show: true, clanarina });
    setEditForm({
      iznos: clanarina.iznos,
      jePlaceno: clanarina.jePlaceno,
      datumUplate: clanarina.datumUplate ? clanarina.datumUplate.split('T')[0] : '', // Format za input type="date"
      mjesec: clanarina.mjesec
    });
  };

  const handleUpdateClanarina = async (e) => {
    e.preventDefault();
    try {
      // Ako je označeno kao plaćeno, a nema datuma, stavi današnji
      let finalForm = { ...editForm };
      if (finalForm.jePlaceno && !finalForm.datumUplate) {
        finalForm.datumUplate = new Date().toISOString();
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/clanarine/${showEditModal.clanarina._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalForm)
      });

      if (response.ok) {
        const updatedItem = await response.json();
        
        // Ažuriraj state bez ponovnog fetchanja cijele liste
        setClanarine(clanarine.map(c => 
          c._id === showEditModal.clanarina._id ? updatedItem : c
        ));
        
        setShowEditModal({ show: false, clanarina: null });
        alert('Članarina ažurirana!');
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
      const response = await fetch(`${process.env.REACT_APP_API_URL}/clanarine/${showDeleteModal.clanarina._id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setClanarine(clanarine.filter(c => c._id !== showDeleteModal.clanarina._id));
        setShowDeleteModal({ show: false, clanarina: null });
        alert('Obrisano!');
      }
    } catch (error) {
      console.error(error);
      alert('Greška pri brisanju.');
    }
  };

  // Pomoćna funkcija za stil statusa
  const getStatusBadgeClass = (jePlaceno) => {
    return jePlaceno ? 'status-completed' : 'status-pending'; 
    // Koristimo tvoje postojeće klase: completed (zeleno) i pending (žuto/crveno)
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <Link to="/admin" className="back-link">← Natrag na Dashboard</Link>
        <h1>Pregled Članarina</h1>
        <p>Učitavanje...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Link to="/admin" className="back-link">← Natrag na Dashboard</Link>
      
      <div className="page-header">
        <h1>Pregled svih članarina</h1>
      </div>

      {/* FILTERI */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Status plaćanja:</label>
          <select 
            value={filter.status} 
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="filter-select"
          >
            <option value="all">Svi statusi</option>
            <option value="paid">Plaćeno</option>
            <option value="unpaid">Nije plaćeno</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Mjesec (pretraga):</label>
          <input 
            type="text" 
            placeholder="npr. 10/2023"
            value={filter.mjesec}
            onChange={(e) => setFilter({ ...filter, mjesec: e.target.value })}
            className="filter-input" // Dodaj malo CSS-a za ovo ako nemaš
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
              <th>Ime i Prezime</th>
              <th>Mjesec</th>
              <th>Iznos (€)</th>
              <th>Status</th>
              <th>Datum uplate</th>
              <th>Akcije</th>
            </tr>
          </thead>
          <tbody>
            {filteredClanarine.map((item) => (
              <tr key={item._id}>
                <td>
                  {/* Ovdje pazi kako ti se zove polje s imenom korisnika */}
                  <strong>{item.imePrezime || item.user?.name || "Nepoznato"}</strong>
                </td>
                <td>{item.mjesec}</td>
                <td>{item.iznos} €</td>
                <td>
                  <span className={`status-badge ${getStatusBadgeClass(item.jePlaceno)}`}>
                    {item.jePlaceno ? "PLAĆENO" : "NIJE PLAĆENO"}
                  </span>
                </td>
                <td>
                  {item.jePlaceno && item.datumUplate 
                    ? new Date(item.datumUplate).toLocaleDateString('hr-HR') 
                    : '-'}
                </td>
                <td className="table-actions">
                  <button
                    onClick={() => handleEditClick(item)}
                    className="btn-table btn-approve"
                    title="Uredi"
                  >
                    Uredi
                  </button>
                  <button
                    onClick={() => setShowDeleteModal({ show: true, clanarina: item })}
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

        {filteredClanarine.length === 0 && (
          <div className="empty-state">
            <p>Nema zapisa o članarinama za odabrani filter.</p>
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {showEditModal.show && (
        <div className="modal-overlay" onClick={() => setShowEditModal({ show: false, clanarina: null })}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Uredi članarinu</h3>
            <form onSubmit={handleUpdateClanarina}>
              
              <div className="form-group">
                <label>Mjesec</label>
                <input
                  type="text"
                  value={editForm.mjesec}
                  onChange={(e) => setEditForm({ ...editForm, mjesec: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Iznos (€)</label>
                <input
                  type="number"
                  value={editForm.iznos}
                  onChange={(e) => setEditForm({ ...editForm, iznos: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <label style={{ margin: 0 }}>Je li plaćeno?</label>
                <input
                  type="checkbox"
                  checked={editForm.jePlaceno}
                  onChange={(e) => setEditForm({ ...editForm, jePlaceno: e.target.checked })}
                  style={{ width: '20px', height: '20px' }}
                />
              </div>

              {editForm.jePlaceno && (
                <div className="form-group">
                  <label>Datum uplate</label>
                  <input
                    type="date"
                    value={editForm.datumUplate}
                    onChange={(e) => setEditForm({ ...editForm, datumUplate: e.target.value })}
                  />
                </div>
              )}

              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal({ show: false, clanarina: null })} 
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

      {/* DELETE MODAL */}
      {showDeleteModal.show && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal({ show: false, clanarina: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Potvrda brisanja</h3>
            <p>Jeste li sigurni da želite obrisati članarinu za:</p>
            <p className="modal-user-name">
              <strong>{showDeleteModal.clanarina.imePrezime || "Korisnika"}</strong><br/>
              Mjesec: {showDeleteModal.clanarina.mjesec}
            </p>
            <div className="modal-actions">
              <button
                onClick={() => setShowDeleteModal({ show: false, clanarina: null })}
                className="btn-cancel"
              >
                Odustani
              </button>
              <button onClick={handleDeleteClanarina} className="btn-confirm-delete">
                Da, obriši
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Članarine;