import ModalImportarBiblioteca from './ModalImportarBiblioteca';
import SuscribirPush from './SuscribirPush';
import { useState } from 'react';
import PortadaLibro from '../PortadaLibro';
import BuscadorLibros from '../BuscadorLibros';
import { LomoLibroEstanteria } from './DecoracionesHabitacion';

export default function SeccionHabitacion({ supabase, 
  sesion,
  miPagina,
  libroActual,
  porcentajeLibro,
  todosMisLibrosEstanteria,
  librosBibliotecaVisibles,
  tabEstanteria,
  setTabEstanteria,
  isReadingNow,
  setIsReadingNow,
  fotoPerfilPersonalizada,
  nombreUsuarioPersonalizado,
  handleFotoPerfilUpdate,
  guardarLibroPersonal,
  setLibroSeleccionadoDetalle,
  setMostrarModalShare,
  registrarActividadPresencia,
  safeSet,
  AvatarUsuaria
}) {
  const [modoCreacionManual, setModoCreacionManual] = useState(false);
  const [mostrarModalBiblioteca, setMostrarModalBiblioteca] = useState(false);
  const [libroPersonalInput, setLibroPersonalInput] = useState('');
  const [paginaPersonalInput, setPaginaPersonalInput] = useState('');
  const [manualTitulo, setManualTitulo] = useState('');
  const [manualAutora, setManualAutora] = useState('');
  const [manualPortada, setManualPortada] = useState('');

  return (
    <div className="space-y-5 fade-in">
      {/* Banner Principal */}
      <section className="editorial-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-babydoll text-3xl sm:text-4xl font-bold text-[#23211e]">Mi habitación</h1>
            <p className="mt-0.5 text-xs text-[#75706b] font-sans">Tu rincón personal de lectura.</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <button
              onClick={() => setMostrarModalShare(true)}
              className="px-3.5 py-1.5 text-xs rounded-lg font-medium font-sans bg-white text-[#23211e] border border-[#e8e4d9] hover:bg-[#ffffee] transition-colors min-h-[44px]"
            >
              Compartir
            </button>
            <button
              onClick={() => setMostrarModalBiblioteca(true)}
              className="px-3.5 py-1.5 text-xs rounded-lg font-medium font-sans bg-white text-[#23211e] border border-[#e8e4d9] hover:bg-[#ffffee] transition-colors min-h-[44px] flex items-center gap-1.5"
            >
              <i className="fa-solid fa-book-bookmark text-[10px]"></i> Importar biblioteca
            </button>
            <button
              onClick={() => {
                const nuevo = !isReadingNow;
                setIsReadingNow(nuevo);
                safeSet('gilda_is_reading', nuevo);
                registrarActividadPresencia();
              }}
              className={`px-3.5 py-1.5 text-xs rounded-lg font-medium font-sans border transition-colors min-h-[44px] ${
                isReadingNow
                  ? 'bg-[#23211e] border-[#23211e] text-[#ffffee]'
                  : 'bg-white border-[#e8e4d9] text-[#75706b] hover:text-[#23211e]'
              }`}
            >
              {isReadingNow ? 'Leyendo ahora' : 'En pausa'}
            </button>
          </div>
        </div>
      </section>

      {/* Renderizado del Modal de Importación */}
      {mostrarModalBiblioteca && (
        <ModalImportarBiblioteca 
          onClose={() => setMostrarModalBiblioteca(false)} 
          supabase={supabase}
          sesion={sesion}
          cargarDatosSupabase={cargarDatosSupabase}
          mostrarToast={typeof mostrarToast === "function" ? mostrarToast : (msg) => console.log(msg)}
        />
      )}
    </div>
  );
}
}