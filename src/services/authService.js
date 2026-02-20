import api from './api'; // Importamos la instancia configurada en el archivo de arriba

const roleMapping = {
  'administrador': 'Administrador',
  'asesor': 'Asesor',
  'cliente': 'Cliente'
};

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

  return response.data;
};

export const register = async (userData) => {
  const backendUserData = {
    email: userData.email,
    nombres: userData.first_name,
    apellidos: userData.last_name,
    password: userData.password,
    rol_usuario: roleMapping[userData.role] || 'Cliente',
    dni: userData.dni,
    telefono: userData.telefono || null,
  };

  // Solo agregar ingreso_mensual si es Cliente
  if (userData.role === 'cliente') {
    backendUserData.ingreso_mensual = parseFloat(userData.ingreso_mensual);
  }

  const response = await api.post('/auth/signup', backendUserData);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
};
