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
        <label htmlFor={inputId} className="block text-xs font-bold text-steel-600 mb-1.5 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative rounded-btn shadow-inset">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-steel-500">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={effectiveType}
          className={`
            block w-full rounded-btn border text-sm text-navy-900 bg-white placeholder-steel-500
            transition-all duration-150 min-h-[44px]
            ${Icon ? 'pl-10' : 'pl-3.5'}
            ${EndIcon || hasEyeToggle ? 'pr-10' : 'pr-3.5'}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-steel-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15'}
            focus:outline-none focus:ring-opacity-20
            disabled:bg-steel-50 disabled:text-steel-500 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
        {EndIcon && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-steel-500">
            <EndIcon className="w-4 h-4" />
          </div>
        )}
        {hasEyeToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-steel-500 hover:text-navy-900 focus:outline-none focus:text-brand-600 transition-colors"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            tabIndex="-1"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-steel-500">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
