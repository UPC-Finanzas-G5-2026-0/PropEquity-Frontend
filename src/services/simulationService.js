import api from './api';

// Crear simulación
export const createSimulation = async (simulationData) => {
    try {
        const response = await api.post('/simulator/', simulationData);
        return { success: true, data: response.data };
    } catch (error) {
        const errorDetail = error.response?.data?.detail;
        let errorMessage = 'Error al crear la simulación';

        if (typeof errorDetail === 'string') {
            errorMessage = errorDetail;
        } else if (Array.isArray(errorDetail)) {
            errorMessage = errorDetail.map(e => e.msg).join(', ');
        }

        return { success: false, error: errorMessage };
    }
};

// Obtener mis simulaciones (Cliente)
export const getMySimulations = async () => {
    try {
        const response = await api.get('/simulator/me');
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: 'Error al cargar simulaciones' };
    }
};

// Obtener todas las simulaciones (Admin/Asesor)
export const getAllSimulations = async (skip = 0, limit = 100) => {
    try {
        const response = await api.get('/simulator/', {
            params: { skip, limit }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: 'Error al cargar simulaciones' };
    }
};

// Obtener detalle de simulación
export const getSimulationDetail = async (id) => {
    try {
        const response = await api.get(`/simulator/${id}`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: 'Simulación no encontrada' };
    }
};

// Exportar a Excel
export const exportToExcel = async (id) => {
    try {
        const response = await api.get(`/simulator/${id}/export/excel`, {
            responseType: 'blob'
        });

        // Crear enlace de descarga
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;

        // Obtener nombre del archivo desde headers o usar uno por defecto
        const contentDisposition = response.headers['content-disposition'];
        const filename = contentDisposition
            ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
            : `simulacion_${id}.xlsx`;

        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al exportar a Excel' };
    }
};

// Exportar a PDF
export const exportToPDF = async (id) => {
    try {
        const response = await api.get(`/simulator/${id}/export/pdf`, {
            responseType: 'blob'
        });

        // Crear enlace de descarga
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;

        // Obtener nombre del archivo desde headers o usar uno por defecto
        const contentDisposition = response.headers['content-disposition'];
        const filename = contentDisposition
            ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
            : `simulacion_${id}.pdf`;

        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al exportar a PDF' };
    }
};

// Obtener IFIs disponibles para un monto
export const getAvailableIFIs = async (montoPrestamo) => {
    try {
        const response = await api.get('/simulator/ifis-disponibles', {
            params: { monto_prestamo: montoPrestamo }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: 'Error al consultar IFIs' };
    }
};

// Mantener compatibilidad con nombres anteriores
export const runSimulation = createSimulation;
export const getSimulationById = getSimulationDetail;
