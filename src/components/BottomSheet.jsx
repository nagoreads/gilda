import React, { useEffect } from 'react';

export default function BottomSheet({ isOpen, onClose, title, children }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop con desenfoque suave */}
      <div 
        className="fixed inset-0 bg-black/35 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Contenedor Bottom Sheet en móvil / Modal centrado en escritorio */}
      <div className="relative w-full max-w-lg bg-[#faf8f5] border-t sm:border border-[#e8e4d9] rounded-t-2xl sm:rounded-2xl p-6 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] sm:shadow-[0_12px_40px_rgba(40,30,20,0.12)] z-10 animate-slide-up max-h-[88vh] overflow-y-auto">
        {/* Indicador táctil superior (Handle Pill) */}
        <div className="w-10 h-1 bg-[#e2ddd0] rounded-full mx-auto mb-4 sm:hidden" />

        {/* Encabezado editorial */}
        {title && (
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#e8e4d9]">
            <h3 className="font-serif text-lg font-medium text-[#2c2825] tracking-tight">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-[#75706b] hover:text-[#2c2825] p-1 rounded-full hover:bg-[#f0ebe1] transition-colors text-sm font-sans"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        )}

        {/* Contenido del Sheet */}
        <div className="font-sans text-[#2c2825]">
          {children}
        </div>
      </div>
    </div>
  );
}
