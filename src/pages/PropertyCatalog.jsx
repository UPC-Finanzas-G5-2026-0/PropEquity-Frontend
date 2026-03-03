import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalculateIcon from '@mui/icons-material/Calculate';
import { useNavigate } from 'react-router-dom';
import { getUnits, toggleUnitFavorite } from '../services/unitService';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

// NUEVA FUNCIÓN: Procesador inteligente de URLs de imágenes
const getImageUrl = (fotoPath) => {
  if (!fotoPath) return null;
  // Si ya es una URL completa (Cloudinary o externo), pasa directo
  if (fotoPath.startsWith('http')) return fotoPath;
  // Si empieza con '/', significa que es una ruta local en /public/ (Ideal para desarrollo/demos)
  if (fotoPath.startsWith('/')) return fotoPath;

  const API_URL = process.env.REACT_APP_API_URL || 'https://propequity-backend.onrender.com';
  return `${API_URL}${fotoPath}`;
};

const PropertyCatalogPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const response = await getUnits();
        if (response.success) {
          // Filtramos para que solo se muestren las propiedades "Activas" (Disponibles)
          const activeUnits = response.data.filter(u => u.codigo_estado === 1);
          setProperties(activeUnits);
        }
      } catch (error) {
        console.error("Error cargando catálogo:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const handleSimulate = (prop) => {
    // Navegamos al simulador y le pasamos los datos de la propiedad seleccionada por memoria
    navigate('/simulador', { state: { unidadSeleccionada: prop } });
  };

  const handleToggleFavorite = async (propId) => {
    const result = await toggleUnitFavorite(propId);
    if (result.success) {
      setProperties(prev => prev.map(p =>
        p.codigo_unidad === propId ? { ...p, es_favorito: result.data.es_favorito } : p
      ));
    }
  };

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen font-['Inter',_sans-serif]">
      <Sidebar />
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Catálogo Inmobiliario</h1>
          <p className="text-gray-500 text-lg font-medium">Explora las unidades disponibles y realiza simulaciones para tus clientes.</p>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-pulse">
            {[1, 2, 3].map(n => <div key={n} className="h-80 bg-gray-200 rounded-[2.5rem]"></div>)}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-gray-100 shadow-sm">
            <LocationOnIcon sx={{ fontSize: 60 }} className="text-gray-300 mb-4" />
            <h3 className="text-gray-400 font-black text-2xl">No hay propiedades disponibles</h3>
            <p className="text-gray-400 mt-2">El administrador aún no ha registrado inventario activo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
            {properties.map((prop) => (
              <div key={prop.codigo_unidad} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group flex flex-col">
                <div className="h-56 bg-gray-100 relative overflow-hidden shrink-0">

                  {/* CAMBIO APLICADO AQUÍ: Uso de getImageUrl */}
                  {getImageUrl(prop.foto) ? (
                    <img
                      src={getImageUrl(prop.foto)}
                      alt={prop.direccion_unidad}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <LocationOnIcon sx={{ fontSize: 60 }} />
                    </div>
                  )}

                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md ${prop.es_sostenible ? 'bg-emerald-500/90 text-white' : 'bg-gray-500/90 text-white'}`}>
                      {prop.es_sostenible ? 'Sostenible' : 'Tradicional'}
                    </span>
                  </div>

                  {/* Botón Favoritos flotante - REFORZADO */}
                  <button
                    onClick={() => handleToggleFavorite(prop.codigo_unidad)}
                    className="absolute top-4 right-4 z-20 bg-red-500 hover:bg-red-600 text-white p-2.5 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-90 flex items-center justify-center border-2 border-white"
                    title={prop.es_favorito ? "Quitar de favoritos" : "Añadir a favoritos"}
                  >
                    {prop.es_favorito ? (
                      <FavoriteIcon sx={{ fontSize: 20 }} />
                    ) : (
                      <FavoriteBorderIcon sx={{ fontSize: 20 }} />
                    )}
                  </button>
                </div>

                <div className="p-8 flex flex-col flex-1">
                  <div className="mb-6">
                    <h3 className="font-black text-gray-900 text-2xl mb-1 truncate" title={prop.distrito_unidad}>
                      {prop.distrito_unidad}
                    </h3>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-tighter truncate" title={prop.direccion_unidad}>
                      {prop.direccion_unidad}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="text-center flex-1 border-r border-gray-200">
                      <span className="block text-[9px] font-black text-gray-400 uppercase mb-1">Precio</span>
                      <span className="font-black text-brand-blue text-base">
                        {prop.codigo_moneda === 2 ? '$' : 'S/'} {prop.precio_venta?.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-center flex-1">
                      <span className="block text-[9px] font-black text-gray-400 uppercase mb-1">Área</span>
                      <span className="font-black text-gray-700 text-base">{prop.area_unidad} m²</span>
                    </div>
                  </div>

                  {/* Botón de Acción Principal */}
                  <button
                    onClick={() => handleSimulate(prop)}
                    className="mt-auto w-full bg-brand-orange text-white font-black py-4 rounded-xl shadow-lg shadow-brand-orange/30 hover:bg-orange-600 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
                  >
                    <CalculateIcon fontSize="small" />
                    Simular Crédito
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

export default PropertyCatalogPage;
