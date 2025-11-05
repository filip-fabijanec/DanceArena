import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import OrganizatorDashboard from './pages/OrganizatorDashboard';
import VoditeljDashboard from './pages/VoditeljDashboard';
import SudacDashboard from './pages/SudacDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CreateUser from './CreateUser';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Login ruta - javna */}
          <Route path="/login" element={<Login />} />
          
          {/* Test ruta za kreiranje korisnika - možeš ostaviti ili maknuti */}
          <Route path="/create-user" element={<CreateUser />} />

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

          {/* Redirect sa početne stranice na login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* 404 - Stranica ne postoji */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;