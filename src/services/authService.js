import api from './api'; // Importamos la instancia configurada en el archivo de arriba

const roleMapping = {
  'administrador': 'Administrador',
  'asesor': 'Asesor',
  'cliente': 'Cliente'
};

export const login = async (email, password) => {
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);

  // 2. Enviar con la cabecera explícita
  const response = await api.post('/auth/auth/login', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  if (response.data.access_token) {
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('user_role', response.data.rol_usuario);
    localStorage.setItem('user_id', response.data.codigo_usuario);
    localStorage.setItem('user_email', response.data.email);
  }

  return response.data;
};

export const register = async (userData) => {
  // Mapeamos los campos del frontend a los que espera el backend
  const backendUserData = {
    email: userData.email,
    password: userData.password,
    nombre: userData.first_name,
    apellido: userData.last_name,
    rol: userData.role
  };
  const response = await api.post('/auth/auth/signup', backendUserData);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_role');
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_email');
  window.location.href = '/login';
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};

export const getUserRole = () => {
  return localStorage.getItem('user_role');
};
