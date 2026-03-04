import React, { useState, useRef, useEffect } from 'react';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Tooltip } from '@mui/material';

const CustomSelect = ({ label, name, options, value, onChange, placeholder = 'Seleccionar...', icon, showInfo = false, disabled = false }) => {
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
        <div className={`relative w-full text-left ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={dropdownRef}>
            {label && (
                <label className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-2 ml-1">
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
                                        fontWeight: 800,
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
                                width: 14, height: 14, borderRadius: '50%',
                                background: '#EFF6FF',
                                border: '1.5px solid #93C5FD',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', flexShrink: 0, marginLeft: 2
                            }}>
                                <span style={{ fontSize: '7px', fontWeight: 900, color: '#3B82F6', userSelect: 'none', lineHeight: 1 }}>?</span>
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
                    w-full bg-gray-50/50 border border-gray-100 py-2.5 px-3 rounded-xl flex items-center justify-between
                    ${!disabled ? 'focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-all hover:bg-white' : 'cursor-not-allowed'}
                    text-sm font-medium text-gray-700 cursor-pointer
                `}
            >
                <div className="flex items-center gap-2 truncate">
                    {icon && <span className="text-gray-400">{icon}</span>}
                    <span className={!selectedOption ? 'text-gray-400 font-medium' : ''}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <KeyboardArrowDownIcon
                    className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    sx={{ fontSize: 18 }}
                />
            </button>

            <div className={`
                absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-2xl shadow-2xl shadow-brand-dark/10 border border-gray-100 z-[100] overflow-hidden
                transition-all duration-200 origin-top
                ${isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}
            `}>
                <div className="max-h-60 overflow-y-auto py-2 custom-scrollbar">
                    {options.map((option) => {
                        const isSelected = String(value) === String(option.id);
                        return (
                            <div
                                key={option.id}
                                onClick={() => {
                                    if (name) {
                                        onChange({ target: { name, value: option.id, type: 'select-one' } });
                                    } else {
                                        onChange(option.id);
                                    }
                                    setIsOpen(false);
                                }}
                                className={`
                                    px-4 py-2.5 cursor-pointer text-sm font-bold transition-all mx-2 rounded-xl my-0.5
                                    ${isSelected
                                        ? 'bg-brand-blue text-white shadow-md'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:scale-[1.02]'}
                                `}
                            >
                                {option.label}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CustomSelect;
