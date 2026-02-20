import React from 'react';
import Sidebar from '../components/Sidebar';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CalculateIcon from '@mui/icons-material/Calculate';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAuth } from '../context/AuthContext';

const ClientDashboard = () => {
    const { user } = useAuth();

    const stats = [
        { label: 'Simulaciones Guardadas', value: '4', icon: <ReceiptLongIcon className="text-blue-500" /> },
        { label: 'Propiedades Vistas', value: '12', icon: <AccountCircleIcon className="text-purple-500" /> },
        { label: 'Última Evaluación', value: 'Apto', icon: <CalculateIcon className="text-green-500" /> },
    ];

    const featuredProperties = [
        { id: 1, title: 'Depa de Lujo en Miraflores', price: 'S/ 450,000', img: 'https://images.unsplash.com/photo-1545324418-f1d3ac1ef739?w=500&auto=format&fit=crop&q=60' },
        { id: 2, title: 'Casa Amplia en Surco', price: 'S/ 720,000', img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&auto=format&fit=crop&q=60' },
        { id: 3, title: 'Dúplex Moderno en San Isidro', price: 'S/ 580,000', img: 'https://images.unsplash.com/photo-1512918766671-ed6a07be3573?w=500&auto=format&fit=crop&q=60' },
    ];

    return (
        <div className="flex bg-[#F8FAFC] min-h-screen w-full font-['Inter',_sans-serif]">
            <Sidebar />

            <main className="flex-1 p-8 overflow-y-auto">
                {/* Header Bienvenida */}
                <header className="mb-10">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
                        ¡Hola, {user?.nombres || 'Cliente'}! 👋
                    </h1>
                    <p className="text-gray-500 text-lg font-medium">Gestiona tus simulaciones y descubre tu próximo hogar.</p>
                </header>

                {/* Stats / Quick Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                                <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Acción Principal: Simulador */}
                <section className="relative overflow-hidden bg-brand-dark rounded-[2.5rem] p-10 mb-12 text-white shadow-2xl shadow-brand-dark/20 group">
                    <div className="relative z-10 max-w-lg">
                        <h2 className="text-3xl font-black mb-4 leading-tight">¿Listo para simular tu crédito hipotecario?</h2>
                        <p className="text-gray-400 mb-8 font-medium">Calcula tus cuotas, evalúa seguros y descubre los beneficios del Bono de Buen Pagador en segundos.</p>
                        <button className="flex items-center gap-3 bg-brand-orange text-white px-8 py-4 rounded-2xl font-bold hover:bg-orange-600 transition-all active:scale-95">
                            Comenzar Simulación <ArrowForwardIcon />
                        </button>
                    </div>
                    {/* Elementos decorativos abstractos */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-brand-blue/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-brand-blue/20 transition-colors"></div>
                    <div className="absolute bottom-0 right-20 w-40 h-40 bg-brand-orange/5 rounded-full blur-2xl group-hover:bg-brand-orange/10 transition-colors"></div>
                </section>

                {/* Propiedades Destacadas */}
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Propiedades recomendadas</h3>
                        <button className="text-brand-blue font-bold text-sm hover:underline uppercase tracking-wider">Ver todo</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {featuredProperties.map((prop) => (
                            <div key={prop.id} className="bg-white overflow-hidden rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-2 group">
                                <div className="h-64 overflow-hidden relative">
                                    <img src={prop.img} alt={prop.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-4 py-1.5 rounded-full text-xs font-black text-gray-900 uppercase">Nuevo</div>
                                </div>
                                <div className="p-6">
                                    <h4 className="font-black text-gray-900 text-lg mb-1 truncate">{prop.title}</h4>
                                    <p className="text-brand-blue font-black text-xl mb-4">{prop.price}</p>
                                    <button className="w-full py-3 border-2 border-gray-100 rounded-xl font-bold text-gray-600 hover:bg-brand-blue hover:text-white hover:border-brand-blue transition-all">Ver Detalles</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default ClientDashboard;
