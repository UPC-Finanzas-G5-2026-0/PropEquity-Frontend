import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getUnits } from '../services/unitService';
import { createSimulation, exportToExcel, exportToPDF } from '../services/simulationService';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SavingsIcon from '@mui/icons-material/Savings';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import PaymentsIcon from '@mui/icons-material/Payments';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CustomSelect from '../components/CustomSelect';

const SimulationPage = () => {
    const { user } = useAuth();
    const location = useLocation();

    const userRole = (user?.rol_rel?.tipo_rol || user?.role || user?.rol || '').toLowerCase();
    const userId = user?.codigo_usuario || user?.id;
    const unidadPreseleccionada = location.state?.unidadSeleccionada;

    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [serverError, setServerError] = useState(null);
    const [cuotaType, setCuotaType] = useState('porcentaje');

    // 🚨 ESTADOS PARA BÚSQUEDA EN VIVO: IFM y Status del Prospecto/Cliente
    const [prospectIFM, setProspectIFM] = useState(0);
    const [prospectStatus, setProspectStatus] = useState('');

    const getErrorTitle = (errorMsg) => {
        const lowerMsg = errorMsg.toLowerCase();
        if (lowerMsg.includes('90%') || lowerMsg.includes('excede') || lowerMsg.includes('ltv')) return 'Financiamiento excede 90%';
        if (lowerMsg.includes('cuota inicial') || lowerMsg.includes('inicial mínima') || lowerMsg.includes('10%')) return 'Cuota inicial insuficiente';
        if (lowerMsg.includes('ingreso') || lowerMsg.includes('ratio') || lowerMsg.includes('40%') || lowerMsg.includes('50%')) return 'Capacidad de pago excedida';
        if (lowerMsg.includes('plazo')) return 'Plazo fuera de rango';
        if (lowerMsg.includes('bbp') || lowerMsg.includes('bono')) return 'Error con BBP';
        if (lowerMsg.includes('precio') || lowerMsg.includes('mivivienda')) return 'Precio fuera de rango';
        if (lowerMsg.includes('prospecto')) return 'Falta ID';
        return 'Error de validación';
    };

    const [formData, setFormData] = useState({
        codigo_unidad: unidadPreseleccionada ? String(unidadPreseleccionada.codigo_unidad) : '',
        codigo_prospecto: '',
        cuota_inicial: '10',
        gastos_tasacion: '250',
        gastos_notariales: '1200',
        gastos_estudio_titulos: '300',
        comision_ifi: '0',
        bono_bbp: '0',
        sin_bono: true,
        es_integrador: false,
        categoria_integrador: 'Menores ingresos',
        vivienda_sostenible: false,
        ifi_seleccionada: '',
        codigo_tipo_tasa: '2',
        tasa_anual: '10',
        capitalizacion: 'Mensual',
        plazo_meses: '240',
        codigo_tipo_gracia: '1',
        meses_gracia: '0',
        seguro_desgravamen: '0.00039',
        tipo_cambio: '3.80',
        ha_recibido_apoyo: false,
        tiene_credito_activo: false,
        fecha_inicio_prestamo: new Date().toISOString().split('T')[0]
    });

    const selectedUnit = units.find(u => String(u.codigo_unidad) === formData.codigo_unidad);

    const fetchUnits = async () => {
        try {
            const response = await getUnits();
            if (response.success) {
                setUnits(response.data);
                if (response.data.length > 0 && !formData.codigo_unidad) {
                    setFormData(prev => ({ ...prev, codigo_unidad: String(response.data[0].codigo_unidad) }));
                }
            }
        } catch (error) {
            console.error("Error cargando unidades:", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (e.target.type === 'number' && parseFloat(value) < 0) return;
        setFormData(prev => ({ ...prev, [name]: value }));
        setResult(null);
        setServerError(null);
    };

    const handleCustomChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: String(value) }));
        setResult(null);
        setServerError(null);
    };

    // 🚨 EFECTO NINJA: Búsqueda dinámica con el nuevo endpoint `/check-income/`
    useEffect(() => {
        const fetchProspect = async () => {
            if (userRole === 'asesor' && formData.codigo_prospecto) {
                setProspectStatus('Buscando...');
                try {
                    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

                    const response = await fetch(`http://localhost:8000/api/v1/simulator/check-income/${formData.codigo_prospecto}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setProspectIFM(data.ifm);
                        setProspectStatus(`✓ Ingresos cargados (${data.type})`);
                    } else {
                        setProspectIFM(0);
                        setProspectStatus('⚠ ID no encontrado en BD');
                    }
                } catch (error) {
                    setProspectIFM(0);
                    setProspectStatus('⚠ Error de red');
                }
            } else {
                setProspectIFM(0);
                setProspectStatus('');
            }
        };

        const timer = setTimeout(fetchProspect, 600); // 600ms de delay para no saturar al escribir
        return () => clearTimeout(timer);
    }, [formData.codigo_prospecto, userRole]);

    useEffect(() => {
        fetchUnits();
        const handleFocus = () => fetchUnits();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const BONO_INTEGRADOR = 3600;
    const BBP_RANGES = [
        { min: 68800, max: 97800, rango: 'R1', tradicional: 35100, sostenible: 41400 },
        { min: 97801, max: 146900, rango: 'R2', tradicional: 28000, sostenible: 34300 },
        { min: 146901, max: 244600, rango: 'R3', tradicional: 20900, sostenible: 27200 },
        { min: 244601, max: 362100, rango: 'R4', tradicional: 7800, sostenible: 14100 },
        { min: 362101, max: 488800, rango: 'R5', tradicional: 0, sostenible: 0 }
    ];

    const calculateBBP = (precio, moneda, sostenible = false, integrador = false, tc = 3.80) => {
        let pPEN = parseFloat(precio);
        const isUSD = moneda === 2 || moneda === 'USD';
        if (isUSD) pPEN = pPEN * tc;

        const rangoAplicable = BBP_RANGES.find(r => pPEN >= r.min && pPEN <= r.max);
        if (!rangoAplicable) return '0';

        let bonoPEN = sostenible ? rangoAplicable.sostenible : rangoAplicable.tradicional;
        if (integrador && rangoAplicable.rango !== 'R5') bonoPEN += BONO_INTEGRADOR;

        return isUSD ? (bonoPEN / tc).toFixed(2) : bonoPEN.toString();
    };

    const getRangoInfo = (precio, moneda, tc = 3.80) => {
        let pPEN = parseFloat(precio);
        const isUSD = moneda === 2 || moneda === 'USD';
        if (isUSD) pPEN = pPEN * tc;
        return BBP_RANGES.find(r => pPEN >= r.min && pPEN <= r.max) || null;
    };

    useEffect(() => {
        if (selectedUnit) {
            const m = selectedUnit.moneda || selectedUnit.codigo_moneda;
            if (formData.sin_bono || formData.ha_recibido_apoyo || formData.tiene_credito_activo) {
                setFormData(prev => ({ ...prev, bono_bbp: '0' }));
                return;
            }

            let isIntegradorEligible = formData.es_integrador;
            const currentIFM = userRole === 'asesor' ? prospectIFM : (parseFloat(user?.ingreso_mensual || 0) + parseFloat(user?.ingreso_conyuge || 0));

            if (formData.es_integrador && formData.categoria_integrador === 'Menores ingresos') {
                if (currentIFM > 4746) isIntegradorEligible = false;
            }

            const bono = calculateBBP(selectedUnit.precio_venta, m, formData.vivienda_sostenible, isIntegradorEligible, parseFloat(formData.tipo_cambio || 3.80));
            setFormData(prev => ({ ...prev, bono_bbp: bono }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedUnit, formData.vivienda_sostenible, formData.es_integrador, formData.categoria_integrador, formData.sin_bono, formData.ha_recibido_apoyo, formData.tiene_credito_activo, formData.tipo_cambio, prospectIFM, user?.ingreso_mensual, user?.ingreso_conyuge, userRole]);

    useEffect(() => {
        if (formData.ifi_seleccionada && formData.codigo_tipo_tasa === '1') {
            setFormData(prev => ({ ...prev, codigo_tipo_tasa: '2' }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.ifi_seleccionada]);

    useEffect(() => {
        if (!formData.ifi_seleccionada || !selectedUnit) return;
        const p = selectedUnit.precio_venta;
        const b = parseFloat(formData.bono_bbp || 0);
        const val = parseFloat(formData.cuota_inicial || 0);
        const ini = cuotaType === 'porcentaje' ? (val / 100) * p : val;
        const montoFinanciar = p - ini - b;
        const bankRates = {
            'Pichincha': [{ max: 100000, tea: 15.00 }, { max: 200000, tea: 14.00 }, { max: Infinity, tea: 13.00 }],
            'Interbank': [{ max: 100000, tea: 10.60 }, { max: 200000, tea: 10.40 }, { max: 300000, tea: 10.25 }, { max: Infinity, tea: 10.05 }],
            'BBVA': [{ max: 94999, tea: 13.10 }, { max: Infinity, tea: 12.90 }],
            'BCP': [{ max: Infinity, tea: 13.99 }],
            'GNB': [{ max: Infinity, tea: 13.25 }]
        };
        const rules = bankRates[formData.ifi_seleccionada];
        if (rules) {
            const rule = rules.find(r => montoFinanciar <= r.max) || rules[rules.length - 1];
            setFormData(prev => ({ ...prev, tasa_anual: rule.tea.toString() }));
        }
    }, [formData.ifi_seleccionada, formData.cuota_inicial, cuotaType, selectedUnit, formData.bono_bbp]);

    const handleSimulate = async () => {
        if (userRole === 'asesor' && !formData.codigo_prospecto) {
            setServerError({ titulo: 'Falta ID', mensaje: 'Debes ingresar el ID del cliente o prospecto para simular.' });
            return;
        }

        const val = parseFloat(formData.cuota_inicial);
        const plazo = parseInt(formData.plazo_meses);
        const precio = selectedUnit?.precio_venta || 0;
        let finalCuotaInicial = cuotaType === 'porcentaje' ? (val / 100) * precio : val;
        const totalGastosCierre = parseFloat(formData.gastos_tasacion || 0) + parseFloat(formData.gastos_notariales || 0) + parseFloat(formData.gastos_estudio_titulos || 0) + parseFloat(formData.comision_ifi || 0);

        setLoading(true);
        setServerError(null);
        try {
            const TIPO_TASA_MAP = { '1': 'Nominal', '2': 'Efectiva' };
            const TIPO_GRACIA_MAP = { '1': 'Ninguno', '2': 'Parcial', '3': 'Total' };
            let tipoBbp = "Ninguno";
            if (!formData.sin_bono) {
                if (selectedUnit?.es_sostenible) tipoBbp = formData.es_integrador ? "Integrador Sostenible" : "Sostenible";
                else tipoBbp = formData.es_integrador ? "Integrador Tradicional" : "Tradicional";
            }

            const payload = {
                codigo_unidad: parseInt(formData.codigo_unidad),
                cuota_inicial: parseFloat(finalCuotaInicial),
                gastos_cierre: totalGastosCierre,
                tipo_bbp: tipoBbp,
                categoria_integrador: formData.es_integrador ? formData.categoria_integrador : null,
                ifi_seleccionada: formData.ifi_seleccionada || null,
                tipo_tasa: TIPO_TASA_MAP[formData.codigo_tipo_tasa] || 'Efectiva',
                tasa_anual: parseFloat(formData.tasa_anual),
                capitalizacion: formData.capitalizacion,
                plazo_meses: plazo,
                tipo_gracia: TIPO_GRACIA_MAP[formData.codigo_tipo_gracia] || 'Ninguno',
                meses_gracia: parseInt(formData.meses_gracia),
                seguro_desgravamen: parseFloat(formData.seguro_desgravamen),
                tipo_cambio: parseFloat(formData.tipo_cambio),
                ha_recibido_apoyo: formData.ha_recibido_apoyo,
                tiene_credito_activo: formData.tiene_credito_activo,
                codigo_cliente: userRole === 'cliente' ? userId : null,
                codigo_asesor: userRole === 'asesor' ? userId : null,
                codigo_prospecto: userRole === 'asesor' ? parseInt(formData.codigo_prospecto) : null,
                fecha_inicio_prestamo: formData.fecha_inicio_prestamo
            };

            const response = await createSimulation(payload);
            if (response.success) {
                setResult(response.data);
                setServerError(null);
                setTimeout(() => { document.getElementById('simulation-result')?.scrollIntoView({ behavior: 'smooth' }); }, 100);
            } else {
                setServerError({ titulo: getErrorTitle(response.error), mensaje: response.error });
                setResult(null);
            }
        } catch (error) {
            console.error(error);
            const msg = error.message || 'Error al simular';
            setServerError({ titulo: getErrorTitle(msg), mensaje: msg });
            setResult(null);
        } finally { setLoading(false); }
    };

    useEffect(() => {
        if (selectedUnit) {
            setFormData(prev => ({ ...prev, vivienda_sostenible: selectedUnit.es_sostenible || false, es_integrador: false, sin_bono: true }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedUnit]);

    // 🚨 ASIGNACIÓN VISUAL DINÁMICA
    const visualIFM = userRole === 'asesor'
        ? prospectIFM
        : (parseFloat(user?.ingreso_mensual || 0) + parseFloat(user?.ingreso_conyuge || 0));

    return (
        <div className="flex bg-[#F8FAFC] min-h-screen font-['Inter',_sans-serif]">
            <Sidebar />
            <main className="flex-1 p-4 overflow-y-auto bg-gray-50/50">
                <header className="mb-3 flex justify-between items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                    <div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tighter leading-none">Simulador PropEquity</h1>
                        <p className="text-gray-400 text-[9px] font-bold mt-0.5 uppercase tracking-[0.2em]">Crédito MiVivienda 2026</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start mb-6">
                    <div className="xl:col-span-9 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Inmueble y Cliente */}
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-black text-brand-blue uppercase tracking-widest border-b border-gray-50 pb-2 mb-1">Inmueble</h3>

                                {/* 🚨 CAJA DE BÚSQUEDA DEL ASESOR */}
                                {userRole === 'asesor' && (
                                    <div className="bg-orange-50 border border-orange-100 p-2 rounded-xl mb-3">
                                        <label className="flex items-center gap-1 text-[9px] font-black text-brand-orange uppercase tracking-widest mb-1">
                                            <PersonOutlineIcon sx={{ fontSize: 12 }} /> ID del Prospecto/Cliente
                                        </label>
                                        <input
                                            type="number"
                                            name="codigo_prospecto"
                                            value={formData.codigo_prospecto}
                                            onChange={handleChange}
                                            placeholder="Ej: 126"
                                            className="w-full bg-white border border-orange-200 rounded-md py-1.5 px-2 text-xs font-bold text-gray-700 focus:outline-none focus:border-brand-orange shadow-sm"
                                        />
                                        {prospectStatus && (
                                            <p className={`text-[8px] font-bold mt-1.5 leading-tight ${prospectIFM > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                {prospectStatus}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <CustomSelect label="Unidad" value={formData.codigo_unidad} showInfo={true} onChange={(val) => handleCustomChange('codigo_unidad', val)} options={units.map(u => ({ id: u.codigo_unidad, label: `${u.distrito_unidad} - ${u.direccion_unidad}` }))} />

                                {selectedUnit && (() => {
                                    const rangoInfo = getRangoInfo(selectedUnit.precio_venta, selectedUnit.moneda || selectedUnit.codigo_moneda, parseFloat(formData.tipo_cambio || 3.80));
                                    const m = selectedUnit.moneda === 2 || selectedUnit.codigo_moneda === 2;
                                    return (
                                        <div className="bg-gray-50/50 p-2 rounded-lg border border-gray-100 space-y-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[8px] font-bold text-gray-400 uppercase">Precio</span>
                                                <span className="text-[10px] font-black text-gray-700">{m ? '$' : 'S/'} {parseFloat(selectedUnit.precio_venta).toLocaleString()}</span>
                                            </div>
                                            {rangoInfo ? (
                                                <p className="text-[7px] font-semibold text-green-600">✓ {rangoInfo.rango} - Elegible MiVivienda</p>
                                            ) : (
                                                <p className="text-[7px] font-semibold text-red-500">⚠ Fuera de rango MiVivienda (S/68,800 - S/488,800)</p>
                                            )}
                                        </div>
                                    );
                                })()}

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Plazo (Meses)</label>
                                    <input type="number" name="plazo_meses" value={formData.plazo_meses} onChange={handleChange} min="60" max="240" className="w-full bg-transparent border-b border-gray-100 py-1 px-1 focus:outline-none focus:border-brand-blue font-black text-gray-700 text-sm" />
                                    <p className="text-[7px] font-medium text-gray-400 mt-0.5 ml-1">Rango permitido: 60 - 240 meses (5 a 20 años)</p>
                                    {parseInt(formData.plazo_meses) < 60 && <p className="text-[8px] text-red-500 font-bold ml-1">⚠ Mínimo 60 meses</p>}
                                    {parseInt(formData.plazo_meses) > 240 && <p className="text-[8px] text-red-500 font-bold ml-1">⚠ Máximo 240 meses</p>}
                                    {parseInt(formData.plazo_meses) >= 60 && parseInt(formData.plazo_meses) <= 240 && <p className="text-[7px] text-green-600 font-semibold ml-1">✓ Plazo válido</p>}
                                </div>
                                <CustomSelect label="Periodo de Gracia" value={formData.codigo_tipo_gracia} showInfo={true} onChange={(val) => handleCustomChange('codigo_tipo_gracia', val)} options={[{ id: '1', label: 'Sin Gracia' }, { id: '2', label: 'Parcial' }, { id: '3', label: 'Total' }]} />
                                {formData.codigo_tipo_gracia !== '1' && (
                                    <div className="animate-in fade-in duration-300">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Meses de Gracia</label>
                                        <input type="number" name="meses_gracia" value={formData.meses_gracia} onChange={handleChange} className="w-full bg-transparent border-b border-gray-100 py-1 px-1 focus:outline-none focus:border-brand-blue font-black text-gray-700 text-sm" />
                                        {parseInt(formData.meses_gracia) < 1 && <p className="text-[8px] text-red-500 font-bold mt-1">Requerido al menos 1 mes</p>}
                                        {parseInt(formData.meses_gracia) >= parseInt(formData.plazo_meses) && <p className="text-[8px] text-red-500 font-bold mt-1">Debe ser menor al plazo</p>}
                                    </div>
                                )}
                            </div>

                            {/* Aportes */}
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-black text-brand-blue uppercase tracking-widest border-b border-gray-50 pb-2 mb-1">Aportes</h3>
                                <div>
                                    <div className="flex justify-between items-center mb-1 ml-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inicial</label>
                                        <div className="flex bg-gray-50 p-0.5 rounded-lg border border-gray-100">
                                            <button onClick={() => setCuotaType('porcentaje')} className={`px-2 py-0.5 rounded-md text-[8px] font-black transition-all ${cuotaType === 'porcentaje' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-300'}`}>%</button>
                                            <button onClick={() => setCuotaType('monto')} className={`px-2 py-0.5 rounded-md text-[8px] font-black transition-all ${cuotaType === 'monto' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-300'}`}>S/</button>
                                        </div>
                                    </div>
                                    <input type="number" name="cuota_inicial" value={formData.cuota_inicial} onChange={handleChange} className="w-full bg-transparent border-b border-gray-100 py-1 px-1 focus:outline-none focus:border-brand-blue font-black text-gray-900 text-sm" />
                                    {selectedUnit && (() => {
                                        const p = selectedUnit?.precio_venta || 0;
                                        const val = parseFloat(formData.cuota_inicial);
                                        const ini = cuotaType === 'porcentaje' ? (val / 100) * p : val;
                                        const minPerc = selectedUnit?.codigo_modalidad === 1 ? 0.10 : 0.075;
                                        const minMonto = p * minPerc;
                                        const moneda = selectedUnit?.moneda === 2 ? '$' : 'S/';
                                        const isValid = ini >= minMonto;
                                        return (
                                            <>
                                                <p className="text-[7px] font-medium text-gray-400 mt-0.5 ml-1">
                                                    Mínimo {(minPerc * 100)}%: {moneda} {minMonto.toLocaleString()}
                                                </p>
                                                {isValid ? (
                                                    <p className="text-[7px] text-green-600 font-semibold ml-1">✓ Cuota inicial válida ({((ini / p) * 100).toFixed(1)}%)</p>
                                                ) : (
                                                    <p className="text-[7px] text-red-500 font-semibold ml-1">⚠ Insuficiente (actual: {((ini / p) * 100).toFixed(1)}%)</p>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                                {selectedUnit && (
                                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${selectedUnit.es_sostenible ? 'bg-emerald-50/50 border-emerald-100' : 'bg-gray-50/50 border-gray-100'}`}>
                                        <SavingsIcon sx={{ fontSize: 14, color: selectedUnit.es_sostenible ? '#10b981' : '#94a3b8' }} />
                                        <p className={`text-[9px] font-black uppercase ${selectedUnit.es_sostenible ? 'text-emerald-600' : 'text-gray-400'} leading-none`}>{selectedUnit.es_sostenible ? 'Sostenibilidad Grado III' : 'Inmueble Tradicional'}</p>
                                    </div>
                                )}
                                <div className="space-y-1 bg-gray-50/50 p-1 rounded-xl border border-gray-100">
                                    <p className="text-[8px] font-black text-gray-400 uppercase text-center mb-1">Modalidad de Bono</p>
                                    {(() => {
                                        const p = parseFloat(selectedUnit?.precio_venta || 0);
                                        const mod = parseInt(selectedUnit?.codigo_modalidad || 0);
                                        const isOwner = user?.es_propietario_vivienda;

                                        if (p > 362100) return <p className="text-[8px] font-bold text-amber-500 p-2 uppercase text-center">R5: Solo Bono Integrador</p>;
                                        if (mod === 3) return <p className="text-[8px] font-bold text-red-400 p-2 uppercase text-center">Mejoramiento: Sin BBP</p>;
                                        if (isOwner) return <p className="text-[8px] font-bold text-red-400 p-2 uppercase text-center">Propietario actual: Sin BBP</p>;

                                        const isSostenible = selectedUnit?.es_sostenible || false;
                                        const opciones = isSostenible
                                            ? [{ label: 'Sin Bono', sinBono: true, sostenible: false, integrador: false }, { label: 'Sostenible', sinBono: false, sostenible: true, integrador: false }, { label: 'Integrador', sinBono: false, sostenible: true, integrador: true }]
                                            : [{ label: 'Sin Bono', sinBono: true, sostenible: false, integrador: false }, { label: 'Tradicional', sinBono: false, sostenible: false, integrador: false }, { label: 'Integrador', sinBono: false, sostenible: false, integrador: true }];
                                        const activeIdx = formData.sin_bono ? 0 : formData.es_integrador ? 2 : 1;
                                        return opciones.map((op, idx) => (
                                            <button key={op.label} type="button" onClick={() => setFormData(prev => ({ ...prev, sin_bono: op.sinBono, vivienda_sostenible: op.sostenible, es_integrador: op.integrador }))} className={`w-full py-1.5 rounded-lg text-[9px] font-black uppercase text-left px-3 ${activeIdx === idx ? 'bg-brand-blue text-white shadow-md' : 'text-gray-400 hover:bg-gray-100/50'}`}>{op.label}</button>
                                        ));
                                    })()}
                                </div>
                                {formData.es_integrador && (
                                    <div className="animate-in slide-in-from-top-2 duration-300">
                                        <CustomSelect label="Categoría Integrador" value={formData.categoria_integrador} onChange={(val) => handleCustomChange('categoria_integrador', val)} options={[{ id: 'Menores ingresos', label: 'Menores Ingresos' }, { id: 'Adulto mayor', label: 'Adulto Mayor' }, { id: 'Desplazados', label: 'Desplazados' }, { id: 'Miembros FF.AA.', label: 'FF.AA. / PNP' }]} />
                                        {formData.categoria_integrador === 'Menores ingresos' && visualIFM > 4746 && (
                                            <p className="text-[8px] text-red-500 font-bold mt-1 bg-red-50 p-1.5 rounded-lg border border-red-100">Excede Ingresos (S/ 4,746)</p>
                                        )}
                                    </div>
                                )}
                                <div className="space-y-2 bg-gray-50/50 p-2 rounded-xl border border-gray-100">
                                    <p className="text-[8px] font-black text-gray-400 uppercase text-center mb-1">Elegibilidad FMV</p>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" checked={formData.ha_recibido_apoyo} onChange={(e) => setFormData(prev => ({ ...prev, ha_recibido_apoyo: e.target.checked }))} className="w-3 h-3 rounded text-brand-blue focus:ring-brand-blue transition-all" />
                                        <span className="text-[8px] font-bold text-gray-500 uppercase group-hover:text-brand-blue transition-colors leading-none">¿Ya recibió apoyo estatal?</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" checked={formData.tiene_credito_activo} onChange={(e) => setFormData(prev => ({ ...prev, tiene_credito_activo: e.target.checked }))} className="w-3 h-3 rounded text-brand-blue focus:ring-brand-blue transition-all" />
                                        <span className="text-[8px] font-bold text-gray-500 uppercase group-hover:text-brand-blue transition-colors leading-none">¿Tiene crédito FMV activo?</span>
                                    </label>
                                </div>
                            </div>

                            {/* Banco */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-brand-blue uppercase tracking-widest border-b border-gray-50 pb-2 mb-1">Banco</h3>
                                <CustomSelect label="Entidad (IFI)" value={formData.ifi_seleccionada} showInfo={true} onChange={(val) => handleCustomChange('ifi_seleccionada', val)} options={[{ id: '', label: 'Cálculo Genérico' }, { id: 'BCP', label: 'BCP' }, { id: 'BBVA', label: 'BBVA' }, { id: 'Interbank', label: 'Interbank' }, { id: 'Pichincha', label: 'Banco Pichincha' }, { id: 'GNB', label: 'GNB' }]} />
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Tasa Anual (%)</label>
                                    <input type="number" name="tasa_anual" value={formData.tasa_anual} onChange={handleChange} className="w-full bg-transparent border-b border-gray-100 py-1.5 px-1 focus:outline-none focus:border-brand-blue font-black text-gray-900 text-sm" />
                                </div>
                                <CustomSelect label="Tipo de Tasa" value={formData.codigo_tipo_tasa} showInfo={true} onChange={(val) => handleCustomChange('codigo_tipo_tasa', val)} options={[{ id: '1', label: 'Nominal (TNA)' }, { id: '2', label: 'Efectiva (TEA)' }]} />

                                <div className={`transition-all duration-300 ${formData.codigo_tipo_tasa === '1' ? 'opacity-100 h-auto mb-2' : 'opacity-40 h-auto pointer-events-none'}`}>
                                    <CustomSelect label="Capitalización" value={formData.capitalizacion} showInfo={true} onChange={(val) => handleCustomChange('capitalizacion', val)} options={[{ id: 'Mensual', label: 'Mensual' }, { id: 'Bimestral', label: 'Bimestral' }, { id: 'Trimestral', label: 'Trimestral' }]} />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Fecha de Inicio</label>
                                    <input type="date" name="fecha_inicio_prestamo" value={formData.fecha_inicio_prestamo} onChange={handleChange} className="w-full bg-transparent border-b border-gray-100 py-1.5 px-1 focus:outline-none focus:border-brand-blue font-black text-gray-900 text-[11px]" />
                                </div>
                            </div>

                            {/* Detalle Gastos */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-brand-blue uppercase tracking-widest border-b border-gray-50 pb-2 mb-1">Detalle</h3>
                                <div className="bg-gray-50/20 p-2.5 rounded-xl border border-gray-100 space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><label className="block text-[7px] font-black text-gray-400 uppercase mb-0.5">Tasación</label><input type="number" name="gastos_tasacion" value={formData.gastos_tasacion} onChange={handleChange} className="w-full bg-white border border-gray-100 rounded-md py-1 px-1.5 text-[10px] font-bold focus:outline-none focus:border-brand-blue shadow-sm" /></div>
                                        <div><label className="block text-[7px] font-black text-gray-400 uppercase mb-0.5">CRI/Títulos</label><input type="number" name="gastos_estudio_titulos" value={formData.gastos_estudio_titulos} onChange={handleChange} className="w-full bg-white border border-gray-100 rounded-md py-1 px-1.5 text-[10px] font-bold focus:outline-none focus:border-brand-blue shadow-sm" /></div>
                                        <div><label className="block text-[7px] font-black text-gray-400 uppercase mb-0.5">Notaría</label><input type="number" name="gastos_notariales" value={formData.gastos_notariales} onChange={handleChange} className="w-full bg-white border border-gray-100 rounded-md py-1 px-1.5 text-[10px] font-bold focus:outline-none focus:border-brand-blue shadow-sm" /></div>
                                        <div><label className="block text-[7px] font-black text-gray-400 uppercase mb-0.5">Comis. Banco</label><input type="number" name="comision_ifi" value={formData.comision_ifi} onChange={handleChange} className="w-full bg-white border border-gray-100 rounded-md py-1 px-1.5 text-[10px] font-bold focus:outline-none focus:border-brand-blue shadow-sm" /></div>
                                    </div>
                                    {selectedUnit && (() => {
                                        const totalGastos = parseFloat(formData.gastos_tasacion || 0) + parseFloat(formData.gastos_notariales || 0) + parseFloat(formData.gastos_estudio_titulos || 0) + parseFloat(formData.comision_ifi || 0);
                                        const precio = parseFloat(selectedUnit.precio_venta || 0);
                                        const pct = precio > 0 ? (totalGastos / precio) * 100 : 0;
                                        const isValid = pct <= 5;
                                        return (
                                            <div className={`text-[7px] font-semibold px-1 ${isValid ? 'text-green-600' : 'text-red-500'}`}>
                                                {isValid ? '✓' : '⚠'} Gastos cierre: {pct.toFixed(2)}% del precio (máx. 5%)
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div className="pt-2">
                                    <button onClick={handleSimulate} disabled={loading} className="w-full bg-brand-orange hover:bg-orange-600 text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-brand-orange/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95">
                                        {loading ? "Calculando..." : <>GENERAR PROYECCIÓN <ArrowForwardIcon sx={{ fontSize: 14 }} /></>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="xl:col-span-3 bg-[#0F172A] p-5 rounded-2xl text-white shadow-xl self-start sticky top-4">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                                <ShowChartIcon className="text-brand-blue-light" sx={{ fontSize: 18 }} />
                                <h3 className="text-xs font-black uppercase tracking-widest text-brand-blue-light">Análisis en Vivo</h3>
                            </div>

                            {/* Desglose de Montos */}
                            <div className="space-y-2 px-1">
                                <div className="flex justify-between items-center"><p className="text-[8px] text-gray-400 uppercase font-black">Valor Vivienda</p><p className="text-[11px] font-black">{selectedUnit?.moneda === 2 ? '$' : 'S/'} {parseFloat(selectedUnit?.precio_venta || 0).toLocaleString()}</p></div>
                                <div className="flex justify-between items-center"><p className="text-[8px] text-gray-400 uppercase font-black">(-) Cuota Inicial</p><p className="text-[11px] font-black text-rose-400">- {selectedUnit?.moneda === 2 ? '$' : 'S/'} {(() => { const p = parseFloat(selectedUnit?.precio_venta || 0); const v = parseFloat(formData.cuota_inicial || 0); return (cuotaType === 'porcentaje' ? (v / 100) * p : v).toLocaleString(); })()}</p></div>
                                <div className="flex justify-between items-center"><p className="text-[8px] text-gray-400 uppercase font-black">(-) Bono BBP</p><p className="text-[11px] font-black text-emerald-400">- {selectedUnit?.moneda === 2 ? '$' : 'S/'} {parseFloat(formData.bono_bbp).toLocaleString()}</p></div>
                                <div className="pt-2 border-t border-white/10 flex justify-between items-center"><p className="text-[8px] text-brand-blue-light uppercase font-black">Crédito Neto</p><p className="text-[12px] font-black text-brand-blue-light">{selectedUnit?.moneda === 2 ? '$' : 'S/'} {(() => { const p = parseFloat(selectedUnit?.precio_venta || 0); const b = parseFloat(formData.bono_bbp || 0); const val = parseFloat(formData.cuota_inicial || 0); const ini = cuotaType === 'porcentaje' ? (val / 100) * p : val; return (p - ini - b).toLocaleString(); })()}</p></div>

                                <div className="flex justify-between items-center pt-1"><p className="text-[8px] text-gray-400 uppercase font-black">Ingreso Familiar (IFM)</p><p className="text-[11px] font-black text-white">S/ {visualIFM.toLocaleString()}</p></div>

                                {userRole !== 'asesor' && parseFloat(user?.ingreso_conyuge || 0) > 0 && (
                                    <div className="flex justify-between items-center opacity-40 -mt-1"><p className="text-[6px] text-gray-300 uppercase font-bold tracking-tighter">└ T: S/ {parseFloat(user?.ingreso_mensual || 0).toLocaleString()} | C: S/ {parseFloat(user?.ingreso_conyuge || 0).toLocaleString()}</p></div>
                                )}
                            </div>

                            <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-1.5">
                                <div className="flex justify-between text-[9px] font-bold text-gray-300">
                                    <span className="uppercase opacity-60">Gastos Operativos</span>
                                    <span>
                                        {selectedUnit?.moneda === 2 ? '$' : 'S/'}
                                        {(parseFloat(formData.gastos_tasacion || 0) + parseFloat(formData.gastos_notariales || 0) + parseFloat(formData.gastos_estudio_titulos || 0) + parseFloat(formData.comision_ifi || 0)).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-[9px] font-bold text-gray-300">
                                    <span className="uppercase opacity-60">Tasa Mensual (TEM)</span>
                                    <span className="text-brand-blue-light">
                                        {(() => {
                                            const annualRate = parseFloat(formData.tasa_anual) / 100;
                                            let tea = annualRate;

                                            if (formData.codigo_tipo_tasa === '1') {
                                                const m_map = { 'Diaria': 360, 'Quincenal': 24, 'Mensual': 12, 'Trimestral': 4, 'Semestral': 2 };
                                                const m = m_map[formData.capitalizacion] || 12;
                                                tea = Math.pow(1 + annualRate / m, m) - 1;
                                            }

                                            const tem = Math.pow(1 + tea, 1 / 12) - 1;
                                            return (tem * 100).toFixed(4) + '%';
                                        })()}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-brand-blue/20 p-5 rounded-xl border border-brand-blue/30 text-center relative overflow-hidden shadow-inner">
                                <AccountBalanceIcon className="absolute -right-3 -bottom-3 opacity-10 text-brand-blue-light" sx={{ fontSize: 80 }} />
                                <p className="text-[9px] font-black text-brand-blue-light uppercase mb-1.5 tracking-[0.2em] relative z-10">
                                    Cuota Mensual
                                </p>
                                {result ? (
                                    <>
                                        <p className="text-3xl font-black text-white relative z-10 drop-shadow-md">
                                            {result.codigo_moneda === 1 ? 'S/' : '$'} {parseFloat(result.detalles[1]?.cuota_total || result.detalles[0]?.cuota_total).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-[8px] text-emerald-400 font-bold uppercase mt-2 relative z-10 tracking-widest">✓ Calculado por el sistema</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-2xl font-black text-gray-400 relative z-10">
                                            --
                                        </p>
                                        <p className="text-[8px] text-gray-500 font-bold uppercase mt-2 relative z-10 tracking-widest">Generar simulación para ver</p>
                                    </>
                                )}
                            </div>

                            {/* Mensaje de error del backend */}
                            <div className="space-y-2 mt-4">
                                {serverError ? (
                                    <div className="bg-rose-500/15 border border-rose-500/30 p-2.5 rounded-lg">
                                        <div className="flex items-start gap-2">
                                            <ErrorOutlineIcon className="text-rose-400 shrink-0 mt-0.5" sx={{ fontSize: 14 }} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] font-bold text-rose-300">{serverError.titulo}</p>
                                                <p className="text-[8px] text-rose-200/80 mt-1 leading-relaxed">{serverError.mensaje}</p>
                                                <button
                                                    onClick={() => setServerError(null)}
                                                    className="mt-2 px-2 py-0.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded text-[8px] font-bold transition-colors"
                                                >
                                                    Cerrar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : !selectedUnit && (
                                    <div className="bg-blue-500/15 border border-blue-500/30 p-2.5 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <InfoOutlinedIcon className="text-blue-400" sx={{ fontSize: 14 }} />
                                            <p className="text-[9px] font-bold text-blue-300">Seleccione una unidad para simular</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {result && (
                    <div id="simulation-result" className="animate-in fade-in slide-in-from-bottom-5 duration-700">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                            {[
                                { label: 'Cuota Total', value: `${result.codigo_moneda === 1 ? 'S/' : '$'} ${result.detalles[1]?.cuota_total || result.detalles[0]?.cuota_total}`, icon: <PaymentsIcon sx={{ fontSize: 18 }} /> },
                                { label: 'Plazo', value: `${result.detalles.length} Meses`, icon: <CalendarMonthIcon sx={{ fontSize: 18 }} /> },
                                { label: 'TCEA Estimada', value: `${(result.tcea * 100).toFixed(2)}%`, icon: <QueryStatsIcon sx={{ fontSize: 18 }} /> },
                                { label: 'TEA Banco', value: `${(result.tea * 100).toFixed(2)}%`, icon: <ShowChartIcon sx={{ fontSize: 18 }} /> }
                            ].map((stat, i) => (
                                <div key={i} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3">
                                    <div className="text-brand-blue/30">{stat.icon}</div>
                                    <div><p className="text-[7px] font-black text-gray-400 uppercase leading-none mb-1">{stat.label}</p><p className="text-sm font-black text-gray-900 leading-none">{stat.value}</p></div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-50 flex justify-between items-center"><h3 className="text-xs font-black text-gray-900 uppercase tracking-tighter">Cronograma de Pagos</h3><div className="flex gap-2"><button onClick={() => exportToExcel(result.codigo_simulacion)} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg font-black text-[8px] uppercase hover:bg-green-100">Excel</button><button onClick={() => exportToPDF(result.codigo_simulacion)} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg font-black text-[8px] uppercase hover:bg-red-100">PDF</button></div></div>
                            <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-gray-50/30 text-[7px] font-black text-gray-400 uppercase">
                                <th className="px-5 py-2.5 border-b border-gray-100">N° Cuota</th><th className="px-5 py-2.5 border-b border-gray-100 text-center">Vencimiento</th><th className="px-5 py-2.5 border-b border-gray-100 text-right">Saldo Inicial</th><th className="px-5 py-2.5 border-b border-gray-100 text-right">Amortización</th><th className="px-5 py-2.5 border-b border-gray-100 text-right">Interés</th><th className="px-5 py-2.5 border-b border-gray-100 text-right bg-brand-blue/5 text-brand-blue">Cuota Total</th><th className="px-5 py-2.5 border-b border-gray-100 text-right">Saldo Final</th>
                            </tr></thead><tbody className="divide-y divide-gray-50 text-[9px] font-bold text-gray-700">
                            {result.detalles.map((cuota) => (
                                <tr key={cuota.numero_cuota} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-5 py-2.5">#{cuota.numero_cuota}</td>
                                    <td className="px-5 py-2.5 text-center text-gray-400">{cuota.fecha_vencimiento}</td>
                                    <td className="px-5 py-2.5 text-right">S/ {cuota.saldo_inicio?.toLocaleString()}</td>
                                    <td className="px-5 py-2.5 text-right">S/ {cuota.amortizacion.toLocaleString()}</td>
                                    <td className="px-5 py-2.5 text-right">S/ {cuota.interes.toLocaleString()}</td>
                                    <td className="px-5 py-2.5 text-right font-black text-brand-blue bg-brand-blue/[0.01]">S/ {cuota.cuota_total.toLocaleString()}</td>
                                    <td className="px-5 py-2.5 text-right">S/ {cuota.saldo_final?.toLocaleString()}</td>
                                </tr>
                            ))}
                            </tbody></table></div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default SimulationPage;
