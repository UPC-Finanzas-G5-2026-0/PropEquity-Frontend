import api from './api';

// Obtener perfil del cliente autenticado
export const getMyProfile = async () => {
  try {
    const response = await api.get('/clients/me');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: 'Error al cargar el perfil' };
  }
};

// Buscar cliente por DNI (Solo Staff)
export const getClientByDNI = async (dni) => {
  try {
    const response = await api.get(`/clients/${dni}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: 'Cliente no encontrado' };
  }
};

// Actualizar perfil de cliente
export const updateProfile = async (id, updateData) => {
  try {
    const response = await api.put(`/clients/update/${id}`, updateData);
    return { success: true, data: response.data };
  } catch (error) {
    const errorDetail = error.response?.data?.detail;
    let errorMessage = 'Error al actualizar el perfil';

    if (typeof errorDetail === 'string') {
      errorMessage = errorDetail;
    } else if (Array.isArray(errorDetail)) {
      errorMessage = errorDetail.map(e => e.msg).join(', ');
    }

    return { success: false, error: errorMessage };
  }
};

// Mantener compatibilidad con nombres anteriores
export const getClients = async () => {
  try {
    const response = await api.get('/clients/');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: 'Error al cargar clientes' };
  }
};

export const getClientByCode = getClientByDNI;
export const updateClient = updateProfile;
