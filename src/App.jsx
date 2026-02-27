import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PropertyRegistrationPage from './pages/PropertyRegistrationPage';
import SimulationPage from './pages/SimulationPage';
import ClientDashboard from './pages/ClientDashboard';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import AdvisorDashboard from "./pages/AdvisorDashboard";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Redirección automática a Login al entrar a la raíz */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Rutas Públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Rutas Privadas - Cliente */}
          <Route path="/cliente/dashboard" element={<ClientDashboard />} />
          <Route path="/dashboard/client" element={<ClientDashboard />} />
          <Route path="/simulation" element={<SimulationPage />} />
          <Route path="/simulation/:id" element={<SimulationPage />} />
          <Route path="/simulador" element={<SimulationPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/configuracion" element={<SettingsPage />} />

          {/* Rutas Privadas - Asesor / Admin */}
          <Route path="/asesor/dashboard" element={<AdvisorDashboard />} />
          <Route path="/dashboard" element={<PropertyRegistrationPage />} />
          <Route path="/propiedades" element={<PropertyRegistrationPage />} />
          <Route path="/property/register" element={<PropertyRegistrationPage />} />
          <Route path="/clientes" element={<PropertyRegistrationPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
