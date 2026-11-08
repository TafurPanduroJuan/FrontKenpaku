import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
  showCloseButton = true
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-navy-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className={`w-full ${maxWidth} bg-white rounded-panel shadow-lift overflow-hidden border border-steel-200 my-auto flex flex-col max-h-[88vh] animate-fade-in`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-steel-200 bg-white/95 shrink-0 sticky top-0 z-10">
          <h3 id="modal-title" className="text-base sm:text-lg font-bold font-display text-navy-900">
            {title}
          </h3>
          {showCloseButton && (
            <button
              type="button"
              data-testid="modal-close-button"
              onClick={onClose}
              className="p-1.5 text-steel-500 hover:text-navy-900 rounded-btn hover:bg-steel-100 transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 text-navy-900">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
