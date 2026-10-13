import { useState } from 'react';

export function ModalUpgrade({ onClose }) {
  return (
    <div className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 fade-in">
      <div className="editorial-card max-w-sm w-full p-6 space-y-4 text-center bg-white relative modal-pop">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-black p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <i className="fa-solid fa-xmark text-sm"></i>
        </button>
        <div className="w-12 h-12 bg-[#ffffee] rounded-full flex items-center justify-center mx-auto text-[#3d4220] border border-[#e6e4dc]">
          <i className="fa-solid fa-lock text-lg"></i>
        </div>
        <div className="space-y-1">
          <h3 className="font-babydoll text-xl font-bold">Acceso restringido</h3>
          <p className="text-xs text-[#595750] font-sans leading-relaxed">
            Tu modalidad actual no incluye acceso a esta función. Actualiza tu suscripción para acceder a todas las secciones de gilda.
          </p>
        </div>
        <a href="https://nagoreads.github.io/gilda/" target="_blank" rel="noopener noreferrer" className="block w-full editorial-btn py-3 text-xs text-center font-semibold min-h-[44px] flex items-center justify-center">
          Actualizar modalidad
        </a>
      </div>
    </div>
  );
}

export function ModalImportarPin({ onClose, onSave }) {
  const [urlInput, setUrlInput] = useState('');
  const [tituloInput, setTituloInput] = useState('');

  return (
    <div className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 fade-in">
      <div className="editorial-card max-w-sm w-full p-6 space-y-4 bg-white relative modal-pop">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-black p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <i className="fa-solid fa-xmark text-sm"></i>
        </button>
        <h3 className="font-babydoll text-xl font-bold">Añadir pin o imagen externa</h3>
        <p className="text-xs text-[#595750] font-sans leading-relaxed">
          Pega la URL directa de la imagen (ej. de Pinterest o Cosmos).
        </p>
        <div className="space-y-3 font-sans">
          <div>
            <label className="block text-xs font-semibold text-[#1c1c1a] mb-1">Título del marco o moodboard</label>
            <input type="text" placeholder="Ej: Inspiración otoño..." value={tituloInput} onChange={(e) => setTituloInput(e.target.value)} className="w-full editorial-input p-2.5 text-xs" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1c1c1a] mb-1">URL directa de la imagen (.jpg, .png)</label>
            <input type="url" placeholder="https://..." value={urlInput} onChange={(e) => setUrlInput(e.target.value)} className="w-full editorial-input p-2.5 text-xs" />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={() => { if (urlInput.trim()) { onSave(urlInput.trim(), tituloInput.trim()); } }} className="flex-1 editorial-btn py-2.5 text-xs font-semibold min-h-[44px]">
            Guardar marco
          </button>
          <button onClick={onClose} className="flex-1 bg-gray-100 text-[#595750] rounded-xl py-2.5 text-xs font-semibold hover:bg-gray-200 font-sans min-h-[44px]">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}