import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalculateIcon from '@mui/icons-material/Calculate';
import HomeIcon from '@mui/icons-material/Home';
import SpaIcon from '@mui/icons-material/Spa';
import { useNavigate } from 'react-router-dom';
import { getUnits, toggleUnitFavorite } from '../services/unitService';
import { useAuth } from '../context/AuthContext';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const getImageUrl = (fotoPath) => {
  if (!fotoPath) return null;
  if (fotoPath.startsWith('http')) return fotoPath;
  return `https://tu-backend.onrender.com${fotoPath}`;
};

// 🗺️ RANGOS BBP FMV (DS 004-2025-VIVIENDA)
const BBP_RANGES = [
  { min: 68800, max: 97800, rango: 'R1', tradicional: 35100, sostenible: 41400 },
  { min: 97801, max: 146900, rango: 'R2', tradicional: 28000, sostenible: 34300 },
  { min: 146901, max: 244600, rango: 'R3', tradicional: 20900, sostenible: 27200 },
  { min: 244601, max: 362100, rango: 'R4', tradicional: 7800, sostenible: 14100 },
  { min: 362101, max: 488800, rango: 'R5', tradicional: 0, sostenible: 0 }
];

const calculateAffordability = (unit, user) => {
  if (!user) return { eligible: true, affordable: true, score: 0 };

  const price = parseFloat(unit.precio_venta);
  const income = parseFloat(user.ingreso_mensual || 0) + parseFloat(user.ingreso_conyuge || 0);

  // 1. Restricciones Legales (Fundamental)
  const isBlocked = user.es_propietario_vivienda || user.ha_recibido_apoyo || user.tiene_credito_activo || user.conyuge_propietario;

  if (isBlocked) {
    return { eligible: false, message: 'Inhabilitado (Regulaciones FMV)', affordable: false };
  }

  // 2. Cálculo de Bono Estimado
  const range = BBP_RANGES.find(r => price >= r.min && price <= r.max);
  const bono = range ? (unit.es_sostenible ? range.sostenible : range.tradicional) : 0;

  // 3. Capacidad de Pago estimada
  // Estimación conservadora: TEA 10%, Plazo 20 años, Inicial 10%
  const initial = price * 0.10;
  const loan = price - initial - bono;
  const factor = 0.00965; // Factor cuota fija para 10% TEA a 20 años
  const estimatedCuota = loan * factor;

  const maxCuota = income * 0.40; // 40% del ingreso neto (Estándar bancario)
  const affordable = income > 0 ? (estimatedCuota <= maxCuota) : true;

  return {
    eligible: true,
    affordable,
    estimatedCuota,
    bono,
    maxCuota,
    priceWithBono: price - bono,
    score: affordable ? 100 : (maxCuota / estimatedCuota) * 100
  };
};

const ClientCatalogPage = () => {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyFilters, setApplyFilters] = useState(true); // Default: Filtrar por restricciones
  const navigate = useNavigate();
  const { user } = useAuth();
  const myId = user?.codigo_usuario || user?.id;

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const response = await getUnits();
        if (response.success) {
          const processed = response.data
            .filter(u => u.codigo_estado === 1 && u.codigo_cliente !== myId)
            .map(u => ({
              ...u,
              analysis: calculateAffordability(u, user)
            }));
          setProperties(processed);
        }
      } catch (error) {
        console.error("Error cargando el catálogo:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, [myId, user]);

  useEffect(() => {
    if (applyFilters) {
      setFilteredProperties(properties.filter(p => p.analysis.eligible && p.analysis.affordable));
    } else {
      setFilteredProperties(properties);
    }
  }, [properties, applyFilters]);

  const handleSimulate = (prop) => {
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
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Header intermedio */}
        <header className="mb-6 bg-gradient-to-r from-brand-dark to-brand-blue p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-2xl font-black mb-2 tracking-tight flex items-center gap-2">
              <HomeIcon fontSize="medium" className="text-brand-orange" />
              Catálogo de Propiedades
            </h1>
            <p className="text-white/80 text-sm font-medium max-w-xl">
              Explora nuestro catálogo exclusivo de propiedades calificadas para el Crédito MiVivienda.
            </p>
          </div>

          <div className="relative z-10 mt-6 flex flex-wrap gap-4">
            <div
              onClick={() => setApplyFilters(!applyFilters)}
              className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl cursor-pointer transition-all border-2 ${applyFilters ? 'bg-white text-brand-dark border-white shadow-lg' : 'bg-transparent text-white border-white/30 hover:bg-white/10'}`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${applyFilters ? 'bg-brand-orange border-brand-orange' : 'border-white/50'}`}>
                {applyFilters && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
              </div>
              <span className="text-xs font-black uppercase tracking-widest">Filtrar por mis restricciones</span>
            </div>

            {user && (
              <div className="bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-2xl flex items-center gap-3 border border-white/10">
                <span className="text-[10px] font-black uppercase text-brand-orange">Presupuesto:</span>
                <span className="text-xs font-black">S/ {(parseFloat(user.ingreso_mensual || 0) + parseFloat(user.ingreso_conyuge || 0)).toLocaleString()} / mes</span>
              </div>
            )}
          </div>
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
            <HomeIcon sx={{ fontSize: 240 }} />
          </div>
        </header>

        {/* Estado: cargando */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
            {[1, 2, 3].map(n => <div key={n} className="h-52 bg-gray-200 rounded-2xl"></div>)}
          </div>

        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-gray-300">
              <WarningAmberIcon sx={{ fontSize: 28 }} className="text-brand-orange" />
            </div>
            <h3 className="text-gray-900 font-black text-base mb-1">Sin propiedades compatibles</h3>
            <p className="text-gray-500 text-xs font-medium px-8 text-center max-w-sm">No encontramos propiedades que cumplan con tus restricciones actuales. Intenta desactivar el filtro inteligente.</p>
            <button
              onClick={() => setApplyFilters(false)}
              className="mt-4 text-brand-blue font-black text-[10px] uppercase tracking-widest hover:underline"
            >
              Ver todo el catálogo
            </button>
          </div>

        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProperties.map((prop) => (
              <div
                key={prop.codigo_unidad}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col"
              >
                {/* Imagen */}
                <div className="h-52 bg-gray-100 relative overflow-hidden shrink-0">
                  {getImageUrl(prop.foto) ? (
                    <img
                      src={getImageUrl(prop.foto)}
                      alt={prop.direccion_unidad}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                      <LocationOnIcon sx={{ fontSize: 50 }} />
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {prop.es_sostenible && (
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow bg-emerald-500/95 text-white backdrop-blur-sm flex items-center gap-1.5">
                        <SpaIcon sx={{ fontSize: 12 }} /> Bono Verde
                      </span>
                    )}
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow bg-white/95 text-brand-blue backdrop-blur-sm">
                      Aplica MiVivienda
                    </span>
                  </div>

                  {/* Botón Favoritos flotante - REFORZADO */}
                  <button
                    onClick={() => handleToggleFavorite(prop.codigo_unidad)}
                    className="absolute top-3 right-3 z-20 bg-red-500 hover:bg-red-600 text-white p-2.5 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-90 flex items-center justify-center border-2 border-white"
                    title={prop.es_favorito ? "Quitar de favoritos" : "Añadir a favoritos"}
                  >
                    {prop.es_favorito ? (
                      <FavoriteIcon sx={{ fontSize: 20 }} />
                    ) : (
                      <FavoriteBorderIcon sx={{ fontSize: 20 }} />
                    )}
                  </button>

                  {/* Precio flotante */}
                  <div className="absolute bottom-3 right-3 bg-brand-dark/95 backdrop-blur-md text-white px-5 py-2.5 rounded-2xl shadow-xl flex flex-col items-end border border-white/5">
                    <span className="text-[10px] font-black text-brand-orange uppercase tracking-widest mb-1.5 leading-none">Precio con Bono</span>
                    <span className="font-black text-xl leading-none">
                      {prop.codigo_moneda === 2 ? '$' : 'S/'} {prop.analysis?.priceWithBono?.toLocaleString() || prop.precio_venta?.toLocaleString()}
                    </span>
                    <span className="text-[9px] font-black text-white/30 mt-1.5 uppercase tracking-widest line-through">Lista: {prop.codigo_moneda === 2 ? '$' : 'S/'} {prop.precio_venta?.toLocaleString()}</span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-6 flex flex-col flex-1">
                  {/* Elegibilidad Badge */}
                  {!prop.analysis?.eligible ? (
                    <div className="mb-4 bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2">
                      <WarningAmberIcon className="text-red-500" sx={{ fontSize: 16 }} />
                      <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">{prop.analysis.message}</span>
                    </div>
                  ) : !prop.analysis?.affordable && (
                    <div className="mb-4 bg-amber-50 p-3 rounded-xl border border-amber-100 flex items-center gap-2">
                      <WarningAmberIcon className="text-amber-500" sx={{ fontSize: 16 }} />
                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Capacidad Limitada</span>
                    </div>
                  )}

                  <div className="mb-4 flex-1">
                    <h3 className="font-black text-gray-900 text-lg mb-1.5 line-clamp-1" title={prop.distrito_unidad}>
                      {prop.distrito_unidad}
                    </h3>
                    <div className="flex items-start gap-1.5 text-gray-500">
                      <LocationOnIcon sx={{ fontSize: 16 }} className="mt-0.5 shrink-0 text-brand-orange" />
                      <p className="text-sm font-medium leading-relaxed line-clamp-2" title={prop.direccion_unidad}>
                        {prop.direccion_unidad}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between mb-5 p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                    <div className="text-center flex-1 border-r border-blue-100">
                      <span className="block text-[9px] font-black text-brand-blue/60 uppercase tracking-widest mb-1">Área</span>
                      <span className="font-black text-gray-800 text-base">{prop.area_unidad} <span className="text-sm text-gray-500">m²</span></span>
                    </div>
                    <div className="text-center flex-1">
                      <span className="block text-[9px] font-black text-brand-blue/60 uppercase tracking-widest mb-1">Modalidad</span>
                      <span className="font-black text-gray-800 text-sm block">
                        {prop.codigo_modalidad === 1 ? 'Compra' : prop.codigo_modalidad === 2 ? 'Construcción' : 'Mejoramiento'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSimulate(prop)}
                    className="mt-auto w-full bg-brand-blue text-white font-black py-3.5 rounded-xl shadow-lg shadow-brand-blue/30 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest group"
                  >
                    <CalculateIcon sx={{ fontSize: 18 }} className="group-hover:rotate-12 transition-transform" />
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
