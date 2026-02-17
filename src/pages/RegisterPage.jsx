import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/authService';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

// 1. IMPORTAMOS EL LOGO (Asegúrate que el nombre del archivo coincida)
import logoPropEquity from '../assets/logo.jpeg';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'asesor'
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(formData);
      alert("Cuenta creada con éxito. Ahora inicia sesión.");
      navigate('/login');
    } catch (err) {
      console.error(err);
      setError('Error al registrar. Verifica los datos.');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Panel Izquierdo (Branding) */}
      <div className="hidden w-1/2 bg-brand-dark lg:flex flex-col justify-center items-center text-white p-12">
        <h1 className="text-4xl font-bold mb-8">Bienvenido(a) a</h1>

        {/* --- 2. AQUÍ CAMBIAMOS EL PLACEHOLDER POR LA IMAGEN --- */}
        <img
          src={logoPropEquity}
          alt="Logo PropEquity"
          className="w-48 mb-8 object-contain" // Ajusta w-48 al tamaño que prefieras
        />

        <h2 className="text-3xl font-bold tracking-widest uppercase">PropEquity</h2>
        <p className="mt-8 text-center text-gray-300 text-sm max-w-md">
          Bienvenido a PropEquity, la plataforma definitiva para la gestión y simulación de créditos hipotecarios bajo el esquema Nuevo Crédito Mivivienda y Techo Propio.
        </p>
      </div>

      {/* Panel Derecho (Formulario) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center bg-white p-8">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Crea Tu Cuenta</h2>

          {error && <div className="mb-4 text-red-500 text-center text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Campos Nombres y Apellidos */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombres</label>
                <input
                  name="first_name"
                  type="text"
                  placeholder="Ej. Juan"
                  className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-brand-orange transition-colors"
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Apellidos</label>
                <input
                  name="last_name"
                  type="text"
                  placeholder="Ej. Pérez"
                  className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-brand-orange transition-colors"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Dirección de correo Email</label>
              <input
                name="email"
                type="email"
                placeholder="Ingrese su Dirección de correo electrónico"
                className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-brand-orange transition-colors"
                onChange={handleChange}
                required
              />
            </div>

            {/* Contraseña */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Ingrese su Contraseña"
                className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-brand-orange transition-colors"
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 bottom-2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </button>
            </div>

            {/* Roles */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Indique su rol</label>
              <div className="flex space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" name="role" value="administrador" onChange={handleChange} className="text-brand-orange focus:ring-brand-orange" />
                  <span className="text-gray-600">Administrador</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" name="role" value="asesor" defaultChecked onChange={handleChange} className="text-brand-orange focus:ring-brand-orange" />
                  <span className="text-gray-600">Asesor</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" name="role" value="cliente" onChange={handleChange} className="text-brand-orange focus:ring-brand-orange" />
                  <span className="text-gray-600">Cliente</span>
                </label>
              </div>
            </div>

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
