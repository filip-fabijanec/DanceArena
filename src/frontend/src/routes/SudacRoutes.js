import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

import SudacDashboard from '../pages/SudacPages/SudacDashboard';
import SudacFolder from '../pages/SudacPages/SudacFolder';
import OcjenjivanjePage from '../pages/SudacPages/OcjenjivanjePage';
import OcjenjivanjeKategorija from '../pages/SudacPages/OcjenjivanjeKategorija'; 


const SudacRoutes = () => {
  return (
    <div>
      <Routes>
        <Navbar />
        <Route path="/" element={<SudacDashboard />} />
        <Route path="/moja-natjecanja" element={<SudacFolder />} />
        <Route path="/ocjenjivanje/:competitionId" element={<OcjenjivanjeKategorija />} />
        <Route path="/ocjenjeno" element={<OcjenjivanjePage />} />
      </Routes>
    </div>
  );
};

export default SudacRoutes;