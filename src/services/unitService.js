import api from './api';

export const createUnit = async (unitData) => {
    const formData = new FormData();

    Object.keys(unitData).forEach(key => {
        if (key === 'foto') return;
        const val = unitData[key];
        if (val === null || val === undefined) return;

        if (typeof val === 'boolean') {
            formData.append(key, val ? '1' : '0');
        } else {
            formData.append(key, val);
        }
    });

    if (unitData.foto instanceof File) {
        formData.append('foto', unitData.foto);
    }

    const response = await api.post('/units/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const getUnits = async () => {
    const response = await api.get('/units/');
    return response.data;
};

export const updateUnit = async (codigo_unidad, unitData) => {
    const formData = new FormData();

    Object.keys(unitData).forEach(key => {
        if (key === 'foto') return;
        const val = unitData[key];

        if (key === 'remove_foto') {
            // Solo enviar si es true
            if (val) formData.append('remove_foto', '1');
            return;
        }

        if (val === null || val === undefined || val === '') return;

        if (typeof val === 'boolean') {
            formData.append(key, val ? '1' : '0');
        } else {
            formData.append(key, val);
        }
    });

    if (unitData.foto instanceof File) {
        formData.append('foto', unitData.foto);
    }

    const response = await api.put(`/units/${codigo_unidad}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const deleteUnit = async (codigo_unidad) => {
    const response = await api.delete(`/units/${codigo_unidad}`);
    return response.data;
};
