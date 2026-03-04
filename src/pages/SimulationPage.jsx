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
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const SimulationPage = () => {
    const navigate = useNavigate();
    const { id: simId } = useParams();
    const location = useLocation();
    const initialUnitFromState = location.state?.unidadSeleccionada;
    const hasAutoSimulated = React.useRef(false);

    const { user } = useAuth();
    const userRole = (user?.rol_rel?.tipo_rol || user?.role || user?.rol || '').toLowerCase();
    const userId = user?.codigo_usuario || user?.id;

    const [formData, setFormData] = useState({
        codigo_prospecto: '',
        codigo_unidad: initialUnitFromState ? String(initialUnitFromState.codigo_unidad) : '',
        cuota_inicial: '10',
        gastos_tasacion: '0.00',
        gastos_notariales: '0.00',
        gastos_estudio_titulos: '0.00',
        comision_estudio: '0.00',
        comision_activacion: '0.00',
        bono_bbp: '0',
        sin_bono: initialUnitFromState?.precio_venta > 362100 ? true : false,
        es_integrador: false,
        categoria_integrador: 'Menores ingresos',
        vivienda_sostenible: initialUnitFromState?.es_sostenible || false,
        ifi_seleccionada: '',
        codigo_tipo_tasa: '2', // 1: Nominal, 2: Efectiva
        tasa_anual: '10',
        comision_periodica: '0.00',
        portes: '0.00',
        gastos_administracion: '0.00',
        capitalizacion: 'Mensual',
        plazo_meses: '240',
        codigo_tipo_gracia: '1',
        meses_gracia: '0',
        seguro_desgravamen: '0.028',
        tipo_cambio: '3.80',
        es_propietario_vivienda: user?.es_propietario_vivienda || false,
        ha_recibido_apoyo: user?.ha_recibido_apoyo || false,
        tiene_credito_activo: user?.tiene_credito_activo || false,
        fecha_inicio_prestamo: new Date().toISOString().split('T')[0]
    });

    const [temValue, setTemValue] = useState('--');
    const [bbpData, setBbpData] = useState([]);

    // Cargar rangos BBP desde backend
    useEffect(() => {
        const fetchBBP = async () => {
            try {
                const response = await api.get('/simulator/bbp-ranges');
                if (response.data && Array.isArray(response.data)) {
                    setBbpData(response.data);
                }
            } catch (err) {
                console.error("Error al cargar rangos BBP desde backend:", err);
            }
        };
        fetchBBP();
    }, []);


    // Consultar TEM desde backend solo si es Tasa Efectiva
    useEffect(() => {
        const fetchTEM = async () => {
            if (!formData.tasa_anual) {
                setTemValue('--');
                return;
            }
            if (formData.codigo_tipo_tasa === '1') {
                setTemValue('Aplica según Cap.');
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
    }, [formData.tasa_anual, formData.codigo_tipo_tasa]);

    const handleSaveSimulation = async () => {
        if (!result || !lastPayload) {
            alert('Genera una proyección primero antes de guardar.');
            return;
        }
        setSaving(true);
        try {
            const response = await createSimulation(lastPayload, true);
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

    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [cuotaMoneda, setCuotaMoneda] = useState('S/');
    const [serverError, setServerError] = useState(null);
    const [cuotaType, setCuotaType] = useState('porcentaje');
    const [lastPayload, setLastPayload] = useState(null);
    const [saving, setSaving] = useState(false);
    const [prospectStatus, setProspectStatus] = useState('');
    const [prospectIFM, setProspectIFM] = useState(0);
    const [isProspectMancomunado, setIsProspectMancomunado] = useState(false);

    // Carga de Simulación Guardada
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
                if (data.detalles && !data.cronograma) data.cronograma = data.detalles;
                setResult(data);

                setFormData({
                    codigo_prospecto: userRole === 'asesor' ? String(data.codigo_prospecto || '') : '',
                    codigo_unidad: String(data.codigo_unit || data.codigo_unidad || ''),
                    cuota_inicial: String(data.cuota_inicial || '0'),
                    gastos_tasacion: String(data.tasacion || '0.00'),
                    gastos_notariales: String(data.coste_notarial || '0.00'),
                    gastos_estudio_titulos: String(data.coste_registral || '0.00'),
                    comision_estudio: String(data.comision_estudio || '0.00'),
                    comision_activacion: String(data.comision_activacion || '0.00'),
                    comision_periodica: String(data.comision_periodica || '0.00'),
                    portes: String(data.portes || '0.00'),
                    gastos_administracion: String(data.gastos_administracion || '0.00'),
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
                    seguro_desgravamen: String(data.seguro_desgravamen || '0.028'),
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
    }, [simId, initialUnitFromState, userRole]);

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

    // UNIFICACIÓN DE MANEJADOR DE EVENTOS (SIRVE PARA INPUTS Y SELECTS NATIVOS)
    const handleUnifiedChange = (e) => {
        const { name, value, type } = e.target;

        // Bloquear números negativos en inputs
        if (type === 'number' && parseFloat(value) < 0) return;

        setFormData(prev => {
            const newData = { ...prev, [name]: String(value) };

            // Lógica inteligente de Tasa Nominal vs Bono
            if (name === 'codigo_tipo_tasa' && String(value) === '1') {
                newData.sin_bono = true;
                newData.ifi_seleccionada = '';
            }

            // Lógica inteligente de Banco vs Tasa Efectiva
            if (name === 'ifi_seleccionada' && String(value) !== '') {
                newData.codigo_tipo_tasa = '2'; // Efectiva
                newData.capitalizacion = 'Mensual';
            }

            return newData;
        });
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
                        const typeStr = String(data.type || '').toLowerCase();
                        setIsProspectMancomunado(typeStr.includes('mancomunado') || typeStr.includes('conyuge') || typeStr.includes('casado'));
                    } else {
                        setProspectIFM(0);
                        setProspectStatus('⚠ ID no encontrado en BD');
                        setIsProspectMancomunado(false);
                    }
                } catch (error) {
                    setProspectIFM(0);
                    setProspectStatus('⚠ Error de red');
                    setIsProspectMancomunado(false);
                }
            } else {
                setProspectIFM(0);
                setProspectStatus('');
                setIsProspectMancomunado(false);
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

        const ranges = bbpData.length > 0 ? bbpData : BBP_RANGES;
        const rangoAplicable = ranges.find(r => pPEN >= r.min && pPEN <= r.max);
        if (!rangoAplicable) return '0';

        let bonoPEN = 0;
        if (integrador) {
            // Si el backend trae el monto ya consolidado, lo usamos. Si no, sumamos 3600.
            if (sostenible) {
                bonoPEN = rangoAplicable.integrador_sostenible || (rangoAplicable.sostenible + BONO_INTEGRADOR);
            } else {
                bonoPEN = rangoAplicable.integrador_tradicional || (rangoAplicable.tradicional + BONO_INTEGRADOR);
            }
        } else {
            bonoPEN = sostenible ? rangoAplicable.sostenible : rangoAplicable.tradicional;
        }

        return isUSD ? (bonoPEN / tc).toFixed(2) : bonoPEN.toString();
    };

    const getRangoInfo = (precio, moneda, tc = 3.80) => {
        let pPEN = parseFloat(precio);
        const isUSD = moneda === 2 || moneda === 'USD';
        if (isUSD) pPEN = pPEN * tc;
        const ranges = bbpData.length > 0 ? bbpData : BBP_RANGES;
        return ranges.find(r => pPEN >= r.min && pPEN <= r.max) || null;
    };

    useEffect(() => {
        if (!formData.sin_bono) {
            if (formData.codigo_tipo_tasa === '1') {
                setFormData(prev => ({ ...prev, codigo_tipo_tasa: '2' }));
            }
        }
        if (formData.codigo_tipo_tasa === '1') {
            if (!formData.sin_bono) {
                setFormData(prev => ({ ...prev, sin_bono: true }));
            }
        }
    }, [formData.sin_bono, formData.codigo_tipo_tasa]);

    useEffect(() => {
        if (selectedUnit) {
            const m = selectedUnit.moneda || selectedUnit.codigo_moneda;
            if (formData.sin_bono || formData.ha_recibido_apoyo || formData.tiene_credito_activo || formData.es_propietario_vivienda) {
                setFormData(prev => ({ ...prev, bono_bbp: '0' }));
                return;
            }
            let isIntegradorEligible = formData.es_integrador;
            if (formData.es_integrador && formData.categoria_integrador === 'Menores ingresos') {
                const ifm = userRole === 'asesor' ? parseFloat(prospectIFM || 0) : (parseFloat(user?.ingreso_mensual || 0) + parseFloat(user?.ingreso_conyuge || 0));
                if (ifm > 4746) isIntegradorEligible = false;
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
    }, [selectedUnit, bbpData, formData.vivienda_sostenible, formData.es_integrador, formData.categoria_integrador, formData.sin_bono, formData.ha_recibido_apoyo, formData.tiene_credito_activo, formData.es_propietario_vivienda, formData.tipo_cambio, user?.ingreso_mensual]);

    // CÁLCULO INTERNO DE TASA Y SEGURO (MIRA AL USUARIO O AL PROSPECTO)
    useEffect(() => {
        if (!formData.ifi_seleccionada || !selectedUnit) return;
        const p = selectedUnit.precio_venta;
        const b = parseFloat(formData.bono_bbp || 0);
        const val = parseFloat(formData.cuota_inicial || 0);
        const ini = cuotaType === 'porcentaje' ? (val / 100) * p : val;
        const montoFinanciar = p - ini - b;

        const bankRules = {
            'Pichincha': {
                rates: [{ max: 100000, tea: 15.00 }, { max: 200000, tea: 14.00 }, { max: Infinity, tea: 13.00 }],
                seguro_individual: '0.047',
                seguro_mancomunado: '0.080'
            },
            'Interbank': {
                rates: [{ max: 100000, tea: 10.60 }, { max: 200000, tea: 10.40 }, { max: 300000, tea: 10.25 }, { max: Infinity, tea: 10.05 }],
                seguro_individual: '0.028',
                seguro_mancomunado: '0.052'
            },
            'BBVA': {
                rates: [{ max: 94999, tea: 13.10 }, { max: Infinity, tea: 12.90 }],
                seguro_individual: '0.023',
                seguro_mancomunado: '0.043'
            },
            'BCP': {
                rates: [{ max: Infinity, tea: 13.99 }],
                seguro_individual: '0.039',
                seguro_mancomunado: '0.070'
            },
            'GNB': {
                rates: [{ max: Infinity, tea: 13.25 }],
                seguro_individual: '0.040',
                seguro_mancomunado: '0.075'
            }
        };

        const config = bankRules[formData.ifi_seleccionada];
        if (config) {
            const rule = config.rates.find(r => montoFinanciar <= r.max) || config.rates[config.rates.length - 1];
            const isMancomunado = userRole === 'asesor'
                ? isProspectMancomunado
                : (parseFloat(user?.ingreso_conyuge || 0) > 0 || !!user?.nombre_conyuge);

            setFormData(prev => ({
                ...prev,
                codigo_tipo_tasa: '2',
                tasa_anual: rule.tea.toString(),
                seguro_desgravamen: isMancomunado ? config.seguro_mancomunado : config.seguro_individual
            }));
        }
    }, [formData.ifi_seleccionada, formData.cuota_inicial, cuotaType, selectedUnit, formData.bono_bbp, userRole, isProspectMancomunado, user?.ingreso_conyuge, user?.nombre_conyuge]);

    const handleSimulate = async () => {
        if (userRole === 'administrador') {
            setServerError({
                titulo: 'Acceso Denegado',
                mensaje: 'Los administradores tienen acceso de solo lectura y no pueden generar simulaciones.'
            });
            return;
        }

        const codigoUnidadInt = parseInt(formData.codigo_unidad);
        if (isNaN(codigoUnidadInt) || !formData.codigo_unidad) {
            setServerError({
                titulo: 'Unidad no seleccionada',
                mensaje: 'Por favor seleccione una unidad válida antes de simular.'
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

        // --- PRE-VALIDACIÓN FRONTEND (CORTAFUEGOS ANTI-CORS MASKING) ---
        const val = parseFloat(formData.cuota_inicial || 0);
        const plazo = parseInt(formData.plazo_meses || 240);
        const precio = parseFloat(selectedUnit?.precio_venta || 0);
        let finalCuotaInicial = cuotaType === 'porcentaje' ? (val / 100) * precio : val;

        const totalGastosIniciales = parseFloat(formData.gastos_tasacion || 0) +
            parseFloat(formData.gastos_notariales || 0) +
            parseFloat(formData.gastos_estudio_titulos || 0) +
            parseFloat(formData.comision_estudio || 0) +
            parseFloat(formData.comision_activacion || 0);

        const bonoAplicado = parseFloat(formData.bono_bbp || 0);
        const precio_neto = precio - bonoAplicado;
        const monto_financiar = (precio_neto - finalCuotaInicial) + totalGastosIniciales;

        // Validar 90% (Solo para Compra)
        const mod = parseInt(selectedUnit?.codigo_modalidad || 1);
        if (mod === 1 || mod === 0) {
            const max_financiar = precio * 0.90;
            if (monto_financiar > max_financiar) {
                setServerError({
                    titulo: 'Financiamiento excede 90%',
                    mensaje: `El monto a financiar (S/ ${monto_financiar.toLocaleString('es-PE', { minimumFractionDigits: 2 })}) excede el 90% del valor de la vivienda (Máx: S/ ${max_financiar.toLocaleString('es-PE', { minimumFractionDigits: 2 })}). Reduzca los gastos iniciales o aumente su inicial.`
                });
                return;
            }
        }

        // Validar Límite de Gastos (5%)
        const max_gastos = precio * 0.05;
        if (totalGastosIniciales > max_gastos) {
            setServerError({
                titulo: 'Gastos Excedidos',
                mensaje: `Los gastos iniciales (S/ ${totalGastosIniciales.toLocaleString()}) no pueden superar el 5% del valor de la vivienda (Máx: S/ ${max_gastos.toLocaleString()}).`
            });
            return;
        }
        // ----------------------------------------------------------------

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
                tasa_anual: parseFloat(formData.tasa_anual || 0),
                capitalizacion: formData.capitalizacion,
                plazo_meses: plazo,
                tipo_gracia: TIPO_GRACIA_MAP[formData.codigo_tipo_gracia] || 'Ninguno',
                meses_gracia: parseInt(formData.meses_gracia || 0),
                seguro_desgravamen: parseFloat(formData.seguro_desgravamen || 0),
                comision_periodica: parseFloat(formData.comision_periodica || 0),
                portes: parseFloat(formData.portes || 0),
                gastos_administracion: parseFloat(formData.gastos_administracion || 0),
                tipo_cambio: parseFloat(formData.tipo_cambio || 3.80),
                ha_recibido_apoyo: formData.ha_recibido_apoyo,
                tiene_credito_activo: formData.tiene_credito_activo,
                codigo_cliente: userRole === 'cliente' ? userId : null,
                codigo_asesor: userRole === 'asesor' ? userId : null,
                codigo_prospecto: userRole === 'asesor' ? (formData.codigo_prospecto ? parseInt(formData.codigo_prospecto) : null) : null,
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
                    titulo: 'Error de Validación',
                    mensaje: response.error || "Ocurrió un error inesperado al procesar la simulación."
                });
                setResult(null);
            }
        } catch (error) {
            console.error(error);
            setServerError({
                titulo: 'Error de Conexión',
                mensaje: error.message || 'Error al comunicarse con el servidor. Verifique su conexión.'
            });
            setResult(null);
        } finally { setLoading(false); }
    };

    return (
        <div className="flex bg-[#F8FAFC] min-h-screen font-['Inter',_sans-serif]">
            <Sidebar />
            <main className="flex-1 p-6 overflow-y-auto bg-gray-50/50">
                <header className="mb-6">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Simulador de Crédito</h1>
                    <p className="text-gray-500 text-sm font-medium">Calcula tu cuota hipotecaria MiVivienda 2026</p>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start mb-6">
                    {/* FORMULARIO PRINCIPAL (9 COLUMNAS) */}
                    <div className="xl:col-span-9 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
                            {/* ── COLUMNA 1: OPERACIÓN ── */}
                            <div className="space-y-6">
                                <section className="space-y-4">
                                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                                        <div className="w-1 h-3 bg-brand-blue rounded-full"></div>
                                        Vivienda y Plazo
                                    </h3>

                                    {userRole === 'asesor' && (
                                        <div className="bg-brand-blue/5 p-3 rounded-xl border border-brand-blue/10 mb-2">
                                            <label className="block text-[10px] font-black text-brand-blue uppercase tracking-widest mb-2 ml-1">ID de Prospecto / Cliente</label>
                                            <input type="number" name="codigo_prospecto" value={formData.codigo_prospecto} onChange={handleUnifiedChange} placeholder="Ingresa el ID (ej. 5)" className="w-full bg-white rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 border border-brand-blue/10 font-black text-gray-900 text-sm transition-all" />
                                            {prospectStatus && <p className={`text-[9px] font-black uppercase tracking-tight mt-2 ml-1 ${prospectStatus.includes('Error') || prospectStatus.includes('no encontrado') ? 'text-red-500' : prospectStatus.includes('Buscando') ? 'text-amber-500' : 'text-green-600'}`}>{prospectStatus}</p>}
                                        </div>
                                    )}

                                    <div className="relative">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Unidad</label>
                                        <select name="codigo_unidad" value={formData.codigo_unidad} onChange={handleUnifiedChange} className="w-full bg-gray-50/50 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 border border-gray-100 font-black text-gray-900 text-sm transition-all appearance-none cursor-pointer">
                                            <option value="" disabled>Seleccione una unidad...</option>
                                            {units.map(u => (
                                                <option key={u.codigo_unidad} value={u.codigo_unidad}>
                                                    {u.distrito_unidad} - {u.direccion_unidad}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-[34px] pointer-events-none text-gray-400">
                                            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>

                                    {selectedUnit && (
                                        <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black text-gray-400 uppercase">Precio</span>
                                                <span className="text-sm font-black text-gray-900">{selectedUnit.moneda === 2 || selectedUnit.codigo_moneda === 2 ? '$' : 'S/'} {parseFloat(selectedUnit.precio_venta).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Fecha de Inicio</label>
                                        <input type="date" name="fecha_inicio_prestamo" value={formData.fecha_inicio_prestamo} onChange={handleUnifiedChange} className="w-full bg-gray-50/50 rounded-xl py-2 px-3 focus:outline-none border border-gray-100 font-bold text-gray-900 text-sm" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Plazo (Meses)</label>
                                            <input type="number" name="plazo_meses" value={formData.plazo_meses} onChange={handleUnifiedChange} min="60" max="240" className="w-full bg-gray-50/50 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-blue/10 border border-gray-100 font-black text-gray-900 text-sm transition-all" />
                                        </div>
                                        <div className="relative">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Gracia</label>
                                            <select name="codigo_tipo_gracia" value={formData.codigo_tipo_gracia} onChange={handleUnifiedChange} className="w-full bg-gray-50/50 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 border border-gray-100 font-black text-gray-900 text-sm transition-all appearance-none cursor-pointer">
                                                <option value="1">Sin Gracia</option>
                                                <option value="2">Parcial</option>
                                                <option value="3">Total</option>
                                            </select>
                                            <div className="absolute right-3 top-[32px] pointer-events-none text-gray-400">
                                                <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>

                                    {formData.codigo_tipo_gracia !== '1' && (
                                        <div className="animate-in fade-in duration-300">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Meses de Gracia</label>
                                            <input type="number" name="meses_gracia" value={formData.meses_gracia} onChange={handleUnifiedChange} className="w-full bg-transparent border-b border-gray-100 py-1 px-1 focus:outline-none focus:border-brand-blue font-black text-gray-700 text-sm" />
                                        </div>
                                    )}
                                </section>

                                <section className="space-y-4 pt-4 border-t border-gray-100">
                                    <div className="flex justify-between items-center mb-1 ml-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cuota Inicial</label>
                                        <div className="flex bg-gray-50 p-0.5 rounded-lg border border-gray-100">
                                            <button onClick={() => { setCuotaType('porcentaje'); setServerError(null); }} className={`px-2 py-0.5 rounded-md text-[8px] font-black transition-all ${cuotaType === 'porcentaje' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-300'}`}>%</button>
                                            <button onClick={() => { setCuotaType('monto'); setServerError(null); }} className={`px-2 py-0.5 rounded-md text-[8px] font-black transition-all ${cuotaType === 'monto' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-300'}`}>S/</button>
                                        </div>
                                    </div>
                                    <input type="number" name="cuota_inicial" value={formData.cuota_inicial} onChange={handleUnifiedChange} className="w-full bg-gray-50/50 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-blue/10 border border-gray-100 font-black text-gray-900 text-sm transition-all" />
                                </section>
                            </div>
                            {/* ── COLUMNA 2: BANCO Y BONO ── */}
                            <div className="space-y-6">
                                <section className="space-y-4">
                                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                                        <div className="w-1 h-3 bg-brand-blue rounded-full"></div>
                                        Incentivos y Entidad
                                    </h3>

                                    <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                                        <div className="space-y-4">
                                            <div className="bg-white p-3 rounded-xl border border-gray-100">
                                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center border-b border-gray-100 pb-2 mb-3">Modalidad de Bono</h4>
                                                {(() => {
                                                    if (formData.codigo_tipo_tasa === '1') return <div className="text-center text-[8px] text-gray-400 p-2 uppercase font-bold">Cambie a TEA para usar bonos</div>;
                                                    const p = parseFloat(selectedUnit?.precio_venta || 0);
                                                    const mod = parseInt(selectedUnit?.codigo_modalidad || 0);
                                                    const isRestricted = formData.ha_recibido_apoyo || formData.tiene_credito_activo || formData.es_propietario_vivienda;
                                                    if (mod === 3 || isRestricted) {
                                                        let msg = "Sin BBP (No califica)";
                                                        if (formData.es_propietario_vivienda) msg = "Ya es propietario (No califica)";
                                                        else if (formData.ha_recibido_apoyo) msg = "Ya recibió apoyo (No califica)";
                                                        else if (formData.tiene_credito_activo) msg = "Tiene crédito activo (No califica)";
                                                        return <p className="text-[8px] font-bold text-red-500 p-2 uppercase text-center">{msg}</p>;
                                                    }
                                                    if (p > 362100) return <p className="text-[8px] font-bold text-amber-500 p-2 uppercase text-center">R5: Solo Bono Integrador</p>;

                                                    const isSostenible = selectedUnit?.es_sostenible || false;
                                                    const opciones = isSostenible
                                                        ? [{ label: 'Sin Bono', sinBono: true, sostenible: false, integrador: false }, { label: 'Sostenible', sinBono: false, sostenible: true, integrador: false }, { label: 'Integrador', sinBono: false, sostenible: true, integrador: true }]
                                                        : [{ label: 'Sin Bono', sinBono: true, sostenible: false, integrador: false }, { label: 'Tradicional', sinBono: false, sostenible: false, integrador: false }, { label: 'Integrador', sinBono: false, sostenible: false, integrador: true }];
                                                    const activeIdx = formData.sin_bono ? 0 : formData.es_integrador ? 2 : 1;
                                                    return (
                                                        <div className="space-y-2">
                                                            {opciones.map((op, idx) => (
                                                                <button key={op.label} type="button" onClick={() => setFormData(prev => ({ ...prev, sin_bono: op.sinBono, vivienda_sostenible: op.sostenible, es_integrador: op.integrador, codigo_tipo_tasa: '2' }))} className={`w-full py-1.5 rounded-lg text-[9px] font-black uppercase text-left px-3 ${activeIdx === idx ? 'bg-brand-blue text-white shadow-sm' : 'text-gray-400 hover:bg-gray-100/50'}`}>{op.label}</button>
                                                            ))}
                                                            {formData.es_integrador && (
                                                                <div className="pt-2 animate-in fade-in duration-300">
                                                                    <div className="relative">
                                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Categoría</label>
                                                                        <select name="categoria_integrador" value={formData.categoria_integrador} onChange={handleUnifiedChange} className="w-full bg-gray-50/50 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 border border-gray-100 font-black text-gray-900 text-sm transition-all appearance-none cursor-pointer">
                                                                            <option value="Menores ingresos">Menores Ingresos</option>
                                                                            <option value="Adulto mayor">Adulto Mayor (&gt;60)</option>
                                                                            <option value="Discapacidad">Discapacidad</option>
                                                                            <option value="Desplazado">Desplazados</option>
                                                                            <option value="Migrante retornado">Migrante</option>
                                                                        </select>
                                                                    </div>
                                                                    {formData.categoria_integrador === 'Menores ingresos' && (() => {
                                                                        const ifm = userRole === 'asesor' ? parseFloat(prospectIFM || 0) : (parseFloat(user?.ingreso_mensual || 0) + parseFloat(user?.ingreso_conyuge || 0));
                                                                        if (ifm > 4746) {
                                                                            return (
                                                                                <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-100 rounded-lg mt-2 animate-in slide-in-from-top-1 duration-200">
                                                                                    <InfoOutlinedIcon className="text-amber-600 shrink-0" sx={{ fontSize: 12 }} />
                                                                                    <p className="text-[8px] text-amber-700 font-bold leading-tight uppercase">
                                                                                        Ingreso Familiar (S/ {ifm.toLocaleString()}) excede el límite de S/ 4,746 para esta categoría.
                                                                                    </p>
                                                                                </div>
                                                                            );
                                                                        }
                                                                        return null;
                                                                    })()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                            <div className="p-3 bg-white rounded-xl border border-gray-100 space-y-2">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center border-b border-gray-100 pb-1">Declaraciones FMV</p>
                                                <div className="grid grid-cols-1 gap-1.5">
                                                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="es_propietario_vivienda" checked={formData.es_propietario_vivienda} onChange={(e) => setFormData(prev => ({ ...prev, es_propietario_vivienda: e.target.checked }))} className="w-3 h-3 text-brand-blue" /><span className="text-[9px] font-bold text-gray-500 uppercase">¿Es Propietario?</span></label>
                                                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="ha_recibido_apoyo" checked={formData.ha_recibido_apoyo} onChange={(e) => setFormData(prev => ({ ...prev, ha_recibido_apoyo: e.target.checked }))} className="w-3 h-3 text-brand-blue" /><span className="text-[9px] font-bold text-gray-500 uppercase">¿Apoyo FMV previo?</span></label>
                                                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="tiene_credito_activo" checked={formData.tiene_credito_activo} onChange={(e) => setFormData(prev => ({ ...prev, tiene_credito_activo: e.target.checked }))} className="w-3 h-3 text-brand-blue" /><span className="text-[9px] font-bold text-gray-500 uppercase">¿Crédito Activo?</span></label>
                                                </div>
                                                {(formData.es_propietario_vivienda || formData.ha_recibido_apoyo || formData.tiene_credito_activo) && (
                                                    <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-100 rounded-lg mt-1 animate-in zoom-in-95 duration-200">
                                                        <ErrorOutlineIcon className="text-red-500 shrink-0" sx={{ fontSize: 12 }} />
                                                        <p className="text-[8px] text-red-600 font-bold leading-tight uppercase">
                                                            Restricción BBP aplicada: El perfil no califica para bonos estatales.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative pt-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Entidad (IFI)</label>
                                        <select name="ifi_seleccionada" value={formData.ifi_seleccionada} onChange={handleUnifiedChange} className="w-full bg-gray-50/50 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 border border-gray-100 font-black text-gray-900 text-sm transition-all appearance-none cursor-pointer">
                                            <option value="">Cálculo Genérico</option>
                                            <option value="BCP">BCP</option>
                                            <option value="BBVA">BBVA</option>
                                            <option value="Interbank">Interbank</option>
                                            <option value="Pichincha">Banco Pichincha</option>
                                            <option value="GNB">GNB</option>
                                        </select>
                                        <div className="absolute right-3 top-[32px] pointer-events-none text-gray-400">
                                            <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">TEA (%)</label>
                                            <input type="number" name="tasa_anual" value={formData.tasa_anual} onChange={handleUnifiedChange} readOnly={!!formData.ifi_seleccionada} className={`w-full rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-blue/10 border border-gray-100 font-black text-gray-900 text-sm transition-all ${formData.ifi_seleccionada ? 'bg-gray-100 opacity-60' : 'bg-white'}`} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Desgrav. (%)</label>
                                            <input type="number" name="seguro_desgravamen" value={formData.seguro_desgravamen} onChange={handleUnifiedChange} readOnly={!!formData.ifi_seleccionada} className={`w-full rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-blue/10 border border-gray-100 font-black text-gray-900 text-sm transition-all ${formData.ifi_seleccionada ? 'bg-gray-100 opacity-60' : 'bg-white'}`} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className={`relative ${formData.ifi_seleccionada ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Tipo Tasa</label>
                                            <select name="codigo_tipo_tasa" value={formData.ifi_seleccionada ? '2' : formData.codigo_tipo_tasa} onChange={handleUnifiedChange} className="w-full bg-gray-50/50 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 border border-gray-100 font-black text-gray-900 text-sm appearance-none">
                                                <option value="1">Nominal</option>
                                                <option value="2">Efectiva</option>
                                            </select>
                                            <div className="absolute right-3 top-[32px] pointer-events-none text-gray-400">
                                                <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                        <div className={`relative transition-all duration-300 ${formData.codigo_tipo_tasa !== '1' ? 'opacity-30 pointer-events-none' : ''}`}>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Capitalización</label>
                                            <select name="capitalizacion" value={formData.capitalizacion} onChange={handleUnifiedChange} className="w-full bg-gray-50/50 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 border border-gray-100 font-black text-gray-900 text-sm appearance-none">
                                                <option value="Mensual">Mensual</option>
                                                <option value="Bimestral">Bimestral</option>
                                                <option value="Trimestral">Trimestral</option>
                                            </select>
                                            <div className="absolute right-3 top-[32px] pointer-events-none text-gray-400">
                                                <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* ── COLUMNA 3: GASTOS ── */}
                            <div className="space-y-6">
                                <section className="space-y-4">
                                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                                        <div className="w-[3px] h-3.5 bg-brand-orange"></div>
                                        Gastos
                                    </h3>

                                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-1">Gastos Iniciales</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div><label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Notaría</label><input type="number" name="gastos_notariales" value={formData.gastos_notariales} onChange={handleUnifiedChange} className="w-full bg-white border border-gray-100 rounded-lg py-1.5 px-3 text-xs font-bold focus:outline-none" /></div>
                                            <div><label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Registros</label><input type="number" name="gastos_estudio_titulos" value={formData.gastos_estudio_titulos} onChange={handleUnifiedChange} className="w-full bg-white border border-gray-100 rounded-lg py-1.5 px-3 text-xs font-bold focus:outline-none" /></div>
                                            <div><label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Tasación</label><input type="number" name="gastos_tasacion" value={formData.gastos_tasacion} onChange={handleUnifiedChange} className="w-full bg-white border border-gray-100 rounded-lg py-1.5 px-3 text-xs font-bold focus:outline-none" /></div>
                                            <div><label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Com. Estudio</label><input type="number" name="comision_estudio" value={formData.comision_estudio} onChange={handleUnifiedChange} className="w-full bg-white border border-gray-100 rounded-lg py-1.5 px-3 text-xs font-bold focus:outline-none" /></div>
                                            <div className="col-span-2"><label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Com. Activación</label><input type="number" name="comision_activacion" value={formData.comision_activacion} onChange={handleUnifiedChange} className="w-full bg-white border border-gray-100 rounded-lg py-1.5 px-3 text-xs font-bold focus:outline-none" /></div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-1">Gastos Periódicos</h4>
                                        <div className="space-y-3">
                                            <div><label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Comisión Periódica</label><input type="number" name="comision_periodica" value={formData.comision_periodica} onChange={handleUnifiedChange} className="w-full bg-white border border-gray-100 rounded-lg py-1.5 px-3 text-xs font-bold focus:outline-none" /></div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div><label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Portes</label><input type="number" name="portes" value={formData.portes} onChange={handleUnifiedChange} className="w-full bg-white border border-gray-100 rounded-lg py-1.5 px-3 text-xs font-bold focus:outline-none" /></div>
                                                <div><label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Gastos Admin.</label><input type="number" name="gastos_administracion" value={formData.gastos_administracion} onChange={handleUnifiedChange} className="w-full bg-white border border-gray-100 rounded-lg py-1.5 px-3 text-xs font-bold focus:outline-none" /></div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-gray-50 text-center">
                            {userRole === 'administrador' ? (
                                <div className="text-[9px] text-red-500 font-bold bg-red-50 p-3 rounded-xl border border-red-100 uppercase tracking-tighter inline-block px-8">Modo Lectura (Admin)</div>
                            ) : (
                                <div className="flex justify-center">
                                    <button onClick={handleSimulate} disabled={loading} className="w-full md:w-80 bg-brand-orange hover:bg-orange-600 text-white py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-brand-orange/30 transition-all flex items-center justify-center gap-3">
                                        {loading ? "Calculando..." : <>GENERAR PROYECCIÓN <ArrowForwardIcon sx={{ fontSize: 16 }} /></>}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SIDEPANEL: ANÁLISIS EN VIVO (3 COLUMNAS) */}
                    <div className="xl:col-span-3 bg-[#0F172A] p-5 rounded-[2rem] text-white shadow-2xl self-start sticky top-6 border border-white/5">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-brand-blue-light animate-pulse"></div>
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-blue-light">Resumen</h3>
                            </div>

                            <div className="space-y-3 px-1">
                                <div className="flex justify-between items-center"><p className="text-[9px] text-white/30 uppercase font-bold tracking-widest">Vivienda</p><p className="text-xs font-black">{selectedUnit?.moneda === 2 ? '$' : 'S/'} {parseFloat(selectedUnit?.precio_venta || 0).toLocaleString()}</p></div>
                                <div className="flex justify-between items-center"><p className="text-[9px] text-white/30 uppercase font-bold tracking-widest">(-) Inicial</p><p className="text-xs font-black text-rose-400">- {selectedUnit?.moneda === 2 ? '$' : 'S/'} {(() => { const p = parseFloat(selectedUnit?.precio_venta || 0); const v = parseFloat(formData.cuota_inicial || 0); return (cuotaType === 'porcentaje' ? (v / 100) * p : v).toLocaleString(); })()}</p></div>
                                <div className="flex justify-between items-center"><p className="text-[9px] text-white/30 uppercase font-bold tracking-widest">(-) Bono</p><p className="text-xs font-black text-emerald-400">- {selectedUnit?.moneda === 2 ? '$' : 'S/'} {parseFloat(formData.bono_bbp).toLocaleString()}</p></div>

                                <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                                    <p className="text-[10px] text-brand-blue-light uppercase font-black tracking-widest leading-none">Préstamo</p>
                                    <p className="text-lg font-black text-brand-blue-light">{selectedUnit?.moneda === 2 ? '$' : 'S/'} {(() => {
                                        const p = parseFloat(selectedUnit?.precio_venta || 0);
                                        const b = parseFloat(formData.bono_bbp || 0);
                                        const val = parseFloat(formData.cuota_inicial || 0);
                                        const ini = cuotaType === 'porcentaje' ? (val / 100) * p : val;
                                        const g = parseFloat(formData.gastos_tasacion || 0) + parseFloat(formData.gastos_notariales || 0) + parseFloat(formData.gastos_estudio_titulos || 0) + parseFloat(formData.comision_estudio || 0) + parseFloat(formData.comision_activacion || 0);
                                        return (p - ini - b + g).toLocaleString(undefined, { minimumFractionDigits: 2 });
                                    })()}</p>
                                </div>
                            </div>

                            {serverError && (
                                <div className="bg-rose-500/15 border border-rose-500/30 p-3 rounded-xl mt-4">
                                    <div className="flex items-start gap-2">
                                        <ErrorOutlineIcon className="text-rose-400 shrink-0" sx={{ fontSize: 16 }} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black text-rose-300 uppercase tracking-widest">{serverError.titulo}</p>
                                            <p className="text-[9px] text-rose-200 mt-1 leading-relaxed">{serverError.mensaje}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {result && !serverError && (
                                <div className="pt-3 mt-3 border-t border-white/10 space-y-2 px-1">
                                    <div className="flex justify-between items-center text-rose-300">
                                        <p className="text-[8px] uppercase font-black tracking-widest opacity-60">Intereses Totales</p>
                                        <p className="text-[10px] font-black">S/ {parseFloat(result.resumen?.total_intereses || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <div className="flex justify-between items-center text-amber-300 opacity-80">
                                        <p className="text-[8px] uppercase font-bold">Comisiones</p>
                                        <p className="text-[10px] font-black">S/ {parseFloat(result.resumen?.total_comisiones_periodicas || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <div className="flex justify-between items-center text-white font-black pt-2 border-t border-white/5">
                                        <p className="text-[9px] uppercase tracking-widest">Total</p>
                                        <p className="text-sm text-brand-blue-light">S/ {parseFloat(result.resumen?.total_pagado || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {result && (
                    <div id="simulation-result" className="animate-in fade-in slide-in-from-bottom-5 duration-700">
                        {/* ── Indicadores de Rentabilidad ── */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                            <div className="col-span-2 md:col-span-4 flex items-center gap-2 mb-1">
                                <div className="w-1 h-3 bg-brand-orange rounded-full"></div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Indicadores de Rentabilidad</p>
                            </div>
                            {[
                                {
                                    label: 'Tasa de Descuento',
                                    sublabel: 'COK mensual (8% anual)',
                                    value: `${parseFloat(result?.resumen?.tasa_descuento_mensual || 0).toFixed(5)}%`,
                                    accent: '#3B82F6',
                                    icon: <TrendingDownIcon sx={{ fontSize: 16 }} />
                                },
                                {
                                    label: 'TIR de la Operación',
                                    sublabel: 'TIR Mensual Proyectada',
                                    value: `${parseFloat(result?.resumen?.tir || 0).toFixed(5)}%`,
                                    accent: '#10B981',
                                    icon: <ShowChartIcon sx={{ fontSize: 16 }} />
                                },
                                {
                                    label: 'TCEA de la Operación',
                                    sublabel: 'Costo Efectivo Anual',
                                    value: `${parseFloat(result?.resumen?.tcea || 0).toFixed(5)}%`,
                                    accent: '#F97316',
                                    icon: <AccountBalanceWalletIcon sx={{ fontSize: 16 }} />
                                },
                                {
                                    label: 'VAN Operación',
                                    sublabel: 'Valor Actual Neto',
                                    value: `S/ ${parseFloat(result?.resumen?.van || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
                                    accent: parseFloat(result?.resumen?.van || 0) >= 0 ? '#10B981' : '#EF4444',
                                    icon: <AccountBalanceIcon sx={{ fontSize: 16 }} />
                                }
                            ].map((stat, i) => (
                                <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 hover:shadow-lg transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: stat.accent }}></div>
                                    <div className="p-2 rounded-xl bg-gray-50 text-gray-400 group-hover:bg-white group-hover:shadow-sm transition-all" style={{ color: stat.accent }}>
                                        {stat.icon}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                                        <p className="text-[13px] font-black leading-none truncate mb-1" style={{ color: stat.accent }}>{stat.value}</p>
                                        <p className="text-[8px] font-bold text-gray-300 uppercase leading-none">{stat.sublabel}</p>
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
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
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
                                            <th className="px-3 py-3">Comisión</th>
                                            <th className="px-3 py-3">Portes</th>
                                            <th className="px-3 py-3">Gastos Adm.</th>
                                            <th className="px-3 py-3 bg-brand-blue/5 text-brand-blue font-black">Flujo</th>
                                            <th className="px-3 py-3">Saldo Final</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 text-[9px] font-bold text-gray-700">
                                        {result.detalles.map((d, index) => {
                                            const rowClass = d.numero_cuota === 0 ? 'bg-gray-50/50 italic opacity-60 text-gray-400' : '';
                                            return (
                                                <tr key={index} className={`border-b border-gray-50 hover:bg-brand-blue/[0.02] transition-colors ${rowClass}`}>
                                                    <td className="px-2 py-2.5 font-black text-brand-blue">#{d.numero_cuota}</td>
                                                    <td className="px-2 py-2.5 text-center text-gray-500">{new Date(d.fecha_vencimiento).toLocaleDateString('es-PE')}</td>
                                                    <td className="px-3 py-2.5 text-center text-gray-500">{d.tea ? `${parseFloat(d.tea).toFixed(2)}%` : '—'}</td>
                                                    <td className="px-3 py-2.5 text-center text-gray-500">{d.tem ? `${parseFloat(d.tem).toFixed(4)}%` : '—'}</td>
                                                    <td className="px-3 py-2.5 text-gray-600 font-bold">S/ {parseFloat(d.saldo_inicial || d.saldo_inicio || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td className="px-3 py-2.5 text-gray-400">S/ {parseFloat(d.interes || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td className="px-3 py-2.5 text-gray-400">S/ {parseFloat(d.amortizacion || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td className="px-3 py-2.5 text-gray-400">S/ {parseFloat(d.seguro_desgravamen || d.seguro || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td className="px-3 py-2.5 text-gray-400">S/ {parseFloat(d.comision_periodica || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td className="px-3 py-2.5 text-gray-400">S/ {parseFloat(d.portes || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td className="px-3 py-2.5 text-gray-400">S/ {parseFloat(d.gastos_administracion || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td className="px-3 py-2.5 font-black text-brand-blue bg-brand-blue/[0.01]">S/ {parseFloat(d.cuota_total || d.cuota || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td className="px-3 py-2.5 text-gray-900 font-black">S/ {parseFloat(d.saldo_final || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
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
