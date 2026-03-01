import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext'; // 🚨 Añadimos useAuth aquí

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PropertyRegistrationPage from './pages/PropertyRegistrationPage';
import SimulationPage from './pages/SimulationPage';
import ClientDashboard from './pages/ClientDashboard';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import AdvisorDashboard from "./pages/AdvisorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import PropertyCatalogPage from "./pages/PropertyCatalog";
import ClientCatalogPage from "./pages/ClientCatalogPage";
import ClientSimulationsPage from "./pages/ClientSimulationsPage"; // 🚨 Importamos el nuevo catálogo del cliente

const CatalogRouter = () => {
  const { user } = useAuth();
  const role = (user?.rol_rel?.tipo_rol || user?.role || user?.rol || '').toLowerCase();

  // Si es asesor, mostramos la vitrina técnica. Si es cliente, la vitrina comercial.
  return role === 'asesor' ? <PropertyCatalogPage /> : <ClientCatalogPage />;
};

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

          {/*  Rutas Privadas - Administrador */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/propiedades" element={<PropertyRegistrationPage />} />
          <Route path="/property/register" element={<PropertyRegistrationPage />} />

          {/*  Rutas Privadas - Asesor */}
          <Route path="/asesor/dashboard" element={<AdvisorDashboard />} />
          <Route path="/clientes" element={<AdvisorDashboard />} />
          <Route path="/simulations/client/:id" element={<ClientSimulationsPage />} />

          {/*  Rutas Privadas - Cliente */}
          <Route path="/cliente/dashboard" element={<ClientDashboard />} />
          <Route path="/dashboard/client" element={<ClientDashboard />} />

          <Route path="/catalogo" element={<CatalogRouter />} />

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
