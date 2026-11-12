import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = React.forwardRef(({
  children,
  variant = 'primary', // primary (orange), navy, whatsapp, blue, secondary, outline, ghost, danger
  size = 'md', // sm, md, lg
  isLoading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  type = 'button',
  icon: Icon,
  iconRight: IconRight,
  ...props
}, ref) => {

  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-btn transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none min-h-[44px] active:scale-[0.98]';

  const variants = {
    primary: 'bg-accent-600 hover:bg-accent-700 text-white shadow-cta hover:shadow-cta-hover focus-visible:outline-accent-600 hover:-translate-y-px',
    navy: 'bg-navy-900 hover:bg-navy-800 text-white focus-visible:outline-navy-900 shadow-sm hover:-translate-y-px',
    whatsapp: 'bg-wa-600 hover:bg-wa-700 text-white shadow-wa focus-visible:outline-wa-600 hover:-translate-y-px',
    blue: 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm focus-visible:outline-brand-600 hover:-translate-y-px',
    secondary: 'bg-steel-100 hover:bg-steel-200 text-navy-900 border border-steel-200 shadow-sm',
    outline: 'border border-steel-300 bg-white hover:bg-steel-50 text-navy-900 hover:border-navy-900 focus-visible:outline-brand-500 shadow-sm',
    ghost: 'bg-transparent hover:bg-steel-100 text-navy-900 focus-visible:outline-brand-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus-visible:outline-red-600 shadow-sm hover:-translate-y-px'
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 min-h-[38px] gap-1.5',
    md: 'text-sm px-4 py-2.5 min-h-[44px] gap-2',
    lg: 'text-base px-6 py-3 min-h-[50px] gap-2.5 font-bold'
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
      <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">{children}</span>
      {IconRight && !isLoading && (
        <IconRight className="w-4 h-4 shrink-0" />
      )}
    </button>
  );
});

Button.displayName = 'Button';
