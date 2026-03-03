import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { getUnits } from '../services/unitService';
import { createSimulation, exportToExcel, exportToPDF } from '../services/simulationService';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
import CustomSelect from '../components/CustomSelect';

const SimulationPage = () => {
    const navigate = useNavigate();
    const { id: simId } = useParams(); // ID de simulación guardada (modo vista)
    const location = useLocation();
    const initialUnitFromState = location.state?.unidadSeleccionada;
    const hasAutoSimulated = React.useRef(false);

    const [formData, setFormData] = useState({
        codigo_prospecto: '', // <-- ESTADO AGREGADO PARA EL ASESOR
        codigo_unidad: initialUnitFromState ? String(initialUnitFromState.codigo_unidad) : '',
        cuota_inicial: '10',
        gastos_tasacion: '0.00',
        gastos_notariales: '0.00',
        gastos_estudio_titulos: '0.00',
        comision_estudio: '0.00',
        comision_activacion: '0.00',
        bono_bbp: '0',
        sin_bono: initialUnitFromState?.precio_venta > 362100 ? true : false, // Auto-aplica bono si califica por precio
        es_integrador: false,
        categoria_integrador: 'Menores ingresos',
        vivienda_sostenible: initialUnitFromState?.es_sostenible || false,
        ifi_seleccionada: '',
        codigo_tipo_tasa: '2',
        tasa_anual: '10',
        capitalizacion: 'Mensual',
        plazo_meses: '240',
        codigo_tipo_gracia: '1',
        meses_gracia: '0',
        seguro_desgravamen: '0.039',
        tipo_cambio: '3.80',
        ha_recibido_apoyo: false,
        tiene_credito_activo: false,
        fecha_inicio_prestamo: new Date().toISOString().split('T')[0]
    });

    const [temValue, setTemValue] = useState('--');

    // Consultar TEM desde backend cada vez que cambia la tasa anual
    useEffect(() => {
        const fetchTEM = async () => {
            if (!formData.tasa_anual) {
                setTemValue('--');
                return;
            }
            try {
                const response = await api.get(`/simulator/tem?tea=${formData.tasa_anual}`);
                if (response.data && typeof response.data.tem !== 'undefined') {
                    setTemValue(`${parseFloat(response.data.tem).toFixed(4)}%`);
                } else {
                    setTemValue('--');
                }
            } catch {
                setTemValue('--');
            }
        };
        fetchTEM();
    }, [formData.tasa_anual]);

    // Guardar simulación — llama al backend con save=true para persistir en BD
    const handleSaveSimulation = async () => {
        if (!result || !lastPayload) {
            alert('Genera una proyección primero antes de guardar.');
            return;
        }
        setSaving(true);
        try {
            const response = await createSimulation(lastPayload, true); // save=true → persiste en BD
            if (response.success) {
                const codigo = response.data?.codigo_simulacion;
                alert(`✅ Simulación #${codigo} guardada correctamente.`);
                navigate('/cliente/dashboard');
            } else {
                alert(`Error al guardar: ${response.error}`);
            }
        } finally {
            setSaving(false);
        }
    };

    const { user } = useAuth();
    const userRole = (user?.rol_rel?.tipo_rol || user?.role || user?.rol || '').toLowerCase();
    const userId = user?.codigo_usuario || user?.id;
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [cuotaMoneda, setCuotaMoneda] = useState('S/');
    const [serverError, setServerError] = useState(null);
    const [cuotaType, setCuotaType] = useState('porcentaje');
    const [lastPayload, setLastPayload] = useState(null); // Payload del último cálculo
    const [saving, setSaving] = useState(false); // Estado del botón guardar
    const [prospectStatus, setProspectStatus] = useState('');
    const [prospectIFM, setProspectIFM] = useState(0);

    // Cargar simulación guardada si hay un ID en la URL (modo solo lectura)
    useEffect(() => {
        if (!simId) {
            if (!initialUnitFromState) {
                setResult(null);
                setServerError(null);
                setLastPayload(null);
            }
            return;
        }

        const loadSavedSimulation = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/simulator/${simId}`);
                const data = response.data;
                // Normalizar detalles
                if (data.detalles && !data.cronograma) data.cronograma = data.detalles;
                setResult(data);

                // Poblamos el formulario con los datos de la simulación guardada
                setFormData({
                    codigo_prospecto: String(data.codigo_prospecto || ''),
                    codigo_unidad: String(data.codigo_unit || data.codigo_unidad || ''),
                    cuota_inicial: String(data.cuota_inicial || '0'),
                    gastos_tasacion: String(data.tasacion || '0.00'),
                    gastos_notariales: String(data.coste_notarial || '0.00'),
                    gastos_estudio_titulos: String(data.coste_registral || '0.00'),
                    comision_estudio: String(data.comision_estudio || '0.00'),
                    comision_activacion: String(data.comision_activacion || '0.00'),
                    bono_bbp: String(data.bono_bbp || '0'),
                    sin_bono: !data.bono_bbp || data.bono_bbp === 0,
                    es_integrador: data.tipo_bbp === 'integrador',
                    vivienda_sostenible: data.tipo_bbp === 'sostenible',
                    ifi_seleccionada: data.ifi_seleccionada || '',
                    codigo_tipo_tasa: String(data.tipo_tasa || '2'),
                    tasa_anual: String(data.tasa_anual || '10'),
                    capitalizacion: data.capitalizacion || 'Mensual',
                    plazo_meses: String(data.plazo_meses || '240'),
                    codigo_tipo_gracia: String(data.tipo_gracia || '1'),
                    meses_gracia: String(data.meses_gracia || '0'),
                    seguro_desgravamen: String(data.seguro_desgravamen || '0.039'),
                    tipo_cambio: String(data.tipo_cambio || '3.80'),
                    fecha_inicio_prestamo: data.fecha_inicio_prestamo ? data.fecha_inicio_prestamo.split('T')[0] : new Date().toISOString().split('T')[0]
                });

            } catch (err) {
                setServerError({ titulo: 'Error', mensaje: 'No se pudo cargar la simulación guardada.' });
            } finally {
                setLoading(false);
            }
        };
        loadSavedSimulation();
    }, [simId, initialUnitFromState]);

    const getErrorTitle = (errorMsg) => {
        const lowerMsg = errorMsg.toLowerCase();
        if (lowerMsg.includes('90%') || lowerMsg.includes('financiamiento excede') || lowerMsg.includes('ltv')) return 'Financiamiento excede 90%';
        if (lowerMsg.includes('cuota inicial') || lowerMsg.includes('inicial mínima') || lowerMsg.includes('10%')) return 'Cuota inicial insuficiente';
        if (lowerMsg.includes('ingreso') || lowerMsg.includes('ratio') || lowerMsg.includes('40%') || lowerMsg.includes('50%')) return 'Capacidad de pago excedida';
        if (lowerMsg.includes('plazo')) return 'Plazo fuera de rango';
        if (lowerMsg.includes('bbp') || lowerMsg.includes('bono')) return 'Error con BBP';
        if (lowerMsg.includes('precio') || lowerMsg.includes('mivivienda')) return 'Precio fuera de rango';
        return 'Error de validación';
    };

    const selectedUnit = units.find(u => String(u.codigo_unidad) === formData.codigo_unidad);

    const fetchUnits = async () => {
        try {
            const response = await getUnits(0, 100, false, true);
            if (response.success) {
                let finalUnits = [...response.data];
                if (initialUnitFromState) {
                    const exists = finalUnits.some(u => String(u.codigo_unidad) === String(initialUnitFromState.codigo_unidad));
                    if (!exists) finalUnits.push(initialUnitFromState);
                }
                setUnits(finalUnits);
                setFormData(prev => {
                    if (finalUnits.length > 0 && !prev.codigo_unidad && !simId && !initialUnitFromState) {
                        return { ...prev, codigo_unidad: String(finalUnits[0].codigo_unidad) };
                    }
                    return prev;
                });
            }
        } catch (error) {
            console.error("Error cargando unidades:", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (e.target.type === 'number' && parseFloat(value) < 0) return;
        setFormData(prev => ({ ...prev, [name]: value }));
        setServerError(null);
    };

    const handleCustomChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: String(value) }));
        setServerError(null);
    };

    useEffect(() => {
        const fetchProspect = async () => {
            if (userRole === 'asesor' && formData.codigo_prospecto) {
                setProspectStatus('Buscando...');
                try {
                    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                    const API_URL = process.env.REACT_APP_API_URL || 'https://propequity-backend.onrender.com';

                    const response = await fetch(`${API_URL}/api/v1/simulator/check-income/${formData.codigo_prospecto}`, {
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

        const timer = setTimeout(fetchProspect, 600);
        return () => clearTimeout(timer);
    }, [formData.codigo_prospecto, userRole]);

    useEffect(() => {
        fetchUnits();
        const handleFocus = () => fetchUnits();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    useEffect(() => {
        if (units.length > 0 && initialUnitFromState && !simId && !hasAutoSimulated.current) {
            const unitExists = units.some(u => String(u.codigo_unidad) === String(initialUnitFromState.codigo_unidad));
            if (unitExists) {
                hasAutoSimulated.current = true;
                setTimeout(() => { handleSimulate(); }, 100);
            }
        }
    }, [units, initialUnitFromState, simId]);

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
            if (formData.es_integrador && formData.categoria_integrador === 'Menores ingresos') {
                if (parseFloat(user?.ingreso_mensual || 0) > 4746) isIntegradorEligible = false;
            }

            const bono = calculateBBP(
                selectedUnit.precio_venta,
                m,
                formData.vivienda_sostenible,
                isIntegradorEligible,
                parseFloat(formData.tipo_cambio || 3.80)
            );
            setFormData(prev => ({ ...prev, bono_bbp: bono }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedUnit, formData.vivienda_sostenible, formData.es_integrador, formData.categoria_integrador, formData.sin_bono, formData.ha_recibido_apoyo, formData.tiene_credito_activo, formData.tipo_cambio, user?.ingreso_mensual]);

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
        const codigoUnidadInt = parseInt(formData.codigo_unidad);
        if (isNaN(codigoUnidadInt) || !formData.codigo_unidad) {
            setServerError({
                titulo: 'Unidad no seleccionada',
                mensaje: 'Por favor selecciona una unidad válida antes de simular.'
            });
            return;
        }

        const bonoTradicional = !formData.sin_bono && !formData.vivienda_sostenible && !formData.es_integrador;
        const bonoIntegrador = formData.es_integrador;
        if ((bonoTradicional || bonoIntegrador) && !formData.ifi_seleccionada) {
            setServerError({
                titulo: 'Entidad requerida',
                mensaje: 'Debe seleccionar una entidad financiera (IFI) para continuar con modalidad Tradicional o Integrador.'
            });
            return;
        }

        const val = parseFloat(formData.cuota_inicial);
        const plazo = parseInt(formData.plazo_meses);
        const precio = selectedUnit?.precio_venta || 0;
        let finalCuotaInicial = cuotaType === 'porcentaje' ? (val / 100) * precio : val;
        const totalGastosIniciales = parseFloat(formData.gastos_tasacion || 0) + parseFloat(formData.gastos_notariales || 0) + parseFloat(formData.gastos_estudio_titulos || 0) + parseFloat(formData.comision_estudio || 0) + parseFloat(formData.comision_activacion || 0);

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
                tasacion: parseFloat(formData.gastos_tasacion || 0),
                coste_notarial: parseFloat(formData.gastos_notariales || 0),
                coste_registral: parseFloat(formData.gastos_estudio_titulos || 0),
                comision_estudio: parseFloat(formData.comision_estudio || 0),
                comision_activacion: parseFloat(formData.comision_activacion || 0),
                gastos_iniciales: totalGastosIniciales,
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
                codigo_prospecto: formData.codigo_prospecto || null,
                fecha_inicio_prestamo: formData.fecha_inicio_prestamo
            };
            setLastPayload(payload);
            const response = await createSimulation(payload, false);
            if (response.success) {
                setResult(response.data);
                setServerError(null);
                setTimeout(() => { document.getElementById('simulation-result')?.scrollIntoView({ behavior: 'smooth' }); }, 100);
            } else {
                setServerError({
                    titulo: getErrorTitle(response.error),
                    mensaje: response.error
                });
                setResult(null);
            }
        } catch (error) {
            console.error(error);
            const msg = error.message || 'Error al simular';
            setServerError({
                titulo: getErrorTitle(msg),
                mensaje: msg
            });
            setResult(null);
        } finally { setLoading(false); }
    };

    useEffect(() => {
        if (selectedUnit) {
            setFormData(prev => ({ ...prev, vivienda_sostenible: selectedUnit.es_sostenible || false }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedUnit]);

    return (
        <div className="flex bg-[#F8FAFC] min-h-screen font-['Inter',_sans-serif]">
            <Sidebar />
            <main className="flex-1 p-6 overflow-y-auto bg-gray-50/50">
                <header className="mb-6">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Simulador de Crédito</h1>
                    <p className="text-gray-500 text-sm font-medium">Calcula tu cuota hipotecaria MiVivienda 2026</p>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start mb-6">
                    <div className="xl:col-span-9 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                            {/* Inmueble y Plazo */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <div className="w-1 h-3 bg-brand-blue rounded-full"></div>
                                    Propiedad y Plazo
                                </h3>

                                {/*  BLOQUE RESTAURADO PARA EL ASESOR  */}
                                {userRole === 'asesor' && (
                                    <div className="bg-brand-blue/5 p-3 rounded-xl border border-brand-blue/10 mb-2">
                                        <label className="block text-[10px] font-black text-brand-blue uppercase tracking-widest mb-2 ml-1">
                                            ID de Prospecto / Cliente
                                        </label>
                                        <input
                                            type="number"
                                            name="codigo_prospecto"
                                            value={formData.codigo_prospecto}
                                            onChange={handleChange}
                                            placeholder="Ingresa el ID (ej. 5)"
                                            className="w-full bg-white rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 border border-brand-blue/10 font-black text-gray-900 text-sm transition-all"
                                        />
                                        {prospectStatus && (
                                            <p className={`text-[9px] font-black uppercase tracking-tight mt-2 ml-1 ${prospectStatus.includes('Error') || prospectStatus.includes('no encontrado') ? 'text-red-500' : prospectStatus.includes('Buscando') ? 'text-amber-500' : 'text-green-600'}`}>
                                                {prospectStatus}
                                            </p>
                                        )}
                                    </div>
                                )}
                                {/*  FIN BLOQUE ASESOR  */}

                                <CustomSelect label="Unidad" value={formData.codigo_unidad} showInfo={true} onChange={(val) => handleCustomChange('codigo_unidad', val)} options={units.map(u => ({ id: u.codigo_unidad, label: `${u.distrito_unidad} - ${u.direccion_unidad}` }))} />

                                {selectedUnit && (() => {
                                    const rangoInfo = getRangoInfo(selectedUnit.precio_venta, selectedUnit.moneda || selectedUnit.codigo_moneda, parseFloat(formData.tipo_cambio || 3.80));
                                    const m = selectedUnit.moneda === 2 || selectedUnit.codigo_moneda === 2;
                                    return (
                                        <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black text-gray-400 uppercase">Precio</span>
                                                <span className="text-sm font-black text-gray-900">{m ? '$' : 'S/'} {parseFloat(selectedUnit.precio_venta).toLocaleString()}</span>
                                            </div>
                                            {rangoInfo ? (
                                                <p className="text-[9px] font-black text-green-600 uppercase tracking-tight flex items-center gap-1">
                                                    <span className="w-1 h-1 rounded-full bg-green-500"></span> ✓ {rangoInfo.rango} - Elegible FMV
                                                </p>
                                            ) : (
                                                <p className="text-[9px] font-black text-red-500 uppercase tracking-tight flex items-center gap-1">
                                                    <span className="w-1 h-1 rounded-full bg-red-500"></span> ⚠ Fuera de rango FMV
                                                </p>
                                            )}
                                        </div>
                                    );
                                })()}
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Plazo de Pago</label>
                                    <input type="number" name="plazo_meses" value={formData.plazo_meses} onChange={handleChange} min="60" max="240" className="w-full bg-gray-50/50 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-blue/10 border border-gray-100 font-black text-gray-900 text-sm transition-all" />
                                    <div className="flex justify-between items-center mt-2 px-1">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-tight">Rango: 60 - 240 meses</p>
                                        {parseInt(formData.plazo_meses) >= 60 && parseInt(formData.plazo_meses) <= 240 && <p className="text-[9px] text-green-600 font-black uppercase tracking-tight">✓ Válido</p>}
                                    </div>
                                    {parseInt(formData.plazo_meses) < 60 && <p className="text-[9px] text-red-500 font-black uppercase tracking-tight mt-1 ml-1">⚠ Mínimo 5 años</p>}
                                    {parseInt(formData.plazo_meses) > 240 && <p className="text-[9px] text-red-500 font-black uppercase tracking-tight mt-1 ml-1">⚠ Máximo 20 años</p>}
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
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <div className="w-1 h-3 bg-brand-blue rounded-full"></div>
                                    Aportes e Incentivos
                                </h3>
                                <div>
                                    <div className="flex justify-between items-center mb-1 ml-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inicial</label>
                                        <div className="flex bg-gray-50 p-0.5 rounded-lg border border-gray-100">
                                            <button onClick={() => { setCuotaType('porcentaje'); setServerError(null); }} className={`px-2 py-0.5 rounded-md text-[8px] font-black transition-all ${cuotaType === 'porcentaje' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-300'}`}>%</button>
                                            <button onClick={() => { setCuotaType('monto'); setServerError(null); }} className={`px-2 py-0.5 rounded-md text-[8px] font-black transition-all ${cuotaType === 'monto' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-300'}`}>S/</button>
                                        </div>
                                    </div>
                                    <input type="number" name="cuota_inicial" value={formData.cuota_inicial} onChange={handleChange} className="w-full bg-gray-50/50 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-blue/10 border border-gray-100 font-black text-gray-900 text-sm transition-all" />
                                    {selectedUnit && (() => {
                                        const p = selectedUnit?.precio_venta || 0;
                                        const val = parseFloat(formData.cuota_inicial);
                                        const ini = cuotaType === 'porcentaje' ? (val / 100) * p : val;
                                        const minPerc = selectedUnit?.codigo_modalidad === 1 ? 0.10 : 0.075;
                                        const minMonto = p * minPerc;
                                        const moneda = selectedUnit?.moneda === 2 ? '$' : 'S/';
                                        const isValid = ini >= minMonto;
                                        return (
                                            <div className="px-1 mt-2 space-y-1">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-tight">
                                                    Mínimo {(minPerc * 100)}%: {moneda} {minMonto.toLocaleString()}
                                                </p>
                                                {isValid ? (
                                                    <p className="text-[9px] text-green-600 font-black uppercase tracking-tight flex items-center gap-1">
                                                        <span className="w-1 h-1 rounded-full bg-green-500"></span> ✓ Inicial Aceptada ({((ini / p) * 100).toFixed(1)}%)
                                                    </p>
                                                ) : (
                                                    <p className="text-[9px] text-red-500 font-black uppercase tracking-tight flex items-center gap-1">
                                                        <span className="w-1 h-1 rounded-full bg-red-500"></span> ⚠ Insuficiente ({((ini / p) * 100).toFixed(1)}%)
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                                {selectedUnit && (
                                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${selectedUnit.es_sostenible ? 'bg-emerald-50/50 border-emerald-100' : 'bg-gray-50/50 border-gray-100'}`}>
                                        <SavingsIcon sx={{ fontSize: 14, color: selectedUnit.es_sostenible ? '#10b981' : '#94a3b8' }} />
                                        <p className={`text-[9px] font-black uppercase ${selectedUnit.es_sostenible ? 'text-emerald-600' : 'text-gray-400'} leading-none`}>{selectedUnit.es_sostenible ? 'Sostenibilidad Grado III' : 'Inmueble Tradicional'}</p>
                                    </div>
                                )}
                                <div className="space-y-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center border-b border-gray-200 pb-2 mb-2">Modalidad de Bono</h4>
                                    {(() => {
                                        const p = parseFloat(selectedUnit?.precio_venta || 0);
                                        const mod = parseInt(selectedUnit?.codigo_modalidad || 0);
                                        const isOwner = user?.es_propietario_vivienda;

                                        // Razones por las que BBP no aplica
                                        if (p > 362100) return <p className="text-[8px] font-bold text-amber-500 p-2 uppercase text-center">R5: Solo Bono Integrador</p>;
                                        if (mod === 3) return <p className="text-[8px] font-bold text-red-400 p-2 uppercase text-center">Mejoramiento: Sin BBP</p>;
                                        if (isOwner) return <p className="text-[8px] font-bold text-red-400 p-2 uppercase text-center">Propietario actual: Sin BBP</p>;

                                        const isSostenible = selectedUnit?.es_sostenible || false;
                                        const opciones = isSostenible
                                            ? [{ label: 'Sin Bono', sinBono: true, sostenible: false, integrador: false }, { label: 'Sostenible', sinBono: false, sostenible: true, integrador: false }, { label: 'Integrador', sinBono: false, sostenible: true, integrador: true }]
                                            : [{ label: 'Sin Bono', sinBono: true, sostenible: false, integrador: false }, { label: 'Tradicional', sinBono: false, sostenible: false, integrador: false }, { label: 'Integrador', sinBono: false, sostenible: false, integrador: true }];
                                        const activeIdx = formData.sin_bono ? 0 : formData.es_integrador ? 2 : 1;
                                        return opciones.map((op, idx) => (
                                            <button key={op.label} type="button" onClick={() => { setFormData(prev => ({ ...prev, sin_bono: op.sinBono, vivienda_sostenible: op.sostenible, es_integrador: op.integrador })); setServerError(null); }} className={`w-full py-1.5 rounded-lg text-[9px] font-black uppercase text-left px-3 ${activeIdx === idx ? 'bg-brand-blue text-white shadow-md' : 'text-gray-400 hover:bg-gray-100/50'}`}>{op.label}</button>
                                        ));
                                    })()}
                                </div>
                                {formData.es_integrador && (
                                    <div className="animate-in slide-in-from-top-2 duration-300">
                                        <CustomSelect label="Categoría Integrador" value={formData.categoria_integrador} onChange={(val) => handleCustomChange('categoria_integrador', val)} options={[{ id: 'Menores ingresos', label: 'Menores Ingresos' }, { id: 'Adulto mayor', label: 'Adulto Mayor' }, { id: 'Desplazados', label: 'Desplazados' }, { id: 'Miembros FF.AA.', label: 'FF.AA. / PNP' }]} />
                                        {formData.categoria_integrador === 'Menores ingresos' && parseFloat(user?.ingreso_mensual || 0) > 4746 && (
                                            <p className="text-[8px] text-red-500 font-bold mt-1 bg-red-50 p-1.5 rounded-lg border border-red-100">Excede Ingresos (S/ 4,746)</p>
                                        )}
                                    </div>
                                )}
                                <div className="space-y-2 bg-gray-50/50 p-2 rounded-xl border border-gray-100">
                                    <p className="text-[8px] font-black text-gray-400 uppercase text-center mb-1">Elegibilidad FMV</p>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" checked={formData.ha_recibido_apoyo} onChange={(e) => { setFormData(prev => ({ ...prev, ha_recibido_apoyo: e.target.checked })); setServerError(null); }} className="w-3 h-3 rounded text-brand-blue focus:ring-brand-blue transition-all" />
                                        <span className="text-[8px] font-bold text-gray-500 uppercase group-hover:text-brand-blue transition-colors leading-none">¿Ya recibió apoyo estatal?</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" checked={formData.tiene_credito_activo} onChange={(e) => { setFormData(prev => ({ ...prev, tiene_credito_activo: e.target.checked })); setServerError(null); }} className="w-3 h-3 rounded text-brand-blue focus:ring-brand-blue transition-all" />
                                        <span className="text-[8px] font-bold text-gray-500 uppercase group-hover:text-brand-blue transition-colors leading-none">¿Tiene crédito FMV activo?</span>
                                    </label>
                                </div>
                            </div>

                            {/* Banco */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <div className="w-1 h-3 bg-brand-blue rounded-full"></div>
                                    Entidad Financiera
                                </h3>
                                <CustomSelect label="Entidad (IFI)" value={formData.ifi_seleccionada} showInfo={true} onChange={(val) => handleCustomChange('ifi_seleccionada', val)} options={[{ id: '', label: 'Cálculo Genérico' }, { id: 'BCP', label: 'BCP' }, { id: 'BBVA', label: 'BBVA' }, { id: 'Interbank', label: 'Interbank' }, { id: 'Pichincha', label: 'Banco Pichincha' }, { id: 'GNB', label: 'GNB' }]} />
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Tasa Anual (%)</label>
                                    <input type="number" name="tasa_anual" value={formData.tasa_anual} onChange={handleChange} className="w-full bg-gray-50/50 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-blue/10 border border-gray-100 font-black text-gray-900 text-sm transition-all" />
                                </div>
                                <div className={formData.ifi_seleccionada ? 'opacity-50 pointer-events-none' : ''}>
                                    <CustomSelect label="Tipo de Tasa" value={formData.ifi_seleccionada ? '2' : formData.codigo_tipo_tasa} showInfo={true} onChange={(val) => handleCustomChange('codigo_tipo_tasa', val)} options={[{ id: '1', label: 'Nominal (TNA)' }, { id: '2', label: 'Efectiva (TEA)' }]} />
                                </div>

                                <div className={`transition-all duration-300 ${formData.ifi_seleccionada || formData.codigo_tipo_tasa !== '1' ? 'opacity-30 h-auto pointer-events-none' : 'opacity-100 h-auto mb-2'}`}>
                                    <CustomSelect label="Capitalización" value={formData.capitalizacion} showInfo={true} onChange={(val) => handleCustomChange('capitalizacion', val)} options={[{ id: 'Diaria', label: 'Diaria' }, { id: 'Quincenal', label: 'Quincenal' }, { id: 'Mensual', label: 'Mensual' }, { id: 'Trimestral', label: 'Trimestral' }, { id: 'Semestral', label: 'Semestral' }]} />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Fecha de Inicio</label>
                                    <input type="date" name="fecha_inicio_prestamo" value={formData.fecha_inicio_prestamo} onChange={handleChange} className="w-full bg-gray-50/50 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-blue/10 border border-gray-100 font-black text-gray-900 text-sm transition-all" />
                                </div>
                            </div>

                            {/* Detalle Gastos */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <div className="w-1 h-3 bg-brand-blue rounded-full"></div>
                                    Gastos Iniciales
                                </h3>
                                <div className="grid grid-cols-1 gap-6">
                                    <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Tasación</label><input type="number" name="gastos_tasacion" value={formData.gastos_tasacion} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-100 rounded-xl py-2 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue/10 transition-all" /></div>
                                    <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Registros Públicos</label><input type="number" name="gastos_estudio_titulos" value={formData.gastos_estudio_titulos} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-100 rounded-xl py-2 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue/10 transition-all" /></div>
                                    <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Notaría</label><input type="number" name="gastos_notariales" value={formData.gastos_notariales} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-100 rounded-xl py-2 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue/10 transition-all" /></div>
                                    <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Estudio de Títulos</label><input type="number" name="comision_estudio" value={formData.comision_estudio} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-100 rounded-xl py-2 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue/10 transition-all" /></div>
                                    <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Com. Activación</label><input type="number" name="comision_activacion" value={formData.comision_activacion} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-100 rounded-xl py-2 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue/10 transition-all" /></div>

                                    {selectedUnit && (() => {
                                        const totalGastos = parseFloat(formData.gastos_tasacion || 0) + parseFloat(formData.gastos_notariales || 0) + parseFloat(formData.gastos_estudio_titulos || 0) + parseFloat(formData.comision_estudio || 0) + parseFloat(formData.comision_activacion || 0);
                                        const precio = parseFloat(selectedUnit.precio_venta || 0);
                                        const pct = precio > 0 ? (totalGastos / precio) * 100 : 0;
                                        const isValid = pct <= 5;
                                        return (
                                            <div className="px-1 mt-2">
                                                <p className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isValid ? 'text-green-600' : 'text-red-500'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${isValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                    Gastos: {pct.toFixed(2)}% del precio (máximo sugerido: 5%)
                                                </p>
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div className="pt-2">
                                    {((!formData.sin_bono && !formData.vivienda_sostenible && !formData.es_integrador) || formData.es_integrador) && !formData.ifi_seleccionada ? (
                                        <div className="text-[9px] text-red-500 font-bold mb-2 bg-red-50 p-2 rounded-lg border border-red-100 text-center">Debe seleccionar una entidad financiera (IFI) para continuar.</div>
                                    ) : (
                                        <button
                                            onClick={handleSimulate}
                                            disabled={loading}
                                            className="w-full bg-brand-orange hover:bg-orange-600 text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-brand-orange/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
                                        >
                                            {loading ? "Calculando..." : <>GENERAR PROYECCIÓN <ArrowForwardIcon sx={{ fontSize: 14 }} /></>}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="xl:col-span-3 bg-[#0F172A] p-3 rounded-2xl text-white shadow-xl self-start sticky top-3">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-brand-blue-light animate-pulse"></div>
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-blue-light">Análisis en Vivo</h3>
                            </div>

                            {/* Desglose de Montos */}
                            <div className="space-y-2 px-1">
                                <div className="flex justify-between items-center"><p className="text-[9px] text-white/30 uppercase font-black tracking-widest">Valor Vivienda</p><p className="text-xs font-black">{selectedUnit?.moneda === 2 ? '$' : 'S/'} {parseFloat(selectedUnit?.precio_venta || 0).toLocaleString()}</p></div>
                                <div className="flex justify-between items-center"><p className="text-[9px] text-white/30 uppercase font-black tracking-widest">(-) Cuota Inicial</p><p className="text-xs font-black text-rose-400">- {selectedUnit?.moneda === 2 ? '$' : 'S/'} {(() => { const p = parseFloat(selectedUnit?.precio_venta || 0); const v = parseFloat(formData.cuota_inicial || 0); return (cuotaType === 'porcentaje' ? (v / 100) * p : v).toLocaleString(); })()}</p></div>
                                <div className="flex justify-between items-center"><p className="text-[9px] text-white/30 uppercase font-black tracking-widest">(-) Bono BBP</p><p className="text-xs font-black text-emerald-400">- {selectedUnit?.moneda === 2 ? '$' : 'S/'} {parseFloat(formData.bono_bbp).toLocaleString()}</p></div>
                                <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                                    <p className="text-[10px] text-brand-blue-light uppercase font-black tracking-[0.2em]">Préstamo Final</p>
                                    <p className="text-sm font-black text-brand-blue-light">{selectedUnit?.moneda === 2 ? '$' : 'S/'} {(() => {
                                        const p = parseFloat(selectedUnit?.precio_venta || 0);
                                        const b = parseFloat(formData.bono_bbp || 0);
                                        const val = parseFloat(formData.cuota_inicial || 0);
                                        const ini = cuotaType === 'porcentaje' ? (val / 100) * p : val;
                                        const g = parseFloat(formData.gastos_tasacion || 0) + parseFloat(formData.gastos_notariales || 0) + parseFloat(formData.gastos_estudio_titulos || 0) + parseFloat(formData.comision_estudio || 0) + parseFloat(formData.comision_activacion || 0);
                                        return (p - ini - b + g).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                    })()}</p>
                                </div>

                                {/* 👇 BLOQUE RESTAURADO: MUESTRA IFM SEGÚN ROL 👇 */}
                                <div className="flex justify-between items-center pt-1">
                                    <p className="text-[8px] text-gray-400 uppercase font-black">Ingreso Familiar (IFM)</p>
                                    <p className="text-[11px] font-black text-white">
                                        S/ {userRole === 'asesor'
                                            ? parseFloat(prospectIFM || 0).toLocaleString()
                                            : (parseFloat(user?.ingreso_mensual || 0) + parseFloat(user?.ingreso_conyuge || 0)).toLocaleString()}
                                    </p>
                                </div>
                                {parseFloat(user?.ingreso_conyuge || 0) > 0 && userRole !== 'asesor' && (
                                    <div className="flex justify-between items-center opacity-40 -mt-1"><p className="text-[6px] text-gray-300 uppercase font-bold tracking-tighter">└ T: S/ {parseFloat(user?.ingreso_mensual || 0).toLocaleString()} | C: S/ {parseFloat(user?.ingreso_conyuge || 0).toLocaleString()}</p></div>
                                )}
                                {/* 👆 FIN BLOQUE IFM 👆 */}
                            </div>

                            <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-1.5">
                                <div className="flex justify-between text-[9px] font-bold text-gray-300"><span className="uppercase opacity-60">Gastos Iniciales</span><span>{selectedUnit?.moneda === 2 ? '$' : 'S/'} {(parseFloat(formData.gastos_tasacion || 0) + parseFloat(formData.gastos_notariales || 0) + parseFloat(formData.gastos_estudio_titulos || 0) + parseFloat(formData.comision_estudio || 0) + parseFloat(formData.comision_activacion || 0)).toLocaleString()}</span></div>
                                <div className="flex justify-between text-[9px] font-bold text-gray-300">
                                    <span className="uppercase opacity-60">Tasa Mensual (TEM)</span>
                                    <span className="text-brand-blue-light">{temValue}</span>
                                </div>
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
                </div >

                {
                    result && (
                        <div id="simulation-result" className="animate-in fade-in slide-in-from-bottom-5 duration-700">
                            {/* ── Indicadores de Rentabilidad ── */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                                <div className="col-span-2 md:col-span-4 flex items-center gap-2 mb-1">
                                    <div className="w-1 h-3 bg-[#F97316] rounded-full"></div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Indicadores de Rentabilidad</p>
                                </div>
                                {[
                                    {
                                        label: 'Tasa de Descuento',
                                        sublabel: 'TCEA anualizada',
                                        value: `${parseFloat(result.resumen?.tcea || 0).toFixed(4)}%`,
                                        accent: '#3B82F6'
                                    },
                                    {
                                        label: 'TIR Mensual',
                                        sublabel: 'Tasa Interna de Retorno',
                                        value: `${parseFloat(result.resumen?.tir || 0).toFixed(6)}%`,
                                        accent: '#10B981'
                                    },
                                    {
                                        label: 'TCEA',
                                        sublabel: 'Costo Efectivo Anual',
                                        value: `${parseFloat(result.resumen?.tcea || 0).toFixed(4)}%`,
                                        accent: '#F97316'
                                    },
                                    {
                                        label: 'VAN',
                                        sublabel: 'Valor Actual Neto',
                                        value: `S/ ${parseFloat(result.resumen?.van || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                                        accent: parseFloat(result.resumen?.van || 0) >= 0 ? '#10B981' : '#EF4444'
                                    }
                                ].map((stat, i) => (
                                    <div key={i} className="bg-[#0F172A] p-4 rounded-2xl border border-white/5 flex items-center gap-4 hover:border-white/10 transition-all group">
                                        <div className="w-0.5 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: stat.accent }}></div>
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest leading-none mb-0.5">{stat.label}</p>
                                            <p className="text-[8px] font-bold text-white/20 uppercase leading-none mb-1.5">{stat.sublabel}</p>
                                            <p className="text-sm font-black leading-none truncate" style={{ color: stat.accent }}>{stat.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-tighter">Cronograma de Pagos</h3>
                                    <div className="flex gap-2">
                                        {!result.codigo_simulacion && (
                                            <button
                                                onClick={handleSaveSimulation}
                                                disabled={saving}
                                                className="px-3 py-1.5 bg-brand-blue text-white rounded-lg font-black text-[8px] uppercase hover:bg-brand-blue-dark shadow-sm transition-all"
                                            >
                                                {saving ? 'Guardando...' : 'Guardar Proyección'}
                                            </button>
                                        )}
                                        <button
                                            onClick={async () => {
                                                const codigoSim = result.codigo_simulacion;
                                                if (!codigoSim) {
                                                    alert('Guarda la simulación primero para poder exportarla.');
                                                    return;
                                                }
                                                const r = await exportToExcel(codigoSim);
                                                if (!r.success) alert(r.error);
                                            }}
                                            className={`px-3 py-1.5 rounded-lg font-black text-[8px] uppercase transition-all ${result.codigo_simulacion ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-50 text-gray-300 cursor-not-allowed'}`}
                                        >Excel</button>
                                        <button
                                            onClick={async () => {
                                                const codigoSim = result.codigo_simulacion;
                                                if (!codigoSim) {
                                                    alert('Guarda la simulación primero para poder exportarla.');
                                                    return;
                                                }
                                                const r = await exportToPDF(codigoSim);
                                                if (!r.success) alert(r.error);
                                            }}
                                            className={`px-3 py-1.5 rounded-lg font-black text-[8px] uppercase transition-all ${result.codigo_simulacion ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-gray-50 text-gray-300 cursor-not-allowed'}`}
                                        >PDF</button>
                                    </div>
                                </div>
                                <div className="overflow-x-auto"><table className="w-full text-left">
                                    <thead className="bg-[#EEE] text-[8px] font-black text-brand-dark uppercase tracking-[0.2em] border-b-2 border-brand-blue/10">
                                        <tr>
                                            <th className="px-2 py-3">N°</th>
                                            <th className="px-2 py-3">Fecha Pago</th>
                                            <th className="px-3 py-3">TEA%</th>
                                            <th className="px-3 py-3">TEM%</th>
                                            <th className="px-3 py-3">Saldo Inicial</th>
                                            <th className="px-3 py-3">Interés</th>
                                            <th className="px-3 py-3">Amortización</th>
                                            <th className="px-3 py-3">Seg. Desgrav.</th>
                                            <th className="px-3 py-3 bg-brand-blue/5 text-brand-blue">Cuota Total</th>
                                            <th className="px-3 py-3">Saldo Final</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 text-[9px] font-bold text-gray-700">
                                        {result.detalles.map((d, index) => {
                                            const gracia = d.plazo_gracia || d.tipo_gracia || '';
                                            const esParcial = gracia.toLowerCase().includes('parcial');
                                            const esTotal = gracia.toLowerCase().includes('total');
                                            const rowClass = d.numero_cuota === 0
                                                ? 'bg-gray-50/50 italic opacity-60 text-gray-400'
                                                : esParcial
                                                    ? 'bg-amber-50/80'
                                                    : esTotal
                                                        ? 'bg-red-50/60'
                                                        : '';

                                            return (
                                                <tr key={index} className={`border-b border-gray-50 hover:bg-brand-blue/[0.02] transition-colors ${rowClass}`}>
                                                    <td className="px-2 py-2.5 font-black text-brand-blue">
                                                        <div className="flex items-center gap-2">
                                                            {d.numero_cuota > 0 && esParcial && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Gracia Parcial"></div>}
                                                            {d.numero_cuota > 0 && esTotal && <div className="w-1.5 h-1.5 rounded-full bg-red-500" title="Gracia Total"></div>}
                                                            #{d.numero_cuota}
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-2.5 text-center text-gray-500">{new Date(d.fecha_vencimiento).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                                                    <td className="px-3 py-2.5 text-center text-gray-500">{d.tea ? `${parseFloat(d.tea).toFixed(2)}%` : '—'}</td>
                                                    <td className="px-3 py-2.5 text-center text-gray-500">{d.tem ? `${parseFloat(d.tem).toFixed(4)}%` : '—'}</td>
                                                    <td className="px-3 py-2.5 text-gray-600 font-bold">S/ {parseFloat(d.saldo_inicial || d.saldo_inicio || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="px-3 py-2.5 text-gray-400">S/ {parseFloat(d.interes || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="px-3 py-2.5 text-gray-400">S/ {parseFloat(d.amortizacion || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="px-3 py-2.5 text-gray-400">S/ {parseFloat(d.seguro_desgravamen || d.seguro || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="px-3 py-2.5 font-black text-brand-blue bg-brand-blue/[0.01]">
                                                        <div className="flex flex-col">
                                                            <span>S/ {parseFloat(d.cuota_total || d.cuota || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                            {d.numero_cuota > 0 && (esParcial || esTotal) && (
                                                                <span className={`text-[7px] font-black uppercase tracking-tighter ${esTotal ? 'text-red-500' : 'text-amber-600'}`}>
                                                                    Gracia {esTotal ? 'Total' : 'Parcial'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-gray-900 font-black">S/ {parseFloat(d.saldo_final || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody></table></div>
                            </div>
                        </div>
                    )
                }
            </main >
        </div >
    );
};

export default SimulationPage;
