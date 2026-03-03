import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { exportToExcel, exportToPDF } from '../services/simulationService';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PaymentsIcon from '@mui/icons-material/Payments';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import api from '../services/api';

const SimulationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSimulation = async () => {
      try {
        const response = await api.get(`/simulator/${id}`);
        setResult(response.data);
      } catch (err) {
        console.error("Error fetching simulation:", err);
        setError(err.response?.data?.detail || 'No se pudo cargar la información de esta simulación.');
      } finally {
        setLoading(false);
      }
    };
    fetchSimulation();
  }, [id]);

  if (loading) return (
    <div className="flex bg-[#F8FAFC] min-h-screen font-['Inter',_sans-serif]">
      <Sidebar />
      <main className="flex-1 p-10 flex items-center justify-center">
        <div className="animate-pulse text-brand-blue font-black tracking-widest uppercase">Cargando detalles...</div>
      </main>
    </div>
  );

  if (error || !result) return (
    <div className="flex bg-[#F8FAFC] min-h-screen font-['Inter',_sans-serif]">
      <Sidebar />
      <main className="flex-1 p-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-brand-orange font-bold text-xs uppercase tracking-widest mb-6 transition-colors">
          <ArrowBackIcon fontSize="small" /> Volver
        </button>
        <div className="bg-red-50 p-6 rounded-2xl text-red-600 font-bold border border-red-100">{error || "Simulación no encontrada"}</div>
      </main>
    </div>
  );

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen font-['Inter',_sans-serif]">
      <Sidebar />
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-brand-orange font-bold text-xs uppercase tracking-widest mb-6 transition-colors">
            <ArrowBackIcon fontSize="small" /> Volver a Mis Simulaciones
          </button>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Detalle de Simulación #{result.codigo_simulacion}</h1>
            <div className="flex items-center gap-2 mt-2 bg-brand-blue/5 px-4 py-2 rounded-xl border border-brand-blue/10 w-fit">
              <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest">
                {result.distrito_unidad || result.unidad_rel?.distrito_unidad || 'Distrito'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-blue/20"></span>
              <span className="text-sm font-bold text-gray-700 italic">
                {result.direccion_unidad || result.unidad_rel?.direccion_unidad || 'Sin dirección registrada'}
              </span>
            </div>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-4">
              Generada el {new Date(result.fecha_simulacion).toLocaleDateString('es-PE')} • {result.ifi_seleccionada || 'Cálculo Genérico'}
            </p>
          </div>
        </header>

        {/* Resumen Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Monto a Financiar', value: `S/ ${parseFloat(result.resumen?.monto_financiar || 0).toLocaleString()}`, icon: <PaymentsIcon sx={{ fontSize: 20 }} /> },
            { label: 'Plazo', value: `${result.plazo_meses} Meses`, icon: <CalendarMonthIcon sx={{ fontSize: 20 }} /> },
            { label: 'TCEA Estimada', value: `${parseFloat(result.resumen?.tcea || 0).toFixed(2)}%`, icon: <QueryStatsIcon sx={{ fontSize: 20 }} /> },
            { label: 'Cuota Total Aprox.', value: `S/ ${parseFloat(result.detalles?.[1]?.cuota_total || result.detalles?.[0]?.cuota_total || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, icon: <ShowChartIcon sx={{ fontSize: 20 }} /> }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-brand-blue flex items-center justify-center">{stat.icon}</div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1.5">{stat.label}</p>
                <p className="text-xl font-black text-gray-900 leading-none">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabla de Cronograma */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Cronograma de Pagos</h3>
            <div className="flex gap-3">
              <button onClick={() => exportToExcel(result.codigo_simulacion)} className="px-5 py-2.5 bg-green-50 text-green-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-100 transition-colors">Excel</button>
              <button onClick={() => exportToPDF(result.codigo_simulacion)} className="px-5 py-2.5 bg-red-50 text-red-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-colors">PDF</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="px-6 py-4 border-b border-gray-100">N° Cuota</th>
                  <th className="px-6 py-4 border-b border-gray-100 text-center">Vencimiento</th>
                  <th className="px-6 py-4 border-b border-gray-100 text-right">Saldo Inicial</th>
                  <th className="px-6 py-4 border-b border-gray-100 text-right">Amortización</th>
                  <th className="px-6 py-4 border-b border-gray-100 text-right">Interés</th>
                  <th className="px-6 py-4 border-b border-gray-100 text-right bg-brand-blue/5 text-brand-blue">Total a Pagar</th>
                  <th className="px-6 py-4 border-b border-gray-100 text-right">Saldo Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm font-bold text-gray-700">
                {result.detalles?.map((cuota) => (
                  <tr key={cuota.numero_cuota} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5">#{cuota.numero_cuota}</td>
                    <td className="px-6 py-3.5 text-center text-gray-400">{new Date(cuota.fecha_vencimiento).toLocaleDateString('es-PE')}</td>
                    <td className="px-6 py-3.5 text-right">S/ {parseFloat(cuota.saldo_inicio || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-3.5 text-right">S/ {parseFloat(cuota.amortizacion || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-3.5 text-right">S/ {parseFloat(cuota.interes || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-3.5 text-right font-black text-brand-blue bg-brand-blue/[0.02]">S/ {parseFloat(cuota.cuota_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-3.5 text-right">S/ {parseFloat(cuota.saldo_final || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SimulationDetailPage;
