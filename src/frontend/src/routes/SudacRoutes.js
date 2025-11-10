import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

// Importamo sve stranice za organizatora
import MojaNatjecanja from '../pages/OrgPages/moja_natjecanja_org';
import KreirajNatjecanje from '../pages/OrgPages/kreiraj_natjecanje';
import UpravljanjePrijavama from '../pages/OrgPages/prijave_org';
import OdabirSudaca from '../pages/OrgPages/odabir_sudaca';

function OrganizatorRoutes() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/organizator/natjecanja" replace />} />
        <Route path="/natjecanja" element={<MojaNatjecanja />} />
        <Route path="/kreiranje-natjecanja" element={<KreirajNatjecanje />} />
        <Route path="/prijave" element={<UpravljanjePrijavama />} />
        <Route path="/suci" element={<OdabirSudaca />} />
      </Routes>
    </div>
  );
}

export default OrganizatorRoutes;