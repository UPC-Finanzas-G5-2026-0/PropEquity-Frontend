import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.jpeg';

const Sidebar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // Extraer rol del usuario buscando en todos los campos posibles
  const rawRole = user?.role || user?.rol || user?.rol_usuario || user?.tipo_rol || user?.rol_rel?.tipo_rol || '';
  const currentRole = rawRole.toLowerCase();
  console.log('[Sidebar] currentRole:', currentRole, '| user keys:', user ? Object.keys(user) : 'null');

  // 2. Función para asignar la ruta correcta del Dashboard según el rol
  const getHomePath = (role) => {
    switch (role) {
      case 'administrador': return '/admin/dashboard';
      case 'asesor': return '/asesor/dashboard';
      case 'cliente': return '/cliente/dashboard';
      default: return '/';
    }
  };

  // 3. Definimos el menú con los accesos restringidos
  const allMenuItems = [
    { name: 'Inicio', path: getHomePath(currentRole), roles: ['administrador', 'asesor', 'cliente'] },

    // Administrador: gestión del inventario de propiedades
    { name: 'Propiedades', path: '/propiedades', roles: ['administrador'] },

    // Cliente: registrar/ver su propia propiedad (solo lo ve él mismo)
    { name: 'Mis Propiedades', path: '/propiedades', roles: ['cliente'] },

    // Asesor y Cliente: catálogo técnico
    { name: 'Catálogo', path: '/catalogo', roles: ['asesor', 'cliente'] },

    // Simulaciones (solo asesores y clientes)
    { name: 'Simulaciones', path: '/simulador', roles: ['asesor', 'cliente'] },

    { name: 'Mi Perfil', path: '/perfil', roles: ['cliente', 'asesor'] },
    { name: 'Configuración', path: '/configuracion', roles: ['administrador', 'asesor', 'cliente'] },
  ];

  // Filtramos los ítems exactos para el rol del usuario
  const menuItems = allMenuItems.filter(item => item.roles.includes(currentRole));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-brand-dark h-screen sticky top-0 flex flex-col p-6 text-white shrink-0 overflow-y-auto">
      <div className="mb-5 mt-2 px-2 flex flex-col items-center text-center gap-2">
        <img
          src={logo}
          alt="PropEquity Logo"
          className="w-16 h-16 rounded-2xl object-cover shadow-sm border border-white/10"
        />
        <div className="text-lg font-bold tracking-wide">
          PropEquity
        </div>
      </div>

      <nav className="flex-1">
        <ul className="space-y-0.5">
          {menuItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `block py-2.5 px-4 rounded-lg text-[15px] transition-colors font-medium ${isActive
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

      <div className="mt-auto pt-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full text-left py-2.5 px-4 rounded-lg text-[15px] text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors font-medium"
        >
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
