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
            <main className="flex-1 p-10 overflow-y-auto">
                <header className="mb-12 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Mi Perfil</h1>
                        <p className="text-gray-500 text-lg font-medium">Información centralizada y seguridad de cuenta.</p>
                    </div>
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)} className="px-8 py-3 bg-brand-dark text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-brand-dark/10">Editar Datos</button>
                    )}
                </header>

                <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 p-10 max-w-4xl">
                    <div className="flex items-center gap-8 mb-12 border-b border-gray-50 pb-10">
                        <div className="w-28 h-28 bg-brand-blue/5 rounded-[2.5rem] flex items-center justify-center text-brand-blue relative">
                            <AccountCircleIcon style={{ fontSize: 80 }} />
                            <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-white"></div>
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-gray-900">{formData.nombres ? `${formData.nombres} ${formData.apellidos}` : (user?.names || 'Usuario')}</h2>
                            <span className="inline-block bg-brand-orange text-white px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mt-4">
                                Rango: {user?.role || 'Cliente'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Datos Básicos */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-gray-300 uppercase tracking-[0.2em] mb-4">Información de Identidad</h3>
                            {[
                                { label: 'Nombres', name: 'nombres' },
                                { label: 'Apellidos', name: 'apellidos' },
                                { label: 'DNI', name: 'dni', max: 8 },
                                { label: 'Teléfono', name: 'telefono', max: 9 }
                            ].map((field) => (
                                <div key={field.name}>
                                    <label className="block text-[9px] font-black text-gray-400 uppercase ml-1 mb-1">{field.label}</label>
                                    {isEditing ? (
                                        <input name={field.name} maxLength={field.max} value={formData[field.name]} onChange={handleChange} className="w-full bg-gray-50/50 border-b border-gray-100 py-2 px-1 focus:outline-none focus:border-brand-blue font-bold text-gray-800" />
                                    ) : (
                                        <p className="text-lg font-bold text-gray-900 px-1">{formData[field.name] || '---'}</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Datos de Contacto/Socioeco */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-gray-300 uppercase tracking-[0.2em] mb-4">Estado y Residencia</h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[9px] font-black text-gray-400 uppercase ml-1 mb-1">Email (Privado)</label>
                                    <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-2xl">
                                        <EmailIcon className="text-gray-300" sx={{ fontSize: 20 }} />
                                        <span className="font-bold text-gray-400 text-sm">{formData.email}</span>
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
                                        <label className="block text-[9px] font-black text-gray-400 uppercase ml-1 mb-1">Residencia</label>
                                        <p className="text-lg font-bold text-gray-900 px-1">{formData.residencia}</p>
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
                                        <label className="block text-[9px] font-black text-gray-400 uppercase ml-1 mb-1">Estado Civil</label>
                                        <p className="text-lg font-bold text-gray-900 px-1">
                                            {formData.codigo_estado_civil === 1 ? 'Soltero' : formData.codigo_estado_civil === 2 ? 'Casado' : formData.codigo_estado_civil === 3 ? 'Conviviente' : 'Otros'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sección Financiera (Cliente) */}
                    {user?.role === 'Cliente' && (
                        <div className="mt-16 pt-12 border-t border-gray-50 space-y-10">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-10 bg-brand-orange rounded-full"></div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900">Perfil Financiero</h3>
                                    <p className="text-gray-400 text-sm font-medium">Crucial para la evaluación del crédito.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div>
                                    <label className="block text-[9px] font-black text-gray-400 uppercase ml-1 mb-1">Ingreso Mensual Neto (S/.)</label>
                                    {isEditing ? (
                                        <input name="ingreso_mensual" type="number" value={formData.ingreso_mensual} onChange={handleChange} className="w-full bg-transparent border-b border-gray-100 py-3 px-1 focus:outline-none focus:border-brand-blue font-black text-brand-blue text-xl" />
                                    ) : (
                                        <p className="text-3xl font-black text-brand-blue px-1">S/. {Number(formData.ingreso_mensual).toLocaleString()}</p>
                                    )}
                                </div>
                                {isEditing ? (
                                    <CustomSelect
                                        label="Modo de Ingreso"
                                        value={formData.codigo_tipo_ingreso}
                                        onChange={(val) => handleCustomChange('codigo_tipo_ingreso', val)}
                                        options={[{ id: 1, label: 'Dependiente' }, { id: 2, label: 'Independiente' }, { id: 3, label: 'Ahorro Programado' }]}
                                    />
                                ) : (
                                    <div>
                                        <label className="block text-[9px] font-black text-gray-400 uppercase ml-1 mb-1">Tipo de Ingreso</label>
                                        <p className="text-lg font-extrabold text-gray-700 px-1">{formData.codigo_tipo_ingreso === 3 ? 'Ahorro Programado' : 'General'}</p>
                                    </div>
                                )}
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
                        <div className="mt-16 pt-10 border-t border-gray-50 flex justify-end gap-6">
                            <button onClick={() => setIsEditing(false)} className="px-8 py-3 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-gray-900 transition-all">Cancelar</button>
                            <button onClick={handleSave} className="px-10 py-4 bg-brand-orange text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 hover:bg-orange-600 hover:-translate-y-1 active:scale-95 transition-all">Sincronizar Cambios</button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;
