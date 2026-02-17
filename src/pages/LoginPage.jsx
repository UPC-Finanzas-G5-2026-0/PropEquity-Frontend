import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Credenciales incorrectas.');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Panel Izquierdo */}
      <div className="hidden w-1/2 bg-brand-dark lg:flex flex-col justify-center items-center text-white p-12">
        <h1 className="text-4xl font-bold mb-4 text-center leading-tight">
          Que bueno es verte <br /> de vuelta
        </h1>
        <p className="mt-6 text-center text-gray-300 text-lg max-w-sm">
          Accede a tus simulaciones y gestiona tu cartera de clientes.
        </p>
      </div>

      {/* Panel Derecho */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center bg-white p-8">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Iniciar Sesión</h2>

          {error && <div className="mb-4 text-red-500 text-center text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700">Dirección de correo Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ingrese su Dirección de correo electrónico"
                className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-brand-dark transition-colors"
                required
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese su Contraseña"
                className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-brand-dark transition-colors"
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

            <button
              type="submit"
              className="w-full bg-brand-dark text-white font-bold py-3 rounded-lg hover:bg-gray-900 transition duration-200 shadow-lg"
            >
              Iniciar Sesión
            </button>
          </form>

          <p className="mt-12 text-center text-gray-500">
            No es un usuario? <Link to="/register" className="text-brand-dark font-bold hover:underline">Crea tu cuenta</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
