import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import ModalImportarBiblioteca from './ModalImportarBiblioteca';
import SuscribirPush from './SuscribirPush';
import PortadaLibro from '../PortadaLibro';
import BuscadorLibros from '../BuscadorLibros';
import BuscadorOpenLibrary from './BuscadorOpenLibrary';
import { LomoLibroEstanteria } from './DecoracionesHabitacion';

const supabaseUrl = "https://lsbdcmshswcqzitqwfiq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzYmRjbXNoc3djcXppdHF3ZmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwMjA2MzUsImV4cCI6MjEwNjU5NjYzNX0.n9KPVdYVDQ_l3WtFCO0RVOMdAI_OLKYNLhHdg34EKK0";
const fallbackClient = createClient(supabaseUrl, supabaseKey);

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
  const [mostrarBuscadorOL, setMostrarBuscadorOL] = useState(false);
  const [cargandoGuardar, setCargandoGuardar] = useState(false);

  const activeClient = (supabase && typeof supabase.from === 'function') ? supabase : fallbackClient;

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

  const librosRestantes = todosMisLibrosEstanteria?.filter(l => !librosLeyendo.includes(l) && !librosQuiero.includes(l) && !librosLeidos.includes(l)) || [];
  if (librosRestantes.length > 0) {
    librosLeidos.push(...librosRestantes);
  }

  // Función robusta para actualizar o eliminar utilizando id, libro y email
  const manejarAccionLibro = async (lib, nuevaAccion) => {
    let emailUsuario = sesion?.email;
    if (!emailUsuario) {
      try { emailUsuario = JSON.parse(localStorage.getItem('gilda_sesion') || '{}').email; } catch (e) {}
    }
    const emailFiltro = emailUsuario ? emailUsuario.toLowerCase().trim() : lib.email;

    if (nuevaAccion === 'eliminar') {
      if (!window.confirm(`¿Seguro que quieres eliminar "${lib.libro}" de tu estantería?`)) return;
      try {
        let query = activeClient.from('personal_readings').delete();
        if (lib.id) {
          query = query.eq('id', lib.id);
        } else {
          query = query.eq('libro', lib.libro).eq('email', emailFiltro);
        }
        const { error } = await query;
        if (error) throw error;
        if (typeof cargarDatosSupabase === 'function') await cargarDatosSupabase();
        if (typeof mostrarToast === 'function') mostrarToast('Libro eliminado correctamente.');
      } catch (err) {
        console.error("Error al eliminar libro:", err);
        if (typeof mostrarToast === 'function') mostrarToast('Error al eliminar el libro.');
      }
    } else {
      try {
        let query = activeClient.from('personal_readings').update({ estado: nuevaAccion });
        if (lib.id) {
          query = query.eq('id', lib.id);
        } else {
          query = query.eq('libro', lib.libro).eq('email', emailFiltro);
        }
        const { error } = await query;
        if (error) throw error;
        if (typeof cargarDatosSupabase === 'function') await cargarDatosSupabase();
        if (typeof mostrarToast === 'function') mostrarToast('Estante actualizado con éxito.');
      } catch (err) {
        console.error("Error al cambiar de estante:", err);
        if (typeof mostrarToast === 'function') mostrarToast('Error al cambiar de estante.');
      }
    }
  };

  const manejarLibroSeleccionadoOL = async (libroSeleccionado) => {
    if (cargandoGuardar) return;
    setCargandoGuardar(true);

    let emailUsuario = sesion?.email;
    if (!emailUsuario) {
      try { emailUsuario = JSON.parse(localStorage.getItem('gilda_sesion') || '{}').email; } catch (e) {}
    }

    let estadoBD = 'pendiente';
    if (tabEstanteria === 'leyendo') estadoBD = 'leyendo';
    else if (tabEstanteria === 'leidos') estadoBD = 'leido';

    const nuevoLibro = {
      email: emailUsuario ? emailUsuario.toLowerCase().trim() : 'invitada@gilda.app',
      nombre: sesion?.nombre || 'Socia',
      libro: libroSeleccionado.titulo,
      autora: libroSeleccionado.autora,
      estado: estadoBD,
      pagina: tabEstanteria === 'leidos' ? 100 : 0,
      paginas: libroSeleccionado.paginas || 200,
      portada: libroSeleccionado.portada
    };

    try {
      const { error } = await activeClient.from('personal_readings').insert([nuevoLibro]);
      if (error) throw error;
      
      setMostrarBuscadorOL(false);
      if (typeof cargarDatosSupabase === 'function') await cargarDatosSupabase();
      if (typeof mostrarToast === 'function') mostrarToast('Libro añadido con su portada real.');
    } catch (err) {
      console.error("Error al añadir libro:", err);
      if (typeof mostrarToast === 'function') mostrarToast('Error al guardar el libro.');
    } finally {
      setCargandoGuardar(false);
    }
  };

  const renderizarTarjetaLibro = (lib, idx) => (
    <div key={lib.id || idx} className="bg-white p-3 rounded-xl border border-[#e8e4d9] flex flex-col justify-between space-y-2 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <img src={lib.portada || 'https://books.google.com/books/content?pprint=1&printsec=frontcover&img=1&zoom=1&source=gbs_api'} alt={lib.libro} className="w-20 h-28 object-cover rounded shadow mb-2" />
        <div className="truncate w-full">
          <p className="text-xs font-bold text-[#23211e] truncate">{lib.libro}</p>
          <p className="text-[10px] text-[#75706b] truncate">{lib.autora}</p>
        </div>
      </div>
      <div className="pt-2 border-t border-[#e8e4d9]/50">
        <select
          value={lib.estado || 'pendiente'}
          onChange={(e) => manejarAccionLibro(lib, e.target.value)}
          className="w-full text-[10px] bg-[#ffffee] border border-[#e8e4d9] rounded-lg px-2 py-1 text-[#23211e] font-medium focus:outline-none cursor-pointer"
        >
          <option value="leyendo">Leyendo</option>
          <option value="pendiente">Quiero leer</option>
          <option value="leido">Leído</option>
          <option value="eliminar" className="text-red-600 font-semibold">Eliminar libro</option>
        </select>
      </div>
    </div>
  );

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
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-babydoll text-2xl font-bold text-[#23211e]">Estantería</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#75706b] font-sans">{todosMisLibrosEstanteria?.length || 0} libros</span>
            <button
              onClick={() => setMostrarBuscadorOL(!mostrarBuscadorOL)}
              className="px-3.5 py-1.5 bg-[#23211e] text-[#ffffee] text-xs font-semibold rounded-xl hover:opacity-95 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <i className={`fa-solid ${mostrarBuscadorOL ? 'fa-xmark' : 'fa-plus'}`}></i>
              {mostrarBuscadorOL ? 'Cerrar buscador' : 'Añadir libro'}
            </button>
          </div>
        </div>

        {/* Buscador desplegable de Open Library */}
        {mostrarBuscadorOL && (
          <div className="bg-white/80 p-4 rounded-2xl border border-[#e8e4d9] fade-in space-y-2">
            <div className="text-xs font-semibold text-[#75706b] flex justify-between items-center">
              <span>Añadiendo al estante actual: <strong className="text-[#23211e] uppercase">{tabEstanteria}</strong></span>
              {cargandoGuardar && <span className="text-xs italic text-[#23211e] animate-pulse">Guardando libro...</span>}
            </div>
            <BuscadorOpenLibrary onSeleccionarLibro={manejarLibroSeleccionadoOL} />
          </div>
        )}

        {/* Pestanas de estantería */}
        <div className="flex gap-2 border-b border-[#e8e4d9] pb-3">
          <button
            onClick={() => { setTabEstanteria('leyendo'); setMostrarBuscadorOL(false); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              tabEstanteria === 'leyendo'
                ? 'bg-[#23211e] text-[#ffffee]'
                : 'bg-white text-[#75706b] border border-[#e8e4d9] hover:bg-[#ffffee]'
            }`}
          >
            Leyendo ({librosLeyendo.length})
          </button>
          <button
            onClick={() => { setTabEstanteria('quiero'); setMostrarBuscadorOL(false); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              tabEstanteria === 'quiero'
                ? 'bg-[#23211e] text-[#ffffee]'
                : 'bg-white text-[#75706b] border border-[#e8e4d9] hover:bg-[#ffffee]'
            }`}
          >
            Quiero leer ({librosQuiero.length})
          </button>
          <button
            onClick={() => { setTabEstanteria('leidos'); setMostrarBuscadorOL(false); }}
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
          {tabEstanteria === 'leyendo' && librosLeyendo.map((lib, idx) => renderizarTarjetaLibro(lib, idx))}
          {tabEstanteria === 'quiero' && librosQuiero.map((lib, idx) => renderizarTarjetaLibro(lib, idx))}
          {tabEstanteria === 'leidos' && librosLeidos.map((lib, idx) => renderizarTarjetaLibro(lib, idx))}
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