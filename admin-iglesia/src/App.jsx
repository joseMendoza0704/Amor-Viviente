import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import MainLayout from './layouts/MainLayout'

// Páginas
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Miembros from './pages/Miembros'
import Usuarios from './pages/Usuarios'
import Programa from './pages/Programa'
import Asistencia from './pages/Asistencia'

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={
          <PrivateRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </PrivateRoute>
        } />

        <Route path="/miembros" element={
          <PrivateRoute>
            <MainLayout>
              <Miembros />
            </MainLayout>
          </PrivateRoute>
        } />

        <Route path="/usuarios" element={
          <PrivateRoute>
            <MainLayout>
              <Usuarios />
            </MainLayout>
          </PrivateRoute>
        } />

        <Route path="/asistencias" element={
          <PrivateRoute>
            <MainLayout>
              <Asistencia />
            </MainLayout>
          </PrivateRoute>
        } />

        <Route path="/programa" element={
          <PrivateRoute>
            <MainLayout>
              <Programa />
            </MainLayout>
          </PrivateRoute>
        } />


        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App
