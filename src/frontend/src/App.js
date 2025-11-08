import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';

// Importamo Routes komponente za svaki role
import OrganizatorRoutes from './routes/OrganizatorRoutes';
import VoditeljDashboard from './pages/VoditeljPages/VoditeljDashboard';
import SudacDashboard from './pages/SudacPages/SudacDashboard';
import AdminRoutes from './routes/AdminRoutes';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Javne rute */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />

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
                <VoditeljDashboard />
              </ProtectedRoute>
            }
          />

          {/* Sudac */}
          <Route
            path="/sudac"
            element={
              <ProtectedRoute allowedRoles={['sudac']}>
                <SudacDashboard />
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