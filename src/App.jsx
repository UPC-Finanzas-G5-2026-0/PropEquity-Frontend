import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Importación de Páginas
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PropertyRegistrationPage from './pages/PropertyRegistrationPage';
import SimulationPage from './pages/SimulationPage';
import ClientDashboard from './pages/ClientDashboard';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import AdvisorDashboard from "./pages/AdvisorDashboard";
import AdminDashboard from "./pages/AdminDashboard"; // 🚨 NUEVO: Importamos el dashboard del admin

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

          {/* 👑 Rutas Privadas - Administrador */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/propiedades" element={<PropertyRegistrationPage />} />
          <Route path="/property/register" element={<PropertyRegistrationPage />} />

          {/* 💼 Rutas Privadas - Asesor */}
          <Route path="/asesor/dashboard" element={<AdvisorDashboard />} />
          <Route path="/clientes" element={<AdvisorDashboard />} />

          {/* 👤 Rutas Privadas - Cliente */}
          <Route path="/cliente/dashboard" element={<ClientDashboard />} />
          <Route path="/dashboard/client" element={<ClientDashboard />} />

          {/* 🔄 Rutas Compartidas */}
          <Route path="/simulation" element={<SimulationPage />} />
          <Route path="/simulation/:id" element={<SimulationPage />} />
          <Route path="/simulador" element={<SimulationPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/configuracion" element={<SettingsPage />} />

          {/* Ruta fallback para el dashboard genérico */}
          <Route path="/dashboard" element={<AdvisorDashboard />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
