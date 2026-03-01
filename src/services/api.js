import axios from 'axios';

const API_URL = 'https://propequity-backend.onrender.com/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Inyecta el token en todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: Si el servidor responde 401, limpiar sesión y redirigir al login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_email');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
