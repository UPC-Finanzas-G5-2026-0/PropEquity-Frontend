import React from 'react';
import Sidebar from '../components/Sidebar';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import LockIcon from '@mui/icons-material/Lock';
import LanguageIcon from '@mui/icons-material/Language';

const SettingsPage = () => {

    const settingSections = [
        {
            title: 'Cuenta',
            items: [
                { icon: <LockIcon />, label: 'Cambiar Contraseña', action: 'Actualizar' },
                { icon: <LanguageIcon />, label: 'Idioma', value: 'Español' },
            ]
        },
        {
            title: 'Notificaciones',
            items: [
                { icon: <NotificationsNoneIcon />, label: 'Alertas de Propiedades', toggle: true },
                { icon: <NotificationsNoneIcon />, label: 'Nuevas Simulaciones', toggle: true },
            ]
        }
    ];

    return (
        <div className="flex bg-[#F8FAFC] min-h-screen font-['Inter',_sans-serif]">
            <Sidebar />
            <main className="flex-1 p-6">
                <header className="mb-6">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Configuraciones</h1>
                    <p className="text-gray-500 text-sm font-medium">Ajustes generales de tu cuenta.</p>
                </header>

                <div className="grid gap-6 max-w-3xl">
                    {settingSections.map((section, idx) => (
                        <div key={idx} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                            <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest mb-8 flex items-center gap-3">
                                <div className="w-1 h-3 bg-brand-blue rounded-full"></div>
                                {section.title}
                            </h3>
                            <div className="space-y-6">
                                {section.items.map((item, itemIdx) => (
                                    <div key={itemIdx} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-brand-blue/10 group-hover:text-brand-blue transition-colors">
                                                {item.icon}
                                            </div>
                                            <span className="font-bold text-gray-800 text-sm">{item.label}</span>
                                        </div>
                                        <div>
                                            {item.action && (
                                                <button className="text-[10px] font-black text-brand-blue uppercase tracking-widest hover:underline px-4 py-2 bg-brand-blue/5 rounded-full">{item.action}</button>
                                            )}
                                            {item.value && (
                                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{item.value}</span>
                                            )}
                                            {item.toggle && (
                                                <div className="w-10 h-6 bg-brand-orange rounded-full relative cursor-pointer opacity-90 hover:opacity-100">
                                                    <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 shadow-sm"></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default SettingsPage;
