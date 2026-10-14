import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const Input = React.forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  endIcon: EndIcon,
  fullWidth = true,
  className = '',
  id,
  type = 'text',
  showPasswordToggle = true,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === 'password';
  const effectiveType = isPasswordField && showPassword ? 'text' : type;

  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const hasEyeToggle = isPasswordField && showPasswordToggle && !EndIcon;

  return (
    <div className={`${fullWidth ? 'w-full' : ''} text-left`}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative rounded-lg shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={effectiveType}
          className={`
            block w-full rounded-lg border text-sm text-slate-900 bg-white placeholder-slate-400
            transition-colors duration-150 min-h-[44px]
            ${Icon ? 'pl-10' : 'pl-3.5'}
            ${EndIcon || hasEyeToggle ? 'pr-10' : 'pr-3.5'}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-300 focus:border-kenpaku-blue focus:ring-kenpaku-blue'}
            focus:outline-none focus:ring-2 focus:ring-opacity-20
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
        {EndIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">
            <EndIcon className="w-5 h-5" />
          </div>
        )}
        {hasEyeToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none focus:text-[#0284C7] transition-colors"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            tabIndex="-1"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
