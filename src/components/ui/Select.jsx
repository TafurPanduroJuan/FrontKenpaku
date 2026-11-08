import React from 'react';

export const Select = React.forwardRef(({
  label,
  error,
  options = [],
  fullWidth = true,
  className = '',
  id,
  placeholder = 'Seleccionar...',
  ...props
}, ref) => {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`${fullWidth ? 'w-full' : ''} text-left`}>
      {label && (
        <label htmlFor={selectId} className="block text-xs font-bold text-steel-600 mb-1.5 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative rounded-btn shadow-inset">
        <select
          ref={ref}
          id={selectId}
          className={`
            block w-full rounded-btn border text-sm text-navy-900 bg-white px-3.5 py-2.5
            transition-all duration-150 min-h-[44px] appearance-none pr-9
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-steel-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15'}
            focus:outline-none focus:ring-opacity-20
            disabled:bg-steel-50 disabled:text-steel-500 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-steel-500">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';
