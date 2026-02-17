import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/authService';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '', // Agregaremos un campo oculto o combinaremos nombre por ahora
    email: '',
    password: '',
    role: 'asesor' // Valor por defecto
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Separamos el nombre para cumplir con el backend (first_name, last_name)
      // Asumiremos que el usuario ingresa "Nombre Apellido" en el campo nombre
      const nameParts = formData.first_name.split(' ');
      const payload = {
        ...formData,
        first_name: nameParts[0],
        last_name: nameParts.slice(1).join(' ') || 'Pendiente'
      };

      await register(payload);
      alert("Cuenta creada con éxito. Ahora inicia sesión.");
      navigate('/login');
    } catch (err) {
      setError('Error al registrar. Verifica los datos.');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Panel Izquierdo (Branding) */}
      <div className="hidden w-1/2 bg-brand-dark lg:flex flex-col justify-center items-center text-white p-12">
        <h1 className="text-4xl font-bold mb-8">Bienvenido(a) a</h1>
        {/* Placeholder para Logo */}
        <div className="bg-white text-brand-dark p-6 rounded-full w-32 h-32 flex items-center justify-center mb-6 font-bold text-3xl">
          $$$
        </div>
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
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input
                name="first_name"
                type="text"
                placeholder="Ingrese su Nombre Completo"
                className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-brand-orange transition-colors"
                onChange={handleChange}
                required
              />
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

            {/* Roles (Radio Buttons) */}
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

            {/* Botón */}
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
