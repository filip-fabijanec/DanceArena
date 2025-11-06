import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from '../components/Navbar';

// Importaj sve stranice za organizatora
import Dashboard from '../pages/OrgPages/OrganizatorDashboard';
import KreirajNatjecanje from '../pages/OrgPages/kreiraj_natjecanje';
import MojaNatjecanja from '../pages/OrgPages/moja_natjecanja_org';
import UpravljanjePrijavama from '../pages/OrgPages/prijave_org';
import OdabirSudaca from '../pages/OrgPages/odabir_sudaca';

function OrganizatorRoutes() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/kreiranje-natjecanja" element={<KreirajNatjecanje />} />
        <Route path="/natjecanja" element={<MojaNatjecanja />} />
        <Route path="/prijave" element={<UpravljanjePrijavama />} />
        <Route path="/suci" element={<OdabirSudaca />} />
      </Routes>
    </div>
  );
}

export default OrganizatorRoutes;