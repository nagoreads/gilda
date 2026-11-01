import React, { useState, useEffect } from 'react';

// Helper exportado para disparar Toasts desde cualquier parte de la app
export const showToast = (message, type = 'info') => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type, id: Date.now() } }));
  }
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      const { message, type, id } = e.detail;
      setToasts((prev) => [...prev, { message, type, id }]);
      
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    };

    window.addEventListener('app-toast', handleToast);

    // Sobrescribir window.alert nativo para capturar alertas antiguas automáticamente
    window.alert = (msg) => showToast(msg, 'info');

    return () => window.removeEventListener('app-toast', handleToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto p-3.5 rounded-xl shadow-md border text-xs font-sans flex items-center justify-between transition-all duration-300 transform translate-y-0 ${
            t.type === 'error'
              ? 'bg-[#fff5f5] border-[#f5c6cb] text-[#721c24]'
              : t.type === 'success'
              ? 'bg-[#f4f9f4] border-[#c3e6cb] text-[#155724]'
              : 'bg-[#faf9f5] border-[#e8e4d9] text-[#23211e]'
          }`}
        >
          <span className="leading-snug">{t.message}</span>
          <button
            onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
            className="ml-3 text-xs opacity-50 hover:opacity-100 font-bold px-1"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};
