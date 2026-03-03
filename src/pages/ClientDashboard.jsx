import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CalculateIcon from '@mui/icons-material/Calculate';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'; // 🚨 NUEVO ICONO PARA PDF
import { useAuth } from '../context/AuthContext';
import { getMySimulations, exportToExcel, exportToPDF } from '../services/simulationService';
import { useNavigate, Link } from 'react-router-dom';

// Utilidades de formateo
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN',
        minimumFractionDigits: 2
    }).format(amount);
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

const ClientDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [simulations, setSimulations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSimulations = async () => {
            try {
                setLoading(true);
                const result = await getMySimulations();
                if (result.success) {
                    setSimulations(result.data);
                } else {
                    setError(result.error);
                }
            } catch (err) {
                console.error(err);
                setError('Error al cargar las simulaciones');
            } finally {
                setLoading(false);
            }
        };
        fetchSimulations();

        // Refrescar lista cuando el usuario vuelve al dashboard (ej: desde Simulador)
        const handleFocus = () => fetchSimulations();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const totalSimulations = simulations.length;
    const avgFinanced = totalSimulations > 0
        ? simulations.reduce((acc, sim) => acc + parseFloat(sim.monto_financiamiento || sim.resumen?.monto_financiar || 0), 0) / totalSimulations
        : 0;

    const stats = [
        { label: 'Mis Simulaciones', value: totalSimulations.toString(), icon: <ReceiptLongIcon className="text-blue-500" /> },
        { label: 'Monto Promedio', value: formatCurrency(avgFinanced), icon: <AccountBalanceWalletIcon className="text-purple-500" /> },
        { label: 'Estado', value: totalSimulations > 0 ? 'Activo' : 'Sin actividad', icon: <CalculateIcon className="text-green-500" /> },
    ];

    const handleExportExcel = async (id) => {
        const result = await exportToExcel(id);
        if (!result.success) {
            alert(result.error);
        }
    };

    // 🚨 Esta función ahora sí se usa en el botón de abajo
    const handleExportPDF = async (id) => {
        const result = await exportToPDF(id);
        if (!result.success) {
            alert(result.error);
        }
    };

    return (
        <div className="flex bg-[#F8FAFC] min-h-screen w-full font-['Inter',_sans-serif]">
            <Sidebar />

            <main className="flex-1 p-6 overflow-y-auto">
                <header className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                            ¡Bienvenido, {user?.nombres || 'Cliente'}! 👋
                        </h1>
                        <p className="text-gray-500 text-sm font-medium">Gestiona tus simulaciones de crédito hipotecario.</p>
                    </div>
                    <div className="hidden md:block">
                        <div className="bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sincronizado con FMV</span>
                        </div>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center">
                                    {stat.icon}
                                </div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{stat.label}</p>
                            </div>
                            <p className="text-3xl font-black text-gray-900">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Main Action CTA */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
                    <section className="relative overflow-hidden bg-brand-dark rounded-3xl p-8 text-white shadow-2xl shadow-brand-dark/20 group cursor-pointer" onClick={() => navigate('/simulador')}>
                        <div className="relative z-10">
                            <h2 className="text-xl font-black mb-3 leading-tight max-w-xs">Simula tu cuota mensual ahora</h2>
                            <p className="text-white/60 mb-6 font-medium text-sm max-w-sm">Aplica al Bono del Buen Pagador y obtén tasas preferenciales.</p>
                            <button className="flex items-center gap-3 bg-brand-orange text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 shadow-lg shadow-brand-orange/40">
                                Ir al Simulador <ArrowForwardIcon sx={{ fontSize: 18 }} />
                            </button>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/10 rounded-full blur-[80px] -mr-16 -mt-16"></div>
                    </section>

                    <div className="bg-white border border-gray-100 rounded-3xl p-8 flex flex-col justify-center shadow-sm">
                        <h3 className="text-xs font-black text-brand-orange uppercase tracking-widest flex items-center gap-2 mb-6">
                            <div className="w-1 h-3 bg-brand-orange rounded-full"></div>
                            Requisitos MiVivienda
                        </h3>
                        <ul className="space-y-4">
                            {[
                                'No ser propietario de vivienda en el país.',
                                'No haber recibido apoyo habitacional del Estado.',
                                'Ser calificado por una Institución Financiera.'
                            ].map((req, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-700">
                                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center text-[10px] border border-emerald-100 flex-shrink-0">✓</div>
                                    {req}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Simulations Table */}
                <section>
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-lg font-black text-gray-900 tracking-tight">Mis Simulaciones</h2>
                            <p className="text-gray-500 text-sm font-medium mt-1">Historial de proyecciones recientes</p>
                        </div>
                        <Link to="/simulador" className="bg-brand-orange px-6 py-3 rounded-xl font-black text-[10px] text-white uppercase tracking-widest hover:bg-orange-600 transition-all shadow-sm">
                            + Nueva Simulación
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                            {[1, 2].map(n => <div key={n} className="h-48 bg-white rounded-[2rem] border border-gray-100 shadow-sm"></div>)}
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 rounded-[2.5rem] p-8 text-center">
                            <p className="text-red-600 font-medium">{error}</p>
                        </div>
                    ) : simulations.length === 0 ? (
                        <div className="bg-white rounded-[2.5rem] p-12 shadow-sm border border-gray-100 text-center">
                            <ReceiptLongIcon sx={{ fontSize: 60 }} className="text-gray-300 mb-4" />
                            <h4 className="text-xl font-bold text-gray-700 mb-2">No tienes simulaciones aún</h4>
                            <p className="text-gray-500 mb-6">Crea tu primera simulación para ver tu cronograma de pagos.</p>
                            <Link to="/simulador" className="inline-flex items-center gap-2 bg-brand-orange text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all">
                                Crear Simulación <ArrowForwardIcon />
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {simulations.map((sim) => (
                                <div key={sim.codigo_simulacion} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col group">
                                    <div className="flex justify-between items-start mb-5 border-b border-gray-50 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center group-hover:bg-brand-blue group-hover:text-white transition-colors">
                                                <CalculateIcon fontSize="small" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Simulación #{sim.codigo_simulacion}</p>
                                                <p className="text-sm font-bold text-gray-900">{formatDate(sim.fecha_simulacion)}</p>
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
                                        <h4 className="text-base font-black text-gray-900 leading-tight truncate" title={sim.distrito_unidad || sim.unidad_rel?.distrito_unidad || 'Distrito'}>
                                            {sim.distrito_unidad || sim.unidad_rel?.distrito_unidad || 'Sin distrito'}
                                        </h4>
                                        <p className="text-[11px] font-bold text-gray-400 leading-tight mt-1 truncate" title={sim.direccion_unidad || sim.unidad_rel?.direccion_unidad}>
                                            {sim.direccion_unidad || sim.unidad_rel?.direccion_unidad || 'Sin dirección registrada'}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        <div>
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1">Monto a Financiar</p>
                                            <p className="text-sm font-black text-brand-blue">{formatCurrency(sim.monto_financiamiento || sim.resumen?.monto_financiar || 0)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1">TCEA (%)</p>
                                            <p className="text-sm font-black text-gray-900">{sim.tcea ? `${parseFloat(sim.tcea).toFixed(2)}%` : (sim.resumen?.tcea ? `${parseFloat(sim.resumen.tcea).toFixed(2)}%` : '—')}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1">Plazo</p>
                                            <p className="text-sm font-bold text-gray-600">{sim.plazo_meses} meses</p>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-5 border-t border-gray-50 flex items-center justify-between">
                                        <div>
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.15em] mb-0.5">Cuota Mensual</p>
                                            <p className="text-lg font-black text-brand-orange">{formatCurrency(sim.cuota_mensual || sim.detalles?.[1]?.cuota_total || sim.detalles?.[0]?.cuota_total || sim.resumen?.cuota_base || 0)}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => navigate(`/simulaciones/${sim.codigo_simulacion}`)}
                                                className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-brand-blue hover:text-white transition-all shadow-sm"
                                                title="Ver Detalle"
                                            >
                                                <VisibilityIcon sx={{ fontSize: 18 }} />
                                            </button>
                                            <button
                                                onClick={() => handleExportExcel(sim.codigo_simulacion)}
                                                className="p-2.5 rounded-xl bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm"
                                                title="Exportar Excel"
                                            >
                                                <DownloadIcon sx={{ fontSize: 18 }} />
                                            </button>
                                            <button
                                                onClick={() => handleExportPDF(sim.codigo_simulacion)}
                                                className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                                title="Exportar PDF"
                                            >
                                                <PictureAsPdfIcon sx={{ fontSize: 18 }} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default ClientDashboard;
