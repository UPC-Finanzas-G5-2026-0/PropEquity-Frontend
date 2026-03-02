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
            <main className="flex-1 p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Configuración</h1>
                    <p className="text-gray-500 font-medium">Ajustes generales de tu cuenta.</p>
                </header>

                <div className="grid gap-8 max-w-3xl">
                    {settingSections.map((section, idx) => (
                        <div key={idx} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
                            <h3 className="text-lg font-black text-gray-900 mb-6 border-b border-gray-100 pb-2">{section.title}</h3>
                            <div className="space-y-6">
                                {section.items.map((item, itemIdx) => (
                                    <div key={itemIdx} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-brand-blue/10 group-hover:text-brand-blue transition-colors">
                                                {item.icon}
                                            </div>
                                            <span className="font-medium text-gray-700">{item.label}</span>
                                        </div>
                                        <div>
                                            {item.action && (
                                                <button className="text-sm font-bold text-brand-blue hover:underline">{item.action}</button>
                                            )}
                                            {item.value && (
                                                <span className="text-sm font-bold text-gray-400">{item.value}</span>
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
