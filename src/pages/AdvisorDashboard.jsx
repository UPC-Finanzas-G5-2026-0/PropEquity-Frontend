import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CalculateIcon from '@mui/icons-material/Calculate';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Tooltip } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { getClients } from '../services/clientService';
import { useNavigate } from 'react-router-dom';
import ClientForm from '../components/ClientForm';

// Utilidades de formateo
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2
  }).format(amount);
};

const AdvisorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para el Modal del Formulario (Alta/Edición)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const result = await getClients();
      if (result.success) {
        setClients(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Error al cargar la cartera de clientes');
    } finally {
      setLoading(false);
    }
  };

  // Calcular KPIs del Asesor
  const totalClients = clients.length;
  // Asumiendo que cada cliente trae sus simulaciones anidadas (según el backend que hicimos)
  const totalSimulations = clients.reduce((acc, client) => acc + (client.simulaciones?.length || 0), 0);

  const stats = [
    { label: 'Total Clientes', value: totalClients.toString(), icon: <PeopleAltIcon className="text-blue-500" /> },
    { label: 'Simulaciones Creadas', value: totalSimulations.toString(), icon: <CalculateIcon className="text-purple-500" /> },
    { label: 'Rendimiento', value: totalClients > 0 ? 'Óptimo' : 'Sin actividad', icon: <CalculateIcon className="text-green-500" /> },
  ];

  const handleOpenForm = (client = null) => {
    setClientToEdit(client);
    setIsModalOpen(true);
  };

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen w-full font-['Inter',_sans-serif]">
      <Sidebar />

      <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
              ¡Hola, Asesor {user?.nombres || ''}! 💼
            </h1>
            <p className="text-gray-500 text-lg font-medium">Gestiona tu cartera de prospectos y clientes.</p>
          </div>
          <div className="hidden md:block">
            <button
              onClick={() => handleOpenForm()}
              className="bg-brand-orange px-6 py-3 rounded-2xl font-black text-sm text-white uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-brand-orange/40 flex items-center gap-2"
            >
              <PersonAddIcon fontSize="small" />
              Nuevo Cliente
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
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

        {/* Tabla de Clientes */}
        <section>
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-3xl font-black text-gray-900 tracking-tight">Mi Cartera</h3>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Listado de clientes registrados</p>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-[2.5rem] p-8 text-center">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-12 shadow-sm border border-gray-100 text-center">
              <PeopleAltIcon sx={{ fontSize: 60 }} className="text-gray-300 mb-4" />
              <h4 className="text-xl font-bold text-gray-700 mb-2">Tu cartera está vacía</h4>
              <p className="text-gray-500 mb-6">Comienza registrando a tu primer cliente interesado.</p>
              <button onClick={() => handleOpenForm()} className="inline-flex items-center gap-2 bg-brand-orange text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all">
                Registrar Cliente <PersonAddIcon />
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">DNI</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Contacto</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Ingresos Mensuales</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                  {clients.map((client) => (
                    <tr key={client.codigo_cliente} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-900">{client.usuario?.nombres} {client.usuario?.apellidos}</p>
                        <p className="text-xs text-gray-500">{client.usuario?.email}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{client.dni_cliente}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{client.telefono_cliente}</td>
                      <td className="px-6 py-4 text-sm font-bold text-green-600">{formatCurrency(client.ingreso_mensual || 0)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Tooltip title="Editar datos del cliente" arrow placement="top">
                            <button
                              onClick={() => handleOpenForm(client)}
                              className="p-2 rounded-lg bg-orange-50 text-brand-orange hover:bg-orange-100 transition-colors"
                            >
                              <EditIcon fontSize="small" />
                            </button>
                          </Tooltip>

                          <Tooltip title="Ver simulaciones hipotecarias de este cliente" arrow placement="top">
                            <button
                              onClick={() => navigate(`/simulations/client/${client.codigo_cliente}`)}
                              className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            >
                              <VisibilityIcon fontSize="small" />
                            </button>
                          </Tooltip>
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

        {/* Modal del Formulario */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-2xl relative animate-fade-in-up">
              <ClientForm
                clientToEdit={clientToEdit}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadClients} // Esto recargará la tabla automáticamente
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdvisorDashboard;
