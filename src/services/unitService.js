import api from './api';

export const createUnit = async (unitData) => {
    const formData = new FormData();

    // Agregar campos de texto y numéricos, evitando nulos que se convierten en string "null"
    Object.keys(unitData).forEach(key => {
        if (key !== 'foto' && unitData[key] !== null && unitData[key] !== undefined) {
            formData.append(key, unitData[key]);
        }
    });

    // Agregar archivo si existe
    if (unitData.foto instanceof File) {
        formData.append('foto', unitData.foto);
    }

    const response = await api.post('/units/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const getUnits = async () => {
    const response = await api.get('/units/');
    return response.data;
};

export const updateUnit = async (codigo_unidad, unitData) => {
    const formData = new FormData();

    // Siempre usamos FormData ahora que el backend soporta Form/File en PUT
    Object.keys(unitData).forEach(key => {
        // Solo agregamos valores que no sean null/undefined
        if (unitData[key] !== null && unitData[key] !== undefined && unitData[key] !== '') {
            // Si es la foto, solo la agregamos si ES un archivo nuevo (instancia de File)
            if (key === 'foto') {
                if (unitData[key] instanceof File) {
                    formData.append('foto', unitData[key]);
                }
            } else {
                formData.append(key, unitData[key]);
            }
        }
    });

    console.log("Enviando actualización (FormData) para ID:", codigo_unidad);
    const response = await api.put(`/units/${codigo_unidad}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const deleteUnit = async (codigo_unidad) => {
    const response = await api.delete(`/units/${codigo_unidad}`);
    return response.data;
};
