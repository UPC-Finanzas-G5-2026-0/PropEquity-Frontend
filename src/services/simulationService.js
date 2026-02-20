import api from './api';

export const runSimulation = async (simulationData) => {
    const response = await api.post('/simulator/', simulationData);
    return response.data;
};

export const getSimulationsByClient = async (codigo_cliente) => {
    const response = await api.get(`/simulator/client/${codigo_cliente}`);
    return response.data;
};

export const getSimulationById = async (codigo_simulacion) => {
    const response = await api.get(`/simulator/${codigo_simulacion}`);
    return response.data;
};

export const exportSimulationExcel = (codigo_simulacion) => {
    window.open(`${api.defaults.baseURL}/simulator/${codigo_simulacion}/export/excel`, '_blank');
};

export const exportSimulationPdf = (codigo_simulacion) => {
    window.open(`${api.defaults.baseURL}/simulator/${codigo_simulacion}/export/pdf`, '_blank');
};
