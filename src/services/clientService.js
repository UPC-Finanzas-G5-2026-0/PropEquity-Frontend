import api from './api';

export const getClients = async () => {
    const response = await api.get('/clients/');
    return response.data;
};

export const getClientByCode = async (code) => {
    const response = await api.get(`/clients/code/${code}`);
    return response.data;
};

export const updateClient = async (code, clientData) => {
    // Endpoint correcto proporcionado por Backend: /clients/update/{codigo_cliente}
    const response = await api.put(`/clients/update/${code}`, clientData);
    return response.data;
};
