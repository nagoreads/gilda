import { useState } from 'react';
import PortadaLibro from '../PortadaLibro';
import BuscadorLibros from '../BuscadorLibros';
import { LomoLibroEstanteria, ObjetoExternoEnmarcado, IlustracionDecoracion } from './DecoracionesHabitacion';

export default function SeccionHabitacion({
  sesion,
  miPagina,
  libroActual,
  porcentajeLibro,
  todosMisLibrosEstanteria,
  librosBibliotecaVisibles,
  objetosPersonalizados,
  setObjetosPersonalizados,
  decoracionActual,
  setDecoracionActual,
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
  setObjetoActivoParaImportar,
  setModalImportarAbierto,
  registrarActividadPresencia,
  mostrarToast,
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
      {/* Banner Principal de la Habitación */}
      <section className="rounded-2xl border border-[#d0ceeb] bg-[#eeeeff]/70 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase text-[#3f4268] font-sans">tu rincón de lectura</p>
            <h1 className="font-babydoll text-3xl sm:text-4xl font-bold text-[#23211e] leading-tight">Mi habitación</h1>
            <p className="mt-1 text-xs text-[#625f6e] font-sans">Un espacio propio para tus libros y lecturas.</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <button
              onClick={() => setMostrarModalShare(true)}
              className="px-3 py-2 text-xs rounded-xl font-bold font-sans bg-white/90 text-[#3f4268] border border-[#d0ceeb] shadow-xs hover:bg-[#eeeeff] flex items-center gap-1.5 transition-colors min-h-[44px]"
            >
              <i className="fa-brands fa-instagram text-xs"></i> Compartir
            </button>
            <button
              onClick={() => {
                const nuevo = !isReadingNow;
                setIsReadingNow(nuevo);
                safeSet('gilda_is_reading', nuevo);
                registrarActividadPresencia();
              }}
              className={`px-3 py-2 text-xs rounded-xl font-bold font-sans border transition-colors flex items-center gap-1.5 min-h-[44px] ${
                isReadingNow
                  ? 'bg-[var(--primary-olive)] border-[var(--primary-olive)] text-[#ffffee]'
                  : 'bg-white/90 border-[#d0ceeb] text-[#625f6e] hover:bg-[#eeeeff]'
              }`}
            >
              <i className={`fa-solid ${isReadingNow ? 'fa-book-open' : 'fa-book'} text-[10px]`}></i>
              {isReadingNow ? 'Leyendo ahora' : 'En pausa'}
            </button>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 border-t border-[#d0ceeb] pt-3">
          <div>
            <p className="text-[9px] uppercase text-[#625f6e] font-sans">mis libros</p>
            <p className="font-babydoll text-lg font-bold text-[#23211e]">{todosMisLibrosEstanteria.length}</p>
          </div>
          <div className="border-l border-[#d0ceeb] pl-3">
            <p className="text-[9px] uppercase text-[#625f6e] font-sans">marcos</p>
            <p className="font-babydoll text-lg font-bold text-[#23211e]">{objetosPersonalizados.length}</p>
          </div>
          <div className="border-l border-[#d0ceeb] pl-3">
            <p className="text-[9px] uppercase text-[#625f6e] font-sans">página</p>
            <p className="font-babydoll text-lg font-bold text-[#23211e]">{miPagina}</p>
          </div>
        </div>
      </section>

      {/* Lectura Activa del Club */}
      <section className="editorial-card p-4 sm:p-5 flex items-center gap-4">
        <div className="w-16 h-24 shrink-0 overflow-hidden rounded shadow-xs border border-[#e8e4d9] bg-[#ffffee]">
          <PortadaLibro titulo={libroActual.titulo} autora={libroActual.autora} portada={libroActual.portada} size="story" />
        </div>
        <div className="min-w-0 flex-grow">
          <p className="text-[10px] uppercase font-bold text-[#3f4268] font-sans">lectura del club</p>
          <h2 className="font-babydoll text-lg font-bold text-[#23211e] leading-snug line-clamp-2">{libroActual.titulo}</h2>
          <p className="text-xs text-[#625f6e] italic font-sans truncate">{libroActual.autora}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-grow rounded-full bg-[#e8e4d9] overflow-hidden">
              <div className="h-full rounded-full bg-[var(--primary-olive)]" style={{ width: `${porcentajeLibro}%` }}></div>
            </div>
            <span className="text-[10px] font-bold text-[#625f6e] font-sans">{porcentajeLibro}%</span>
          </div>
        </div>
        <div className="shrink-0 text-right pl-2 border-l border-[#e8e4d9]">
          <p className="text-[9px] uppercase text-[#625f6e] font-sans">página</p>
          <p className="font-babydoll text-lg font-bold text-[#23211e]">{miPagina}</p>
        </div>
      </section>

      {/* Ajustes Rápidos en tarjetas lavanda */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="editorial-card-lavender p-3 flex items-center gap-3">
          <AvatarUsuaria foto={fotoPerfilPersonalizada} nombre={nombreUsuarioPersonalizado || sesion?.nombre} sizeClass="w-12 h-12" textClass="text-xl" editable={true} onFotoChange={handleFotoPerfilUpdate} />
          <div className="flex flex-col text-xs font-sans">
            <span className="font-bold text-[#23211e]">Foto de perfil</span>
            <span className="text-xs text-[#625f6e]">Haz clic para subir imagen</span>
          </div>
        </div>

        <div className="editorial-card-lavender p-3 flex flex-col justify-center gap-2">
          <label htmlFor="room-decoration" className="text-xs font-bold text-[#23211e] font-sans">Ambiente de la balda</label>
          <select id="room-decoration" value={decoracionActual} onChange={(e) => { setDecoracionActual(e.target.value); safeSet('gilda_decoracion', e.target.value); registrarActividadPresencia(); }} className="editorial-input w-full text-xs px-2.5 py-2 bg-white font-sans font-semibold">
            <option value="monstera">Plantita Monstera</option>
            <option value="maceta">Maceta Cerámica</option>
            <option value="vela">Vela Aromática</option>
            <option value="cafe">Taza de Café</option>
            <option value="cactus">Pequeño Cactus</option>
            <option value="auriculares">Auriculares Crema</option>
            <option value="tocadiscos">Tocadiscos Vintage</option>
            <option value="camara">Cámara Analógica</option>
            <option value="lampara">Lámpara de Lectura</option>
            <option value="ninguna">Sin decoración</option>
          </select>
        </div>
      </div>

      {/* Estantería de Madera */}
      <section className="editorial-card p-4 sm:p-5 space-y-4">
        <div className="flex items-end justify-between gap-3 border-b border-[#e8e4d9] pb-2">
          <div>
            <p className="text-[9px] uppercase font-bold text-[#3f4268] font-sans">colección personal</p>
            <h2 className="font-babydoll text-xl font-bold text-[#23211e]">Estantería</h2>
          </div>
          <span className="text-[10px] font-bold text-[#625f6e] font-sans text-right">{todosMisLibrosEstanteria.length} libros · {objetosPersonalizados.length} marcos</span>
        </div>

        <div className="pt-4 pb-6 px-3 estanteria-madera min-h-[225px] flex items-end justify-between overflow-x-auto">
          <div className="flex items-end justify-start gap-3.5 flex-grow">
            {todosMisLibrosEstanteria.length === 0 && objetosPersonalizados.length === 0 ? (
              <div className="w-full flex flex-col items-center justify-center py-8 text-center">
                <i className="fa-solid fa-book-bookmark text-2xl text-[#3f4268]/40 mb-2"></i>
                <p className="font-babydoll text-sm font-bold text-[#23211e]">Tu balda está descansando</p>
                <p className="text-[11px] text-[#625f6e] font-sans italic mb-3">Añade tu primera lectura o marco a la colección</p>
                <button type="button" onClick={() => setModoCreacionManual(true)} className="editorial-btn px-3 py-2 text-xs font-semibold min-h-[44px]">+ Añadir primer libro</button>
              </div>
            ) : (
              <>
                {todosMisLibrosEstanteria.map((item, idx) => (
                  <LomoLibroEstanteria key={idx} item={item} onClick={() => setLibroSeleccionadoDetalle(item)} />
                ))}
                {objetosPersonalizados.map(obj => (
                  <ObjetoExternoEnmarcado key={obj.id} urlImagen={obj.url} titulo={obj.titulo} onClick={() => { setObjetoActivoParaImportar(obj.id); setModalImportarAbierto(true); }} />
                ))}
                <button onClick={() => {
                  const nuevoId = `pin-${Date.now()}`;
                  const actualizado = [...objetosPersonalizados, { id: nuevoId, url: null, titulo: 'Nuevo pin' }];
                  setObjetosPersonalizados(actualizado);
                  safeSet('gilda_objetos_personalizados', actualizado);
                  mostrarToast('Nuevo marco añadido');
                }} className="shrink-0 border-[1.5px] border-dashed border-[#3f4268] rounded-sm bg-[#eeeeff]/70 hover:bg-[#eeeeff] w-12 h-20 flex flex-col items-center justify-center text-[#3f4268] text-[10px] transition font-sans" title="Añadir marco">
                  <i className="fa-solid fa-plus text-xs mb-1"></i>
                  <span>Marco</span>
                </button>
              </>
            )}
          </div>
          {decoracionActual !== 'ninguna' && (
            <div className="shrink-0 pl-3 pb-1 flex items-end select-none">
              <IlustracionDecoracion tipo={decoracionActual} onInteractuar={(t) => setDecoracionActual(t)} />
            </div>
          )}
        </div>

        {/* Pestañas de estado de lectura y Buscador */}
        <div className="pt-4 border-t border-[#e8e4d9] space-y-3">
          <div className="flex bg-[#eeeeff]/70 p-1 rounded-xl text-xs font-semibold text-center border border-[#d0ceeb] font-sans">
            <button onClick={() => setTabEstanteria('leyendo')} className={`flex-1 py-2 rounded-lg transition-all min-h-[44px] ${tabEstanteria === 'leyendo' ? 'bg-[var(--primary-olive)] text-[#ffffee] shadow-xs' : 'text-[#625f6e] hover:text-[#23211e]'}`}>Leyendo</button>
            <button onClick={() => setTabEstanteria('want_to_read')} className={`flex-1 py-2 rounded-lg transition-all min-h-[44px] ${tabEstanteria === 'want_to_read' ? 'bg-[var(--primary-olive)] text-[#ffffee] shadow-xs' : 'text-[#625f6e] hover:text-[#23211e]'}`}>Quiero leer</button>
            <button onClick={() => setTabEstanteria('leidos')} className={`flex-1 py-2 rounded-lg transition-all min-h-[44px] ${tabEstanteria === 'leidos' ? 'bg-[var(--primary-olive)] text-[#ffffee] shadow-xs' : 'text-[#625f6e] hover:text-[#23211e]'}`}>Leídos</button>
          </div>

          {modoCreacionManual ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!manualTitulo.trim()) return;
              guardarLibroPersonal(manualTitulo, paginaPersonalInput, tabEstanteria, manualAutora, manualPortada);
              setManualTitulo(''); setManualAutora(''); setManualPortada(''); setPaginaPersonalInput(''); setModoCreacionManual(false);
            }} className="space-y-2 bg-[#eeeeff]/60 p-3 rounded-xl border border-[#d0ceeb]">
              <p className="text-xs font-bold font-sans text-[#3f4268]">Añadir libro manualmente:</p>
              <input type="text" placeholder="Título..." value={manualTitulo} onChange={(e) => setManualTitulo(e.target.value)} required className="w-full editorial-input p-2.5 text-xs" />
              <input type="text" placeholder="Autora..." value={manualAutora} onChange={(e) => setManualAutora(e.target.value)} className="w-full editorial-input p-2.5 text-xs" />
              <input type="text" placeholder="URL portada..." value={manualPortada} onChange={(e) => setManualPortada(e.target.value)} className="w-full editorial-input p-2.5 text-xs" />
              {tabEstanteria === 'leyendo' && <input type="number" placeholder="Página actual..." value={paginaPersonalInput} onChange={(e) => setPaginaPersonalInput(e.target.value)} className="w-full editorial-input p-2.5 text-xs" />}
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 editorial-btn py-2 text-xs min-h-[44px]">Guardar libro</button>
                <button type="button" onClick={() => setModoCreacionManual(false)} className="flex-1 bg-white border border-[#d0ceeb] py-2 rounded-xl text-xs text-[#3f4268] font-semibold min-h-[44px]">Cancelar</button>
              </div>
            </form>
          ) : (
            <div className="space-y-2 bg-[#eeeeff]/60 p-3 rounded-xl border border-[#d0ceeb]">
              <BuscadorLibros placeholder="Buscar libro..." valor={libroPersonalInput} setValor={setLibroPersonalInput} onSelectLibro={(l) => { setLibroPersonalInput(l.titulo); guardarLibroPersonal(l.titulo, 0, tabEstanteria, l.autora, l.portada); setLibroPersonalInput(''); }} />
              <div className="flex justify-between items-center pt-1 font-sans">
                <span className="text-xs text-[#625f6e]">¿No aparece?</span>
                <button type="button" onClick={() => setModoCreacionManual(true)} className="text-xs text-[var(--primary-olive)] font-bold hover:underline min-h-[44px] flex items-center">+ Crear manualmente</button>
              </div>
            </div>
          )}
        </div>

        {/* Lista de Biblioteca */}
        <div className="pt-3 border-t border-[#e8e4d9] space-y-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-babydoll text-base font-bold text-[#23211e]">Tu biblioteca</h3>
            <span className="text-[10px] font-bold text-[#625f6e] font-sans">{librosBibliotecaVisibles.length} {librosBibliotecaVisibles.length === 1 ? 'libro' : 'libros'}</span>
          </div>
          {librosBibliotecaVisibles.length === 0 ? (
            <div className="p-5 text-center bg-[#eeeeff]/50 rounded-xl border border-[#d0ceeb] my-2">
              <i className="fa-solid fa-feather-pointed text-xl text-[#3f4268]/40 mb-1"></i>
              <p className="font-babydoll text-sm font-bold text-[#23211e]">Sin libros en este estado</p>
              <p className="text-xs text-[#625f6e] italic font-sans mt-0.5">Añade un título desde el buscador superior.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#e8e4d9]">
              {librosBibliotecaVisibles.map((item, idx) => (
                <button
                  key={`${item.libro || item.titulo}-${idx}`}
                  type="button"
                  onClick={() => setLibroSeleccionadoDetalle(item)}
                  className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-[#eeeeff]/40 transition-colors min-h-[44px]"
                >
                  <PortadaLibro titulo={item.libro || item.titulo} autora={item.autora} portada={item.portada} size="thumb" />
                  <span className="min-w-0 flex-grow">
                    <span className="block truncate font-babydoll text-sm font-bold text-[#23211e]">{item.libro || item.titulo}</span>
                    <span className="block truncate text-[10px] italic text-[#625f6e] font-sans">{item.autora || 'Autora no especificada'}</span>
                  </span>
                  <span className="shrink-0 text-right text-[10px] font-sans text-[#625f6e]">
                    <span className="block">pág. {item.pagina || item.paginas || 0}</span>
                    <span className="block capitalize">{item.estado || 'leyendo'}</span>
                  </span>
                  <i className="fa-solid fa-chevron-right text-[9px] text-[#3f4268]/50"></i>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}