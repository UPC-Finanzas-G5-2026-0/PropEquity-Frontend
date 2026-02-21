import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { jwtDecode } from 'jwt-decode';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await login(email, password);
      const decodedToken = jwtDecode(response.access_token);
      const userRole = decodedToken.role || decodedToken.rol;

      setLoading(false);
      switch (userRole) {
        case 'Administrador':
        case 'administrador':
        case 'Asesor':
        case 'asesor':
          navigate('/dashboard');
          break;
        case 'Cliente':
        case 'cliente':
          navigate('/cliente/dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Panel Izquierdo - Estilo referencia */}
      <div className="hidden w-1/2 lg:flex flex-col justify-center items-center text-white p-16" style={{ backgroundColor: '#0f1b2d' }}>
        <div className="max-w-xs text-center">
          <h1 className="text-4xl font-bold leading-tight mb-4">Que bueno es verte de vuelta</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Accede a tus simulaciones y gestiona tu cartera de clientes.
          </p>
        </div>
      </div>

      {/* Panel Derecho (Formulario) - Estilo Original */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center bg-white p-8">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Iniciar Sesión</h2>

          {error && (
            <div className="mb-6 text-red-500 text-center text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Dirección de correo Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ingrese su correo electrónico"
                className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-brand-orange transition-colors"
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
                className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-brand-orange transition-colors"
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
              disabled={loading}
              className="w-full bg-brand-orange text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition duration-200 shadow-lg disabled:opacity-70"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <p className="mt-12 text-center text-gray-500">
            ¿No es un usuario? <Link to="/register" className="text-brand-dark font-bold hover:underline">Crea tu cuenta</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
