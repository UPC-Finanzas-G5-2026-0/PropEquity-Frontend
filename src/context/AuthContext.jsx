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
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Verificamos si el token ha expirado
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          setUser(null);
        } else {
          setUser(decoded);
        }
      } catch (error) {
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await loginService(email, password);
    if (data.access_token) {
      const decoded = jwtDecode(data.access_token);
      setUser(decoded);
    }
    return data;
  };

  const register = async (userData) => {
    return await registerService(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
