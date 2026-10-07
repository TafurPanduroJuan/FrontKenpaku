import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      await login(email, password);
      navigate('/admin');
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
          <h1 className="text-2xl font-extrabold text-kenpaku-navy">Acceso Panel Admin</h1>
          <p className="text-xs text-slate-500">Comercial Kenpaku S.A.C. - Puente Piedra</p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Correo de Administrador"
            type="email"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
