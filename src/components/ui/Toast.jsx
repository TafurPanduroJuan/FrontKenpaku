import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function Toast({
  message,
  type = 'success', // success, error, info
  isVisible,
  onClose,
  duration = 3500
}) {
  useEffect(() => {
    if (isVisible && duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-kenpaku-blue shrink-0" />
  };

  const borderClasses = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    error: 'border-red-200 bg-red-50 text-red-900',
    info: 'border-blue-200 bg-blue-50 text-blue-900'
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in max-w-sm w-full">
      <div className={`flex items-center justify-between p-4 rounded-xl border shadow-lg ${borderClasses[type]}`}>
        <div className="flex items-center gap-3">
          {icons[type]}
          <p className="text-sm font-medium leading-snug">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/5 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
