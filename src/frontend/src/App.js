import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import Login from './components/Login';
import Registracija from './components/Registracija';
import ProtectedRoute from './components/ProtectedRoute';

// Importamo Routes komponente za svaki role
import OrganizatorRoutes from './routes/OrganizatorRoutes';
import VoditeljRoutes from './routes/VoditeljRoutes';
import SudacDashboard from './pages/SudacPages/SudacDashboard';
import AdminRoutes from './routes/AdminRoutes';
import SudacRoutes from './routes/SudacRoutes';


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Javne rute */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registracija" element={<Registracija />} />

          {/* Organizator - sve rute pod /organizator/* */}
          <Route
            path="/organizator/*"
            element={
              <ProtectedRoute allowedRoles={['organizator']}>
                <OrganizatorRoutes />
              </ProtectedRoute>
            }
          />

          {/* Voditelj */}
          <Route
            path="/voditelj/*"
            element={
              <ProtectedRoute allowedRoles={['voditeljKluba']}>
                <VoditeljRoutes />
              </ProtectedRoute>
            }
          />

          {/* Sudac */}
          <Route
            path="/sudac/*"
            element={
              <ProtectedRoute allowedRoles={['sudac']}>
                <SudacRoutes />
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminRoutes />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;