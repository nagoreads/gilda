import { useState } from 'react';
import PortadaLibro from '../PortadaLibro';

export function ModalUpgrade({ onClose }) {
  return (
    <div className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 fade-in">
      <div className="editorial-card max-w-sm w-full p-6 space-y-4 text-center bg-[#ffffee] relative modal-pop">
        <button onClick={onClose} className="absolute top-3 right-3 text-[#75706b] hover:text-[#23211e] p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <i className="fa-solid fa-xmark text-sm"></i>
        </button>
        <div className="w-12 h-12 bg-[#ffffee] rounded-full flex items-center justify-center mx-auto text-[var(--primary-olive)] border border-[#e8e4d9]">
          <i className="fa-solid fa-lock text-lg"></i>
        </div>
        <div className="space-y-1">
          <h3 className="font-babydoll text-xl font-bold">Acceso restringido</h3>
          <p className="text-xs text-[#75706b] font-sans leading-relaxed">
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
      <div className="editorial-card max-w-sm w-full p-6 space-y-4 bg-[#ffffee] relative modal-pop">
        <button onClick={onClose} className="absolute top-3 right-3 text-[#75706b] hover:text-[#23211e] p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <i className="fa-solid fa-xmark text-sm"></i>
        </button>
        <h3 className="font-babydoll text-xl font-bold">Añadir pin o imagen externa</h3>
        <p className="text-xs text-[#75706b] font-sans leading-relaxed">
          Pega la URL directa de la imagen (ej. de Pinterest o Cosmos).
        </p>
        <div className="space-y-3 font-sans">
          <div>
            <label className="block text-xs font-semibold text-[#23211e] mb-1">Título del marco o moodboard</label>
            <input type="text" placeholder="Ej: Inspiración otoño..." value={tituloInput} onChange={(e) => setTituloInput(e.target.value)} className="w-full editorial-input p-2.5 text-xs" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#23211e] mb-1">URL directa de la imagen (.jpg, .png)</label>
            <input type="url" placeholder="https://..." value={urlInput} onChange={(e) => setUrlInput(e.target.value)} className="w-full editorial-input p-2.5 text-xs" />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={() => { if (urlInput.trim()) { onSave(urlInput.trim(), tituloInput.trim()); } }} className="flex-1 editorial-btn py-2.5 text-xs font-semibold min-h-[44px]">
            Guardar marco
          </button>
          <button onClick={onClose} className="flex-1 bg-gray-100 text-[#75706b] rounded-xl py-2.5 text-xs font-semibold hover:bg-gray-200 font-sans min-h-[44px]">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export function ModalDetalleLibro({
  libro,
  onClose,
  sesion,
  supabase,
  cargarDatosSupabase,
  registrarActividadPresencia,
  mostrarToast,
  nombreUsuarioPersonalizado
}) {
  const [mostrarInputCorreccion, setMostrarInputCorreccion] = useState(false);
  const [editandoPortadaUrl, setEditandoPortadaUrl] = useState('');
  const [estrellasSeleccionadas, setEstrellasSeleccionadas] = useState(5);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);

  if (!libro) return null;

  const tituloLibro = libro.libro || libro.titulo || '';

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 fade-in">
      <div className="editorial-card max-w-sm w-full p-6 space-y-4 text-center bg-[#ffffee] relative modal-pop">
        <button onClick={onClose} className="absolute top-3 right-3 text-[#75706b] hover:text-[#23211e] p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <i className="fa-solid fa-xmark text-sm"></i>
        </button>
        <div className="flex justify-center">
          <PortadaLibro titulo={tituloLibro} autora={libro.autora} portada={libro.portada} size="large" />
        </div>
        <div className="space-y-1">
          <h3 className="font-babydoll text-xl font-bold">{tituloLibro}</h3>
          <p className="text-xs text-[#75706b] italic font-sans">{libro.autora || 'Autora desconocida'}</p>
          <p className="text-xs text-[#75706b] uppercase tracking-wider pt-1 font-sans">Estado: <b>{libro.estado || 'leyendo'}</b></p>
        </div>

        {mostrarInputCorreccion ? (
          <div className="space-y-2 bg-[#faf9f5] p-3 rounded-xl border border-[#e8e4d9] font-sans">
            <input id="edit-cover-url" name="editCoverUrl" autoComplete="off" type="text" value={editandoPortadaUrl} onChange={(e) => setEditandoPortadaUrl(e.target.value)} placeholder="Pega la URL de la nueva portada..." className="w-full px-3 py-2 text-xs border border-[#e8e4d9] rounded-lg bg-white text-[#23211e]" />
            <div className="flex gap-2">
              <button onClick={async () => {
                const nuevaPortada = editandoPortadaUrl.trim();
                await supabase.from('personal_readings').update({ portada: nuevaPortada }).eq('email', sesion.email).eq('libro', tituloLibro);
                await cargarDatosSupabase();
                registrarActividadPresencia();
                mostrarToast('¡Portada actualizada!');
                setMostrarInputCorreccion(false);
              }} className="flex-1 editorial-btn py-1.5 text-xs font-semibold min-h-[44px]">Guardar</button>
              <button onClick={() => setMostrarInputCorreccion(false)} className="flex-1 bg-white border border-[#e8e4d9] text-[#75706b] py-1.5 rounded-xl text-xs font-semibold min-h-[44px]">Cancelar</button>
            </div>
          </div>
        ) : (
          <button onClick={() => { setEditandoPortadaUrl(libro.portada || ''); setMostrarInputCorreccion(true); }} className="w-full bg-[#faf9f5] border border-[#e8e4d9] text-[var(--primary-olive)] py-2 rounded-xl text-xs font-semibold min-h-[44px]">
            <i className="fa-solid fa-image mr-1"></i> Corregir portada o URL
          </button>
        )}

        <div className="py-3 px-3 my-2 bg-[#ffffee] rounded-xl border border-[#e8e4d9] flex flex-col items-center gap-2 font-sans">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--primary-olive)]">deja tu marca de tinta</span>
          <div className="flex gap-1 items-center">
            {[1, 2, 3, 4, 5].map((num) => (
              <span 
                key={num} 
                onClick={() => setEstrellasSeleccionadas(num)} 
                className={`cursor-pointer font-babydoll text-2xl transition-transform hover:scale-125 p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center ${num <= estrellasSeleccionadas ? 'text-[#23211e]' : 'text-[#d4cfbc]'}`}
              >
                ✦
              </span>
            ))}
          </div>
          <button onClick={async () => {
            const postMuro = {
              tipo: 'evaluacion',
              email: sesion.email,
              nombre: nombreUsuarioPersonalizado || sesion.nombre,
              libro: tituloLibro,
              estrellas: estrellasSeleccionadas,
              portada: libro.portada || '',
              timestamp: new Date().toISOString()
            };
            await supabase.from('wall_posts').insert([postMuro]);
            await cargarDatosSupabase();
            registrarActividadPresencia();
            mostrarToast(`¡Marca de ${estrellasSeleccionadas}/5 ✦ guardada!`);
            onClose();
          }} className="w-full mt-2 editorial-btn py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[44px]">
            <i className="fa-solid fa-feather text-[10px]"></i> Estampar en el Muro
          </button>
        </div>

        <div className="pt-2 border-t border-[#e8e4d9] flex flex-col gap-2">
          {confirmandoEliminar ? (
            <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-center space-y-2.5 fade-in font-sans">
              <p className="text-xs font-bold text-red-800">¿Segura que quieres eliminar este libro de tu estantería?</p>
              <div className="flex gap-2">
                <button onClick={async () => {
                  await supabase.from('personal_readings').delete().eq('email', sesion.email).eq('libro', tituloLibro);
                  await cargarDatosSupabase();
                  registrarActividadPresencia();
                  onClose();
                  mostrarToast('Libro eliminado de la estantería');
                }} className="flex-1 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 min-h-[44px]">Sí, eliminar</button>
                <button onClick={() => setConfirmandoEliminar(false)} className="flex-1 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50 min-h-[44px]">Cancelar</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setConfirmandoEliminar(true)} className="flex-1 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors min-h-[44px]">Eliminar</button>
              <button onClick={onClose} className="flex-1 editorial-btn py-2 text-xs min-h-[44px]">Cerrar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}