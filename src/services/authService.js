import api from './api'; // Importamos la instancia configurada en el archivo de arriba

export const login = async (email, password) => {
  // 1. Crear los datos como formulario web estándar (URLSearchParams)
  // Esto es OBLIGATORIO para que FastAPI OAuth2 lo acepte
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);

  // 2. Enviar con la cabecera explícita
  const response = await api.post('/auth/login', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  if (response.data.access_token) {
    localStorage.setItem('token', response.data.access_token);
  }
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/auth/signup', userData);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
};
