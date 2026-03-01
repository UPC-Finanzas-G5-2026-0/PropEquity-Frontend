import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalculateIcon from '@mui/icons-material/Calculate';
import HomeIcon from '@mui/icons-material/Home';
import SpaIcon from '@mui/icons-material/Spa';
import { useNavigate } from 'react-router-dom';
import { getUnits } from '../services/unitService';

// NUEVA FUNCIÓN: Procesador inteligente de URLs de imágenes
const getImageUrl = (fotoPath) => {
  if (!fotoPath) return null;
  if (fotoPath.startsWith('http')) return fotoPath; // Si es de Cloudinary, pasa directo

  // URL de tu backend en Render para fotos locales antiguas (opcional)
  return `https://tu-backend.onrender.com${fotoPath}`;
};

const ClientCatalogPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const response = await getUnits();
        if (response.success) {
          // Solo mostramos propiedades activas
          const activeUnits = response.data.filter(u => u.codigo_estado === 1);
          setProperties(activeUnits);
        }
      } catch (error) {
        console.error("Error cargando el catálogo:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const handleSimulate = (prop) => {
    // Llevamos al cliente a SU simulador con la casa ya cargada en memoria
    navigate('/simulador', { state: { unidadSeleccionada: prop } });
  };

  return (
      <div className="flex bg-[#F8FAFC] min-h-screen font-['Inter',_sans-serif]">
        <Sidebar />
        <main className="flex-1 p-10 overflow-y-auto">
          <header className="mb-12 bg-gradient-to-r from-brand-dark to-brand-blue p-10 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-4xl font-black mb-3 tracking-tight flex items-center gap-3">
                <HomeIcon fontSize="large" className="text-brand-orange" />
                Encuentra tu Hogar Ideal
              </h1>
              <p className="text-white/80 text-lg font-medium max-w-2xl">
                Explora nuestro catálogo exclusivo de propiedades calificadas para el Crédito MiVivienda. Descubre, enamórate y simula tus cuotas en un solo clic.
              </p>
            </div>
            {/* Decoración de fondo */}
            <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
              <HomeIcon sx={{ fontSize: 300 }} />
            </div>
          </header>

          {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 animate-pulse">
                {[1, 2, 3].map(n => <div key={n} className="h-96 bg-gray-200 rounded-[2.5rem]"></div>)}
              </div>
          ) : properties.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[3rem] border border-gray-100 shadow-sm flex flex-col items-center">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
                  <HomeIcon sx={{ fontSize: 50 }} />
                </div>
                <h3 className="text-gray-900 font-black text-2xl mb-2">Pronto habrán nuevos hogares</h3>
                <p className="text-gray-500 font-medium">Estamos preparando las mejores opciones para ti. Vuelve pronto.</p>
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {properties.map((prop) => (
                    <div key={prop.codigo_unidad} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group flex flex-col">
                      <div className="h-64 bg-gray-100 relative overflow-hidden shrink-0">

                        {/* 🚨 CAMBIO APLICADO AQUÍ: Uso de getImageUrl */}
                        {getImageUrl(prop.foto) ? (
                            <img
                                src={getImageUrl(prop.foto)}
                                alt={prop.direccion_unidad}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                              <LocationOnIcon sx={{ fontSize: 60 }} />
                            </div>
                        )}

                        {/* Etiquetas (Badges) flotantes */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                          {prop.es_sostenible && (
                              <span className="px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg bg-emerald-500/95 text-white backdrop-blur-sm flex items-center gap-1.5">
                          <SpaIcon sx={{ fontSize: 14 }} /> Bono Verde
                      </span>
                          )}
                          <span className="px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg bg-white/95 text-brand-blue backdrop-blur-sm">
                        Aplica MiVivienda
                    </span>
                        </div>

                        {/* Etiqueta de Precio Flotante */}
                        <div className="absolute bottom-4 right-4 bg-brand-dark/90 backdrop-blur-md text-white px-5 py-2.5 rounded-2xl shadow-xl">
                          <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Precio Total</span>
                          <span className="font-black text-xl">
                        {prop.codigo_moneda === 2 ? '$' : 'S/'} {prop.precio_venta?.toLocaleString()}
                    </span>
                        </div>
                      </div>

                      <div className="p-8 flex flex-col flex-1">
                        <div className="mb-6 flex-1">
                          <h3 className="font-black text-gray-900 text-2xl mb-2 line-clamp-1" title={prop.distrito_unidad}>
                            {prop.distrito_unidad}
                          </h3>
                          <div className="flex items-start gap-1.5 text-gray-500">
                            <LocationOnIcon sx={{ fontSize: 18 }} className="mt-0.5 shrink-0 text-brand-orange" />
                            <p className="text-sm font-medium leading-relaxed line-clamp-2" title={prop.direccion_unidad}>
                              {prop.direccion_unidad}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-8 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                          <div className="text-center flex-1 border-r border-blue-100">
                            <span className="block text-[10px] font-black text-brand-blue/60 uppercase tracking-widest mb-1">Área Total</span>
                            <span className="font-black text-gray-800 text-lg">{prop.area_unidad} <span className="text-sm text-gray-500">m²</span></span>
                          </div>
                          <div className="text-center flex-1">
                            <span className="block text-[10px] font-black text-brand-blue/60 uppercase tracking-widest mb-1">Modalidad</span>
                            <span className="font-black text-gray-800 text-sm mt-1 block">
                          {prop.codigo_modalidad === 1 ? 'Compra' : prop.codigo_modalidad === 2 ? 'Construcción' : 'Mejoramiento'}
                      </span>
                          </div>
                        </div>

                        <button
                            onClick={() => handleSimulate(prop)}
                            className="mt-auto w-full bg-brand-blue text-white font-black py-4 rounded-xl shadow-lg shadow-brand-blue/30 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest group"
                        >
                          <CalculateIcon fontSize="small" className="group-hover:rotate-12 transition-transform" />
                          Calcular mis Cuotas
                        </button>
                      </div>
                    </div>
                ))}
              </div>
          )}
        </main>
      </div>
  );
};

export default ClientCatalogPage;
