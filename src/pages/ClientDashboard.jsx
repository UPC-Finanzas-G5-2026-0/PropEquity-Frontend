import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CalculateIcon from '@mui/icons-material/Calculate';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useAuth } from '../context/AuthContext';
import { getUnits } from '../services/unitService';
import { useNavigate } from 'react-router-dom';

const ClientDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProps = async () => {
            try {
                const data = await getUnits();
                // Filtrar solo las disponibles
                setProperties(data.filter(p => p.codigo_estado === 1).slice(0, 6));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProps();
    }, []);

    const stats = [
        { label: 'Simulaciones', value: '0', icon: <ReceiptLongIcon className="text-blue-500" /> },
        { label: 'Propiedades', value: properties.length.toString(), icon: <AccountCircleIcon className="text-purple-500" /> },
        { label: 'Estado', value: 'Evaluando', icon: <CalculateIcon className="text-green-500" /> },
    ];

    return (
        <div className="flex bg-[#F8FAFC] min-h-screen w-full font-['Inter',_sans-serif]">
            <Sidebar />

            <main className="flex-1 p-10 overflow-y-auto">
                <header className="mb-12 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
                            ¡Bienvenido, {user?.nombres || 'Cliente'}! 👋
                        </h1>
                        <p className="text-gray-500 text-lg font-medium">Explora las unidades disponibles y proyecta tu inversión.</p>
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

                {/* Main Action CTAs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                    <section className="relative overflow-hidden bg-brand-dark rounded-[3rem] p-12 text-white shadow-2xl shadow-brand-dark/20 group cursor-pointer" onClick={() => navigate('/simulador')}>
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black mb-4 leading-tight max-w-xs">Simula tu cuota mensual ahora</h2>
                            <p className="text-gray-400 mb-8 font-medium text-sm max-w-sm">Aplica al Bono Verde y obtén tasas preferenciales. Nuestro simulador te ayuda a decidir.</p>
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

                {/* Properties Listing */}
                <section>
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-3xl font-black text-gray-900 tracking-tight">Propiedades Destacadas</h3>
                            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Unidades seleccionadas para ti</p>
                        </div>
                        <button onClick={() => navigate('/propiedades')} className="bg-white px-6 py-3 rounded-xl font-black text-[10px] text-brand-blue border border-gray-100 uppercase tracking-widest hover:bg-brand-blue hover:text-white transition-all shadow-sm">Ver Todo el Listado</button>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[1, 2, 3].map(i => <div key={i} className="h-96 bg-gray-100 animate-pulse rounded-[2.5rem]"></div>)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {properties.map((prop) => (
                                <div key={prop.codigo_unidad} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
                                    <div className="h-64 overflow-hidden relative">
                                        {prop.foto ? (
                                            <img src={`http://localhost:8000${prop.foto}`} alt={prop.direccion_unidad} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        ) : (
                                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                                                <LocationOnIcon sx={{ fontSize: 50 }} />
                                            </div>
                                        )}
                                        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/20">
                                            {prop.es_sostenible ? (
                                                <span className="text-green-600">Sostenible</span>
                                            ) : (
                                                <span className="text-gray-500">Tradicional</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-8">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="font-black text-gray-900 text-xl truncate max-w-[150px]">{prop.distrito_unidad}</h4>
                                                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-tighter truncate max-w-[150px]">{prop.direccion_unidad}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[8px] font-black text-gray-300 uppercase mb-0.5">Desde</p>
                                                <p className="text-brand-blue font-black text-xl leading-tight">
                                                    {prop.codigo_moneda === 2 ? '$' : 'S/'} {prop.precio_venta.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 pt-4 border-t border-gray-50 mt-4">
                                            <div className="flex-1 text-center">
                                                <span className="block text-[8px] font-black text-gray-300 uppercase">Área</span>
                                                <span className="text-xs font-black text-gray-700">{prop.area_unidad} m²</span>
                                            </div>
                                            <div className="flex-1 text-center border-l border-r border-gray-50">
                                                <span className="block text-[8px] font-black text-gray-300 uppercase">Cuota Est.</span>
                                                <span className="text-xs font-black text-brand-orange">
                                                    S/ {(prop.precio_venta * 0.0075).toLocaleString(undefined, { maximumFractionDigits: 0 })}*
                                                </span>
                                            </div>
                                            <div className="flex-1 text-center">
                                                <span className="block text-[8px] font-black text-gray-300 uppercase">Bono BBP</span>
                                                {(() => {
                                                    const p = prop.precio_venta;
                                                    const applies = p >= 68800 && p <= 362100;
                                                    return (
                                                        <span className={`text-xs font-black ${applies ? 'text-green-500' : 'text-red-400'}`}>
                                                            {applies ? 'Aplica' : 'No Aplica'}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
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
