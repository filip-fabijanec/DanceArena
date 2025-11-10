import React from 'react';
import { Routes, Route } from 'react-router-dom';

import VoditeljDashboard from '../pages/VoditeljPages/VoditeljDashboard';
import PrijaviNastup from '../pages/VoditeljPages/PrijaviNastup';

function VoditeljRoutes() {
  return (
    <Routes>
      <Route path="/" element={<VoditeljDashboard />} />
      <Route path="/prijavi-nastup/:competitionId" element={<PrijaviNastup />} />
    </Routes>
  );
}

export default VoditeljRoutes;