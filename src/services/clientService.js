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

// Crear un nuevo cliente (Alta por el Asesor)
export const createClient = async (clientData) => {
    try {
        const response = await api.post('/clients/', clientData);
        return { success: true, data: response.data };
    } catch (error) {
        const errorDetail = error.response?.data?.detail;
        let errorMessage = 'Error al registrar el cliente';

        if (typeof errorDetail === 'string') {
            errorMessage = errorDetail;
        } else if (Array.isArray(errorDetail)) {
            errorMessage = errorDetail.map(e => e.msg).join(', ');
        }

        return { success: false, error: errorMessage };
    }
};

// Buscar cliente por DNI (Solo Staff o mismo cliente)
export const getClientByDNI = async (dni) => {
    try {
        const response = await api.get(`/clients/${dni}`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: 'Cliente no encontrado por DNI' };
    }
};

// Buscar cliente por Código/ID (Solo Staff o mismo cliente)
export const getClientByCode = async (codigo) => {
    try {
        const response = await api.get(`/clients/code/${codigo}`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: 'Cliente no encontrado por código' };
    }
};

// Actualizar perfil de cliente (Edición)
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

// Listar todos los clientes
export const getClients = async () => {
    try {
        const response = await api.get('/clients/');
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: 'Error al cargar clientes' };
    }
};

// Mantener compatibilidad con nombres de importación en otros componentes
export const updateClient = updateProfile;
