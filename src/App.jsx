// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';     // Asegúrate que estos sean .jsx también
import RegisterPage from './pages/RegisterPage'; // Asegúrate que estos sean .jsx también

// Componente temporal para probar el acceso
const Dashboard = () => (
  <div className="p-10">
    <h1 className="text-3xl font-bold text-brand-blue">Dashboard</h1>
    <p>¡Bienvenido! Has iniciado sesión correctamente.</p>
  </div>
);

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

          {/* Ruta que debería ser privada (luego le pondremos el candado) */}
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
