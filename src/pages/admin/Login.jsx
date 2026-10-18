import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { sanitizeEmailInput, isValidEmail } from '../../utils/sanitizers';

export function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, role, login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  if (isAuthenticated) {
    if (role === 'cajero') {
      return <Navigate to="/caja" replace />;
    }
    return <Navigate to="/admin" replace />;
  }

  const handleEmailChange = (e) => {
    const cleaned = sanitizeEmailInput(e.target.value);
    setEmail(cleaned);
    if (emailError && isValidEmail(cleaned)) {
      setEmailError(null);
    }
  };

  const handleEmailBlur = () => {
    if (email && !isValidEmail(email)) {
      setEmailError('Ingresa un correo válido con @ y dominio (ej. admin@kenpaku.pe)');
    } else {
      setEmailError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isValidEmail(email)) {
      setEmailError('Ingresa un correo válido con @ y dominio (ej. admin@kenpaku.pe)');
      return;
    }
    setEmailError(null);

    try {
      const result = await login(email, password);
      if (result?.rol === 'cajero') {
        navigate('/caja');
      } else {
        navigate('/admin');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Credenciales inválidas. Compruebe el correo y contraseña.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 space-y-6 animate-fade-in border border-slate-200">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-kenpaku-navy text-white font-extrabold text-2xl flex items-center justify-center mx-auto shadow-md">
            K
          </div>
          <h1 className="text-2xl font-extrabold text-kenpaku-navy tracking-tight">Portal de Colaboradores</h1>
          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            Ingresa tus credenciales si eres administrador o personal de ventas.
          </p>
          <p className="text-[11px] text-slate-400 font-medium">Comercial Kenpaku S.A.C. - Puente Piedra</p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            label="Correo de Administrador o Ventas"
            type="email"
            icon={Mail}
            value={email}
            onChange={handleEmailChange}
            onBlur={handleEmailBlur}
            error={emailError}
            placeholder="admin@kenpaku.pe"
            required
          />

          <Input
            label="Contraseña"
            type="password"
            icon={Lock}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />


          <Button
            type="submit"
            variant="navy"
            size="lg"
            fullWidth
            isLoading={isLoading}
            icon={ArrowRight}
          >
            Iniciar sesión  
          </Button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => navigate('/')}
            className="text-xs font-semibold text-slate-500 hover:text-kenpaku-blue transition-colors"
          >
            &larr; Volver a la tienda web pública
          </button>
        </div>
      </div>
    </div>
  );
}
