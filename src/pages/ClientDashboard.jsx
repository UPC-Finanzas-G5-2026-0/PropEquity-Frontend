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
    }, []);

    const totalSimulations = simulations.length;
    const avgFinanced = totalSimulations > 0
        ? simulations.reduce((acc, sim) => acc + parseFloat(sim.resumen?.monto_financiar || 0), 0) / totalSimulations
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

            <main className="flex-1 p-10 overflow-y-auto">
                <header className="mb-12 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
                            ¡Bienvenido, {user?.nombres || 'Cliente'}! 👋
                        </h1>
                        <p className="text-gray-500 text-lg font-medium">Gestiona tus simulaciones de crédito hipotecario.</p>
                    </div>
                    <div className="hidden md:block">
                        <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sincronizado con FMV</span>
                        </div>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
                                    {stat.icon}
                                </div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{stat.label}</p>
                            </div>
                            <p className="text-3xl font-black text-gray-900">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Main Action CTA */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                    <section className="relative overflow-hidden bg-brand-dark rounded-[3rem] p-12 text-white shadow-2xl shadow-brand-dark/20 group cursor-pointer" onClick={() => navigate('/simulador')}>
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black mb-4 leading-tight max-w-xs">Simula tu cuota mensual ahora</h2>
                            <p className="text-gray-400 mb-8 font-medium text-sm max-w-sm">Aplica al Bono del Buen Pagador y obtén tasas preferenciales.</p>
                            <button className="flex items-center gap-3 bg-brand-orange text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 shadow-lg shadow-brand-orange/40">
                                Ir al Simulador <ArrowForwardIcon />
                            </button>
                        </div>
                        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-blue/10 rounded-full blur-[100px] -mr-20 -mt-20"></div>
                    </section>

                    <div className="bg-brand-orange/5 border border-brand-orange/10 rounded-[3rem] p-12 flex flex-col justify-center">
                        <h3 className="text-gray-900 font-black text-2xl mb-4">Requisitos MiVivienda</h3>
                        <ul className="space-y-4">
                            {[
                                'No ser propietario de vivienda en el país.',
                                'No haber recibido apoyo habitacional del Estado.',
                                'Ser calificado por una Institución Financiera.'
                            ].map((req, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-600">
                                    <div className="w-5 h-5 rounded-full bg-brand-orange/20 text-brand-orange flex items-center justify-center text-[10px]">✓</div>
                                    {req}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Simulations Table */}
                <section>
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-3xl font-black text-gray-900 tracking-tight">Mis Simulaciones</h3>
                            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Historial de simulaciones realizadas</p>
                        </div>
                        <Link to="/simulador" className="bg-brand-orange px-6 py-3 rounded-xl font-black text-[10px] text-white uppercase tracking-widest hover:bg-orange-600 transition-all shadow-sm">
                            + Nueva Simulación
                        </Link>
                    </div>

                    {loading ? (
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                            <div className="animate-pulse space-y-4">
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                <div className="h-10 bg-gray-200 rounded"></div>
                                <div className="h-10 bg-gray-200 rounded"></div>
                                <div className="h-10 bg-gray-200 rounded"></div>
                            </div>
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
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">ID</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Propiedad</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Monto Financiado</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Cuota Mensual</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Plazo</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                                        <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                    {simulations.map((sim) => (
                                        <tr key={sim.codigo_simulacion} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-bold text-gray-900">#{sim.codigo_simulacion}</td>

                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {sim.unidad_rel?.direccion_unidad || `Unidad #${sim.codigo_unidad}`}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-brand-blue">
                                                {formatCurrency(sim.resumen?.monto_financiar || 0)}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-brand-orange">
                                                {formatCurrency(sim.detalles?.[1]?.cuota_total || sim.detalles?.[0]?.cuota_total || sim.resumen?.cuota_base || 0)}
                                            </td>

                                            <td className="px-6 py-4 text-sm text-gray-600">{sim.plazo_meses} meses</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{formatDate(sim.fecha_simulacion)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    {/* 🚨 RUTA CORREGIDA AQUÍ PARA QUE COINCIDA CON APP.JS */}
                                                    <button
                                                        onClick={() => navigate(`/simulaciones/${sim.codigo_simulacion}`)}
                                                        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                                        title="Ver Detalles"
                                                    >
                                                        <VisibilityIcon fontSize="small" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleExportExcel(sim.codigo_simulacion)}
                                                        className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                                        title="Exportar Excel"
                                                    >
                                                        <DownloadIcon fontSize="small" />
                                                    </button>
                                                    {/* 🚨 BOTÓN DE PDF AGREGADO */}
                                                    <button
                                                        onClick={() => handleExportPDF(sim.codigo_simulacion)}
                                                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                        title="Exportar PDF"
                                                    >
                                                        <PictureAsPdfIcon fontSize="small" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default ClientDashboard;
