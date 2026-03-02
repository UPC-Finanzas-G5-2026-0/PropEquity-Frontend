// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import { login as loginService, register as registerService } from '../services/authService';
import { jwtDecode } from "jwt-decode"; // Asegúrate de instalarlo: npm install jwt-decode

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    } else if (token) {
      // Fallback para sesiones viejas (opcional)
      setUser({ token });
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await loginService(email, password);
    console.log("[DEBUG] Login Response Body:", data); // Ver qué devuelve el backend realmente
    if (data.access_token) {

      const userData = {
        token: data.access_token,
        role: data.role, // 'Administrador', 'Asesor', 'Cliente'
        // codigo_usuario es el campo que devuelve el backend en login/signup
        id: data.codigo_usuario || data.user_id || data.id,
        codigo_usuario: data.codigo_usuario || data.user_id || data.id,
        names: `${data.nombres} ${data.apellidos}`,
        nombres: data.nombres,
        apellidos: data.apellidos,
        email: email,
        dni: data.dni,
        telefono: data.telefono,
        ingreso_mensual: data.ingreso_mensual,
        ingreso_conyuge: data.ingreso_conyuge || 0,
        codigo_tipo_ingreso: data.codigo_tipo_ingreso || 1,
        meses_ahorro: data.meses_ahorro || 0,
        es_propietario_vivienda: data.es_propietario_vivienda,
        ha_recibido_apoyo: data.ha_recibido_apoyo || false
      };
      localStorage.setItem('token', userData.token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }
    return data;
  };

  const register = async (userData) => {
    return await registerService(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Función para actualizar el usuario manualmente (ej: después de editar perfil)
  const updateUser = (newUserData) => {
    const updatedUser = { ...user, ...newUserData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser)); // Persistir cambio
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, updateUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
