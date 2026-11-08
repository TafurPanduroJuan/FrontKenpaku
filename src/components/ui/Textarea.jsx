import React from 'react';

export const Textarea = React.forwardRef(({
  label,
  error,
  helperText,
  fullWidth = true,
  className = '',
  rows = 4,
  id,
  ...props
}, ref) => {
  const textareaId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`${fullWidth ? 'w-full' : ''} text-left`}>
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-bold text-steel-600 mb-1.5 uppercase tracking-wide">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={`
          block w-full rounded-btn border text-sm text-navy-900 bg-white p-3.5 shadow-inset
          transition-all duration-150 placeholder-steel-500
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-steel-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15'}
          focus:outline-none focus:ring-opacity-20
          disabled:bg-steel-50 disabled:text-steel-500 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-steel-500">{helperText}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';
