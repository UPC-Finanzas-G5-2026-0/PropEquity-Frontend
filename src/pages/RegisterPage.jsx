import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/authService';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

import logoPropEquity from '../assets/logo.jpeg';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'asesor',
    dni: '',
    telefono: '',
    ingreso_mensual: ''
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones básicas antes de enviar
    if (formData.dni.length !== 8) {
      setError('El DNI debe tener 8 dígitos.');
      return;
    }

    try {
      await register(formData);
      alert("Cuenta creada con éxito. Ahora inicia sesión.");
      navigate('/login');
    } catch (err) {
      console.error(err);
      setError('Error al registrar. Verifica los datos o si el email ya existe.');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Panel Izquierdo (Branding) */}
      <div className="hidden w-1/2 bg-brand-dark lg:flex flex-col justify-center items-center text-white p-12 shrink-0">
        <h1 className="text-4xl font-bold mb-8">Bienvenido(a) a</h1>

        <img
          src={logoPropEquity}
          alt="Logo PropEquity"
          className="w-48 mb-8 object-contain"
        />

        <h2 className="text-3xl font-bold tracking-widest uppercase">PropEquity</h2>
        <p className="mt-8 text-center text-gray-300 text-sm max-w-md">
          Plataforma definitiva para la gestión y simulación de créditos hipotecarios.
        </p>
      </div>

      {/* Panel Derecho (Formulario) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center bg-white p-8 overflow-y-auto">
        <div className="w-full max-w-md my-10">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8 tracking-tighter">Crea Tu Cuenta</h2>

          {error && <div className="mb-4 bg-red-50 text-red-500 py-3 px-4 rounded-xl text-center text-sm font-bold border border-red-100">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Campos Nombres y Apellidos */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Nombres</label>
                <input
                  name="first_name"
                  type="text"
                  placeholder="Juan"
                  className="w-full border-b border-gray-100 py-2 focus:outline-none focus:border-brand-orange transition-colors"
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Apellidos</label>
                <input
                  name="last_name"
                  type="text"
                  placeholder="Pérez"
                  className="w-full border-b border-gray-100 py-2 focus:outline-none focus:border-brand-orange transition-colors"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* DNI y Teléfono */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">DNI (8 dígitos)</label>
                <input
                  name="dni"
                  type="text"
                  maxLength="8"
                  placeholder="77777777"
                  className="w-full border-b border-gray-100 py-2 focus:outline-none focus:border-brand-orange transition-colors"
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Teléfono</label>
                <input
                  name="telefono"
                  type="text"
                  maxLength="9"
                  placeholder="988888888"
                  className="w-full border-b border-gray-100 py-2 focus:outline-none focus:border-brand-orange transition-colors"
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Email</label>
              <input
                name="email"
                type="email"
                placeholder="cliente@ejemplo.com"
                className="w-full border-b border-gray-100 py-2 focus:outline-none focus:border-brand-orange transition-colors"
                onChange={handleChange}
                required
              />
            </div>

            {/* Contraseña */}
            <div className="relative">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Contraseña</label>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mín. 8 caracteres"
                className="w-full border-b border-gray-100 py-2 focus:outline-none focus:border-brand-orange transition-colors"
                onChange={handleChange}
                required
                minLength="8"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 bottom-2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </button>
            </div>

            {/* Roles */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Rol de usuario</label>
              <div className="flex bg-gray-50 p-1.5 rounded-2xl">
                {['administrador', 'asesor', 'cliente'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: r })}
                    className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all capitalize ${formData.role === r
                        ? 'bg-white text-brand-orange shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Ingreso Mensual (Solo para Cliente) */}
            {formData.role === 'cliente' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Ingreso Mensual (S/.)</label>
                <input
                  name="ingreso_mensual"
                  type="number"
                  step="0.1"
                  placeholder="4500.00"
                  className="w-full border-b border-gray-100 py-2 focus:outline-none focus:border-brand-orange transition-colors"
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-brand-orange text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition duration-200 shadow-lg"
            >
              Crear Cuenta
            </button>
          </form>

          <p className="mt-8 text-center text-gray-500">
            Ya es un usuario? <Link to="/login" className="text-brand-dark font-bold hover:underline">Iniciar Sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
