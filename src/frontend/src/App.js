import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import OrganizatorDashboard from './pages/OrganizatorDashboard';
import VoditeljDashboard from './pages/VoditeljDashboard';
import SudacDashboard from './pages/SudacDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Javne rute */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />

          {/* Zaštićene rute po ulogama */}
          <Route
            path="/organizator"
            element={
              <ProtectedRoute allowedRoles={['organizator']}>
                <OrganizatorDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/voditelj"
            element={
              <ProtectedRoute allowedRoles={['voditeljKluba']}>
                <VoditeljDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/sudac"
            element={
              <ProtectedRoute allowedRoles={['sudac']}>
                <SudacDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
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