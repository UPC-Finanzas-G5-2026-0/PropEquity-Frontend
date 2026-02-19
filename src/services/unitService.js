import api from './api';

export const createUnit = async (unitData) => {
    const formData = new FormData();

    // Agregar campos de texto y numéricos
    Object.keys(unitData).forEach(key => {
        if (key !== 'foto') {
            formData.append(key, unitData[key]);
        }
    });

    // Agregar archivo si existe
    if (unitData.foto) {
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
