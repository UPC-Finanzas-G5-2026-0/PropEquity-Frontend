import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.jpeg';

const Sidebar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // 1. Normalizamos el rol a minúsculas para evitar fallos por mayúsculas
  // Añadimos la lectura de 'rol_rel.tipo_rol' que es como lo envía tu backend de FastAPI
  const rawRole = user?.rol_rel?.tipo_rol || user?.role || user?.rol || '';
  const currentRole = rawRole.toLowerCase();

  // 2. Función para asignar la ruta correcta del Dashboard según el rol
  const getHomePath = (role) => {
    switch (role) {
      case 'administrador': return '/admin/dashboard';
      case 'asesor': return '/asesor/dashboard';
      case 'cliente': return '/cliente/dashboard';
      default: return '/';
    }
  };

  // 3. Definimos el menú con los accesos estrictos
  const allMenuItems = [
    { name: 'Inicio', path: getHomePath(currentRole), roles: ['administrador', 'asesor', 'cliente'] },

    // 🚨 CAMBIO APLICADO: La gestión de inventario ahora es EXCLUSIVA del administrador
    { name: 'Inventario', path: '/propiedades', roles: ['administrador'] },

    // Aquí pondremos el catálogo de solo lectura en el futuro
    // { name: 'Catálogo', path: '/catalogo', roles: ['asesor', 'cliente'] },

    { name: 'Simulaciones', path: '/simulador', roles: ['administrador', 'asesor', 'cliente'] },
    { name: 'Mi Perfil', path: '/perfil', roles: ['cliente', 'asesor'] },
    { name: 'Configuración', path: '/configuracion', roles: ['administrador', 'asesor', 'cliente'] },
  ];

  // Filtramos los ítems exactos para el rol del usuario que inició sesión
  const menuItems = allMenuItems.filter(item => item.roles.includes(currentRole));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-brand-dark h-screen sticky top-0 flex flex-col p-6 text-white shrink-0 overflow-y-auto">
      <div className="mb-10 mt-4 px-4 flex flex-col items-center text-center gap-4">
        <img
          src={logo}
          alt="PropEquity Logo"
          className="w-20 h-20 rounded-2xl object-cover shadow-sm border border-white/10"
        />
        <div className="text-2xl font-bold tracking-wide">
          PropEquity
        </div>
      </div>

      <nav className="flex-1">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `block py-2.5 px-4 rounded-lg text-lg transition-colors font-medium ${isActive
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

      <div className="mt-auto pt-6 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full text-left py-3 px-4 rounded-lg text-lg text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors font-medium"
        >
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
