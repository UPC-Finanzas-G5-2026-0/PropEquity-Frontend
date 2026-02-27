import api from './api';

// Función Detective para procesar errores 422 de FastAPI
const extractFastAPIError = (error, defaultMessage = 'Error en la operación') => {
    const errorDetail = error.response?.data?.detail;

    // Si FastAPI devuelve un array de errores (Error 422 típico de validación)
    if (Array.isArray(errorDetail)) {
        return "El servidor rechazó estos campos: " + errorDetail.map(e => {
            // e.loc suele ser ["body", "precio_venta"]
            const fieldName = e.loc[e.loc.length - 1];
            return `'${fieldName}' -> ${e.msg}`;
        }).join(' | ');
    }
    // Si FastAPI devuelve un string simple (Tus validaciones manuales)
    else if (typeof errorDetail === 'string') {
        return errorDetail;
    }

    return defaultMessage;
};

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
        return { success: false, error: extractFastAPIError(error, 'Error al crear la unidad') };
    }
};

// Crear unidad con imagen (multipart/form-data)
export const createUnitWithImage = async (unitData, imageFile) => {
    try {
        const formData = new FormData();

        // Agregar todos los campos de texto/números
        Object.keys(unitData).forEach(key => {
            const val = unitData[key];
            if (val !== null && val !== undefined) {
                formData.append(key, val);
            }
        });

        // Agregar imagen si existe (el backend espera 'foto')
        if (imageFile) {
            formData.append('foto', imageFile);
        }

        // 🚨 SOLUCIÓN: Sobrescribimos el header global para que Axios sepa que esto es un archivo
        const response = await api.post('/units/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: extractFastAPIError(error, 'Error al crear la unidad con imagen') };
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

// Actualizar unidad (Inteligente: decide si usa JSON o FormData)
export const updateUnit = async (id, updateData) => {
    try {
        // Si hay un archivo nuevo o se ordenó borrar la foto, usamos FormData
        if (updateData.foto instanceof File || updateData.remove_foto) {
            const formData = new FormData();
            Object.keys(updateData).forEach(key => {
                const val = updateData[key];
                if (val !== null && val !== undefined && key !== 'foto') {
                    formData.append(key, val);
                }
            });

            if (updateData.foto instanceof File) {
                formData.append('foto', updateData.foto);
            }

            // 🚨 SOLUCIÓN: Sobrescribimos el header también en el PUT
            const response = await api.put(`/units/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return { success: true, data: response.data };
        } else {
            // Si no hay cambios en la foto, usamos el endpoint JSON rápido
            const { foto, remove_foto, ...jsonPayload } = updateData;
            const response = await api.put(`/units/${id}/json`, jsonPayload);
            return { success: true, data: response.data };
        }
    } catch (error) {
        return { success: false, error: extractFastAPIError(error, 'Error al actualizar la unidad') };
    }
};

// Eliminar unidad (Solo Administrador)
export const deleteUnit = async (id) => {
    try {
        const response = await api.delete(`/units/${id}`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: extractFastAPIError(error, 'Error al eliminar la unidad') };
    }
};

// Función maestra de compatibilidad (usada por tu PropertyRegistrationPage)
export const createUnit = async (unitData) => {
    if (unitData.foto instanceof File) {
        const { foto, ...rest } = unitData;
        return createUnitWithImage(rest, foto);
    }
    // Si no hay foto, extraemos la llave foto (que será null) y mandamos el resto como JSON
    const { foto, ...rest } = unitData;
    return createUnitJSON(rest);
};
