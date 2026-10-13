import { useState } from 'react';
import PortadaLibro from '../PortadaLibro';
import BuscadorLibros from '../BuscadorLibros';
import { LomoLibroEstanteria } from './DecoracionesHabitacion';

export default function SeccionHabitacion({
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

        <div className="mt-5 grid grid-cols-2 border-t border-[#e8e4d9] pt-3">
          <div>
            <p className="text-[10px] text-[#75706b] font-sans uppercase">Libros en la balda</p>
            <p className="font-babydoll text-2xl font-bold text-[#23211e]">{todosMisLibrosEstanteria.length}</p>
          </div>
          <div className="border-l border-[#e8e4d9] pl-4">
            <p className="text-[10px] text-[#75706b] font-sans uppercase">Página actual</p>
            <p className="font-babydoll text-2xl font-bold text-[#23211e]">{miPagina}</p>
          </div>
        </div>
      </section>

      {/* Lectura del Club */}
      <section className="editorial-card p-4 flex items-center gap-4">
        <div className="w-14 h-20 shrink-0 overflow-hidden rounded border border-[#e8e4d9] bg-[#ffffee]">
          <PortadaLibro titulo={libroActual.titulo} autora={libroActual.autora} portada={libroActual.portada} size="story" />
        </div>
        <div className="min-w-0 flex-grow">
          <p className="text-[10px] font-medium text-[#75706b] font-sans uppercase">Lectura del club</p>
          <h2 className="font-babydoll text-xl font-bold text-[#23211e] leading-snug line-clamp-1">{libroActual.titulo}</h2>
          <p className="text-xs text-[#75706b] italic font-sans truncate">{libroActual.autora}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-grow rounded-full bg-[#e8e4d9] overflow-hidden">
              <div className="h-full rounded-full bg-[#23211e]" style={{ width: `${porcentajeLibro}%` }}></div>
            </div>
            <span className="text-[10px] font-bold text-[#75706b] font-sans">{porcentajeLibro}%</span>
          </div>
        </div>
      </section>

      {/* Foto de Perfil */}
      <div className="editorial-card p-3.5 flex items-center gap-3">
        <AvatarUsuaria foto={fotoPerfilPersonalizada} nombre={nombreUsuarioPersonalizado || sesion?.nombre} sizeClass="w-10 h-10" textClass="text-base" editable={true} onFotoChange={handleFotoPerfilUpdate} />
        <div className="flex flex-col text-xs font-sans">
          <span className="font-bold text-[#23211e]">Foto de perfil</span>
          <span className="text-[11px] text-[#75706b]">Toca para cambiar tu imagen</span>
        </div>
      </div>

      {/* Estantería */}
      <section className="editorial-card p-4 sm:p-5 space-y-4">
        <div className="flex items-baseline justify-between border-b border-[#e8e4d9] pb-2">
          <h2 className="font-babydoll text-2xl font-bold text-[#23211e]">Estantería</h2>
          <span className="text-xs text-[#75706b] font-sans">{todosMisLibrosEstanteria.length} {todosMisLibrosEstanteria.length === 1 ? 'libro' : 'libros'}</span>
        </div>

        <div className="pt-4 pb-6 px-3 estanteria-madera min-h-[200px] flex items-end justify-between overflow-x-auto">
          <div className="flex items-end justify-start gap-3 flex-grow">
            {todosMisLibrosEstanteria.length === 0 ? (
              <div className="w-full flex flex-col items-center justify-center py-8 text-center">
                <p className="font-babydoll text-lg font-bold text-[#23211e]">Tu balda está vacía</p>
                <p className="text-xs text-[#75706b] font-sans italic mb-3">Añade tu primera lectura para verla aquí</p>
                <button type="button" onClick={() => setModoCreacionManual(true)} className="editorial-btn px-3 py-1.5 text-xs font-medium min-h-[44px]">Añadir libro</button>
              </div>
            ) : (
              todosMisLibrosEstanteria.map((item, idx) => (
                <LomoLibroEstanteria key={idx} item={item} onClick={() => setLibroSeleccionadoDetalle(item)} />
              ))
            )}
          </div>
        </div>

        {/* Pestañas de estado de lectura y Buscador */}
        <div className="pt-3 border-t border-[#e8e4d9] space-y-3">
          <div className="flex bg-[#ffffee] p-1 rounded-lg text-xs font-medium text-center border border-[#e8e4d9] font-sans">
            <button onClick={() => setTabEstanteria('leyendo')} className={`flex-1 py-1.5 rounded transition-all min-h-[44px] ${tabEstanteria === 'leyendo' ? 'bg-[#23211e] text-[#ffffee]' : 'text-[#75706b]'}`}>Leyendo</button>
            <button onClick={() => setTabEstanteria('want_to_read')} className={`flex-1 py-1.5 rounded transition-all min-h-[44px] ${tabEstanteria === 'want_to_read' ? 'bg-[#23211e] text-[#ffffee]' : 'text-[#75706b]'}`}>Quiero leer</button>
            <button onClick={() => setTabEstanteria('leidos')} className={`flex-1 py-1.5 rounded transition-all min-h-[44px] ${tabEstanteria === 'leidos' ? 'bg-[#23211e] text-[#ffffee]' : 'text-[#75706b]'}`}>Leídos</button>
          </div>

          {modoCreacionManual ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!manualTitulo.trim()) return;
              guardarLibroPersonal(manualTitulo, paginaPersonalInput, tabEstanteria, manualAutora, manualPortada);
              setManualTitulo(''); setManualAutora(''); setManualPortada(''); setPaginaPersonalInput(''); setModoCreacionManual(false);
            }} className="space-y-2 bg-[#ffffee]/50 p-3 rounded-xl border border-[#e8e4d9]">
              <p className="text-xs font-bold font-sans text-[#23211e]">Añadir libro manualmente:</p>
              <input type="text" placeholder="Título..." value={manualTitulo} onChange={(e) => setManualTitulo(e.target.value)} required className="w-full editorial-input p-2 text-xs" />
              <input type="text" placeholder="Autora..." value={manualAutora} onChange={(e) => setManualAutora(e.target.value)} className="w-full editorial-input p-2 text-xs" />
              <input type="text" placeholder="Portada (URL)..." value={manualPortada} onChange={(e) => setManualPortada(e.target.value)} className="w-full editorial-input p-2 text-xs" />
              {tabEstanteria === 'leyendo' && <input type="number" placeholder="Página actual..." value={paginaPersonalInput} onChange={(e) => setPaginaPersonalInput(e.target.value)} className="w-full editorial-input p-2 text-xs" />}
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 editorial-btn py-1.5 text-xs min-h-[44px]">Guardar</button>
                <button type="button" onClick={() => setModoCreacionManual(false)} className="flex-1 bg-white border border-[#e8e4d9] py-1.5 rounded-lg text-xs text-[#75706b] min-h-[44px]">Cancelar</button>
              </div>
            </form>
          ) : (
            <div className="space-y-2 bg-[#ffffee]/50 p-3 rounded-xl border border-[#e8e4d9]">
              <BuscadorLibros placeholder="Buscar libro..." valor={libroPersonalInput} setValor={setLibroPersonalInput} onSelectLibro={(l) => { setLibroPersonalInput(l.titulo); guardarLibroPersonal(l.titulo, 0, tabEstanteria, l.autora, l.portada); setLibroPersonalInput(''); }} />
              <div className="flex justify-between items-center pt-1 font-sans">
                <span className="text-xs text-[#75706b]">¿No lo encuentras?</span>
                <button type="button" onClick={() => setModoCreacionManual(true)} className="text-xs text-[#23211e] font-bold hover:underline min-h-[44px] flex items-center">+ Crear manualmente</button>
              </div>
            </div>
          )}
        </div>

        {/* Lista de Biblioteca */}
        <div className="pt-3 border-t border-[#e8e4d9] space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-babydoll text-xl font-bold text-[#23211e]">Biblioteca</h3>
            <span className="text-xs text-[#75706b] font-sans">{librosBibliotecaVisibles.length} {librosBibliotecaVisibles.length === 1 ? 'libro' : 'libros'}</span>
          </div>
          {librosBibliotecaVisibles.length === 0 ? (
            <div className="p-4 text-center bg-[#ffffee]/30 rounded-xl border border-[#e8e4d9] my-2">
              <p className="font-babydoll text-base font-bold text-[#23211e]">Sin libros en esta lista</p>
              <p className="text-xs text-[#75706b] italic font-sans mt-0.5">Usa el buscador para añadir tu primer título.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#e8e4d9]">
              {librosBibliotecaVisibles.map((item, idx) => (
                <button
                  key={`${item.libro || item.titulo}-${idx}`}
                  type="button"
                  onClick={() => setLibroSeleccionadoDetalle(item)}
                  className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-[#ffffee]/50 transition-colors min-h-[44px]"
                >
                  <PortadaLibro titulo={item.libro || item.titulo} autora={item.autora} portada={item.portada} size="thumb" />
                  <span className="min-w-0 flex-grow">
                    <span className="block truncate font-babydoll text-base font-bold text-[#23211e]">{item.libro || item.titulo}</span>
                    <span className="block truncate text-xs italic text-[#75706b] font-sans">{item.autora || 'Autora no especificada'}</span>
                  </span>
                  <span className="shrink-0 text-right text-[11px] font-sans text-[#75706b]">
                    <span className="block">pág. {item.pagina || item.paginas || 0}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}