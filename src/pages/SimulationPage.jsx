import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getUnits } from '../services/unitService';
import { runSimulation, exportSimulationExcel, exportSimulationPdf } from '../services/simulationService';
import { useAuth } from '../context/AuthContext';
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
    const { user } = useAuth();
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [cuotaType, setCuotaType] = useState('porcentaje');

    const [formData, setFormData] = useState({
        codigo_unidad: '',
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
        seguro_desgravamen: '0.039',
        tipo_cambio: '3.80',
        ha_recibido_apoyo: false,
        tiene_credito_activo: false,
        fecha_inicio_prestamo: new Date().toISOString().split('T')[0]
    });

    const selectedUnit = units.find(u => String(u.codigo_unidad) === formData.codigo_unidad);

    const fetchUnits = async () => {
        try {
            const data = await getUnits();
            setUnits(data);
            if (data.length > 0) {
                setFormData(prev => ({ ...prev, codigo_unidad: String(data[0].codigo_unidad) }));
            }
        } catch (error) {
            console.error("Error cargando unidades:", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (e.target.type === 'number' && parseFloat(value) < 0) return;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCustomChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: String(value) }));
    };

    useEffect(() => {
        fetchUnits();
    }, []);

    const calculateBBP = (precio, moneda, sostenible = false, integrador = false, tc = 3.80) => {
        let pPEN = parseFloat(precio);
        const isUSD = moneda === 2 || moneda === 'USD';

        // Si es USD, convertir a soles para validar rango según normativa FMV
        if (isUSD) pPEN = pPEN * tc;

        let bonoPEN = 0;
        if (pPEN >= 68800 && pPEN <= 98100) bonoPEN = integrador ? (sostenible ? 37300 : 31000) : (sostenible ? 33700 : 27400);
        else if (pPEN > 98100 && pPEN <= 146900) bonoPEN = integrador ? (sostenible ? 32700 : 26400) : (sostenible ? 29100 : 22800);
        else if (pPEN > 146900 && pPEN <= 244600) bonoPEN = integrador ? (sostenible ? 30800 : 24500) : (sostenible ? 27200 : 20900);
        else if (pPEN > 244600 && pPEN <= 362100) bonoPEN = integrador ? (sostenible ? 17700 : 11400) : (sostenible ? 14100 : 7800);

        // Convertir el bono de vuelta a USD si la unidad está en esa moneda
        return isUSD ? (bonoPEN / tc).toFixed(2) : bonoPEN.toString();
    };

    useEffect(() => {
        if (selectedUnit) {
            const m = selectedUnit.moneda || selectedUnit.codigo_moneda;

            // BLINDAJE: Si ya recibió apoyo o tiene crédito activo, NO califica a BBP (Regla FMV)
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
    }, [formData.codigo_unidad, formData.vivienda_sostenible, formData.es_integrador, formData.categoria_integrador, formData.sin_bono, formData.ha_recibido_apoyo, formData.tiene_credito_activo, formData.tipo_cambio, units, user?.ingreso_mensual]);

    useEffect(() => {
        if (formData.ifi_seleccionada && formData.codigo_tipo_tasa === '1') {
            setFormData(prev => ({ ...prev, codigo_tipo_tasa: '2' }));
        }
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
        const val = parseFloat(formData.cuota_inicial);
        const plazo = parseInt(formData.plazo_meses);
        const precio = selectedUnit?.precio_venta || 0;
        let finalCuotaInicial = cuotaType === 'porcentaje' ? (val / 100) * precio : val;
        const totalGastosCierre = parseFloat(formData.gastos_tasacion || 0) + parseFloat(formData.gastos_notariales || 0) + parseFloat(formData.gastos_estudio_titulos || 0) + parseFloat(formData.comision_ifi || 0);
        setLoading(true);
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
                codigo_cliente: user?.role === 'Cliente' ? user.id : null,
                codigo_asesor: user?.role === 'Asesor' ? user.id : null,
                fecha_inicio_prestamo: formData.fecha_inicio_prestamo
            };
            const data = await runSimulation(payload);
            setResult(data);
            setTimeout(() => { document.getElementById('simulation-result')?.scrollIntoView({ behavior: 'smooth' }); }, 100);
        } catch (error) { console.error(error); alert("Error al simular."); } finally { setLoading(false); }
    };

    useEffect(() => {
        if (selectedUnit) {
            setFormData(prev => ({ ...prev, vivienda_sostenible: selectedUnit.es_sostenible || false, es_integrador: false, sin_bono: true }));
        }
    }, [formData.codigo_unidad, units]);

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
                            {/* Inmueble */}
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-black text-brand-blue uppercase tracking-widest border-b border-gray-50 pb-2 mb-1">Inmueble</h3>
                                <CustomSelect label="Unidad" value={formData.codigo_unidad} showInfo={true} onChange={(val) => handleCustomChange('codigo_unidad', val)} options={units.map(u => ({ id: u.codigo_unidad, label: `${u.distrito_unidad} - ${u.direccion_unidad}` }))} />
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Plazo (Meses)</label>
                                    <input type="number" name="plazo_meses" value={formData.plazo_meses} onChange={handleChange} className="w-full bg-transparent border-b border-gray-100 py-1 px-1 focus:outline-none focus:border-brand-blue font-black text-gray-700 text-sm" />
                                    {parseInt(formData.plazo_meses) < 60 && <p className="text-[8px] text-red-500 font-bold mt-1">Mínimo 60 meses</p>}
                                </div>
                                <CustomSelect label="Periodo de Gracia" value={formData.codigo_tipo_gracia} showInfo={true} onChange={(val) => handleCustomChange('codigo_tipo_gracia', val)} options={[{ id: '1', label: 'Sin Gracia' }, { id: '2', label: 'Parcial' }, { id: '3', label: 'Total' }]} />
                                {formData.codigo_tipo_gracia !== '1' && (
                                    <div className="animate-in fade-in duration-300">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Meses de Gracia</label>
                                        <input type="number" name="meses_gracia" value={formData.meses_gracia} onChange={handleChange} className="w-full bg-transparent border-b border-gray-100 py-1 px-1 focus:outline-none focus:border-brand-blue font-black text-gray-700 text-sm" />
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
                                    {(() => {
                                        const p = selectedUnit?.precio_venta || 0;
                                        const val = parseFloat(formData.cuota_inicial);
                                        const ini = cuotaType === 'porcentaje' ? (val / 100) * p : val;
                                        // Compras (Mod 1) exigen 10%. Construcción/Mejoramiento (Mod 2/3) exigen 7.5%.
                                        const minPerc = selectedUnit?.codigo_modalidad === 1 ? 0.10 : 0.075;
                                        if (ini < (p * minPerc)) return <p className="text-[8px] text-red-500 font-bold mt-1">Mínimo {(minPerc * 100)}% ({selectedUnit?.moneda === 2 ? '$' : 'S/'} {(p * minPerc).toLocaleString()})</p>;
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
                                        if (p > 362100 || mod === 3 || isOwner) return <p className="text-[8px] font-bold text-red-400 p-2 uppercase text-center">BBP No aplica</p>;
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
                                        {formData.categoria_integrador === 'Menores ingresos' && parseFloat(user?.ingreso_mensual || 0) > 4746 && (
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

                                {/* Capitalización siempre visible o condicional, pero con mejor spacing */}
                                <div className={`transition-all duration-300 ${formData.codigo_tipo_tasa === '1' ? 'opacity-100 h-auto mb-2' : 'opacity-40 h-auto pointer-events-none'}`}>
                                    <CustomSelect label="Capitalización" value={formData.capitalizacion} showInfo={true} onChange={(val) => handleCustomChange('capitalizacion', val)} options={[{ id: 'Diaria', label: 'Diaria' }, { id: 'Quincenal', label: 'Quincenal' }, { id: 'Mensual', label: 'Mensual' }, { id: 'Trimestral', label: 'Trimestral' }, { id: 'Semestral', label: 'Semestral' }]} />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Fecha de Inicio</label>
                                    <input type="date" name="fecha_inicio_prestamo" value={formData.fecha_inicio_prestamo} onChange={handleChange} className="w-full bg-transparent border-b border-gray-100 py-1.5 px-1 focus:outline-none focus:border-brand-blue font-black text-gray-900 text-[11px]" />
                                </div>
                            </div>

                            {/* Detalle Gastos */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-brand-blue uppercase tracking-widest border-b border-gray-50 pb-2 mb-1">Detalle</h3>
                                <div className="bg-gray-50/20 p-2.5 rounded-xl border border-gray-100 grid grid-cols-2 gap-3">
                                    <div><label className="block text-[7px] font-black text-gray-400 uppercase mb-0.5">Tasación</label><input type="number" name="gastos_tasacion" value={formData.gastos_tasacion} onChange={handleChange} className="w-full bg-white border border-gray-100 rounded-md py-1 px-1.5 text-[10px] font-bold focus:outline-none focus:border-brand-blue shadow-sm" /></div>
                                    <div><label className="block text-[7px] font-black text-gray-400 uppercase mb-0.5">CRI/Títulos</label><input type="number" name="gastos_estudio_titulos" value={formData.gastos_estudio_titulos} onChange={handleChange} className="w-full bg-white border border-gray-100 rounded-md py-1 px-1.5 text-[10px] font-bold focus:outline-none focus:border-brand-blue shadow-sm" /></div>
                                    <div><label className="block text-[7px] font-black text-gray-400 uppercase mb-0.5">Notaría</label><input type="number" name="gastos_notariales" value={formData.gastos_notariales} onChange={handleChange} className="w-full bg-white border border-gray-100 rounded-md py-1 px-1.5 text-[10px] font-bold focus:outline-none focus:border-brand-blue shadow-sm" /></div>
                                    <div><label className="block text-[7px] font-black text-gray-400 uppercase mb-0.5">Comis. Banco</label><input type="number" name="comision_ifi" value={formData.comision_ifi} onChange={handleChange} className="w-full bg-white border border-gray-100 rounded-md py-1 px-1.5 text-[10px] font-bold focus:outline-none focus:border-brand-blue shadow-sm" /></div>
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

                                <div className="flex justify-between items-center pt-1"><p className="text-[8px] text-gray-400 uppercase font-black">Ingreso Familiar (IFM)</p><p className="text-[11px] font-black text-white">S/ {(parseFloat(user?.ingreso_mensual || 0) + parseFloat(user?.ingreso_conyuge || 0)).toLocaleString()}</p></div>
                                {parseFloat(user?.ingreso_conyuge || 0) > 0 && (
                                    <div className="flex justify-between items-center opacity-40 -mt-1"><p className="text-[6px] text-gray-300 uppercase font-bold tracking-tighter">└ T: S/ {parseFloat(user?.ingreso_mensual || 0).toLocaleString()} | C: S/ {parseFloat(user?.ingreso_conyuge || 0).toLocaleString()}</p></div>
                                )}
                            </div>

                            <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-1.5">
                                <div className="flex justify-between text-[9px] font-bold text-gray-300"><span className="uppercase opacity-60">Gastos Operativos</span><span>{selectedUnit?.moneda === 2 ? '$' : 'S/'} {(parseFloat(formData.gastos_tasacion || 0) + parseFloat(formData.gastos_notariales || 0) + parseFloat(formData.gastos_estudio_titulos || 0) + parseFloat(formData.comision_ifi || 0)).toLocaleString()}</span></div>
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
                                <p className="text-[9px] font-black text-brand-blue-light uppercase mb-1.5 tracking-[0.2em] relative z-10">Cuota Mensual Estimada</p>
                                <p className="text-3xl font-black text-white relative z-10 drop-shadow-md">
                                    S/ {(() => {
                                        const p = parseFloat(selectedUnit?.precio_venta || 0);
                                        const b = parseFloat(formData.bono_bbp || 0);
                                        const val = parseFloat(formData.cuota_inicial || 0);
                                        const ini = cuotaType === 'porcentaje' ? (val / 100) * p : val;
                                        const principal = p - ini - b;
                                        const annualRate = parseFloat(formData.tasa_anual) / 100;
                                        const n = parseInt(formData.plazo_meses);

                                        if (principal <= 0 || n <= 0 || isNaN(annualRate)) return "0.00";

                                        let tea = annualRate;
                                        if (formData.codigo_tipo_tasa === '1') {
                                            const m_map = { 'Diaria': 360, 'Quincenal': 24, 'Mensual': 12, 'Trimestral': 4, 'Semestral': 2 };
                                            const m = m_map[formData.capitalizacion] || 12;
                                            tea = Math.pow(1 + annualRate / m, m) - 1;
                                        }

                                        const tem = Math.pow(1 + tea, 1 / 12) - 1;
                                        const cuota = (principal * tem) / (1 - Math.pow(1 + tem, -n));
                                        return cuota.toLocaleString(undefined, { maximumFractionDigits: 2 });
                                    })()}
                                </p>
                                <p className="text-[8px] text-gray-500 font-bold uppercase mt-2 relative z-10 tracking-widest">Amortización + Interés</p>
                            </div>

                            {/* Alertas Normativas (Blindaje Frontend) */}
                            <div className="space-y-2 mt-4">
                                {(() => {
                                    const p = parseFloat(selectedUnit?.precio_venta || 0);
                                    const b = parseFloat(formData.bono_bbp || 0);
                                    const val = parseFloat(formData.cuota_inicial || 0);
                                    const ini = cuotaType === 'porcentaje' ? (val / 100) * p : val;
                                    const principal = p - ini - b;
                                    const gastos = (parseFloat(formData.gastos_tasacion || 0) + parseFloat(formData.gastos_notariales || 0) + parseFloat(formData.gastos_estudio_titulos || 0) + parseFloat(formData.comision_ifi || 0));

                                    const alerts = [];

                                    // 1. Ratio de Esfuerzo (40% / 50%) -> USANDO INGRESO FAMILIAR (Titular + Cónyuge)
                                    const ingresoTitular = parseFloat(user?.ingreso_mensual || 0);
                                    const ingresoConyuge = parseFloat(user?.ingreso_conyuge || 0);
                                    const ingresoFamiliar = ingresoTitular + ingresoConyuge;

                                    const ratioLimit = p <= 205000 ? 0.40 : 0.50;

                                    // Cálculo rápido de cuota para la alerta
                                    const annualRate = parseFloat(formData.tasa_anual) / 100;
                                    const n = parseInt(formData.plazo_meses);
                                    let tea = annualRate;
                                    if (formData.codigo_tipo_tasa === '1') {
                                        const m_map = { 'Diaria': 360, 'Quincenal': 24, 'Mensual': 12, 'Trimestral': 4, 'Semestral': 2 };
                                        const m = m_map[formData.capitalizacion] || 12;
                                        tea = Math.pow(1 + annualRate / m, m) - 1;
                                    }
                                    const tem = Math.pow(1 + tea, 1 / 12) - 1;
                                    const cuota = (principal > 0 && n > 0 && !isNaN(tea)) ? (principal * tem) / (1 - Math.pow(1 + tem, -n)) : 0;

                                    if (ingresoFamiliar > 0 && (cuota / ingresoFamiliar) > ratioLimit) {
                                        alerts.push({ msg: `Cuota excede el ${(ratioLimit * 100)}% del Ingreso Familiar Mensual (IFM)`, type: 'critica' });
                                    }

                                    // 2. LTV (90% Max)
                                    if (p > 0 && (principal / p) > 0.90) {
                                        alerts.push({ msg: "El crédito neto no puede exceder el 90% del valor de venta", type: 'critica' });
                                    }

                                    // 3. Validación Ahorro Programado (Min 6 meses)
                                    if (Number(user?.codigo_tipo_ingreso) === 3 && Number(user?.meses_ahorro || 0) < 6) {
                                        alerts.push({ msg: "Inhabilitado: Ahorro programado requiere historial mínimo de 6 meses", type: 'critica' });
                                    }

                                    return alerts.map((a, i) => (
                                        <div key={i} className="animate-in slide-in-from-right duration-500 bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg flex items-start gap-2">
                                            <ErrorOutlineIcon className="text-rose-400 mt-0.5" sx={{ fontSize: 12 }} />
                                            <p className="text-[7px] font-black text-rose-300 uppercase leading-tight tracking-tight">{a.msg}</p>
                                        </div>
                                    ));
                                })()}
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
                            <div className="p-4 border-b border-gray-50 flex justify-between items-center"><h3 className="text-xs font-black text-gray-900 uppercase tracking-tighter">Cronograma de Pagos</h3><div className="flex gap-2"><button onClick={() => exportSimulationExcel(result.codigo_simulacion)} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg font-black text-[8px] uppercase hover:bg-green-100">Excel</button><button onClick={() => exportSimulationPdf(result.codigo_simulacion)} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg font-black text-[8px] uppercase hover:bg-red-100">PDF</button></div></div>
                            <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-gray-50/30 text-[7px] font-black text-gray-400 uppercase">
                                <th className="px-5 py-2.5 border-b border-gray-100">N° Cuota</th><th className="px-5 py-2.5 border-b border-gray-100 text-center">Vencimiento</th><th className="px-5 py-2.5 border-b border-gray-100 text-right">Amortización</th><th className="px-5 py-2.5 border-b border-gray-100 text-right">Interés</th><th className="px-5 py-2.5 border-b border-gray-100 text-right bg-brand-blue/5 text-brand-blue">Cuota Total</th>
                            </tr></thead><tbody className="divide-y divide-gray-50 text-[9px] font-bold text-gray-700">
                                    {result.detalles.slice(0, 15).map((cuota) => (
                                        <tr key={cuota.numero_cuota} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-5 py-2.5">Cuota #{cuota.numero_cuota}</td>
                                            <td className="px-5 py-2.5 text-center text-gray-400">{cuota.fecha_pago}</td>
                                            <td className="px-5 py-2.5 text-right">S/ {cuota.amortizacion.toLocaleString()}</td>
                                            <td className="px-5 py-2.5 text-right">S/ {cuota.interes.toLocaleString()}</td>
                                            <td className="px-5 py-2.5 text-right font-black text-brand-blue bg-brand-blue/[0.01]">S/ {cuota.cuota_total.toLocaleString()}</td>
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
