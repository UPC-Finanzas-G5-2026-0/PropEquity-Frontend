import React, { useState, useRef, useEffect } from 'react';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Tooltip } from '@mui/material';

const CustomSelect = ({ label, options, value, onChange, placeholder = 'Seleccionar...', icon, showInfo = false, disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const selectedOption = options.find(opt => String(opt.id) === String(value));

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getLabelInfo = (label) => {
        const info = {
            'Distrito': 'Ubicación del proyecto inmobiliario según demarcación municipal.',
            'Estado': 'Define si la unidad está disponible (Activo) o si ya fue vendida / reservada (Inactivo).',
            'Moneda': 'Divisa oficial para el contrato de compra-venta.',
            'Modalidad': 'Elige "Compra" para adquirir una unidad existente, "Construcción" para edificar en terreno propio o "Mejoramiento" para ampliar/refaccionar.',
            'Tipo de Venta': 'Primera venta: unidad nueva directamente del promotor. Segunda venta: propiedad revendida por un particular.',
            'Tipo de Tasa': 'Efectiva (TEA): tasa que ya incluye capitalización. Nominal (TNA): requiere especificar periodicidad.',
            'Capitalización': 'Frecuencia con la que se acumulan los intereses sobre el saldo pendiente.',
            'Periodo de Gracia': 'Meses en los que solo se pagan intereses sin amortizar capital.',
            'Unidad': 'Selecciona la propiedad del inventario para cargar sus datos automáticamente.',
            'Modalidad BBP': 'Estándar: bono general MiVivienda. Integrador: para familias vulnerables, adultos mayores o personas desplazadas.'
        };
        return info[label] || 'Información adicional sobre este campo.';
    };

    return (
        <div className={`relative w-full text-left ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`} ref={dropdownRef}>
            {label && (
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
                    {label}
                    {showInfo && (
                        <Tooltip
                            title={getLabelInfo(label)}
                            arrow
                            placement="top"
                            enterDelay={150}
                            leaveDelay={0}
                            componentsProps={{
                                tooltip: {
                                    sx: {
                                        bgcolor: 'white',
                                        color: '#334155',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        lineHeight: 1.6,
                                        px: 2,
                                        py: 1.5,
                                        borderRadius: '14px',
                                        maxWidth: 220,
                                    },
                                },
                                arrow: {
                                    sx: {
                                        color: 'white',
                                        '&::before': { border: '1px solid #e2e8f0' },
                                    },
                                },
                            }}
                        >
                            <span style={{
                                width: 15, height: 15, borderRadius: '50%',
                                background: '#EFF6FF',
                                border: '1.5px solid #93C5FD',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', flexShrink: 0, marginLeft: 3
                            }}>
                                <span style={{ fontSize: '8px', fontWeight: 700, color: '#3B82F6', userSelect: 'none', lineHeight: 1 }}>?</span>
                            </span>
                        </Tooltip>
                    )}
                </label>
            )}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    w-full bg-gray-50 border border-gray-200 py-2 px-3 rounded-lg flex items-center justify-between
                    ${!disabled ? 'focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue transition-all' : 'cursor-not-allowed'}
                    text-sm font-medium text-gray-700
                `}
            >
                <div className="flex items-center gap-2 truncate">
                    {icon && <span className="text-gray-400">{icon}</span>}
                    <span className={!selectedOption ? 'text-gray-300' : 'text-gray-800'}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <KeyboardArrowDownIcon
                    className={`text-gray-300 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    sx={{ fontSize: 18 }}
                />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-lg shadow-xl border border-gray-100 z-[100] overflow-hidden">
                    <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
                        {options.map((option) => (
                            <div
                                key={option.id}
                                onClick={() => {
                                    onChange(option.id);
                                    setIsOpen(false);
                                }}
                                className={`
                                    px-4 py-2.5 cursor-pointer text-sm font-medium transition-all
                                    ${String(value) === String(option.id)
                                        ? 'bg-brand-blue/5 text-brand-blue'
                                        : 'text-gray-600 hover:bg-gray-50'}
                                `}
                            >
                                {option.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
