import { useState } from 'react';
import ModalImportarBiblioteca from './ModalImportarBiblioteca';
import SuscribirPush from './SuscribirPush';
import PortadaLibro from '../PortadaLibro';
import BuscadorLibros from '../BuscadorLibros';
import { LomoLibroEstanteria } from './DecoracionesHabitacion';

export default function SeccionHabitacion({ 
  supabase, 
  sesion, 
  miPagina, 
  libroActual, 
  porcentajeLibro, 
  todosMisLibrosEstanteria, 
  librosBibliotecaVisibles, 
  tabEstanteria,
  setTabEstanteria,
  busquedaLibro,
  setBusquedaLibro,
  guardarLibroPersonal,
  eliminarLibroPersonal,
  isReadingNow,
  setIsReadingNow,
  safeSet,
  registrarActividadPresencia,
  setMostrarModalShare,
  cargarDatosSupabase,
  mostrarToast
}) {
  const [mostrarModalBiblioteca, setMostrarModalBiblioteca] = useState(false);

  // Filtros y libros de la estantería
    // Filtros flexibles para capturar cualquier variante de estado en Supabase
  const librosLeyendo = todosMisLibrosEstanteria?.filter(l => {
    const est = (l.estado || "").toLowerCase();
    return est.includes("leyend") || est.includes("actual") || est === "leyendo";
  }) || [];

  const librosQuiero = todosMisLibrosEstanteria?.filter(l => {
    const est = (l.estado || "").toLowerCase();
    return est.includes("pend") || est.includes("quier") || est.includes("to-read") || est === "pendiente";
  }) || [];

  const librosLeidos = todosMisLibrosEstanteria?.filter(l => {
    const est = (l.estado || "").toLowerCase();
    return est.includes("leid") || est.includes("term") || est.includes("read") || est === "leido";
  }) || [];

  // Si por defecto no encajaran en ninguna, los ponemos en leídos o pendientes para que nunca desaparezcan
  const librosRestantes = todosMisLibrosEstanteria?.filter(l => !librosLeyendo.includes(l) && !librosQuiero.includes(l) && !librosLeidos.includes(l)) || [];
  if (librosRestantes.length > 0) {
    librosLeidos.push(...librosRestantes);
  }
  const librosQuiero = todosMisLibrosEstanteria?.filter(l => l.estado === 'pendiente' || l.estado === 'quiero_leer') || [];
  const librosLeidos = todosMisLibrosEstanteria?.filter(l => l.estado === 'leido' || l.estado === 'terminado') || [];

  return (
    <div className="space-y-5 fade-in pb-12">
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

      {/* Sección de Estantería */}
      <section className="editorial-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-babydoll text-2xl font-bold text-[#23211e]">Estantería</h2>
          <span className="text-xs text-[#75706b] font-sans">{todosMisLibrosEstanteria?.length || 0} libros</span>
        </div>

        {/* Pestanas de estantería */}
        <div className="flex gap-2 border-b border-[#e8e4d9] pb-3">
          <button
            onClick={() => setTabEstanteria('leyendo')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              tabEstanteria === 'leyendo'
                ? 'bg-[#23211e] text-[#ffffee]'
                : 'bg-white text-[#75706b] border border-[#e8e4d9] hover:bg-[#ffffee]'
            }`}
          >
            Leyendo ({librosLeyendo.length})
          </button>
          <button
            onClick={() => setTabEstanteria('quiero')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              tabEstanteria === 'quiero'
                ? 'bg-[#23211e] text-[#ffffee]'
                : 'bg-white text-[#75706b] border border-[#e8e4d9] hover:bg-[#ffffee]'
            }`}
          >
            Quiero leer ({librosQuiero.length})
          </button>
          <button
            onClick={() => setTabEstanteria('leidos')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              tabEstanteria === 'leidos'
                ? 'bg-[#23211e] text-[#ffffee]'
                : 'bg-white text-[#75706b] border border-[#e8e4d9] hover:bg-[#ffffee]'
            }`}
          >
            Leídos ({librosLeidos.length})
          </button>
        </div>

        {/* Visualizador de libros en estantes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
          {tabEstanteria === 'leyendo' && librosLeyendo.map((lib, idx) => (
            <div key={idx} className="bg-white p-3 rounded-xl border border-[#e8e4d9] flex flex-col items-center text-center space-y-2">
              <img src={lib.portada || 'https://books.google.com/books/content?pprint=1&printsec=frontcover&img=1&zoom=1&source=gbs_api'} alt={lib.libro} className="w-20 h-28 object-cover rounded shadow" />
              <div className="truncate w-full">
                <p className="text-xs font-bold text-[#23211e] truncate">{lib.libro}</p>
                <p className="text-[10px] text-[#75706b] truncate">{lib.autora}</p>
              </div>
            </div>
          ))}

          {tabEstanteria === 'quiero' && librosQuiero.map((lib, idx) => (
            <div key={idx} className="bg-white p-3 rounded-xl border border-[#e8e4d9] flex flex-col items-center text-center space-y-2">
              <img src={lib.portada || 'https://books.google.com/books/content?pprint=1&printsec=frontcover&img=1&zoom=1&source=gbs_api'} alt={lib.libro} className="w-20 h-28 object-cover rounded shadow" />
              <div className="truncate w-full">
                <p className="text-xs font-bold text-[#23211e] truncate">{lib.libro}</p>
                <p className="text-[10px] text-[#75706b] truncate">{lib.autora}</p>
              </div>
            </div>
          ))}

          {tabEstanteria === 'leidos' && librosLeidos.map((lib, idx) => (
            <div key={idx} className="bg-white p-3 rounded-xl border border-[#e8e4d9] flex flex-col items-center text-center space-y-2">
              <img src={lib.portada || 'https://books.google.com/books/content?pprint=1&printsec=frontcover&img=1&zoom=1&source=gbs_api'} alt={lib.libro} className="w-20 h-28 object-cover rounded shadow" />
              <div className="truncate w-full">
                <p className="text-xs font-bold text-[#23211e] truncate">{lib.libro}</p>
                <p className="text-[10px] text-[#75706b] truncate">{lib.autora}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Suscripción Push */}
      <SuscribirPush sesion={sesion} supabase={supabase} />

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
