import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import WorkIcon from '@mui/icons-material/Work';

import { getClientByCode, updateClient } from '../services/clientService';

const ProfilePage = () => {
    const { user, updateUser } = useAuth(); // Destructuramos updateUser
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [loadingData, setLoadingData] = useState(false);

    // 1. Efecto para cargar datos exclusivamente con ID
    useEffect(() => {
        const fetchClientData = async () => {
            // El usuario debe tener un ID válido (codigo_usuario)
            if (user?.id) {
                setLoadingData(true);
                try {
                    const clientData = await getClientByCode(user.id);
                    console.log("[DEBUG] Datos Client Endpoint:", clientData); // Ver qué campos llegan

                    if (clientData) {
                        const usuario = clientData.usuario || {};
                        setFormData({
                            id: clientData.id || user.id, // ID interno del cliente (INT) para Updates
                            nombres: usuario.nombres || clientData.nombres || user.nombres || '',
                            apellidos: usuario.apellidos || clientData.apellidos || user.apellidos || '',
                            dni: clientData.dni_cliente || clientData.dni || '',
                            telefono: clientData.telefono_cliente || clientData.telefono || '',
                            ingreso_mensual: clientData.ingreso_mensual || '',
                            email: usuario.email || clientData.email || user.email
                        });
                    }
                } catch (error) {
                    console.error("Error loading profile by code:", error);
                    // Fallback a contexto
                    setFormData({
                        id: user.id,
                        nombres: user.nombres || '',
                        apellidos: user.apellidos || '',
                        dni: user.dni || '',
                        telefono: user.telefono || '',
                        ingreso_mensual: user.ingreso_mensual || '',
                        email: user.email || ''
                    });
                } finally {
                    setLoadingData(false);
                }
            } else {
                console.warn("[DEBUG] No ID found for user. Cannot fetch profile.");
            }
        };

        fetchClientData();
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        try {
            setLoadingData(true);
            console.log("Guardando datos...", formData);

            // Payload con nombres de campos de BD (snake_case)
            // Payload con nombres de campos de BD (snake_case)
            // El backend ahora acepta nombres y apellidos directamente
            const payload = {
                nombres: formData.nombres,
                apellidos: formData.apellidos,
                dni_cliente: formData.dni,
                telefono_cliente: formData.telefono,
                ingreso_mensual: Number(formData.ingreso_mensual || 0)
            };

            // Usamos formData.id que capturamos al cargar (el ID numérico del cliente)
            await updateClient(formData.id, payload);

            alert("Perfil actualizado correctamente");

            // Actualizamos en AuthContext para que se refleje "Hola, [Nombre]"
            if (updateUser) {
                updateUser({
                    nombres: formData.nombres,
                    apellidos: formData.apellidos,
                    names: `${formData.nombres} ${formData.apellidos}`, // Actualizamos el compuesto también
                    dni: formData.dni,
                    telefono: formData.telefono,
                    ingreso_mensual: formData.ingreso_mensual
                });
            }

            setIsEditing(false);
            // window.location.reload(); // Ya no recargamos, actualizamos estado
        } catch (error) {
            console.error("Error actualizando perfil:", error);
            alert("Hubo un error al guardar. Revisa la consola.");
        } finally {
            setLoadingData(false);
        }
    };

    return (
        <div className="flex bg-[#F8FAFC] min-h-screen font-['Inter',_sans-serif]">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Mi Perfil</h1>
                        <p className="text-gray-500 font-medium">Gestiona tu información personal.</p>
                    </div>
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-6 py-2 bg-brand-dark text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg"
                        >
                            Editar Perfil
                        </button>
                    )}
                </header>

                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 max-w-3xl">
                    <div className="flex items-center gap-6 mb-8 border-b border-gray-100 pb-8">
                        <div className="w-24 h-24 bg-brand-blue/10 rounded-full flex items-center justify-center text-brand-blue">
                            <AccountCircleIcon style={{ fontSize: 60 }} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900">{formData.nombres ? `${formData.nombres} ${formData.apellidos}` : (user?.names || 'Usuario')}</h2>
                            <span className="inline-block bg-brand-orange/10 text-brand-orange px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mt-2">
                                {user?.role || 'Cliente'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Nombres */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Nombres</label>
                            {isEditing ? (
                                <input
                                    name="nombres"
                                    value={formData.nombres}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-brand-orange font-bold text-gray-700"
                                />
                            ) : (
                                <p className="text-lg font-bold text-gray-900">{formData.nombres || '---'}</p>
                            )}
                        </div>

                        {/* Apellidos */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Apellidos</label>
                            {isEditing ? (
                                <input
                                    name="apellidos"
                                    value={formData.apellidos}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-brand-orange font-bold text-gray-700"
                                />
                            ) : (
                                <p className="text-lg font-bold text-gray-900">{formData.apellidos || '---'}</p>
                            )}
                        </div>

                        {/* DNI */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">DNI</label>
                            {isEditing ? (
                                <input
                                    name="dni"
                                    maxLength="8"
                                    value={formData.dni}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-brand-orange font-bold text-gray-700"
                                />
                            ) : (
                                <p className="text-lg font-bold text-gray-900">{formData.dni || '---'}</p>
                            )}
                        </div>

                        {/* Teléfono */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Teléfono</label>
                            {isEditing ? (
                                <input
                                    name="telefono"
                                    maxLength="9"
                                    value={formData.telefono}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-brand-orange font-bold text-gray-700"
                                />
                            ) : (
                                <p className="text-lg font-bold text-gray-900">{formData.telefono || '---'}</p>
                            )}
                        </div>

                        {/* Email (Solo Lectura) */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Email (No editable)</label>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl opacity-70">
                                <EmailIcon className="text-gray-400" />
                                <span className="font-bold text-gray-500">{formData.email}</span>
                            </div>
                        </div>

                        {/* Ingreso Mensual (Solo Cliente) */}
                        {user?.role === 'Cliente' && (
                            <div className="space-y-2 md:col-span-2 border-t border-gray-100 pt-4">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Ingreso Mensual Declarado</label>
                                {isEditing ? (
                                    <div className="relative">
                                        <span className="absolute left-4 top-3 text-gray-400 font-bold">S/.</span>
                                        <input
                                            name="ingreso_mensual"
                                            type="number"
                                            value={formData.ingreso_mensual}
                                            onChange={handleChange}
                                            className="w-full p-3 pl-10 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-brand-orange font-bold text-gray-700"
                                        />
                                    </div>
                                ) : (
                                    <p className="text-xl font-black text-brand-green">S/. {formData.ingreso_mensual || '0.00'}</p>
                                )}
                            </div>
                        )}

                    </div>

                    {isEditing && (
                        <div className="mt-10 pt-6 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 bg-brand-orange text-white rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg"
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
export default ProfilePage;
