import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { exportToExcel, exportToPDF } from '../services/simulationService';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PaymentsIcon from '@mui/icons-material/Payments';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
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
        {/* Resumen Grid Principal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Monto a Financiar', value: `S/ ${parseFloat(result.resumen?.monto_financiar || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: <PaymentsIcon sx={{ fontSize: 20 }} />, color: 'brand-blue' },
            { label: 'Plazo', value: `${result.plazo_meses} Meses`, icon: <CalendarMonthIcon sx={{ fontSize: 20 }} />, color: 'brand-blue' },
            { label: 'Cuota Total Aprox.', value: `S/ ${parseFloat(result.detalles?.find(d => parseFloat(d.cuota_total || 0) > 0)?.cuota_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: <ShowChartIcon sx={{ fontSize: 20 }} />, color: 'brand-blue' }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-2xl bg-blue-50 text-brand-blue flex items-center justify-center`}>{stat.icon}</div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1.5">{stat.label}</p>
                <p className="text-xl font-black text-gray-900 leading-none">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Indicadores Rentabilidad */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#0F172A] p-5 rounded-3xl text-white flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 text-brand-blue-light flex items-center justify-center"><ShowChartIcon /></div>
            <div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">TIR Mensual</p>
              <p className="text-xl font-black text-emerald-400">{parseFloat(result.resumen?.tir || 0).toFixed(5)}%</p>
            </div>
          </div>
          <div className="bg-[#0F172A] p-5 rounded-3xl text-white flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 text-amber-400 flex items-center justify-center"><AccountBalanceIcon /></div>
            <div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">VAN de la Operación</p>
              <p className={`text-xl font-black ${parseFloat(result.resumen?.van || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>S/ {parseFloat(result.resumen?.van || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          <div className="bg-[#0F172A] p-5 rounded-3xl text-white flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 text-blue-400 flex items-center justify-center"><TrendingDownIcon /></div>
            <div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Tasa Descuento</p>
              <p className="text-xl font-black text-blue-300">{parseFloat(result.resumen?.tasa_descuento_mensual || 0).toFixed(5)}%</p>
            </div>
          </div>
          <div className="bg-[#D97706] p-5 rounded-3xl text-white flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center"><QueryStatsIcon /></div>
            <div>
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">TCEA Final</p>
              <p className="text-xl font-black text-white">{parseFloat(result.resumen?.tcea || 0).toFixed(4)}%</p>
            </div>
          </div>
        </div>

        {/* Desglose de Gastos */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 mb-8">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <div className="w-1 h-3 bg-brand-orange rounded-full"></div>
            Resumen de Costos Totales
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-emerald-600 uppercase">Amortización</p>
              <p className="text-sm font-black text-gray-800">S/ {parseFloat(result.resumen?.monto_financiar || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="space-y-1 border-l border-gray-100 pl-4">
              <p className="text-[10px] font-black text-rose-500 uppercase">Intereses</p>
              <p className="text-sm font-black text-gray-800">S/ {parseFloat(result.resumen?.total_intereses || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase">Seguros</p>
              <p className="text-sm font-black text-gray-800">S/ {parseFloat(result.resumen?.total_seguro || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="space-y-1 border-x border-gray-50 px-4">
              <p className="text-[10px] font-black text-gray-400 uppercase">Comisiones</p>
              <p className="text-sm font-black text-gray-800">S/ {parseFloat(result.resumen?.total_comisiones_periodicas || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase">Portes/Gastos</p>
              <p className="text-sm font-black text-gray-800">S/ {parseFloat(result.resumen?.total_portes_gastos_adm || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="space-y-1 bg-brand-blue/5 p-3 rounded-2xl border border-brand-blue/10">
              <p className="text-[10px] font-black text-brand-blue uppercase">Total Pagado</p>
              <p className="text-base font-black text-brand-blue">S/ {parseFloat(result.resumen?.total_pagado || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
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
                  <th className="px-6 py-4 border-b border-gray-100 text-center">TEA%</th>
                  <th className="px-6 py-4 border-b border-gray-100 text-center">TEM%</th>
                  <th className="px-6 py-4 border-b border-gray-100 text-right">Saldo Inicial</th>
                  <th className="px-6 py-4 border-b border-gray-100 text-right">Interés</th>
                  <th className="px-6 py-4 border-b border-gray-100 text-right">Cuota</th>
                  <th className="px-6 py-4 border-b border-gray-100 text-right">Amortización</th>
                  <th className="px-6 py-4 border-b border-gray-100 text-right">Seg. Desgrav.</th>
                  <th className="px-6 py-4 border-b border-gray-100 text-right">Comisión</th>
                  <th className="px-6 py-4 border-b border-gray-100 text-right">Portes</th>
                  <th className="px-6 py-4 border-b border-gray-100 text-right">Gastos Adm.</th>
                  <th className="px-6 py-4 border-b border-gray-100 text-right">Saldo Final</th>
                  <th className="px-6 py-4 border-b border-gray-100 text-right bg-brand-blue/5 text-brand-blue">Flujo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm font-bold text-gray-700">
                {result.detalles?.map((cuota, idx) => {
                  const numMesesGracia = parseInt(result?.meses_gracia || 0);
                  const isGraciaParcial = result.tipo_gracia === 'Parcial' && cuota.numero_cuota > 0 && cuota.numero_cuota <= numMesesGracia;
                  const isGraciaTotal = result.tipo_gracia === 'Total' && cuota.numero_cuota > 0 && cuota.numero_cuota <= numMesesGracia;

                  return (
                    <tr key={idx} className={`hover:bg-gray-50 transition-colors ${cuota.numero_cuota === 0 ? 'bg-gray-50/50 italic opacity-40' : ''} ${isGraciaParcial ? 'bg-blue-50/40' : ''} ${isGraciaTotal ? 'bg-amber-50/40' : ''}`}>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        #{cuota.numero_cuota}
                        {isGraciaParcial && <span className="ml-2 text-[8px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded uppercase font-bold tracking-tighter">Parcial</span>}
                        {isGraciaTotal && <span className="ml-2 text-[8px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded uppercase font-bold tracking-tighter">Total</span>}
                      </td>
                      <td className="px-6 py-3.5 text-center text-gray-400 whitespace-nowrap">{new Date(cuota.fecha_vencimiento).toLocaleDateString('es-PE')}</td>
                      <td className="px-6 py-3.5 text-center text-gray-400">
                        {cuota.numero_cuota === 0 ? '—' : (() => {
                          const tea = parseFloat(cuota.tea || result.tasa_anual || 0);
                          return `${tea.toFixed(2)}%`;
                        })()}
                      </td>
                      <td className="px-6 py-3.5 text-center text-gray-400">
                        {cuota.numero_cuota === 0 ? '—' : (() => {
                          const tea = parseFloat(cuota.tea || result.tasa_anual || 0);
                          const tem = cuota.tem ? parseFloat(cuota.tem) : (Math.pow(1 + (tea / 100), 1 / 12) - 1) * 100;
                          return `${tem.toFixed(4)}%`;
                        })()}
                      </td>
                      <td className="px-6 py-3.5 text-right whitespace-nowrap text-gray-500">S/ {parseFloat(cuota.saldo_inicio || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-3.5 text-right text-rose-500/60">S/ {parseFloat(cuota.interes || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-3.5 text-right font-black">S/ {parseFloat(cuota.cuota_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-3.5 text-right text-emerald-600/60">S/ {parseFloat(cuota.amortizacion || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-3.5 text-right text-gray-400">S/ {parseFloat(cuota.seguro || cuota.seguro_desgravamen || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-3.5 text-right text-gray-400">S/ {parseFloat(cuota.comision_periodica || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-3.5 text-right text-gray-400">S/ {parseFloat(cuota.portes || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-3.5 text-right text-gray-400">S/ {parseFloat(cuota.gastos_administracion || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-3.5 text-right whitespace-nowrap text-gray-900 font-black">S/ {parseFloat(cuota.saldo_final || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-3.5 text-right font-black text-brand-blue bg-brand-blue/[0.02] whitespace-nowrap">S/ {parseFloat(cuota.flujo_caja || cuota.cuota_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SimulationDetailPage;
