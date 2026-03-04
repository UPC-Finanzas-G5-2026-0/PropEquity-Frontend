import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/authService';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CustomSelect from '../components/CustomSelect';
import logoPropEquity from '../assets/logo.jpeg';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'cliente',
    dni: '',
    telefono: '',
    ingreso_mensual: '',
    codigo_tipo_ingreso: 1,
    meses_ahorro: 0,
    tiene_deudor_solidario: false,
    residencia: 'Peruano',
    codigo_estado_civil: 1,
    nombre_conyuge: '',
    doc_conyuge: '',
    ingreso_conyuge: '',
    conyuge_propietario: false,
    es_propietario_vivienda: false,
    ha_recibido_apoyo: false,
    tiene_credito_activo: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleCustomChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const validateStep = (currentStep) => {
    setError('');
    if (currentStep === 1) {
      if (!formData.email || !formData.password) {
        setError('Por favor, ingresa un correo y contraseña.');
        return false;
      }
      if (formData.password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres.');
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.first_name || !formData.last_name || !formData.dni || !formData.telefono) {
        setError('Completa todos los datos de identidad.');
        return false;
      }
      if (formData.dni.length !== 8 || !/^\d{8}$/.test(formData.dni)) {
        setError('El DNI debe contener exactamente 8 dígitos numéricos.');
        return false;
      }
      if (!/^9\d{8}$/.test(formData.telefono)) {
        setError('El teléfono debe tener 9 dígitos y comenzar con 9.');
        return false;
      }
    } else if (currentStep === 3) {
      if (formData.role === 'cliente') {
        if (!formData.ingreso_mensual || Number(formData.ingreso_mensual) <= 0) {
          setError('El ingreso mensual es obligatorio para evaluar tu capacidad de crédito.');
          return false;
        }
        if (Number(formData.codigo_tipo_ingreso) === 3 && Number(formData.meses_ahorro) < 6) {
          setError('Normativa Bancaria: El Ahorro Programado requiere un historial mínimo de 6 meses.');
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step === 2 && formData.role !== 'cliente') {
        handleSubmit();
      } else if (formData.role === 'cliente' && step === 4) {
        handleSubmit();
      } else {
        setStep(step + 1);
      }
    }
  };

  const handleBack = () => setStep(step - 1);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        nombres: formData.first_name,
        apellidos: formData.last_name,
        dni: formData.dni,
        telefono: formData.telefono,
        rol_usuario: formData.role.charAt(0).toUpperCase() + formData.role.slice(1).toLowerCase(),
        ingreso_mensual: formData.ingreso_mensual ? Number(formData.ingreso_mensual) : 0,
        codigo_tipo_ingreso: Number(formData.codigo_tipo_ingreso),
        meses_ahorro: Number(formData.meses_ahorro || 0),
        codigo_estado_civil: Number(formData.codigo_estado_civil),
        residencia: formData.residencia,
        tiene_deudor_solidario: Boolean(formData.tiene_deudor_solidario),
        es_propietario_vivienda: Boolean(formData.es_propietario_vivienda),
        ha_recibido_apoyo: Boolean(formData.ha_recibido_apoyo),
        tiene_credito_activo: Boolean(formData.tiene_credito_activo),
        nombre_conyuge: formData.nombre_conyuge || "",
        doc_conyuge: formData.doc_conyuge || "",
        ingreso_conyuge: formData.ingreso_conyuge ? Number(formData.ingreso_conyuge) : 0,
        conyuge_propietario: Boolean(formData.conyuge_propietario)
      };
      await register(payload);
      setLoading(false);
      alert("¡Cuenta creada con éxito! Ahora puedes iniciar sesión.");
      navigate('/login');
    } catch (err) {
      console.error(err);
      setLoading(false);
      const serverDetail = err.response?.data?.detail;

      if (typeof serverDetail === 'string') {
        setError(serverDetail);
      } else if (Array.isArray(serverDetail)) {
        // Para errores de validación de Pydantic/FastAPI
        setError(serverDetail.map(e => e.msg).join(', '));
      } else if (err.response?.status === 500) {
        setError('Error interno del servidor. Es probable que este DNI o Correo ya existan en nuestra base de datos.');
      } else {
        setError('No pudimos crear tu cuenta. Por favor, verifica tus datos e intenta de nuevo.');
      }
    }
  };

  const totalSteps = formData.role === 'cliente' ? 4 : 2;

  return (
    <div className="flex min-h-screen">
      {/* Panel Izquierdo (Branding) - Estilo Original */}
      <div className="hidden w-1/2 bg-brand-dark lg:flex flex-col justify-center items-center text-white p-12">
        <img src={logoPropEquity} alt="Logo" className="w-24 rounded-2xl mb-6 shadow-2xl" />
        <h2 className="text-3xl font-bold tracking-widest uppercase">PropEquity</h2>
        <p className="mt-6 text-center text-gray-400 text-sm max-w-xs">
          Bienvenido a PropEquity, la plataforma definitiva para la gestión y simulación de créditos hipotecarios bajo el esquema Nuevo Crédito MiVivienda.
        </p>

        {/* Indicador de pasos */}
        <div className="mt-12 space-y-3 w-full max-w-[200px]">
          {[...Array(totalSteps)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${step > i + 1 ? 'bg-brand-orange border-brand-orange' : step === i + 1 ? 'bg-white text-brand-dark border-white' : 'border-gray-600 text-gray-600'}`}>
                {i + 1}
              </div>
              <span className={`text-sm transition-colors ${step === i + 1 ? 'text-white font-semibold' : 'text-gray-500'}`}>
                {i === 0 ? 'Acceso' : i === 1 ? 'Identidad' : i === 2 ? 'Economía' : 'Regulaciones'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Panel Derecho (Formulario) - Estilo Original */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center bg-white p-8">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
            {step === 1 ? 'Crea Tu Cuenta' : step === 2 ? 'Tus Datos' : step === 3 ? 'Datos Económicos' : 'Situación Legal'}
          </h2>
          <p className="text-center text-gray-400 text-sm mb-8">Paso {step} de {totalSteps}</p>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* PASO 1: Acceso */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                  <input name="email" type="email" placeholder="ejemplo@propequity.pe" value={formData.email}
                    className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-brand-orange transition-colors"
                    onChange={handleChange} />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                  <input name="password" type={showPassword ? "text" : "password"} placeholder="Mínimo 8 caracteres" value={formData.password}
                    className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-brand-orange transition-colors"
                    onChange={handleChange} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 bottom-2 text-gray-500 hover:text-gray-700">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Indique su rol</label>
                  <div className="flex space-x-6">
                    {['administrador', 'asesor', 'cliente'].map(r => (
                      <label key={r} className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="role" value={r} checked={formData.role === r} onChange={handleChange} className="text-brand-orange focus:ring-brand-orange" />
                        <span className="text-gray-600 capitalize">{r}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PASO 2: Identidad */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
                    <input name="first_name" type="text" value={formData.first_name}
                      className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-brand-orange transition-colors"
                      onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                    <input name="last_name" type="text" value={formData.last_name}
                      className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-brand-orange transition-colors"
                      onChange={handleChange} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
                    <input name="dni" type="text" maxLength="8" placeholder="8 dígitos" value={formData.dni}
                      className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-brand-orange transition-colors"
                      onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
                    <input name="telefono" type="text" maxLength="9" value={formData.telefono}
                      className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-brand-orange transition-colors"
                      onChange={handleChange} />
                  </div>
                </div>
              </div>
            )}

            {/* PASO 3: Economía */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ingreso Mensual Neto (S/)</label>
                  <input name="ingreso_mensual" type="number" placeholder="4500.00" value={formData.ingreso_mensual}
                    className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-brand-orange transition-colors"
                    onChange={handleChange} />
                </div>

                <CustomSelect
                  label="Origen de Fondos"
                  value={formData.codigo_tipo_ingreso}
                  onChange={(val) => handleCustomChange('codigo_tipo_ingreso', val)}
                  options={[
                    { id: 1, label: 'Dependiente (Planilla / Boletas)' },
                    { id: 2, label: 'Independiente (4ta / 5ta Categoría)' },
                    { id: 3, label: 'Ahorro Programado' }
                  ]}
                />

                {Number(formData.codigo_tipo_ingreso) === 3 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meses de ahorro demostrable</label>
                    <input name="meses_ahorro" type="number" min="0" value={formData.meses_ahorro}
                      className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-brand-orange transition-colors"
                      onChange={handleChange} />
                    <p className="text-xs text-gray-400 mt-1">Mínimo 6 meses exigido por las IFIs.</p>
                  </div>
                )}

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" name="tiene_deudor_solidario" checked={formData.tiene_deudor_solidario} onChange={handleChange} className="text-brand-orange" />
                  <span className="text-sm text-gray-600">¿Cuenta con deudor solidario?</span>
                </label>
              </div>
            )}

            {/* PASO 4: Regulaciones */}
            {step === 4 && (
              <div className="space-y-5">
                <CustomSelect label="Estado Civil" value={formData.codigo_estado_civil} onChange={(val) => handleCustomChange('codigo_estado_civil', val)}
                  options={[{ id: 1, label: 'Soltero' }, { id: 2, label: 'Casado' }, { id: 3, label: 'Conviviente' }, { id: 4, label: 'Divorciado' }, { id: 5, label: 'Viudo' }]}
                />

                {[2, 3].includes(Number(formData.codigo_estado_civil)) && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                    <p className="text-sm font-medium text-gray-700">Datos del Cónyuge / Conviviente</p>
                    <input name="nombre_conyuge" type="text" placeholder="Apellidos y Nombres del cónyuge"
                      className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-brand-orange transition-colors text-sm"
                      onChange={handleChange} />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">DNI Cónyuge</label>
                        <input name="doc_conyuge" type="text" placeholder="8 dígitos"
                          className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-brand-orange transition-colors text-sm"
                          onChange={handleChange} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Ingreso mensual (S/)</label>
                        <input name="ingreso_conyuge" type="number" placeholder="0.00"
                          className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-brand-orange transition-colors text-sm"
                          onChange={handleChange} />
                      </div>
                    </div>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" name="conyuge_propietario" checked={formData.conyuge_propietario} onChange={handleChange} className="text-brand-orange" />
                      <span className="text-sm text-gray-600">¿El cónyuge posee propiedad inmueble?</span>
                    </label>
                  </div>
                )}

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                  <p className="text-sm font-medium text-gray-700">Restricciones FMV (Bono del Buen Pagador)</p>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" name="es_propietario_vivienda" checked={formData.es_propietario_vivienda} onChange={handleChange} className="text-brand-orange" />
                    <span className="text-sm text-gray-600">¿Es actualmente propietario de una vivienda?</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" name="ha_recibido_apoyo" checked={formData.ha_recibido_apoyo} onChange={handleChange} className="text-brand-orange" />
                    <span className="text-sm text-gray-600">¿Ha recibido apoyo habitacional estatal previo?</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" name="tiene_credito_activo" checked={formData.tiene_credito_activo} onChange={handleChange} className="text-brand-orange" />
                    <span className="text-sm text-gray-600">¿Tiene un crédito FMV activo?</span>
                  </label>
                  {(formData.es_propietario_vivienda || formData.ha_recibido_apoyo || formData.tiene_credito_activo || formData.conyuge_propietario) && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mt-2">
                      <WarningAmberIcon className="text-red-500 shrink-0 mt-0.5" fontSize="small" />
                      <p className="text-xs text-red-600">
                        <strong>Aviso:</strong> Su perfil presenta condiciones que lo inhabilitan para acceder al Bono del Buen Pagador (BBP) según normativa FMV.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Botones de navegación */}
            <div className="flex gap-3 pt-2">
              {step > 1 && (
                <button type="button" onClick={handleBack}
                  className="px-6 py-3 border border-gray-300 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition duration-200">
                  Atrás
                </button>
              )}
              <button type="button" onClick={handleNext} disabled={loading}
                className="flex-1 bg-brand-orange text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition duration-200 shadow-lg disabled:opacity-70">
                {loading ? 'Procesando...' : (step === totalSteps ? 'Crear Cuenta' : 'Siguiente')}
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-gray-500">
            ¿Ya eres usuario? <Link to="/login" className="text-brand-dark font-bold hover:underline">Iniciar Sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
