import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = React.forwardRef(({
  children,
  variant = 'primary', // primary (orange), navy, whatsapp, outline, ghost, danger
  size = 'md', // sm, md, lg
  isLoading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  type = 'button',
  icon: Icon,
  ...props
}, ref) => {

  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none min-h-[44px] active:scale-[0.98]';

  const variants = {
    primary: 'bg-kenpaku-orange hover:bg-kenpaku-orangeHover text-white focus-visible:outline-kenpaku-orange shadow-sm',
    navy: 'bg-kenpaku-navy hover:bg-kenpaku-navyLight text-white focus-visible:outline-kenpaku-navy shadow-sm',
    whatsapp: 'bg-kenpaku-whatsapp hover:bg-kenpaku-whatsappHover text-white focus-visible:outline-kenpaku-whatsapp shadow-sm',
    blue: 'bg-kenpaku-blue hover:bg-kenpaku-blueHover text-white focus-visible:outline-kenpaku-blue shadow-sm',
    outline: 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 focus-visible:outline-kenpaku-blue',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 focus-visible:outline-kenpaku-blue',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus-visible:outline-red-600 shadow-sm'
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 min-h-[36px] gap-1.5',
    md: 'text-sm px-4 py-2.5 min-h-[44px] gap-2',
    lg: 'text-base px-6 py-3 min-h-[48px] gap-2.5 font-semibold'
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
});

Button.displayName = 'Button';
