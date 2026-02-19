// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PropertyRegistrationPage from './pages/PropertyRegistrationPage';

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

          {/* Rutas Privadas */}
          <Route path="/dashboard" element={<PropertyRegistrationPage />} />
          <Route path="/propiedades" element={<PropertyRegistrationPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
