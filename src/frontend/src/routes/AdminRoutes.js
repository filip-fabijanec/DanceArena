import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from '../components/Navbar';

// Importaj sve stranice za organizatora
import Dashboard from '../pages/AdminPages/AdminDashboard';
import PregledČlanarine from '../pages/AdminPages/članarine';
import PregledNatjecanja from '../pages/AdminPages/competition-pregled';
import PregledUser from '../pages/AdminPages/user-admin';

function AdminRoutes() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/članarine" element={<PregledČlanarine />} />
        <Route path="/natjecanja" element={<PregledNatjecanja />} />
        <Route path="/korisnici" element={<PregledUser />} />
      </Routes>
    </div>
  );
}

export default AdminRoutes;