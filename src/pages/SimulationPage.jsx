import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getUnits } from '../services/unitService';
import { createSimulation } from '../services/simulationService';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SavingsIcon from '@mui/icons-material/Savings';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CustomSelect from '../components/CustomSelect';

const SimulationPage = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const userRole = (user?.rol_rel?.tipo_rol || user?.role || user?.rol || '').toLowerCase();
    const userId = user?.codigo_usuario || user?.id;
    const unidadPreseleccionada = location.state?.unidadSeleccionada;
    const clientePreseleccionado = location.state?.clientePreseleccionado;

    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState(null);
    const [cuotaType, setCuotaType] = useState('porcentaje');

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
        codigo_prospecto: clientePreseleccionado ? String(clientePreseleccionado) : '',
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

                    // 🚨 REEMPLAZA ESTO POR LA URL REAL DE TU BACKEND EN RENDER 🚨
                    const API_URL = 'https://pon-tu-url-real-aqui.onrender.com';

                    const response = await fetch(`https://propequity-backend.onrender.com/api/v1/simulator/check-income/${formData.codigo_prospecto}`, {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                navigate(`/simulaciones/${response.data.codigo_simulacion}`);
            } else {
                setServerError({ titulo: getErrorTitle(response.error), mensaje: response.error });
            }
        } catch (error) {
            console.error(error);
            const msg = error.message || 'Error al simular';
            setServerError({ titulo: getErrorTitle(msg), mensaje: msg });
        } finally { setLoading(false); }
    };

    useEffect(() => {
        if (selectedUnit) {
            setFormData(prev => ({ ...prev, vivienda_sostenible: selectedUnit.es_sostenible || false, es_integrador: false, sin_bono: true }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedUnit]);

    const visualIFM = userRole === 'asesor'
        ? prospectIFM
        : (parseFloat(user?.ingreso_mensual || 0) + parseFloat(user?.ingreso_conyuge || 0));

    return (
        <div className="flex bg-[#F8FAFC] min-h-screen font-['Inter',_sans-serif]">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-10 overflow-y-auto bg-gray-50/50 flex flex-col">
                {/* 🚨 TEXTOS DEL HEADER AUMENTADOS */}
                <header className="mb-6 flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm shrink-0">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">Simulador PropEquity</h1>
                        <p className="text-gray-400 text-sm font-bold mt-2 uppercase tracking-[0.2em]">Crédito MiVivienda 2026</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 items-stretch">
                    {/* PANEL IZQUIERDO: Formulario a pantalla completa */}
                    <div className="xl:col-span-8 2xl:col-span-9 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between">

                        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-6">
                            {/* Inmueble y Cliente */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-brand-blue uppercase tracking-widest border-b border-gray-50 pb-2 mb-2">Inmueble</h3>

                                {userRole === 'asesor' && (
                                    <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl mb-4">
                                        <label className="flex items-center gap-1.5 text-[10px] font-black text-brand-orange uppercase tracking-widest mb-1.5">
                                            <PersonOutlineIcon sx={{ fontSize: 14 }} /> ID del Prospecto/Cliente
                                        </label>
                                        <input
                                            type="number"
                                            name="codigo_prospecto"
                                            value={formData.codigo_prospecto}
                                            onChange={handleChange}
                                            placeholder="Ej: 126"
                                            className="w-full bg-white border border-orange-200 rounded-lg py-2 px-3 text-sm font-bold text-gray-700 focus:outline-none focus:border-brand-orange shadow-sm"
                                        />
                                        {prospectStatus && (
                                            <p className={`text-[9px] font-bold mt-2 leading-tight ${prospectIFM > 0 ? 'text-green-600' : 'text-red-500'}`}>
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
                                        <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 space-y-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">Precio</span>
                                                <span className="text-xs font-black text-gray-700">{m ? '$' : 'S/'} {parseFloat(selectedUnit.precio_venta).toLocaleString()}</span>
                                            </div>
                                            {rangoInfo ? (
                                                <p className="text-[9px] font-semibold text-green-600">✓ {rangoInfo.rango} - Elegible MiVivienda</p>
                                            ) : (
                                                <p className="text-[9px] font-semibold text-red-500">⚠ Fuera de rango MiVivienda (S/68,800 - S/488,800)</p>
                                            )}
                                        </div>
                                    );
                                })()}

                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Plazo (Meses)</label>
                                    <input type="number" name="plazo_meses" value={formData.plazo_meses} onChange={handleChange} min="60" max="240" className="w-full bg-transparent border-b-2 border-gray-100 py-1.5 px-2 focus:outline-none focus:border-brand-blue font-black text-gray-700 text-base" />
                                    <p className="text-[9px] font-medium text-gray-400 mt-1 ml-1">Rango permitido: 60 - 240 meses</p>
                                    {parseInt(formData.plazo_meses) < 60 && <p className="text-[10px] text-red-500 font-bold ml-1 mt-1">⚠ Mínimo 60 meses</p>}
                                    {parseInt(formData.plazo_meses) > 240 && <p className="text-[10px] text-red-500 font-bold ml-1 mt-1">⚠ Máximo 240 meses</p>}
                                </div>
                                <CustomSelect label="Periodo de Gracia" value={formData.codigo_tipo_gracia} showInfo={true} onChange={(val) => handleCustomChange('codigo_tipo_gracia', val)} options={[{ id: '1', label: 'Sin Gracia' }, { id: '2', label: 'Parcial' }, { id: '3', label: 'Total' }]} />
                                {formData.codigo_tipo_gracia !== '1' && (
                                    <div className="animate-in fade-in duration-300">
                                        <label className="block text-[11px] font-black text-gray-400 uppercase mb-1.5 ml-1">Meses de Gracia</label>
                                        <input type="number" name="meses_gracia" value={formData.meses_gracia} onChange={handleChange} className="w-full bg-transparent border-b-2 border-gray-100 py-1.5 px-2 focus:outline-none focus:border-brand-blue font-black text-gray-700 text-base" />
                                        {parseInt(formData.meses_gracia) >= parseInt(formData.plazo_meses) && <p className="text-[10px] text-red-500 font-bold mt-1">Debe ser menor al plazo</p>}
                                    </div>
                                )}
                            </div>

                            {/* Aportes */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-brand-blue uppercase tracking-widest border-b border-gray-50 pb-2 mb-2">Aportes</h3>
                                <div>
                                    <div className="flex justify-between items-center mb-1.5 ml-1">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Inicial</label>
                                        <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100">
                                            <button onClick={() => setCuotaType('porcentaje')} className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${cuotaType === 'porcentaje' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-300'}`}>%</button>
                                            <button onClick={() => setCuotaType('monto')} className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${cuotaType === 'monto' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-300'}`}>S/</button>
                                        </div>
                                    </div>
                                    <input type="number" name="cuota_inicial" value={formData.cuota_inicial} onChange={handleChange} className="w-full bg-transparent border-b-2 border-gray-100 py-1.5 px-2 focus:outline-none focus:border-brand-blue font-black text-gray-900 text-base" />
                                    {selectedUnit && (() => {
                                        const p = selectedUnit?.precio_venta || 0;
                                        const val = parseFloat(formData.cuota_inicial);
                                        const ini = cuotaType === 'porcentaje' ? (val / 100) * p : val;
                                        const minPerc = selectedUnit?.codigo_modalidad === 1 ? 0.10 : 0.075;
                                        const minMonto = p * minPerc;
                                        const isValid = ini >= minMonto;
                                        return (
                                            <>
                                                {isValid ? (
                                                    <p className="text-[9px] text-green-600 font-semibold ml-1 mt-1.5">✓ Cuota inicial válida ({((ini / p) * 100).toFixed(1)}%)</p>
                                                ) : (
                                                    <p className="text-[9px] text-red-500 font-semibold ml-1 mt-1.5">⚠ Insuficiente (actual: {((ini / p) * 100).toFixed(1)}%)</p>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                                {selectedUnit && (
                                    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${selectedUnit.es_sostenible ? 'bg-emerald-50/50 border-emerald-100' : 'bg-gray-50/50 border-gray-100'}`}>
                                        <SavingsIcon sx={{ fontSize: 18, color: selectedUnit.es_sostenible ? '#10b981' : '#94a3b8' }} />
                                        <p className={`text-[10px] font-black uppercase ${selectedUnit.es_sostenible ? 'text-emerald-600' : 'text-gray-400'} leading-none`}>{selectedUnit.es_sostenible ? 'Sostenibilidad Grado III' : 'Inmueble Tradicional'}</p>
                                    </div>
                                )}
                                <div className="space-y-1.5 bg-gray-50/50 p-2 rounded-xl border border-gray-100">
                                    <p className="text-[9px] font-black text-gray-400 uppercase text-center mb-2 mt-1">Modalidad de Bono</p>
                                    {(() => {
                                        const p = parseFloat(selectedUnit?.precio_venta || 0);
                                        const mod = parseInt(selectedUnit?.codigo_modalidad || 0);
                                        const isOwner = user?.es_propietario_vivienda;

                                        if (p > 362100) return <p className="text-[9px] font-bold text-amber-500 p-2 uppercase text-center">R5: Solo Bono Integrador</p>;
                                        if (mod === 3) return <p className="text-[9px] font-bold text-red-400 p-2 uppercase text-center">Mejoramiento: Sin BBP</p>;
                                        if (isOwner) return <p className="text-[9px] font-bold text-red-400 p-2 uppercase text-center">Propietario actual: Sin BBP</p>;

                                        const isSostenible = selectedUnit?.es_sostenible || false;
                                        const opciones = isSostenible
                                            ? [{ label: 'Sin Bono', sinBono: true, sostenible: false, integrador: false }, { label: 'Sostenible', sinBono: false, sostenible: true, integrador: false }, { label: 'Integrador', sinBono: false, sostenible: true, integrador: true }]
                                            : [{ label: 'Sin Bono', sinBono: true, sostenible: false, integrador: false }, { label: 'Tradicional', sinBono: false, sostenible: false, integrador: false }, { label: 'Integrador', sinBono: false, sostenible: false, integrador: true }];
                                        const activeIdx = formData.sin_bono ? 0 : formData.es_integrador ? 2 : 1;
                                        return opciones.map((op, idx) => (
                                            <button key={op.label} type="button" onClick={() => setFormData(prev => ({ ...prev, sin_bono: op.sinBono, vivienda_sostenible: op.sostenible, es_integrador: op.integrador }))} className={`w-full py-2.5 rounded-lg text-[10px] font-black uppercase text-left px-4 ${activeIdx === idx ? 'bg-brand-blue text-white shadow-md' : 'text-gray-400 hover:bg-gray-100/50'}`}>{op.label}</button>
                                        ));
                                    })()}
                                </div>
                                {formData.es_integrador && (
                                    <div className="animate-in slide-in-from-top-2 duration-300">
                                        <CustomSelect label="Categoría Integrador" value={formData.categoria_integrador} onChange={(val) => handleCustomChange('categoria_integrador', val)} options={[{ id: 'Menores ingresos', label: 'Menores Ingresos' }, { id: 'Adulto mayor', label: 'Adulto Mayor' }, { id: 'Desplazados', label: 'Desplazados' }, { id: 'Miembros FF.AA.', label: 'FF.AA. / PNP' }]} />
                                        {formData.categoria_integrador === 'Menores ingresos' && visualIFM > 4746 && (
                                            <p className="text-[10px] text-red-500 font-bold mt-2 bg-red-50 p-2 rounded-lg border border-red-100">Excede Ingresos (S/ 4,746)</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Banco */}
                            <div className="space-y-5">
                                <h3 className="text-xs font-black text-brand-blue uppercase tracking-widest border-b border-gray-50 pb-2 mb-2">Banco</h3>
                                <CustomSelect label="Entidad (IFI)" value={formData.ifi_seleccionada} showInfo={true} onChange={(val) => handleCustomChange('ifi_seleccionada', val)} options={[{ id: '', label: 'Cálculo Genérico' }, { id: 'BCP', label: 'BCP' }, { id: 'BBVA', label: 'BBVA' }, { id: 'Interbank', label: 'Interbank' }, { id: 'Pichincha', label: 'Banco Pichincha' }, { id: 'GNB', label: 'GNB' }]} />
                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase mb-1.5 ml-1">Tasa Anual (%)</label>
                                    <input type="number" name="tasa_anual" value={formData.tasa_anual} onChange={handleChange} className="w-full bg-transparent border-b-2 border-gray-100 py-1.5 px-2 focus:outline-none focus:border-brand-blue font-black text-gray-900 text-base" />
                                </div>
                                <CustomSelect label="Tipo de Tasa" value={formData.codigo_tipo_tasa} showInfo={true} onChange={(val) => handleCustomChange('codigo_tipo_tasa', val)} options={[{ id: '1', label: 'Nominal (TNA)' }, { id: '2', label: 'Efectiva (TEA)' }]} />

                                <div className={`transition-all duration-300 ${formData.codigo_tipo_tasa === '1' ? 'opacity-100 h-auto mb-3' : 'opacity-40 h-auto pointer-events-none'}`}>
                                    <CustomSelect label="Capitalización" value={formData.capitalizacion} showInfo={true} onChange={(val) => handleCustomChange('capitalizacion', val)} options={[{ id: 'Mensual', label: 'Mensual' }, { id: 'Bimestral', label: 'Bimestral' }, { id: 'Trimestral', label: 'Trimestral' }]} />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase mb-1.5 ml-1">Fecha de Inicio</label>
                                    <input type="date" name="fecha_inicio_prestamo" value={formData.fecha_inicio_prestamo} onChange={handleChange} className="w-full bg-transparent border-b-2 border-gray-100 py-1.5 px-2 focus:outline-none focus:border-brand-blue font-black text-gray-900 text-sm" />
                                </div>
                            </div>

                            {/* Detalle Gastos */}
                            <div className="space-y-5">
                                <h3 className="text-xs font-black text-brand-blue uppercase tracking-widest border-b border-gray-50 pb-2 mb-2">Detalle</h3>
                                <div className="bg-gray-50/20 p-4 rounded-xl border border-gray-100 space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Tasación</label><input type="number" name="gastos_tasacion" value={formData.gastos_tasacion} onChange={handleChange} className="w-full bg-white border border-gray-100 rounded-lg py-1.5 px-2 text-xs font-bold focus:outline-none focus:border-brand-blue shadow-sm" /></div>
                                        <div><label className="block text-[9px] font-black text-gray-400 uppercase mb-1">CRI/Títulos</label><input type="number" name="gastos_estudio_titulos" value={formData.gastos_estudio_titulos} onChange={handleChange} className="w-full bg-white border border-gray-100 rounded-lg py-1.5 px-2 text-xs font-bold focus:outline-none focus:border-brand-blue shadow-sm" /></div>
                                        <div><label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Notaría</label><input type="number" name="gastos_notariales" value={formData.gastos_notariales} onChange={handleChange} className="w-full bg-white border border-gray-100 rounded-lg py-1.5 px-2 text-xs font-bold focus:outline-none focus:border-brand-blue shadow-sm" /></div>
                                        <div><label className="block text-[9px] font-black text-gray-400 uppercase mb-1">Comis. Banco</label><input type="number" name="comision_ifi" value={formData.comision_ifi} onChange={handleChange} className="w-full bg-white border border-gray-100 rounded-lg py-1.5 px-2 text-xs font-bold focus:outline-none focus:border-brand-blue shadow-sm" /></div>
                                    </div>
                                    {selectedUnit && (() => {
                                        const totalGastos = parseFloat(formData.gastos_tasacion || 0) + parseFloat(formData.gastos_notariales || 0) + parseFloat(formData.gastos_estudio_titulos || 0) + parseFloat(formData.comision_ifi || 0);
                                        const precio = parseFloat(selectedUnit.precio_venta || 0);
                                        const pct = precio > 0 ? (totalGastos / precio) * 100 : 0;
                                        const isValid = pct <= 5;
                                        return (
                                            <div className={`text-[9px] font-semibold px-1 mt-2 ${isValid ? 'text-green-600' : 'text-red-500'}`}>
                                                {isValid ? '✓' : '⚠'} Gastos cierre: {pct.toFixed(2)}% del precio (máx. 5%)
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* 🚨 BOTÓN GIGANTE EN LA PARTE INFERIOR DEL PANEL BLANCO */}
                        <div className="mt-8 pt-8 border-t border-gray-100">
                            <button
                                onClick={handleSimulate}
                                disabled={loading}
                                className="w-full bg-brand-orange hover:bg-orange-600 text-white py-5 rounded-[1.5rem] font-black text-base uppercase tracking-[0.2em] shadow-xl shadow-brand-orange/30 transition-all flex items-center justify-center gap-3 hover:-translate-y-1 active:scale-95"
                            >
                                {loading ? "Calculando Análisis..." : <>CALCULAR Y VER CRONOGRAMA DETALLADO <ArrowForwardIcon sx={{ fontSize: 24 }} /></>}
                            </button>
                        </div>
                    </div>

                    {/* PANEL DERECHO: Análisis en Vivo */}
                    <div className="xl:col-span-4 2xl:col-span-3 bg-[#0F172A] p-6 rounded-[2rem] text-white shadow-xl flex flex-col justify-between self-stretch">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                                <ShowChartIcon className="text-brand-blue-light" sx={{ fontSize: 24 }} />
                                <h3 className="text-sm font-black uppercase tracking-widest text-brand-blue-light">Análisis en Vivo</h3>
                            </div>

                            {/* Desglose de Montos */}
                            <div className="space-y-3 px-1">
                                <div className="flex justify-between items-center"><p className="text-[10px] text-gray-400 uppercase font-black">Valor Vivienda</p><p className="text-sm font-black">{selectedUnit?.moneda === 2 ? '$' : 'S/'} {parseFloat(selectedUnit?.precio_venta || 0).toLocaleString()}</p></div>
                                <div className="flex justify-between items-center"><p className="text-[10px] text-gray-400 uppercase font-black">(-) Cuota Inicial</p><p className="text-sm font-black text-rose-400">- {selectedUnit?.moneda === 2 ? '$' : 'S/'} {(() => { const p = parseFloat(selectedUnit?.precio_venta || 0); const v = parseFloat(formData.cuota_inicial || 0); return (cuotaType === 'porcentaje' ? (v / 100) * p : v).toLocaleString(); })()}</p></div>
                                <div className="flex justify-between items-center"><p className="text-[10px] text-gray-400 uppercase font-black">(-) Bono BBP</p><p className="text-sm font-black text-emerald-400">- {selectedUnit?.moneda === 2 ? '$' : 'S/'} {parseFloat(formData.bono_bbp).toLocaleString()}</p></div>
                                <div className="pt-3 border-t border-white/10 flex justify-between items-center"><p className="text-[10px] text-brand-blue-light uppercase font-black">Crédito Neto</p><p className="text-base font-black text-brand-blue-light">{selectedUnit?.moneda === 2 ? '$' : 'S/'} {(() => { const p = parseFloat(selectedUnit?.precio_venta || 0); const b = parseFloat(formData.bono_bbp || 0); const val = parseFloat(formData.cuota_inicial || 0); const ini = cuotaType === 'porcentaje' ? (val / 100) * p : val; return (p - ini - b).toLocaleString(); })()}</p></div>

                                <div className="flex justify-between items-center pt-2"><p className="text-[10px] text-gray-400 uppercase font-black">Ingreso Familiar (IFM)</p><p className="text-sm font-black text-white">S/ {visualIFM.toLocaleString()}</p></div>
                            </div>

                            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
                                <div className="flex justify-between text-[11px] font-bold text-gray-300">
                                    <span className="uppercase opacity-60">Gastos Operativos</span>
                                    <span>
                                        {selectedUnit?.moneda === 2 ? '$' : 'S/'}
                                        {(parseFloat(formData.gastos_tasacion || 0) + parseFloat(formData.gastos_notariales || 0) + parseFloat(formData.gastos_estudio_titulos || 0) + parseFloat(formData.comision_ifi || 0)).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-[11px] font-bold text-gray-300">
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

                            <div className="bg-brand-blue/20 p-6 rounded-2xl border border-brand-blue/30 text-center relative overflow-hidden shadow-inner mt-4">
                                <AccountBalanceIcon className="absolute -right-4 -bottom-4 opacity-10 text-brand-blue-light" sx={{ fontSize: 100 }} />
                                <p className="text-[10px] font-black text-brand-blue-light uppercase mb-2 tracking-[0.2em] relative z-10">
                                    Listo para Simular
                                </p>
                                <p className="text-lg font-bold text-gray-300 relative z-10">
                                    Presiona el botón inferior para conocer tu cuota y cronograma.
                                </p>
                            </div>

                            {/* Mensaje de error del backend */}
                            <div className="space-y-3 mt-4">
                                {serverError ? (
                                    <div className="bg-rose-500/15 border border-rose-500/30 p-3 rounded-xl">
                                        <div className="flex items-start gap-3">
                                            <ErrorOutlineIcon className="text-rose-400 shrink-0 mt-0.5" sx={{ fontSize: 18 }} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-bold text-rose-300 uppercase tracking-widest mb-1">{serverError.titulo}</p>
                                                <p className="text-[10px] text-rose-200/90 leading-relaxed">{serverError.mensaje}</p>
                                                <button
                                                    onClick={() => setServerError(null)}
                                                    className="mt-3 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 rounded text-[9px] font-black uppercase tracking-widest transition-colors"
                                                >
                                                    Entendido
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : !selectedUnit && (
                                    <div className="bg-blue-500/15 border border-blue-500/30 p-3 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <InfoOutlinedIcon className="text-blue-400" sx={{ fontSize: 18 }} />
                                            <p className="text-[10px] font-bold text-blue-300">Seleccione una unidad para simular</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SimulationPage;
