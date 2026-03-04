import api from './api';

// Crear simulación (save=false: solo preview, save=true: persiste en BD)
export const createSimulation = async (simulationData, save = false) => {
    try {
        const response = await api.post(`/simulator/?save=${save}`, simulationData);
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

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
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
        // Intentar leer el detalle del error aunque la respuesta sea blob
        let msg = 'Error al exportar a Excel';
        try {
            const text = await error.response?.data?.text();
            const parsed = JSON.parse(text);
            msg = parsed?.detail || msg;
        } catch { }
        return { success: false, error: msg };
    }
};

// Exportar a PDF
export const exportToPDF = async (id) => {
    try {
        const response = await api.get(`/simulator/${id}/export/pdf`, {
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
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
        let msg = 'Error al exportar a PDF';
        try {
            const text = await error.response?.data?.text();
            const parsed = JSON.parse(text);
            msg = parsed?.detail || msg;
        } catch { }
        return { success: false, error: msg };
    }
};

// Obtener reglas de las IFIs (tasas, seguros, etc)
export const getIFIRules = async () => {
    try {
        const response = await api.get('/simulator/ifi-rules');
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: 'Error al cargar reglas de bancos' };
    }
};

// Obtener IFIs disponibles para un monto
export const getAvailableIFIs = async (monto, tieneDeudor = false) => {
    try {
        const response = await api.get('/simulator/ifis-disponibles', {
            params: {
                monto: monto,
                tiene_deudor_solidario: tieneDeudor
            }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: 'Error al consultar IFIs' };
    }
};

// Mantener compatibilidad con nombres anteriores
export const runSimulation = createSimulation;
export const getSimulationById = getSimulationDetail;
