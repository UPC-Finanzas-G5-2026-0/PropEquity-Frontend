import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getUnits } from '../services/unitService';
import { runSimulation, exportSimulationExcel, exportSimulationPdf } from '../services/simulationService';
import { useAuth } from '../context/AuthContext';
import CalculateIcon from '@mui/icons-material/Calculate';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import DescriptionIcon from '@mui/icons-material/Description';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SavingsIcon from '@mui/icons-material/Savings';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import PaymentsIcon from '@mui/icons-material/Payments';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const SimulationPage = () => {
    const { user } = useAuth();
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [formData, setFormData] = useState({
        codigo_unidad: '',
        cuota_inicial: '0',
        bono_bbp: '0',
        tasa_anual: '10',
        capitalizacion: 'Mensual',
        plazo_meses: '240',
        codigo_tipo_gracia: '1', // 1: Ninguno
        meses_gracia: '0',
        seguro_desgravamen: '0.05',
        codigo_tipo_tasa: '2', // 1: Nominal, 2: Efectiva
        vivienda_sostenible: false,
        fecha_inicio_prestamo: new Date().toISOString().split('T')[0]
    });

    const [cuotaType, setCuotaType] = useState('porcentaje'); // 'porcentaje' o 'monto'

    // Dropdowns personalizados
    const [openUnidad, setOpenUnidad] = useState(false);
    const [openGracia, setOpenGracia] = useState(false);

    useEffect(() => {
        fetchUnits();
    }, []);

    const calculateBBP = (precio, moneda, sostenible = false) => {
        const p = parseFloat(precio);
        const m = parseInt(moneda);
        if (m !== 1) return 0;

        if (p >= 65200 && p <= 93100) return sostenible ? 31100 : 25700;
        if (p > 93100 && p <= 139400) return sostenible ? 26800 : 21400;
        if (p > 139400 && p <= 232200) return sostenible ? 25000 : 19600;
        if (p > 232200 && p <= 343900) return sostenible ? 16200 : 10800;
        return 0;
    };

    // Sincronizar bono automáticamente al cambiar de unidad
    useEffect(() => {
        if (selectedUnit) {
            const bono = calculateBBP(selectedUnit.precio_venta, selectedUnit.codigo_moneda, formData.vivienda_sostenible);
            setFormData(prev => ({ ...prev, bono_bbp: bono.toString() }));
        }
    }, [formData.codigo_unidad, formData.vivienda_sostenible, units]);

    const fetchUnits = async () => {
        try {
            const data = await getUnits();
            setUnits(data);
            if (data.length > 0) {
                setFormData(prev => ({ ...prev, codigo_unidad: data[0].codigo_unidad }));
            }
        } catch (error) {
            console.error("Error cargando unidades:", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Impedir valores menores a 0 en cualquier campo numérico
        if (e.target.type === 'number' && parseFloat(value) < 0) {
            setFormData({ ...formData, [name]: '0' });
            return;
        }
        setFormData({ ...formData, [name]: value });
    };

    const handleSimulate = async () => {
        const val = parseFloat(formData.cuota_inicial);

        // 1. Validaciones
        if (isNaN(val)) {
            alert("Ingrese solo números.");
            return;
        }
        if (val < 0) {
            alert("La cuota inicial no puede ser un valor negativo.");
            return;
        }

        let finalCuotaInicial = val;
        if (cuotaType === 'porcentaje') {
            if (val >= 100) {
                alert("La cuota inicial debe ser menor al 100%.");
                return;
            }
            if (selectedUnit) {
                finalCuotaInicial = (val / 100) * selectedUnit.precio_venta;
            }
        } else {
            if (selectedUnit && val >= selectedUnit.precio_venta) {
                alert("La cuota inicial debe ser menor al precio total de la propiedad.");
                return;
            }
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                cuota_inicial: finalCuotaInicial,
                bono_bbp: parseFloat(formData.bono_bbp),
                tasa_anual: parseFloat(formData.tasa_anual),
                plazo_meses: parseInt(formData.plazo_meses),
                codigo_tipo_gracia: parseInt(formData.codigo_tipo_gracia),
                meses_gracia: parseInt(formData.meses_gracia),
                seguro_desgravamen: parseFloat(formData.seguro_desgravamen),
                codigo_tipo_tasa: parseInt(formData.codigo_tipo_tasa),
                capitalizacion: formData.capitalizacion,
                codigo_unidad: parseInt(formData.codigo_unidad),
                codigo_cliente: user?.role === 'Cliente' ? user.id : null,
                codigo_asesor: user?.role === 'Asesor' ? user.id : null,
                codigo_prospecto: null, // Opcional según lógica de negocio
                fecha_inicio_prestamo: formData.fecha_inicio_prestamo,
                fecha_simulacion: new Date().toISOString().split('T')[0]
            };

            const data = await runSimulation(payload);
            setResult(data);
            window.scrollTo({ top: 1000, behavior: 'smooth' });
        } catch (error) {
            console.error("Error en simulación:", error);
            alert("Error al procesar la simulación.");
        } finally {
            setLoading(false);
        }
    };

    const selectedUnit = units.find(u => u.codigo_unidad === parseInt(formData.codigo_unidad));

    return (
        <div className="flex bg-[#F8FAFC] min-h-screen font-['Inter',_sans-serif]">
            <Sidebar />

            <main className="flex-1 p-12 overflow-y-auto">
                <header className="mb-10">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Simulador Hipotecario</h1>
                    <p className="text-gray-500 text-lg font-medium">Calcula tu cronograma de pagos y evalúa tu inversión inmobiliaria.</p>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
                    {/* Configurador de Simulación */}
                    <div className="xl:col-span-2 space-y-6">
                        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3">
                                <span className="bg-brand-blue/10 text-brand-blue p-2 rounded-xl"><CalculateIcon sx={{ fontSize: 20 }} /></span>
                                Parámetros de la Simulación
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {/* Columna 1: Propiedad y Tiempo */}
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center h-8 mb-3 gap-2 group relative">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Unidad Inmobiliaria</label>
                                            <HelpOutlineIcon className="text-gray-300 cursor-help" sx={{ fontSize: 14 }} />
                                            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[60] font-medium">
                                                Selecciona la unidad que deseas simular para cargar su precio automáticamente.
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <button
                                                onClick={() => setOpenUnidad(!openUnidad)}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-left font-bold text-gray-700 flex justify-between items-center hover:bg-white transition-colors"
                                            >
                                                <span className="truncate pr-4 text-sm">{selectedUnit ? `${selectedUnit.direccion_unidad}` : 'Seleccione...'}</span>
                                                <KeyboardArrowDownIcon className={`text-gray-400 shrink-0 transition-transform ${openUnidad ? 'rotate-180' : ''}`} />
                                            </button>
                                            {openUnidad && (
                                                <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden max-h-60 overflow-y-auto">
                                                    {units.map((u) => (
                                                        <div
                                                            key={u.codigo_unidad}
                                                            onClick={() => {
                                                                setFormData(prev => ({ ...prev, codigo_unidad: u.codigo_unidad }));
                                                                setOpenUnidad(false);
                                                            }}
                                                            className="px-5 py-4 hover:bg-brand-blue/5 cursor-pointer border-b border-gray-50 last:border-0"
                                                        >
                                                            <p className="font-bold text-gray-900 text-sm">{u.direccion_unidad}</p>
                                                            <p className="text-gray-400 text-xs font-medium">{u.distrito_unidad} • {u.codigo_moneda === 1 ? 'S/.' : '$'} {u.precio_venta}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center h-8 mb-3 gap-2 group relative">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Plazo (Meses)</label>
                                            <HelpOutlineIcon className="text-gray-300 cursor-help" sx={{ fontSize: 13 }} />
                                            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[60] font-medium">
                                                Número total de meses para pagar el crédito hipotecario (ej. 240 meses = 20 años).
                                            </div>
                                        </div>
                                        <input type="number" name="plazo_meses" min="0" value={formData.plazo_meses} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 focus:bg-white focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all" />
                                    </div>

                                    <div>
                                        <div className="flex items-center h-8 mb-3 gap-2 group relative">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Periodo de Gracia</label>
                                            <HelpOutlineIcon className="text-gray-300 cursor-help" sx={{ fontSize: 13 }} />
                                            <div className="absolute bottom-full left-0 mb-2 w-56 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[60] font-medium">
                                                Parcial: Solo pagas intereses. Total: No pagas nada (los intereses se acumulan al capital).
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <button
                                                onClick={() => setOpenGracia(!openGracia)}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-left font-bold text-gray-700 flex justify-between items-center hover:bg-white transition-colors"
                                            >
                                                <span>{formData.codigo_tipo_gracia === '1' ? 'Sin Gracia' : formData.codigo_tipo_gracia === '2' ? 'Parcial' : 'Total'}</span>
                                                <KeyboardArrowDownIcon className={`text-gray-400 transition-transform ${openGracia ? 'rotate-180' : ''}`} />
                                            </button>
                                            {openGracia && (
                                                <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                                                    {[
                                                        { id: '1', label: 'Sin Gracia' },
                                                        { id: '2', label: 'Gracia Parcial' },
                                                        { id: '3', label: 'Gracia Total' }
                                                    ].map((opt) => (
                                                        <div
                                                            key={opt.id}
                                                            onClick={() => { setFormData({ ...formData, codigo_tipo_gracia: opt.id }); setOpenGracia(false); }}
                                                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-xs font-bold text-gray-700"
                                                        >
                                                            {opt.label}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {formData.codigo_tipo_gracia !== '1' && (
                                        <div>
                                            <div className="flex items-center h-8 mb-3">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Meses de Gracia</label>
                                            </div>
                                            <input type="number" name="meses_gracia" min="0" value={formData.meses_gracia} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 focus:bg-white focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all" />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <div className="flex justify-between items-center h-8 mb-3 gap-2 group relative">
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Cuota Inicial</label>
                                                <HelpOutlineIcon className="text-gray-300 cursor-help" sx={{ fontSize: 13 }} />
                                                <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[60] font-medium">
                                                    Monto pagado al inicio. El mínimo suele ser el 10% del valor de la propiedad.
                                                </div>
                                            </div>
                                            <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                                                <button
                                                    onClick={() => setCuotaType('porcentaje')}
                                                    className={`px-2 py-0.5 rounded-md text-[9px] font-black transition-all ${cuotaType === 'porcentaje' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                                >
                                                    %
                                                </button>
                                                <button
                                                    onClick={() => setCuotaType('monto')}
                                                    className={`px-2 py-0.5 rounded-md text-[9px] font-black transition-all ${cuotaType === 'monto' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                                >
                                                    {selectedUnit?.codigo_moneda === 1 ? 'S/' : '$'}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                name="cuota_inicial"
                                                min="0"
                                                value={formData.cuota_inicial}
                                                onChange={handleChange}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 focus:bg-white focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all pr-12"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-300 text-xs">
                                                {cuotaType === 'porcentaje' ? '%' : (selectedUnit?.codigo_moneda === 1 ? 'S/' : '$')}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center h-8 mb-3 gap-2 group relative">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Bonos (BBP)</label>
                                            <HelpOutlineIcon className="text-gray-300 cursor-help" sx={{ fontSize: 13 }} />
                                            <div className="absolute bottom-full left-0 mb-2 w-56 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[60] font-medium">
                                                Bono del Buen Pagador: Subsidio del Estado que aumenta tu inicial y reduce tu préstamo.
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="bono_bbp"
                                                value={parseFloat(formData.bono_bbp) > 0 ? `S/. ${parseFloat(formData.bono_bbp).toLocaleString()}` : 'No aplica'}
                                                readOnly
                                                className="w-full bg-gray-100 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-500 cursor-not-allowed outline-none"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <AccountBalanceIcon className="text-gray-300" sx={{ fontSize: 16 }} />
                                            </span>
                                        </div>
                                        {parseFloat(formData.bono_bbp) === 0 && selectedUnit && selectedUnit.precio_venta > 343900 && (
                                            <p className="mt-1.5 ml-1 text-[9px] font-bold text-red-500 leading-tight">
                                                * El valor supera los S/ 343,900. No aplica bono BBP.
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center h-8 mb-3 gap-2 group relative">
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Tipo de Vivienda</label>
                                                <HelpOutlineIcon className="text-gray-300 cursor-help" sx={{ fontSize: 13 }} />
                                                <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[60] font-medium">
                                                    Las viviendas sostenibles cumplen con criterios ecológicos y reciben un bono mayor.
                                                </div>
                                            </div>
                                            <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                                                <button
                                                    onClick={() => setFormData({ ...formData, vivienda_sostenible: false })}
                                                    className={`px-2 py-0.5 rounded-md text-[9px] font-black transition-all ${!formData.vivienda_sostenible ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                                >
                                                    T
                                                </button>
                                                <button
                                                    onClick={() => setFormData({ ...formData, vivienda_sostenible: true })}
                                                    className={`px-2 py-0.5 rounded-md text-[9px] font-black transition-all ${formData.vivienda_sostenible ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                                >
                                                    S
                                                </button>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-700 flex justify-between items-center">
                                            <span className="text-xs font-bold">{formData.vivienda_sostenible ? 'Sostenible' : 'Tradicional'}</span>
                                            <div className={`w-1.5 h-1.5 rounded-full ${formData.vivienda_sostenible ? 'bg-green-500 animate-pulse' : 'bg-brand-blue'}`} />
                                        </div>
                                    </div>
                                </div>

                                {/* Columna 3: Parámetros Técnicos */}
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex items-center h-8 mb-3 gap-2 group relative">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Tasa Anual (%)</label>
                                            <HelpOutlineIcon className="text-gray-300 cursor-help" sx={{ fontSize: 13 }} />
                                            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[60] font-medium">
                                                TEA (Tasa Efectiva Anual): El costo puro del interés del dinero prestado por el banco.
                                            </div>
                                        </div>
                                        <input type="number" name="tasa_anual" min="0" value={formData.tasa_anual} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 focus:bg-white focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all" />
                                    </div>

                                    <div>
                                        <div className="flex items-center h-8 mb-3">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Tipo de Tasa</label>
                                        </div>
                                        <select
                                            name="codigo_tipo_tasa"
                                            value={formData.codigo_tipo_tasa}
                                            onChange={handleChange}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 focus:bg-white focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="2">Efectiva</option>
                                            <option value="1">Nominal</option>
                                        </select>
                                    </div>

                                    {formData.codigo_tipo_tasa === '1' && (
                                        <div>
                                            <div className="flex items-center h-8 mb-3">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Capitalización</label>
                                            </div>
                                            <select
                                                name="capitalizacion"
                                                value={formData.capitalizacion}
                                                onChange={handleChange}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 focus:bg-white focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="Diaria">Diaria</option>
                                                <option value="Quincenal">Quincenal</option>
                                                <option value="Mensual">Mensual</option>
                                                <option value="Bimestral">Bimestral</option>
                                                <option value="Trimestral">Trimestral</option>
                                                <option value="Cuatrimestral">Cuatrimestral</option>
                                                <option value="Semestral">Semestral</option>
                                                <option value="Anual">Anual</option>
                                            </select>
                                        </div>
                                    )}

                                    <div>
                                        <div className="flex items-center h-8 mb-3">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Fecha de Inicio del Préstamo</label>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                name="fecha_inicio_prestamo"
                                                value={formData.fecha_inicio_prestamo}
                                                onChange={handleChange}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 focus:bg-white focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all"
                                            />
                                            <CalendarMonthIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" sx={{ fontSize: 18 }} />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center h-8 mb-3">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Seguro Desgravamen (%)</label>
                                        </div>
                                        <input
                                            type="number"
                                            name="seguro_desgravamen"
                                            min="0"
                                            step="0.001"
                                            value={formData.seguro_desgravamen}
                                            onChange={handleChange}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 focus:bg-white focus:ring-2 focus:ring-brand-blue/20 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSimulate}
                                disabled={loading}
                                className="w-full mt-6 bg-brand-dark text-white font-black py-3 rounded-xl shadow-lg shadow-brand-dark/20 hover:scale-[1.01] active:scale-95 transition-all text-base flex items-center justify-center gap-3"
                            >
                                {loading ? 'Procesando...' : 'Ejecutar Simulación'}
                                <CalculateIcon sx={{ fontSize: 20 }} />
                            </button>
                        </section>
                    </div>

                    {/* Información Lateral / Quick Tips */}
                    <div className="space-y-6">
                        <section className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                            <h3 className="text-gray-900 font-black text-sm mb-4 flex items-center gap-2 uppercase tracking-wider">
                                <AccountBalanceIcon className="text-brand-orange" fontSize="small" /> Tabla de Bonos BBP 2026
                            </h3>
                            <div className="overflow-hidden rounded-xl border border-gray-50 text-[10px]">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-400 font-bold">
                                            <td className="p-2 border-b border-gray-100">Valor Vivienda</td>
                                            <td className="p-2 border-b border-gray-100 text-center">Trad.</td>
                                            <td className="p-2 border-b border-gray-100 text-center text-green-600">Sost.</td>
                                        </tr>
                                    </thead>
                                    <tbody className="font-bold text-gray-600">
                                        <tr className="hover:bg-gray-50/50">
                                            <td className="p-2 border-b border-gray-50">S/ 65.2k - 93.1k</td>
                                            <td className="p-2 border-b border-gray-50 text-center">S/ 25,700</td>
                                            <td className="p-2 border-b border-gray-50 text-center text-green-600">S/ 31,100</td>
                                        </tr>
                                        <tr className="hover:bg-gray-50/50">
                                            <td className="p-2 border-b border-gray-50">S/ 93.1k - 139.4k</td>
                                            <td className="p-2 border-b border-gray-50 text-center">S/ 21,400</td>
                                            <td className="p-2 border-b border-gray-50 text-center text-green-600">S/ 26,800</td>
                                        </tr>
                                        <tr className="hover:bg-gray-50/50">
                                            <td className="p-2 border-b border-gray-50">S/ 139.4k - 232.2k</td>
                                            <td className="p-2 border-b border-gray-50 text-center">S/ 19,600</td>
                                            <td className="p-2 border-b border-gray-50 text-center text-green-600">S/ 25,000</td>
                                        </tr>
                                        <tr className="hover:bg-gray-50/50">
                                            <td className="p-2">S/ 232.2k - 343.9k</td>
                                            <td className="p-2 text-center">S/ 10,800</td>
                                            <td className="p-2 text-center text-green-600">S/ 16,200</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <p className="mt-3 text-[9px] text-gray-400 font-medium leading-tight">
                                * Los valores están sujetos a la UIT vigente y criterios de sostenibilidad del FMV.
                            </p>
                        </section>

                        <section className="bg-brand-blue/5 p-6 rounded-[2rem] border border-brand-blue/10">
                            <h3 className="text-brand-blue font-black text-xs mb-3 flex items-center gap-2 uppercase tracking-wider">
                                <DescriptionIcon fontSize="small" /> Resumen TCEA
                            </h3>
                            <p className="text-gray-500 text-[11px] font-medium leading-relaxed">
                                La **TCEA** (Tasa de Costo Efectivo Anual) es el indicador real de cuánto te costará el préstamo, incluyendo intereses y seguros.
                            </p>
                        </section>
                    </div>
                </div >

                {/* RESULTADOS DE LA SIMULACIÓN */}
                {
                    result && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
                            <h2 className="text-3xl font-black text-gray-900 border-t border-gray-200 pt-12">Resultados del Análisis</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Card TCEA */}
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                                    <div className="bg-gray-100 p-3 rounded-2xl text-gray-900 border border-gray-50">
                                        <ShowChartIcon fontSize="medium" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">TCEA (Costo Anual)</p>
                                        <p className="text-2xl font-black text-gray-900">{result.resumen.tcea}%</p>
                                    </div>
                                </div>

                                {/* Card VAN */}
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                                    <div className="bg-gray-100 p-3 rounded-2xl text-gray-900 border border-gray-50">
                                        <SavingsIcon fontSize="medium" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">VAN (Valor Actual Neto)</p>
                                        <p className="text-xl font-black text-gray-900">{result.codigo_moneda === 1 ? 'S/.' : '$'} {result.resumen.van || '0.00'}</p>
                                        <p className="text-[9px] font-bold text-green-600">Rentabilidad Positiva</p>
                                    </div>
                                </div>

                                {/* Card TIR */}
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                                    <div className="bg-gray-100 p-3 rounded-2xl text-gray-900 border border-gray-50">
                                        <QueryStatsIcon fontSize="medium" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">TIR (Tasa Interna)</p>
                                        <p className="text-xl font-black text-gray-900">{result.resumen.tir || '0.0000'}%</p>
                                        <p className="text-[9px] font-bold text-blue-600">Retorno Mensual</p>
                                    </div>
                                </div>

                                {/* Card Cuota Promedio */}
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                                    <div className="bg-gray-100 p-3 rounded-2xl text-gray-900 border border-gray-50">
                                        <PaymentsIcon fontSize="medium" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Cuota Mensual (PROM.)</p>
                                        <p className="text-xl font-black text-gray-900">{result.codigo_moneda === 1 ? 'S/.' : '$'} {result.detalles[result.meses_gracia]?.cuota_total || 0}</p>
                                        <p className="text-[9px] font-bold text-gray-400">Sin Seguros: {result.codigo_moneda === 1 ? 'S/.' : '$'} {result.detalles[result.meses_gracia]?.cuota_bruta || '0.00'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900">Cronograma de Pagos</h3>
                                        <p className="text-gray-400 text-sm font-medium">Detalle mensual de amortización e intereses.</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => exportSimulationExcel(result.codigo_simulacion)}
                                            className="flex items-center gap-2 px-6 py-3 bg-green-50 text-green-700 rounded-xl font-bold text-sm hover:bg-green-100 transition-colors"
                                        >
                                            <FileDownloadIcon fontSize="small" /> Excel
                                        </button>
                                        <button
                                            onClick={() => exportSimulationPdf(result.codigo_simulacion)}
                                            className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-700 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors"
                                        >
                                            <FileDownloadIcon fontSize="small" /> PDF
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-50 text-gray-400 font-bold">
                                                <th className="px-6 py-4 text-[10px] uppercase tracking-wider">N°</th>
                                                <th className="px-6 py-4 text-[10px] uppercase tracking-wider">Fecha. Venc.</th>
                                                <th className="px-6 py-4 text-[10px] uppercase tracking-wider">Saldo Inicial</th>
                                                <th className="px-6 py-4 text-[10px] uppercase tracking-wider">Amortización</th>
                                                <th className="px-6 py-4 text-[10px] uppercase tracking-wider">Interés</th>
                                                <th className="px-6 py-4 text-[10px] uppercase tracking-wider text-center">Seg. Desgrav.</th>
                                                <th className="px-6 py-4 text-[10px] uppercase tracking-wider text-right">Cuota total</th>
                                                <th className="px-6 py-4 text-[10px] uppercase tracking-wider text-right">Saldo Final</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 text-[11px] font-bold">
                                            {result.detalles.map((cuota, idx) => {
                                                // Calcular fecha proyectada
                                                const fechaBase = new Date(formData.fecha_inicio_prestamo);
                                                fechaBase.setMonth(fechaBase.getMonth() + cuota.numero_cuota);
                                                const fechaFormateada = fechaBase.toLocaleDateString('es-PE', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric'
                                                });

                                                return (
                                                    <tr key={cuota.numero_cuota} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-4 text-gray-900">{cuota.numero_cuota}</td>
                                                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{cuota.fecha_pago || fechaFormateada}</td>
                                                        <td className="px-6 py-4 text-gray-400">{result.codigo_moneda === 1 ? 'S/' : '$'} {cuota.saldo_inicial || '0.00'}</td>
                                                        <td className="px-6 py-4 text-gray-600">{result.codigo_moneda === 1 ? 'S/' : '$'} {cuota.amortizacion}</td>
                                                        <td className="px-6 py-4 text-gray-600">{result.codigo_moneda === 1 ? 'S/' : '$'} {cuota.interes}</td>
                                                        <td className="px-6 py-4 text-gray-400 text-center">{result.codigo_moneda === 1 ? 'S/' : '$'} {cuota.seguro_desgravamen || cuota.seguro || '0.00'}</td>
                                                        <td className="px-6 py-4 text-brand-blue text-right font-black">{result.codigo_moneda === 1 ? 'S/' : '$'} {cuota.cuota_total}</td>
                                                        <td className="px-6 py-4 text-gray-900 text-right">{result.codigo_moneda === 1 ? 'S/' : '$'} {cuota.saldo_final}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )
                }
            </main >
        </div >
    );
};

export default SimulationPage;
