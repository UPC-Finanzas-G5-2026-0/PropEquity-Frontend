import React, { useState } from 'react';
import { createClient, updateClient } from '../services/clientService';
import CloseIcon from '@mui/icons-material/Close';

const ClientForm = ({ clientToEdit, onClose, onSuccess }) => {
  // Inicializamos el estado. Si hay un cliente para editar, llenamos los datos; si no, va vacío.
  const [formData, setFormData] = useState({
    nombres: clientToEdit?.usuario?.nombres || '',
    apellidos: clientToEdit?.usuario?.apellidos || '',
    email: clientToEdit?.usuario?.email || '',
    dni_cliente: clientToEdit?.dni_cliente || '',
    telefono_cliente: clientToEdit?.telefono_cliente || '',
    ingreso_mensual: clientToEdit?.ingreso_mensual || ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Preparamos el payload (el backend espera que el ingreso sea un número)
    const payload = {
      ...formData,
      ingreso_mensual: parseFloat(formData.ingreso_mensual) || 0
    };

    try {
      let result;
      if (clientToEdit) {
        // En modo edición, el backend no espera ni permite cambiar el email
        const { email, ...updatePayload } = payload;
        result = await updateClient(clientToEdit.codigo_cliente, updatePayload);
      } else {
        // En modo creación, mandamos todo
        result = await createClient(payload);
      }

      if (result.success) {
        onSuccess(); // Actualiza la tabla en el dashboard
        onClose();   // Cierra la ventana modal
      } else {
        setError(result.error || 'Error al procesar la solicitud');
      }
    } catch (err) {
      setError('Ocurrió un error inesperado al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Botón de cerrar (X) en la esquina superior derecha */}
      <button
        onClick={onClose}
        className="absolute -top-2 -right-2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <CloseIcon />
      </button>

      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900">
          {clientToEdit ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
        </h2>
        <p className="text-sm text-gray-500 font-medium mt-1">
          {clientToEdit ? 'Actualiza los datos socioeconómicos y de contacto.' : 'Ingresa los datos para dar de alta a un prospecto.'}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nombres</label>
            <input required type="text" name="nombres" value={formData.nombres} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl py-2.5 px-4 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Apellidos</label>
            <input required type="text" name="apellidos" value={formData.apellidos} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl py-2.5 px-4 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Correo Electrónico</label>
          <input
            required={!clientToEdit}
            disabled={!!clientToEdit} // Deshabilitado si estamos editando
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl py-2.5 px-4 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all ${clientToEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">DNI</label>
            <input required type="text" name="dni_cliente" maxLength="8" pattern="\d{8}" title="Debe contener 8 dígitos numéricos" value={formData.dni_cliente} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl py-2.5 px-4 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Teléfono</label>
            <input required type="text" name="telefono_cliente" maxLength="9" pattern="\d{9}" title="Debe contener 9 dígitos numéricos" value={formData.telefono_cliente} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl py-2.5 px-4 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Ingresos Mensuales (S/)</label>
          <input required type="number" step="0.01" min="0" name="ingreso_mensual" value={formData.ingreso_mensual} onChange={handleChange} placeholder="Ej. 3500.00" className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl py-2.5 px-4 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all" />
        </div>

        <div className="pt-4 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="flex-1 py-3 px-4 bg-brand-orange text-white font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-70">
            {loading ? 'Guardando...' : (clientToEdit ? 'Guardar Cambios' : 'Registrar Cliente')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;
