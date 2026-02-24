import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import MainLayout from './layouts/MainLayout'

// Páginas
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Miembros from './pages/Miembros'

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

        {/* Placeholders para el resto */}
        <Route path="/asistencias" element={
          <PrivateRoute>
            <MainLayout>
              <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-slate-800">Módulo de Asistencias</h2>
                <p className="text-slate-500">Próximamente disponible.</p>
              </div>
            </MainLayout>
          </PrivateRoute>
        } />

        <Route path="/inventario" element={
          <PrivateRoute>
            <MainLayout>
              <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-slate-800">Módulo de Inventario</h2>
                <p className="text-slate-500">Próximamente disponible.</p>
              </div>
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
