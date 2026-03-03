import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Tooltip } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { createUnit, getUnits, updateUnit, deleteUnit } from '../services/unitService';
import CustomSelect from '../components/CustomSelect';

// 🚨 NUEVA FUNCIÓN: Procesador inteligente de URLs de imágenes
const getImageUrl = (fotoPath) => {
    if (!fotoPath) return null; // Si no hay foto, retorna null para que tu código muestre el ícono de Location
    if (fotoPath.startsWith('http')) return fotoPath; // Si es de Cloudinary, pasa directo

    const API_URL = process.env.REACT_APP_API_URL || 'https://propequity-backend.onrender.com';
    return `${API_URL}${fotoPath}`;
};

// Todos los distritos de Lima Metropolitana
const DISTRITOS_LIMA = [
    'Ate', 'Barranco', 'Breña', 'Carabayllo', 'Cercado de Lima', 'Chaclacayo', 'Chorrillos',
    'Cieneguilla', 'Comas', 'El Agustino', 'Independencia', 'Jesús María', 'La Molina',
    'La Victoria', 'Lince', 'Los Olivos', 'Lurigancho', 'Lurín', 'Magdalena del Mar',
    'Miraflores', 'Pachacamac', 'Pucusana', 'Pueblo Libre', 'Puente Piedra', 'Punta Hermosa',
    'Punta Negra', 'Rímac', 'San Bartolo', 'San Borja', 'San Isidro', 'San Juan de Lurigancho',
    'San Juan de Miraflores', 'San Luis', 'San Martín de Porres', 'San Miguel', 'Santa Anita',
    'Santa María del Mar', 'Santa Rosa', 'Santiago de Surco', 'Surquillo', 'Villa El Salvador',
    'Villa María del Triunfo', 'Callao', 'Bellavista', 'La Perla', 'La Punta', 'Ventanilla'
];

const PropertyRegistrationPage = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        direccion: '',
        distrito: '',
        precio: '',
        moneda: 'PEN',
        area: '',
        estado_registro: 'Activo',
        modalidad_vivienda: 'Compra',
        tipo_venta: 'Primera venta',
        es_sostenible: false,
        certificacion_sostenible: '',
        ahorro_energia: '',
        ahorro_agua: '',
        materiales_eco: false,
        foto: null
    });
    const [preview, setPreview] = useState(null);
    const [fotoRemoved, setFotoRemoved] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [properties, setProperties] = useState([]);

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const response = await getUnits(0, 100, true); // solo_mias=true: cada usuario ve sus propias unidades
            if (response.success) {
                setProperties(response.data);
            }
        } catch (error) {
            console.error("Error cargando propiedades:", error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCustomChange = (name, value) => {
        setFormData({ ...formData, [name]: String(value) });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, foto: file });
            setPreview(URL.createObjectURL(file));
        }
    };

    // Mapeo inverso: códigos del backend → strings del frontend
    const mapPropFromApi = (prop) => ({
        direccion: String(prop.direccion_unidad || ''),
        distrito: String(prop.distrito_unidad || ''),
        precio: String(prop.precio_venta || ''),
        moneda: prop.codigo_moneda === 2 ? 'USD' : 'PEN',
        area: String(prop.area_unidad || ''),
        estado_registro: prop.codigo_estado === 2 ? 'Inactivo' : 'Activo',
        modalidad_vivienda: prop.codigo_modalidad === 2 ? 'Construccion'
            : prop.codigo_modalidad === 3 ? 'Mejoramiento' : 'Compra',
        tipo_venta: prop.codigo_tipo_venta === 2 ? 'Segunda venta' : 'Primera venta',
        es_sostenible: prop.es_sostenible || false,
        certificacion_sostenible: prop.certificacion_sostenible || '',
        ahorro_energia: prop.ahorro_energia ? String(prop.ahorro_energia) : '',
        ahorro_agua: prop.ahorro_agua ? String(prop.ahorro_agua) : '',
        materiales_eco: prop.es_sostenible || false,
        foto: prop.foto
    });

    const handleEdit = (prop) => {
        const id = prop.codigo_unidad || prop.codigo_unit;
        if (!id) return;
        setEditingId(id);
        setFotoRemoved(false);
        setFormData(mapPropFromApi(prop));

        // 🚨 CAMBIO APLICADO AQUÍ: Usamos getImageUrl para previsualizar al editar
        if (prop.foto) setPreview(getImageUrl(prop.foto));
        else setPreview(null);

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFotoRemoved(false);
        setFormData({
            direccion: '', distrito: '', precio: '', moneda: 'PEN', area: '', estado_registro: 'Activo',
            modalidad_vivienda: 'Compra', tipo_venta: 'Primera venta', es_sostenible: false,
            certificacion_sostenible: '', ahorro_energia: '', ahorro_agua: '', materiales_eco: false, foto: null
        });
        setPreview(null);
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Estás seguro de que deseas eliminar esta propiedad?")) {
            try {
                const response = await deleteUnit(id);
                if (response.success) {
                    fetchProperties();
                } else {
                    alert(response.error);
                }
            } catch (error) {
                console.error("Error eliminando propiedad:", error);
            }
        }
    };

    const handleSubmit = async () => {
        const precioVal = parseFloat(formData.precio);
        const areaVal = parseFloat(formData.area);

        if (!formData.direccion || !formData.distrito || isNaN(precioVal) || isNaN(areaVal)) {
            alert("Completa todos los campos obligatorios.");
            return;
        }
        if (areaVal <= 0) {
            alert("El área unitaria debe ser mayor a 0.");
            return;
        }

        if (formData.es_sostenible === true && !formData.certificacion_sostenible) {
            alert("Las viviendas sostenibles requieren especificar una certificación (EDGE, LEED, etc.).");
            return;
        }

        if (formData.foto instanceof File) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(formData.foto.type)) {
                alert("Solo se permiten imágenes JPG, PNG o WEBP.");
                return;
            }
            if (formData.foto.size > 5 * 1024 * 1024) {
                alert("La fotografía no puede pesar más de 5MB.");
                return;
            }
        }

        const TC = 3.75;
        let precioEnSoles = precioVal;
        if (formData.moneda === 'USD') {
            precioEnSoles = precioVal * TC;
        }

        if (precioEnSoles < 68800 || precioEnSoles > 488800) {
            const rangoMsg = formData.moneda === 'USD'
                ? `$ ${(68800 / TC).toLocaleString(undefined, { maximumFractionDigits: 0 })} - $ ${(488800 / TC).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                : 'S/ 68,800 - S/ 488,800';
            if (!window.confirm(`El precio está fuera del rango del programa MiVivienda (${rangoMsg}). ¿Deseas continuar?`)) {
                return;
            }
        }

        const MONEDA_MAP = { PEN: 1, USD: 2 };
        const MODALIDAD_MAP = { Compra: 1, Construccion: 2, Mejoramiento: 3 };
        const TIPO_VENTA_MAP = { 'Primera venta': 1, 'Segunda venta': 2 };
        const ESTADO_MAP = { Activo: 1, Inactivo: 2 };

        setLoading(true);
        try {
            const unitPayload = {
                direccion_unidad: formData.direccion,
                distrito_unidad: formData.distrito,
                area_unidad: areaVal,
                precio_venta: precioVal,
                codigo_moneda: MONEDA_MAP[formData.moneda] ?? 1,
                codigo_modalidad: MODALIDAD_MAP[formData.modalidad_vivienda] ?? 1,
                es_sostenible: formData.es_sostenible,
                codigo_estado: ESTADO_MAP[formData.estado_registro] ?? 1,
                foto: formData.foto
            };

            if (formData.modalidad_vivienda === 'Compra') {
                unitPayload.codigo_tipo_venta = TIPO_VENTA_MAP[formData.tipo_venta] ?? 1;
            }

            if (editingId && fotoRemoved) {
                unitPayload.remove_foto = true;
            }

            let response;
            if (editingId) {
                response = await updateUnit(editingId, unitPayload);
            } else {
                response = await createUnit(unitPayload);
            }

            if (response.success) {
                handleCancelEdit();
                fetchProperties();
                alert("Propiedad procesada con éxito.");
            } else {
                alert(`Error: ${response.error}`);
            }
        } catch (error) {
            console.error("Error al procesar propiedad:", error);
            alert("No pudimos guardar la propiedad. Verifica la conexión con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex bg-[#F8FAFC] min-h-screen font-['Inter',_sans-serif]">
            <Sidebar />
            <main className="flex-1 p-6 overflow-y-auto">
                <header className="mb-6">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Propiedades</h1>
                    <p className="text-gray-500 text-sm font-medium">Registra y administra las unidades inmobiliarias.</p>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-12 items-stretch">
                    {/* FORMULARIO COMPACTO */}
                    <div className="xl:col-span-2 bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-3">
                            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                <span className="bg-brand-blue/10 text-brand-blue p-1.5 rounded-xl">
                                    <LocationOnIcon fontSize="small" />
                                </span>
                                {editingId ? 'Editar Propiedad' : 'Nueva Unidad'}
                            </h2>
                            {editingId && (
                                <button onClick={handleCancelEdit} className="text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest px-4 py-2 bg-red-50 rounded-full transition-all border border-red-100/50">Cancelar Edición</button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            {/* DIRECCIÓN */}
                            <div className="col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Dirección Exacta</label>
                                <input
                                    name="direccion" value={formData.direccion} onChange={handleChange}
                                    type="text" placeholder="Ej: Av. Principal 456"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-blue/10 font-bold text-gray-700 text-sm transition-all"
                                />
                            </div>

                            {/* DISTRITO + ESTADO */}
                            <CustomSelect
                                label="Distrito"
                                value={formData.distrito}
                                onChange={(val) => handleCustomChange('distrito', val)}
                                showInfo={false}
                                options={DISTRITOS_LIMA.map(d => ({ id: d, label: d }))}
                            />
                            <CustomSelect
                                label="Estado"
                                value={formData.estado_registro}
                                onChange={(val) => handleCustomChange('estado_registro', val)}
                                showInfo={true}
                                options={[
                                    { id: 'Activo', label: 'Activo' },
                                    { id: 'Inactivo', label: 'Inactivo' }
                                ]}
                            />

                            {/* DIVISA + PRECIO */}
                            <div>
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Precio de Venta</label>
                                <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl h-10 overflow-hidden">
                                    <div className="flex shrink-0 border-r border-gray-200 h-full">
                                        {[{ id: 'PEN', symbol: 'S/' }, { id: 'USD', symbol: '$' }].map(cur => (
                                            <button
                                                key={cur.id}
                                                type="button"
                                                onClick={() => handleCustomChange('moneda', cur.id)}
                                                style={formData.moneda === cur.id
                                                    ? { background: '#3B82F6', color: 'white' }
                                                    : { background: 'transparent', color: '#9ca3af' }
                                                }
                                                className="px-3 text-[11px] font-black h-full transition-all hover:opacity-80"
                                            >
                                                {cur.symbol}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        name="precio" value={formData.precio} onChange={handleChange}
                                        type="number" placeholder="Ej: 180000"
                                        min="0.01" step="0.01"
                                        className="flex-1 bg-transparent h-full px-3 outline-none font-bold text-gray-700 text-sm"
                                    />
                                </div>
                                {/* Rango MiVivienda */}
                                <p className="text-[7px] font-medium text-gray-400 mt-1 ml-1">
                                    Rango MiVivienda: S/ 68,800 - S/ 488,800 {formData.moneda === 'USD' && '(USD 18,347 - USD 130,347 aprox.)'}
                                </p>
                                {formData.precio !== '' && (() => {
                                    const TC = 3.75;
                                    const precioVal = parseFloat(formData.precio);
                                    const precioSoles = formData.moneda === 'USD' ? precioVal * TC : precioVal;

                                    if (precioSoles < 68800) {
                                        return <p className="text-[7px] font-semibold text-red-500 ml-1">⚠ Precio menor al mínimo (S/ 68,800)</p>;
                                    }
                                    if (precioSoles > 488800) {
                                        return <p className="text-[7px] font-semibold text-red-500 ml-1">⚠ Precio mayor al máximo (S/ 488,800)</p>;
                                    }

                                    let rango = '';
                                    if (precioSoles <= 97800) rango = 'R1';
                                    else if (precioSoles <= 146900) rango = 'R2';
                                    else if (precioSoles <= 244600) rango = 'R3';
                                    else if (precioSoles <= 362100) rango = 'R4';
                                    else rango = 'R5';

                                    return (
                                        <p className="text-[7px] font-semibold text-green-600 ml-1">
                                            ✓ Rango {rango} {formData.moneda === 'USD' && `(≈ S/ ${precioSoles.toLocaleString(undefined, { maximumFractionDigits: 0 })})`}
                                        </p>
                                    );
                                })()}
                            </div>

                            {/* ÁREA */}
                            <div>
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Área (m²)</label>
                                <div className={`bg-gray-50 border rounded-xl h-10 flex items-center transition-all ${formData.area !== '' && parseFloat(formData.area) <= 0
                                    ? 'border-red-300 bg-red-50'
                                    : 'border-gray-100'
                                    }`}>
                                    <input
                                        name="area" value={formData.area}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '' || parseFloat(val) > 0 || val === '0' || val === '0.') {
                                                handleChange(e);
                                            }
                                        }}
                                        type="number" placeholder="Ej: 85.5"
                                        min="0.01" step="0.01"
                                        className="w-full bg-transparent h-full px-4 outline-none font-bold text-gray-700 text-sm"
                                    />
                                    <span className="pr-3 text-[10px] font-black text-gray-300">m²</span>
                                </div>
                                {formData.area !== '' && parseFloat(formData.area) <= 0 && (
                                    <p className="text-[7px] text-red-400 font-semibold mt-1 ml-1">El área debe ser mayor a 0</p>
                                )}
                            </div>

                            {/* SOSTENIBLE */}
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-1.5">
                                    Tipo de Vivienda
                                    <Tooltip
                                        title="Define si la vivienda aplica al Bono Buen Pagador (BBP) del Fondo MiVivienda y de qué tipo."
                                        arrow placement="top" enterDelay={150}
                                    >
                                        <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#EFF6FF', border: '1.5px solid #93C5FD', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                            <span style={{ fontSize: 9, fontWeight: 700, color: '#3B82F6', lineHeight: 1 }}>?</span>
                                        </span>
                                    </Tooltip>
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { label: 'Sin BBP', val: null, color: 'gray' },
                                        { label: 'Tradicional', val: false, color: 'blue' },
                                        { label: 'Sostenible', val: true, color: 'green' },
                                    ].map((op) => {
                                        const isActive =
                                            op.val === null
                                                ? formData.es_sostenible === null || formData.es_sostenible === undefined
                                                : formData.es_sostenible === op.val;
                                        const activeStyle = {
                                            gray: isActive ? 'border-gray-400 bg-gray-50 text-gray-600' : 'border-gray-100 text-gray-300 hover:border-gray-300',
                                            blue: isActive ? 'border-brand-blue bg-blue-50 text-brand-blue' : 'border-gray-100 text-gray-300 hover:border-blue-200',
                                            green: isActive ? 'border-green-400 bg-green-50 text-green-600' : 'border-gray-100 text-gray-300 hover:border-green-200',
                                        }[op.color];
                                        return (
                                            <button
                                                key={op.label}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, es_sostenible: op.val ?? false }))}
                                                className={`py-2 px-2 rounded-xl border-2 transition-all duration-200 text-center ${activeStyle}`}
                                            >
                                                <span className="text-[10px] font-black uppercase tracking-wider">{op.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {formData.es_sostenible === true && (
                                    <div className="mt-3 animate-in fade-in duration-300 space-y-2">
                                        <CustomSelect
                                            label="Certificación Sostenible"
                                            value={formData.certificacion_sostenible}
                                            onChange={(val) => handleCustomChange('certificacion_sostenible', val)}
                                            showInfo={true}
                                            options={[
                                                { id: 'EDGE', label: 'EDGE' },
                                                { id: 'LEED', label: 'LEED' },
                                                { id: 'Bono Verde', label: 'Bono Verde MiVivienda' },
                                                { id: 'ISO 14001', label: 'ISO 14001' }
                                            ]}
                                        />
                                        {!formData.certificacion_sostenible && (
                                            <p className="text-[8px] font-semibold text-red-400 ml-1">⚠ Requerido para vivienda sostenible</p>
                                        )}
                                    </div>
                                )}
                            </div>


                            {/* MODALIDAD + TIPO VENTA */}
                            <div>
                                <CustomSelect
                                    label="Modalidad"
                                    value={formData.modalidad_vivienda}
                                    onChange={(val) => handleCustomChange('modalidad_vivienda', val)}
                                    showInfo={true}
                                    options={[{ id: 'Compra', label: 'Compra' }, { id: 'Construccion', label: 'Construcción' }, { id: 'Mejoramiento', label: 'Mejoramiento' }]}
                                />
                                <div className="mt-1.5 flex items-center gap-1.5 ml-1">
                                    <InfoOutlinedIcon sx={{ fontSize: 10, color: '#94a3b8' }} />
                                    <span className="text-[7px] font-semibold text-gray-400">
                                        Cuota inicial mín: {formData.modalidad_vivienda === 'Compra' ? '10%' : '7.5%'} del precio
                                    </span>
                                </div>
                            </div>
                            {formData.modalidad_vivienda === 'Compra' ? (
                                <CustomSelect
                                    label="Tipo de Venta"
                                    value={formData.tipo_venta}
                                    onChange={(val) => handleCustomChange('tipo_venta', val)}
                                    showInfo={true}
                                    options={[{ id: 'Primera venta', label: 'Primera venta' }, { id: 'Segunda venta', label: 'Segunda venta' }]}
                                />
                            ) : (
                                <div className="flex items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-3">
                                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">No aplica</span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={`
                                w-full bg-brand-dark text-white font-black py-3 mt-6 rounded-xl shadow-lg
                                hover:bg-black hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2 text-xs
                                ${loading ? 'opacity-70 cursor-wait' : ''}
                            `}
                        >
                            {loading ? 'Procesando...' : (editingId ? 'GUARDAR CAMBIOS' : 'REGISTRAR PROPIEDAD')}
                        </button>
                    </div>

                    {/* FOTO / DROPZONE */}
                    <div className="relative group h-full">
                        <label className={`
                            h-full min-h-[300px] w-full bg-white rounded-[2rem] border-2 border-dashed border-gray-100
                            hover:border-brand-blue hover:bg-brand-blue/[0.02] transition-all cursor-pointer
                            flex flex-col items-center justify-center overflow-hidden
                            ${preview ? 'border-solid p-0' : 'p-6'}
                        `}>
                            {preview ? (
                                <>
                                    <img src={preview} alt="Vista previa" className="w-full h-full object-cover rounded-[1.8rem]" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white duration-300 rounded-[1.8rem]">
                                        <CloudUploadOutlinedIcon sx={{ fontSize: 32, mb: 1 }} />
                                        <span className="font-black text-xs bg-white/20 px-6 py-2 rounded-full backdrop-blur-md">Cambiar Foto</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setPreview(null);
                                            setFotoRemoved(true);
                                            setFormData(prev => ({ ...prev, foto: null }));
                                        }}
                                        className="absolute top-3 right-3 z-10 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100"
                                        title="Eliminar foto"
                                    >
                                        <span style={{ fontSize: 16, fontWeight: 900, lineHeight: 1 }}>×</span>
                                    </button>
                                </>
                            ) : (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-brand-blue/5 rounded-full flex items-center justify-center mx-auto text-brand-blue mb-4">
                                        <CloudUploadOutlinedIcon sx={{ fontSize: 24 }} />
                                    </div>
                                    <h3 className="font-black text-gray-900 text-sm mb-1">Cargar Fotografía</h3>
                                    <p className="text-gray-400 font-medium text-[10px]">Arrastra o haz clic aquí</p>
                                </div>
                            )}
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                        </label>
                    </div>
                </div>

                {/* LISTADO DE PROPIEDADES */}
                <div className="border-t border-gray-100 pt-10">
                    <div className="flex justify-between items-center mb-5">
                        <div>
                            <h2 className="text-lg font-black text-gray-900 tracking-tight">Inventario Actual</h2>
                            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-0.5">{properties.length} unidades encontradas</p>
                        </div>
                    </div>

                    {properties.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[3rem] border border-gray-50 shadow-sm">
                            <p className="text-gray-300 font-black text-xl">Sin registros en el sistema.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {properties.map((prop) => (
                                <div key={prop.codigo_unidad} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
                                    <div className="h-56 bg-gray-100 relative overflow-hidden">

                                        {/* 🚨 CAMBIO APLICADO AQUÍ: Usamos getImageUrl para la imagen de la tarjeta */}
                                        {getImageUrl(prop.foto) ? (
                                            <img
                                                src={getImageUrl(prop.foto)}
                                                alt={prop.direccion_unidad}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-200">
                                                <LocationOnIcon sx={{ fontSize: 60 }} />
                                            </div>
                                        )}

                                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                                            {(() => {
                                                const isActivo = prop.codigo_estado === 1;
                                                return (
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md ${isActivo ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                                                        {isActivo ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                );
                                            })()}
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md ${prop.es_sostenible ? 'bg-emerald-500/90 text-white' : 'bg-gray-500/90 text-white'}`}>
                                                {prop.es_sostenible ? 'Sostenible' : 'Tradicional'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-8">
                                        <div className="mb-6">
                                            <h3 className="font-black text-gray-900 text-xl mb-1 group-hover:text-brand-blue transition-colors truncate">{prop.distrito_unidad}</h3>
                                            <p className="text-gray-400 text-xs font-bold uppercase tracking-tighter truncate">{prop.direccion_unidad}</p>
                                        </div>

                                        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50/50 rounded-2xl border border-gray-50">
                                            <div className="text-center flex-1 border-r border-gray-100">
                                                <span className="block text-[8px] font-black text-gray-300 uppercase mb-1">Precio</span>
                                                <span className="font-black text-brand-blue text-sm">
                                                    {prop.codigo_moneda === 2 ? '$' : 'S/'} {prop.precio_venta?.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="text-center flex-1">
                                                <span className="block text-[8px] font-black text-gray-300 uppercase mb-1">Área</span>
                                                <span className="font-black text-gray-700 text-sm">{prop.area_unidad} m²</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleEdit(prop)}
                                                className="flex-1 bg-brand-blue/5 text-brand-blue font-black py-3 rounded-xl hover:bg-brand-blue hover:text-white transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                                            >
                                                <EditOutlinedIcon sx={{ fontSize: 16 }} /> Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(prop.codigo_unit || prop.codigo_unidad)}
                                                className="w-12 h-12 bg-red-50 text-red-300 hover:bg-red-500 hover:text-white flex items-center justify-center rounded-xl transition-all"
                                            >
                                                <DeleteOutlineIcon sx={{ fontSize: 20 }} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PropertyRegistrationPage;
