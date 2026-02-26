import api from './api';

// Listar unidades disponibles
export const getUnits = async (skip = 0, limit = 100) => {
    try {
        const response = await api.get('/units/', {
            params: { skip, limit }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: 'Error al cargar unidades' };
    }
};

// Obtener detalle de una unidad
export const getUnitDetail = async (id) => {
    try {
        const response = await api.get(`/units/${id}`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: 'Unidad no encontrada' };
    }
};

// Crear unidad con JSON (sin imagen)
export const createUnitJSON = async (unitData) => {
    try {
        const response = await api.post('/units/json', unitData);
        return { success: true, data: response.data };
    } catch (error) {
        const errorDetail = error.response?.data?.detail;
        let errorMessage = 'Error al crear la unidad';

        if (typeof errorDetail === 'string') {
            errorMessage = errorDetail;
        } else if (Array.isArray(errorDetail)) {
            errorMessage = errorDetail.map(e => e.msg).join(', ');
        }

        return { success: false, error: errorMessage };
    }
};

// Crear unidad con imagen (multipart/form-data)
export const createUnitWithImage = async (unitData, imageFile) => {
    try {
        const formData = new FormData();

        // Agregar todos los campos
        Object.keys(unitData).forEach(key => {
            const val = unitData[key];
            if (val === null || val === undefined) return;

            if (typeof val === 'boolean') {
                formData.append(key, val.toString());
            } else {
                formData.append(key, val);
            }
        });

        // Agregar imagen si existe
        if (imageFile) {
            formData.append('imagen', imageFile);
        }

        const response = await api.post('/units/form', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        const errorDetail = error.response?.data?.detail;
        let errorMessage = 'Error al crear la unidad';

        if (typeof errorDetail === 'string') {
            errorMessage = errorDetail;
        } else if (Array.isArray(errorDetail)) {
            errorMessage = errorDetail.map(e => e.msg).join(', ');
        }

        return { success: false, error: errorMessage };
    }
};

// Obtener opciones de BBP para una unidad
export const getBBPOptions = async (unitId) => {
    try {
        const response = await api.get(`/units/${unitId}/bbp-options`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: 'Error al obtener opciones de BBP' };
    }
};

// Actualizar unidad
export const updateUnit = async (id, updateData) => {
    try {
        const response = await api.put(`/units/${id}`, updateData);
        return { success: true, data: response.data };
    } catch (error) {
        const errorDetail = error.response?.data?.detail;
        let errorMessage = 'Error al actualizar la unidad';

        if (typeof errorDetail === 'string') {
            errorMessage = errorDetail;
        }

        return { success: false, error: errorMessage };
    }
};

// Eliminar unidad (Solo Administrador)
export const deleteUnit = async (id) => {
    try {
        const response = await api.delete(`/units/${id}`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: 'Error al eliminar la unidad' };
    }
};

// Función de compatibilidad para mantener código existente
export const createUnit = async (unitData) => {
    if (unitData.foto instanceof File) {
        const { foto, ...rest } = unitData;
        return createUnitWithImage(rest, foto);
    }
    return createUnitJSON(unitData);
};
