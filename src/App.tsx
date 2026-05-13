import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PSCList from './pages/PSCList';
import PSCProfile from './pages/PSCProfile';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import PSCAdmissionDetails from './pages/PSCAdmissionDetails.tsx';
import PSCAdd from './pages/PSCAdd';
import PSCInterview from './pages/PSCInterview';
import ConfiguracionOpciones from './pages/ConfiguracionOpciones';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Rutas protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/psc" element={<PSCList />} />
          <Route path="/psc/nuevo" element={<PSCAdd />} />
          <Route path="/psc/edit/:id" element={<PSCAdd />} />
          <Route path="/psc/:id" element={<PSCProfile />} />
          <Route path="/psc/:id/entrevista" element={<PSCInterview />} />
          <Route path="/psc/:id/ingreso/:ingresoId/entrevista" element={<PSCInterview />} />
          <Route path="/psc/:id/ingreso/:ingresoId" element={<PSCAdmissionDetails />} />
          <Route path="/configuracion" element={<ConfiguracionOpciones />} />
          {/* Aquí irán más rutas protegidas como /psc, /atenciones, etc. */}
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<div>404 - No encontrado</div>} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
