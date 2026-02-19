import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
    const menuItems = [
        { name: 'Inicio', path: '/dashboard' },
        { name: 'Clientes', path: '/clientes' },
        { name: 'Propiedades', path: '/propiedades' },
        { name: 'Simulador', path: '/simulador' },
    ];

    return (
        <div className="w-64 bg-brand-dark min-h-screen flex flex-col p-6 text-white">
            <div className="text-3xl font-bold mb-12 mt-4 px-4 tracking-wide">
                PropEquity
            </div>

            <nav className="flex-1">
                <ul className="space-y-4">
                    {menuItems.map((item) => (
                        <li key={item.name}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    `block py-3 px-4 rounded-lg text-lg transition-colors font-medium ${isActive
                                        ? 'bg-white/10 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`
                                }
                            >
                                {item.name}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;
