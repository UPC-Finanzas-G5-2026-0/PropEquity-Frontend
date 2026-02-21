import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useAuth } from '../context/AuthContext';
import { createUnit, getUnits, updateUnit, deleteUnit } from '../services/unitService';

const PropertyRegistrationPage = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        direccion: '',
        distrito: '',
        precio: '',
        moneda: '1', // 1: Soles, 2: Dolares
        area: '',
        estado: '1', // 1: Activo, 2: Inactivo
        foto: null
    });
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Lista de propiedades
    const [properties, setProperties] = useState([]);

    // Estados para los dropdowns personalizados
    const [openDistrito, setOpenDistrito] = useState(false);
    const [openMoneda, setOpenMoneda] = useState(false);
    const [openEstado, setOpenEstado] = useState(false);

    // Cargar propiedades al inicio
    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const data = await getUnits();
            setProperties(data);
        } catch (error) {
            console.error("Error cargando propiedades:", error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, foto: file });
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleEdit = (prop) => {
        // El ID puede venir como codigo_unidad o ser el id que pasamos nosotros
        const id = prop.codigo_unidad || prop.codigo_unit;
        if (!id) {
            console.error("No se pudo encontrar el ID de la propiedad:", prop);
            alert("Error: No se encontró el identificador de la propiedad.");
            return;
        }

        setEditingId(id);

        // Cargamos los datos asegurándonos de que sean strings para los inputs
        setFormData({
            direccion: String(prop.direccion_unidad || prop.direccion_unit || ''),
            distrito: String(prop.distrito_unidad || prop.distrito_unit || ''),
            precio: String(prop.precio_venta || ''),
            moneda: String(prop.codigo_moneda || '1'),
            area: String(prop.area_unidad || prop.area_unit || ''),
            estado: String(prop.codigo_estado || '1'),
            foto: prop.foto // Esto se queda como la URL/Path actual
        });

        if (prop.foto) {
            setPreview(`http://localhost:8000${prop.foto}`);
        } else {
            setPreview(null);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({
            direccion: '',
            distrito: '',
            precio: '',
            moneda: '1',
            area: '',
            estado: '1',
            foto: null
        });
        setPreview(null);
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Estás seguro de que deseas eliminar esta propiedad?")) {
            try {
                await deleteUnit(id);
                alert("Propiedad eliminada exitosamente.");
                fetchProperties();
            } catch (error) {
                console.error("Error eliminando propiedad:", error);
                alert("Hubo un error al intentar eliminar la propiedad.");
            }
        }
    };

    const handleSubmit = async () => {
        if (!formData.direccion || !formData.distrito || !formData.precio || !formData.area) {
            alert("Por favor completa todos los campos obligatorios.");
            return;
        }

        if (Number(formData.precio) <= 0 || Number(formData.area) <= 0) {
            alert("El precio y el área deben ser mayores a 0.");
            return;
        }

        setLoading(true);
        try {
            // Preparar payload con tipos correctos
            const unitPayload = {
                direccion_unidad: formData.direccion,
                distrito_unidad: formData.distrito,
                area_unidad: parseFloat(formData.area),
                precio_venta: parseFloat(formData.precio),
                codigo_moneda: parseInt(formData.moneda),
                codigo_estado: parseInt(formData.estado),
                tipo_unidad: formData.tipo_unidad || 'Departamento', 
                grado_sostenible: parseInt(formData.grado_sostenible) || 1, 
                codigo_cliente: user?.id ? parseInt(user.id) : null,
                codigo_prospecto: null,
                codigo_asesor: null,
                foto: formData.foto
            };

            if (editingId) {
                console.log("PUT -> Actualizando unidad ID:", editingId, unitPayload);
                await updateUnit(editingId, unitPayload);
                alert("¡Propiedad actualizada exitosamente!");
            } else {
                console.log("POST -> Creando nueva unidad:", unitPayload);
                await createUnit(unitPayload);
                alert("¡Propiedad registrada exitosamente!");
            }

            handleCancelEdit();
            fetchProperties();

        } catch (error) {
            console.error("Error en la operación:", error);

            if (error.response && error.response.status === 422) {
                // Capturar el detalle de validación del backend
                const details = error.response.data.detail;
                let errorMsg = "Error de validación en el servidor:\n";

                if (Array.isArray(details)) {
                    errorMsg += details.map(err => {
                        const field = err.loc && err.loc.length > 1 ? err.loc[1] : err.loc[0];
                        return `- Campo [${field}]: ${err.msg}`;
                    }).join('\n');
                } else {
                    errorMsg += typeof details === 'string' ? details : JSON.stringify(details);
                }

                alert(errorMsg);
            } else {
                const msg = error.response?.data?.message || error.message;
                alert(`Error al ${editingId ? 'actualizar' : 'registrar'}: ${msg}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex bg-gray-50 min-h-screen font-['Inter',_sans-serif]">
            <Sidebar />

            <main className="flex-1 p-12 overflow-y-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
                        {editingId ? 'Editar Unidad Inmobiliaria' : 'Nueva Unidad Inmobiliaria'}
                    </h1>
                    <p className="text-gray-500 text-lg font-medium">
                        {editingId ? 'Modifica los datos de la propiedad seleccionada.' : 'Ingresa los datos técnicos y financieros de la propiedad.'}
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-16">

                    {/* COLUMNA IZQUIERDA: Formulario de Datos */}
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
                            <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
                                <span className="bg-brand-blue/10 text-brand-blue p-2 rounded-xl">
                                    <LocationOnIcon />
                                </span>
                                Detalles de la Propiedad
                            </h2>
                            {editingId && (
                                <button
                                    onClick={handleCancelEdit}
                                    className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-widest"
                                >
                                    Cancelar Edición
                                </button>
                            )}
                        </div>

                        <div className="space-y-6">
                            {/* Dirección */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Dirección Exacta</label>
                                <input
                                    name="direccion"
                                    value={formData.direccion}
                                    onChange={handleChange}
                                    type="text"
                                    placeholder="Ej: Av. Javier Prado Oeste 123"
                                    className="w-full bg-gray-50 border-none rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-brand-blue font-bold text-gray-700 text-sm outline-none transition-all placeholder:text-gray-300"
                                />
                            </div>

                            {/* Distrito */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Distrito</label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setOpenDistrito(!openDistrito)}
                                        className="w-full bg-gray-50 border-none rounded-xl py-3.5 px-4 flex items-center justify-between focus:ring-2 focus:ring-brand-blue font-bold text-gray-700 text-sm outline-none transition-all cursor-pointer"
                                    >
                                        <span className={!formData.distrito ? 'text-gray-400' : ''}>
                                            {formData.distrito || 'Seleccionar Distrito'}
                                        </span>
                                        <KeyboardArrowDownIcon className={`text-gray-400 transition-transform ${openDistrito ? 'rotate-180' : ''}`} />
                                    </button>

                                    {openDistrito && (
                                        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                            {['Miraflores', 'San Isidro', 'Santiago de Surco', 'La Molina', 'San Borja', 'Magdalena', 'Barranco'].map((dist) => (
                                                <div
                                                    key={dist}
                                                    onClick={() => {
                                                        handleChange({ target: { name: 'distrito', value: dist } });
                                                        setOpenDistrito(false);
                                                    }}
                                                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer font-bold text-gray-700 text-sm transition-colors border-b border-gray-50 last:border-0"
                                                >
                                                    {dist}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {/* Precio */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Precio</label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setOpenMoneda(!openMoneda)}
                                            className="absolute inset-y-0 left-0 flex items-center pl-4 cursor-pointer z-20 focus:outline-none"
                                        >
                                            <span className="text-gray-900 font-black text-xs mr-1">{formData.moneda === '1' ? 'S/.' : '$'}</span>
                                            <KeyboardArrowDownIcon style={{ fontSize: 16 }} className={`text-gray-400 transition-transform ${openMoneda ? 'rotate-180' : ''}`} />
                                        </button>

                                        {openMoneda && (
                                            <div className="absolute top-full left-0 mt-2 w-16 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div
                                                    onClick={() => { handleChange({ target: { name: 'moneda', value: '1' } }); setOpenMoneda(false); }}
                                                    className={`px-2 py-2 hover:bg-gray-50 cursor-pointer font-black text-sm text-center border-b border-gray-50 ${formData.moneda === '1' ? 'text-brand-blue bg-blue-50' : 'text-gray-700'}`}
                                                >
                                                    S/.
                                                </div>
                                                <div
                                                    onClick={() => { handleChange({ target: { name: 'moneda', value: '2' } }); setOpenMoneda(false); }}
                                                    className={`px-2 py-2 hover:bg-gray-50 cursor-pointer font-black text-sm text-center ${formData.moneda === '2' ? 'text-brand-blue bg-blue-50' : 'text-gray-700'}`}
                                                >
                                                    $
                                                </div>
                                            </div>
                                        )}

                                        <input
                                            name="precio"
                                            value={formData.precio}
                                            onChange={handleChange}
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            className="w-full bg-gray-50 border-none rounded-xl py-3.5 pl-20 pr-4 focus:ring-2 focus:ring-brand-blue font-black text-gray-900 text-right text-sm outline-none transition-all placeholder:text-gray-300"
                                        />
                                    </div>
                                </div>

                                {/* Área */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Área Total</label>
                                    <div className="relative">
                                        <input
                                            name="area"
                                            value={formData.area}
                                            onChange={handleChange}
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            className="w-full bg-gray-50 border-none rounded-xl py-3.5 pl-4 pr-10 focus:ring-2 focus:ring-brand-blue font-black text-gray-900 text-right text-sm outline-none transition-all placeholder:text-gray-300"
                                        />
                                        <span className="absolute right-4 top-3.5 text-gray-400 font-bold text-xs">m²</span>
                                    </div>
                                </div>
                            </div>

                            {/* Estado */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Estado</label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setOpenEstado(!openEstado)}
                                        className="w-full bg-gray-50 border-none rounded-xl py-3.5 px-4 flex items-center justify-between focus:ring-2 focus:ring-brand-blue font-bold text-gray-700 text-sm outline-none transition-all cursor-pointer"
                                    >
                                        <span>
                                            {formData.estado === '1' ? 'Activo' :
                                                formData.estado === '2' ? 'Inactivo' : 'Seleccionar'}
                                        </span>
                                        <KeyboardArrowDownIcon className={`text-gray-400 transition-transform ${openEstado ? 'rotate-180' : ''}`} />
                                    </button>

                                    {openEstado && (
                                        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                            {[
                                                { id: '1', label: 'Activo' },
                                                { id: '2', label: 'Inactivo' }
                                            ].map((option) => (
                                                <div
                                                    key={option.id}
                                                    onClick={() => {
                                                        handleChange({ target: { name: 'estado', value: option.id } });
                                                        setOpenEstado(false);
                                                    }}
                                                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer font-bold text-gray-700 text-sm transition-colors border-b border-gray-50 last:border-0"
                                                >
                                                    {option.label}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sección de detalles adicionales */}
                            <div className="grid grid-cols-2 gap-6">
                                {/* Tipo de Unidad */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Tipo de Unidad</label>
                                    <select 
                                    name="tipo_unidad" 
                                    value={formData.tipo_unidad || 'Departamento'} 
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 border-none rounded-xl py-3.5 px-4 font-bold text-gray-700 text-sm outline-none focus:ring-2 focus:ring-brand-blue"
                                    >
                                        <option value="Departamento">Departamento</option>
                                        <option value="Casa">Casa</option>
                                        <option value="Cochera">Cochera</option>
                                    </select>
                                </div>

                                {/* Grado Sostenible (Bono Verde) */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Bono Verde (Grado)</label>
                                    <select 
                                    name="grado_sostenible"  
                                    value={formData.grado_sostenible || '1'} 
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 border-none rounded-xl py-3.5 px-4 font-bold text-gray-700 text-sm outline-none focus:ring-2 focus:ring-brand-blue"
                                    >
                                        <option value="1">Grado 1 (Sostenible)</option>
                                        <option value="2">Grado 2 (Sostenible +)</option>
                                        <option value="3">Grado 3 (Eco-materiales)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: Fotografía / Multimedia */}
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col h-full min-h-[400px]">
                        <h2 className="text-xl font-black text-gray-900 mb-8 border-b border-gray-100 pb-4">Fotografía Principal</h2>

                        <div className="flex-1 flex flex-col">
                            <label className={`
                                flex-1 w-full bg-gray-50 rounded-3xl border-3 border-dashed border-gray-200 
                                hover:border-brand-blue hover:bg-brand-blue/5 transition-all cursor-pointer 
                                flex flex-col items-center justify-center relative overflow-hidden group
                                ${!preview ? 'p-8' : 'p-0 border-none'}
                            `}>
                                {preview ? (
                                    <>
                                        <img src={preview} alt="Vista previa" className="w-full h-full object-cover rounded-3xl" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-white font-bold bg-black/50 px-6 py-2 rounded-full text-sm backdrop-blur-sm">Cambiar Foto</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center space-y-3">
                                        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto text-brand-blue group-hover:scale-110 transition-transform">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-600 text-base">Sube una foto portada</p>
                                            <p className="text-xs text-gray-400 mt-1">PNG, JPG hasta 10MB</p>
                                        </div>
                                    </div>
                                )}
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex justify-center">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className={`
                                w-full bg-brand-green hover:bg-green-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-green-500/20 
                                transition-all hover:scale-105 active:scale-95 text-base flex items-center justify-center gap-2
                                ${loading ? 'opacity-70 cursor-wait' : ''}
                            `}
                    >
                        {loading ? (editingId ? 'Guardando...' : 'Registrando...') : (editingId ? 'Guardar Cambios' : 'Registrar Propiedad')}
                    </button>
                </div>

                {/* LISTA DE PROPIEDADES */}
                <div className="border-t border-gray-200 mt-16 pt-8">
                    <h2 className="text-2xl font-black text-gray-900 mb-6">Propiedades Registradas</h2>
                    {properties.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-[2rem] border border-gray-100">
                            <p className="text-gray-400 font-medium">No hay propiedades registradas aún.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {properties.map((prop) => (
                                <div key={prop.codigo_unidad} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                                    <div className="h-48 bg-gray-100 relative overflow-hidden">
                                        {prop.foto ? (
                                            <img src={`http://localhost:8000${prop.foto}`} alt={prop.direccion_unidad} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <LocationOnIcon style={{ fontSize: 40 }} />
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${prop.codigo_estado === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {prop.codigo_estado === 1 ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">{prop.distrito_unidad}</h3>
                                        <p className="text-gray-500 text-xs mb-4 truncate">{prop.direccion_unidad}</p>

                                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                            <div>
                                                <span className="block text-xs font-bold text-gray-300 uppercase">Precio</span>
                                                <span className="font-black text-brand-blue">
                                                    {prop.codigo_moneda === 1 ? 'S/.' : '$'} {prop.precio_venta}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-xs font-bold text-gray-300 uppercase">Área</span>
                                                <span className="font-bold text-gray-700">{prop.area_unidad} m²</span>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                                            <button
                                                onClick={() => handleDelete(prop.codigo_unit || prop.codigo_unidad)}
                                                className="text-[10px] font-bold text-red-300 hover:text-red-500 uppercase tracking-widest transition-colors"
                                            >
                                                Eliminar
                                            </button>
                                            <button
                                                onClick={() => handleEdit(prop)}
                                                className="text-xs font-bold text-brand-blue hover:text-blue-700 uppercase tracking-widest flex items-center gap-1 transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                </svg>
                                                Editar
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
