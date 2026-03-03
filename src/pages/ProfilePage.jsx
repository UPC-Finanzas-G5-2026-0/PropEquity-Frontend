import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import WorkIcon from '@mui/icons-material/Work';
import CustomSelect from '../components/CustomSelect';

import { getMyProfile, updateProfile } from '../services/clientService';

const ProfilePage = () => {
    const { user, updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [loadingData, setLoadingData] = useState(false);

    useEffect(() => {
        const fetchClientData = async () => {
            if (user?.id) {
                setLoadingData(true);
                try {
                    const response = await getMyProfile();
                    if (response.success && response.data) {
                        const clientData = response.data;
                        const usuario = clientData.usuario || {};
                        setFormData({
                            id: clientData.codigo_cliente || clientData.id || user.id,
                            nombres: usuario.nombres || clientData.nombres || user.nombres || '',
                            apellidos: usuario.apellidos || clientData.apellidos || user.apellidos || '',
                            dni: clientData.dni_cliente || clientData.dni || '',
                            telefono: clientData.telefono_cliente || clientData.telefono || '',
                            ingreso_mensual: clientData.ingreso_mensual || '',
                            email: usuario.email || clientData.email || user.email,
                            codigo_tipo_ingreso: clientData.codigo_tipo_ingreso || 1,
                            meses_ahorro: clientData.meses_ahorro || 0,
                            tiene_deudor_solidario: clientData.tiene_deudor_solidario || false,
                            residencia: clientData.residencia || 'Peruano',
                            codigo_estado_civil: clientData.codigo_estado_civil || 1,
                            nombre_conyuge: clientData.nombre_conyuge || '',
                            doc_conyuge: clientData.doc_conyuge || '',
                            conyuge_propietario: clientData.conyuge_propietario || false,
                            es_propietario_vivienda: clientData.es_propietario_vivienda || false
                        });
                    }
                } catch (error) {
                    console.error(error);
                    setFormData({ id: user.id, nombres: user.nombres || '', apellidos: user.apellidos || '', dni: user.dni || '', telefono: user.telefono || '', ingreso_mensual: user.ingreso_mensual || '', email: user.email || '' });
                } finally {
                    setLoadingData(false);
                }
            }
        };
        fetchClientData();
    }, [user]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleCustomChange = (name, value) => {
        setFormData({ ...formData, [name]: value });
    };

    const handleSave = async () => {
        try {
            setLoadingData(true);
            const payload = {
                nombres: formData.nombres,
                apellidos: formData.apellidos,
                dni_cliente: formData.dni,
                telefono_cliente: formData.telefono,
                ingreso_mensual: Number(formData.ingreso_mensual || 0),
                codigo_tipo_ingreso: Number(formData.codigo_tipo_ingreso),
                meses_ahorro: Number(formData.meses_ahorro),
                tiene_deudor_solidario: Boolean(formData.tiene_deudor_solidario),
                residencia: formData.residencia,
                codigo_estado_civil: Number(formData.codigo_estado_civil),
                nombre_conyuge: formData.nombre_conyuge,
                doc_conyuge: formData.doc_conyuge,
                conyuge_propietario: Boolean(formData.conyuge_propietario),
                es_propietario_vivienda: Boolean(formData.es_propietario_vivienda)
            };
            const response = await updateProfile(formData.id, payload);
            if (response.success) {
                if (updateUser) {
                    updateUser({ nombres: formData.nombres, apellidos: formData.apellidos, names: `${formData.nombres} ${formData.apellidos}`, dni: formData.dni, telefono: formData.telefono, ingreso_mensual: formData.ingreso_mensual });
                }
                setIsEditing(false);
                alert("Perfil actualizado correctamente");
            } else {
                alert(`Error: ${response.error}`);
            }
        } catch (error) {
            console.error(error);
            alert("Error al guardar.");
        } finally {
            setLoadingData(false);
        }
    };

    return (
        <div className="flex bg-[#F8FAFC] min-h-screen font-['Inter',_sans-serif]">
            <Sidebar />
            <main className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-5xl w-full">
                    <header className="mb-6 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Mi Perfil</h1>
                            <p className="text-gray-500 text-sm font-medium">Información centralizada y seguridad de cuenta.</p>
                        </div>
                        {!isEditing && (
                            <button onClick={() => setIsEditing(true)} className="px-6 py-2.5 bg-brand-dark text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-brand-dark/10">Editar Datos</button>
                        )}
                    </header>

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center gap-8 mb-10 border-b border-gray-50 pb-8">
                            <div className="w-24 h-24 bg-brand-blue/5 rounded-2xl flex items-center justify-center text-brand-blue relative">
                                <AccountCircleIcon style={{ fontSize: 60 }} />
                                <div className="absolute -bottom-1.5 -right-1.5 bg-green-500 w-5 h-5 rounded-full border-2 border-white"></div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900">{formData.nombres ? `${formData.nombres} ${formData.apellidos}` : (user?.names || 'Usuario')}</h2>
                                <span className="inline-block bg-brand-orange text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mt-3">
                                    Rango: {user?.role || 'Cliente'}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Datos Básicos */}
                            <div className="space-y-6 lg:col-span-2">
                                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <div className="w-1 h-4 bg-brand-blue rounded-full"></div>
                                    Información de Identidad
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {[
                                        { label: 'Nombres', name: 'nombres' },
                                        { label: 'Apellidos', name: 'apellidos' },
                                        { label: 'DNI', name: 'dni', max: 8 },
                                        { label: 'Teléfono', name: 'telefono', max: 9 }
                                    ].map((field) => (
                                        <div key={field.name}>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">{field.label}</label>
                                            {isEditing ? (
                                                <input name={field.name} maxLength={field.max} value={formData[field.name]} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-100 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-blue/10 font-bold text-gray-800" />
                                            ) : (
                                                <p className="text-base font-black text-gray-900 px-1">{formData[field.name] || '---'}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Datos de Contacto/Socioeco */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <div className="w-1 h-4 bg-brand-blue rounded-full"></div>
                                    Estado y Residencia
                                </h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Email de Contacto</label>
                                        <div className="flex items-center gap-2.5 p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                                            <EmailIcon className="text-gray-300" sx={{ fontSize: 16 }} />
                                            <span className="font-bold text-gray-500 text-xs">{formData.email}</span>
                                        </div>
                                    </div>
                                    {isEditing ? (
                                        <CustomSelect
                                            label="Residencia"
                                            value={formData.residencia}
                                            onChange={(val) => handleCustomChange('residencia', val)}
                                            options={[{ id: 'Peruano', label: 'Peruano' }, { id: 'Extranjero', label: 'Extranjero' }]}
                                        />
                                    ) : (
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Residencia / Nacionalidad</label>
                                            <p className="text-base font-black text-gray-900 px-1">{formData.residencia}</p>
                                        </div>
                                    )}
                                    {isEditing ? (
                                        <CustomSelect
                                            label="Estado Civil"
                                            value={formData.codigo_estado_civil}
                                            onChange={(val) => handleCustomChange('codigo_estado_civil', val)}
                                            options={[{ id: 1, label: 'Soltero' }, { id: 2, label: 'Casado' }, { id: 3, label: 'Conviviente' }, { id: 4, label: 'Divorciado' }, { id: 5, label: 'Viudo' }]}
                                        />
                                    ) : (
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Estado Civil</label>
                                            <p className="text-base font-black text-gray-900 px-1">
                                                {formData.codigo_estado_civil === 1 ? 'Soltero' : formData.codigo_estado_civil === 2 ? 'Casado' : formData.codigo_estado_civil === 3 ? 'Conviviente' : 'Otros'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sección Financiera (Cliente) */}
                        {user?.role === 'Cliente' && (
                            <div className="mt-12 pt-10 border-t border-gray-100 space-y-8">
                                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-3">
                                    <div className="w-1 h-3 bg-brand-orange rounded-full"></div>
                                    Perfil Financiero
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="md:col-span-1">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Ingreso Mensual Neto</label>
                                        {isEditing ? (
                                            <input name="ingreso_mensual" type="number" value={formData.ingreso_mensual} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-100 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-blue/10 font-black text-brand-blue text-lg" />
                                        ) : (
                                            <p className="text-2xl font-black text-brand-blue px-1">S/ {Number(formData.ingreso_mensual).toLocaleString()}</p>
                                        )}
                                    </div>
                                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {isEditing ? (
                                            <CustomSelect
                                                label="Modo de Ingreso"
                                                value={formData.codigo_tipo_ingreso}
                                                onChange={(val) => handleCustomChange('codigo_tipo_ingreso', val)}
                                                options={[{ id: 1, label: 'Dependiente' }, { id: 2, label: 'Independiente' }, { id: 3, label: 'Ahorro Programado' }]}
                                            />
                                        ) : (
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">Tipo de Ingreso</label>
                                                <p className="text-base font-black text-gray-800 px-1">{formData.codigo_tipo_ingreso === 3 ? 'Ahorro Programado' : 'General / Planilla'}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Alertas de Elegibilidad */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                                    <div className={`p-6 rounded-3xl border ${formData.es_propietario_vivienda ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                                        <h4 className={`text-[10px] font-black uppercase tracking-widest mb-3 ${formData.es_propietario_vivienda ? 'text-red-500' : 'text-green-600'}`}>Titular Propietario</h4>
                                        <p className="text-sm font-bold text-gray-800">{formData.es_propietario_vivienda ? 'NO CALIFICA AL NCMV' : 'CUMPLE REQUISITO NCMV'}</p>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-gray-900 text-white relative overflow-hidden group">
                                        <div className="relative z-10">
                                            <h4 className="text-[10px] font-black text-brand-orange uppercase tracking-widest mb-3">Respaldo Financiero</h4>
                                            <p className="text-sm font-bold">{formData.tiene_deudor_solidario ? 'CUENTA CON DEUDOR' : 'SIN DEUDOR REGISTRADO'}</p>
                                        </div>
                                        <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-brand-orange/20 rounded-full blur-2xl"></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isEditing && (
                            <div className="mt-10 pt-8 border-t border-gray-50 flex justify-end gap-4">
                                <button onClick={() => setIsEditing(false)} className="px-6 py-2 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-gray-900 transition-all">Cancelar</button>
                                <button onClick={handleSave} className="px-8 py-3 bg-brand-orange text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20 hover:bg-orange-600 hover:-translate-y-1 active:scale-95 transition-all">Sincronizar Cambios</button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;
