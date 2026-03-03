import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DomainIcon from '@mui/icons-material/Domain';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { getUnits } from '../services/unitService';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUnits: 0,
    activeUnits: 0,
    totalValuePEN: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Obtenemos las unidades para calcular las estadísticas
        const response = await getUnits();
        if (response.success) {
          const units = response.data;
          const active = units.filter(u => u.codigo_estado === 1);

          // Sumatoria referencial en Soles (PEN)
          const totalValue = active.reduce((acc, curr) => {
            const tc = 3.75;
            const valueInSoles = curr.codigo_moneda === 2 ? curr.precio_venta * tc : curr.precio_venta;
            return acc + valueInSoles;
          }, 0);

          setStats({
            totalUnits: units.length,
            activeUnits: active.length,
            totalValuePEN: totalValue
          });
        }
      } catch (error) {
        console.error("Error cargando estadísticas", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen w-full font-['Inter',_sans-serif]">
      <Sidebar />

      <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3 mb-2">
              <DashboardIcon fontSize="large" className="text-brand-blue" />
              Panel de Control
            </h1>
            <p className="text-gray-500 text-lg font-medium">
              Bienvenido, <span className="text-brand-blue font-bold">{user?.nombres}</span>. Resumen general de la inmobiliaria.
            </p>
          </div>
          <button
            onClick={() => navigate('/properties')}
            className="bg-brand-blue px-6 py-3 rounded-2xl font-black text-sm text-white uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-brand-blue/30 flex items-center gap-2"
          >
            <AddCircleOutlineIcon fontSize="small" />
            Añadir Propiedad
          </button>
        </header>

        {/* Grid de Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Tarjeta 1 */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 text-blue-50 opacity-50 group-hover:scale-110 transition-transform duration-500">
              <DomainIcon sx={{ fontSize: 120 }} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Unidades Totales</p>
              {loading ? (
                <div className="h-10 bg-gray-100 animate-pulse rounded w-16"></div>
              ) : (
                <p className="text-5xl font-black text-gray-900">{stats.totalUnits}</p>
              )}
              <p className="text-xs font-bold text-green-500 mt-2">{stats.activeUnits} activas en venta</p>
            </div>
          </div>

          {/* Tarjeta 2 */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 text-orange-50 opacity-50 group-hover:scale-110 transition-transform duration-500">
              <TrendingUpIcon sx={{ fontSize: 120 }} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Valor del Inventario (Aprox)</p>
              {loading ? (
                <div className="h-10 bg-gray-100 animate-pulse rounded w-32"></div>
              ) : (
                <p className="text-4xl font-black text-gray-900">{formatCurrency(stats.totalValuePEN)}</p>
              )}
              <p className="text-xs font-bold text-gray-400 mt-2">Suma de propiedades activas</p>
            </div>
          </div>

          {/* Tarjeta 3 (Placeholder para Asesores/Usuarios) */}
          <div className="bg-gradient-to-br from-gray-900 to-black p-8 rounded-[2.5rem] shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 text-white/5">
              <PeopleAltIcon sx={{ fontSize: 120 }} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Equipo de Ventas</p>
              <p className="text-5xl font-black text-white">Gestión</p>
              <button className="mt-4 text-xs font-bold text-brand-orange hover:text-white transition-colors uppercase tracking-wider flex items-center gap-1">
                Ver Asesores →
              </button>
            </div>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <section>
          <h3 className="text-xl font-black text-gray-900 tracking-tight mb-6">Accesos Rápidos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              onClick={() => navigate('/properties')}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-brand-blue hover:shadow-md cursor-pointer transition-all flex items-center gap-6 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-colors">
                <DomainIcon fontSize="medium" />
              </div>
              <div>
                <h4 className="font-black text-gray-900 mb-1">Inventario Inmobiliario</h4>
                <p className="text-xs font-medium text-gray-500">Registra, edita o elimina propiedades del catálogo.</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-gray-300 hover:shadow-md cursor-not-allowed transition-all flex items-center gap-6 opacity-70">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
                <PeopleAltIcon fontSize="medium" />
              </div>
              <div>
                <h4 className="font-black text-gray-900 mb-1">Gestión de Usuarios</h4>
                <p className="text-xs font-medium text-gray-500">Administra asesores y clientes (Próximamente).</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
