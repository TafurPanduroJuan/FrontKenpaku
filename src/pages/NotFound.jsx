import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function NotFound() {
  return (
    <div className="py-20 text-center flex flex-col items-center justify-center max-w-md mx-auto">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-kenpaku-blue mb-6">
        <FileQuestion className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-extrabold text-kenpaku-navy mb-2">404 - Página no encontrada</h1>
      <p className="text-sm text-slate-600 mb-8">
        La dirección solicitada no existe o ha sido movida. Puedes volver al catálogo principal de acero.
      </p>
      <Link to="/">
        <Button variant="primary" icon={ArrowLeft}>
          Volver al Inicio
        </Button>
      </Link>
    </div>
  );
}
