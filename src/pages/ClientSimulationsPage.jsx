import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { exportToExcel, exportToPDF } from '../services/simulationService';
import { useAuth } from '../context/AuthContext';

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const ClientSimulationsPage = () => {
  const { id } = useParams(); // Obtenemos el ID del cliente desde la URL
  const navigate = useNavigate();
  const { user } = useAuth();

  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSimulations = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        // Hacemos el llamado directo al backend para traer las simulaciones de este cliente específico
        const API_URL = process.env.REACT_APP_API_URL || 'https://propequity-backend.onrender.com';
        const response = await fetch(`${API_URL}/api/v1/simulator/client/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSimulations(data);
        } else {
          setError('No se pudieron cargar las simulaciones.');
        }
      } catch (err) {
        setError('Error de conexión con el servidor.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchSimulations();
  }, [id]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
  };

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen font-['Inter',_sans-serif]">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <header className="mb-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-brand-orange font-bold text-xs uppercase tracking-widest mb-6 transition-colors"
          >
            <ArrowBackIcon fontSize="small" /> Volver a mi cartera
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Mis Simulaciones
            </h1>
            <p className="text-gray-500 text-sm font-medium mt-1">
              Historial de propuestas generadas para el Cliente ID: {id}
            </p>
          </div>
        </header>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(n => <div key={n} className="h-24 bg-white rounded-2xl border border-gray-100 shadow-sm"></div>)}
          </div>
        ) : error ? (
          <div className="bg-red-50 p-6 rounded-2xl text-red-600 font-bold border border-red-100">
            {error}
          </div>
        ) : simulations.length === 0 ? (
          <div className="bg-white p-12 rounded-[2.5rem] border border-gray-100 shadow-sm text-center">
            <ReceiptLongIcon sx={{ fontSize: 60 }} className="text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No hay simulaciones registradas</h3>
            <p className="text-gray-500">Este cliente aún no tiene ninguna propuesta hipotecaria.</p>
            <button
              onClick={() => navigate('/simulador')}
              className="mt-6 bg-brand-blue text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors"
            >
              Ir al Simulador
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {simulations.map((sim) => (
              <div key={sim.codigo_simulacion} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-shadow flex flex-col">
                <div className="flex justify-between items-start mb-5 border-b border-gray-50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center">
                      <AccountBalanceIcon fontSize="small" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Simulación #{sim.codigo_simulacion}</p>
                      <p className="text-sm font-bold text-gray-900">{formatDate ? formatDate(sim.fecha_simulacion) : sim.fecha_simulacion}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-gray-50 text-gray-500 border border-gray-100 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    {sim.ifi_seleccionada || 'Genérico'}
                  </span>
                </div>

                <div className="mb-5">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-brand-orange"></span> Propiedad / Ubicación
                  </p>
                  <h4 className="text-base font-black text-gray-900 leading-tight truncate">
                    {sim.distrito_unidad || sim.unidad_rel?.distrito_unidad || 'Sin distrito'}
                  </h4>
                  <p className="text-[11px] font-bold text-gray-400 leading-tight mt-1 truncate">
                    {sim.direccion_unidad || sim.unidad_rel?.direccion_unidad || 'Sin dirección registrada'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 flex-1">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Monto Financiado</p>
                    <p className="text-base font-black text-gray-900">{formatCurrency(sim.resumen?.monto_financiar || 0)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Bono Aplicado</p>
                    <p className="text-base font-black text-brand-orange">{formatCurrency(sim.bono_bbp || 0)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Tasa (TEA)</p>
                    <p className="text-base font-black text-gray-900">{sim.tasa_anual || sim.resumen?.tasa_efectiva_anual}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Plazo</p>
                    <p className="text-base font-black text-gray-900">{sim.plazo_meses} Meses</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cuota Estimada</p>
                    <p className="text-xl font-black text-brand-blue">{formatCurrency(sim.resumen?.cuota_base || 0)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportToExcel(sim.codigo_simulacion)}
                      className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                      title="Descargar Excel"
                    >
                      <FileDownloadIcon fontSize="small" />
                    </button>
                    <button
                      onClick={() => exportToPDF(sim.codigo_simulacion)}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      title="Descargar PDF"
                    >
                      <FileDownloadIcon fontSize="small" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientSimulationsPage;
