import { useState } from 'react';

export default function TimelineCapitulos({
  capitulos,
  miPagina,
  comentarios,
  modalidadLimpia,
  obtenerNombreReal,
  sesion,
  nombreUsuarioPersonalizado,
  supabase,
  cargarDatosSupabase,
  registrarActividadPresencia,
  mostrarToast
}) {
  const [capituloSeleccionado, setCapituloSeleccionado] = useState(null);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [respuestaA, setRespuestaA] = useState(null);
  const [textoRespuesta, setTextoRespuesta] = useState('');

  const esRestringida = modalidadLimpia.includes('cotilla');

  // 1. Ordenar capítulos por su página final
  const listaCapitulos = [...capitulos].sort((a, b) => (Number(a.pagina_fin) || 0) - (Number(b.pagina_fin) || 0));

  // 2. Definir capítulo activo
  const capActivo = capituloSeleccionado || listaCapitulos[0] || { id: 1, numero: 1, titulo: 'Parte I', pagina_fin: 156 };

  // 3. Lógica Antispoiler:
  // Un capítulo está desbloqueado si la página actual de la usuaria es mayor o igual a la página fin del capítulo ANTERIOR.
  const idxActivo = listaCapitulos.findIndex(c => (c.id || c.numero) === (capActivo.id || capActivo.numero));
  const capAnterior = idxActivo > 0 ? listaCapitulos[idxActivo - 1] : null;
  const paginaCorteAntispoiler = capAnterior ? Number(capAnterior.pagina_fin) : 0;
  
  // El capítulo actual está desbloqueado si la usuaria ha llegado a la página de inicio de ese bloque
  const estaCapituloDesbloqueado = Number(miPagina) >= paginaCorteAntispoiler;

  // 4. Comentarios del capítulo activo
  const comentariosCap = comentarios.filter(c => String(c.capitulo_id || c.capitulo) === String(capActivo.id || capActivo.numero));
  const comentariosPrincipales = comentariosCap.filter(c => !c.parent_id);

  const enviarComentario = async (parentId = null, texto = '') => {
    const contenido = texto.trim();
    if (!contenido || !sesion?.email) return;

    const payload = {
      capitulo_id: capActivo.id || capActivo.numero,
      capitulo: capActivo.numero || capActivo.id,
      email: sesion.email,
      nombre: nombreUsuarioPersonalizado || sesion.nombre,
      comentario: contenido,
      parent_id: parentId,
      timestamp: new Date().toISOString()
    };

    await supabase.from('comments').insert([payload]);
    await cargarDatosSupabase();
    if (parentId) {
      setRespuestaA(null);
      setTextoRespuesta('');
    } else {
      setNuevoComentario('');
    }
    mostrarToast('Anotación guardada.');
  };

  return (
    <div className="space-y-5 fade-in" onClick={registrarActividadPresencia}>
      {/* Selector de capítulos (Timeline horizontal) */}
      <section className="editorial-card p-4 space-y-3">
        <h2 className="font-babydoll text-2xl font-bold text-[#23211e]">Capítulos</h2>
        <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar font-sans">
          {listaCapitulos.map((cap, index) => {
            const capPrev = index > 0 ? listaCapitulos[index - 1] : null;
            const minPagina = capPrev ? Number(capPrev.pagina_fin) : 0;
            const desbloqueado = Number(miPagina) >= minPagina;
            const esSeleccionado = (capActivo.id || capActivo.numero) === (cap.id || cap.numero);

            return (
              <button
                key={cap.id || cap.numero}
                onClick={() => setCapituloSeleccionado(cap)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium shrink-0 transition-all text-left min-h-[44px] active:scale-95 transition-transform duration-100 ${
                  esSeleccionado
                    ? 'bg-[#23211e] text-[#ffffee]'
                    : desbloqueado
                    ? 'bg-white border border-[#e8e4d9] text-[#23211e] hover:bg-[#ffffee]'
                    : 'bg-[#ffffee]/40 border border-[#e8e4d9] text-[#75706b] opacity-60'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="block font-bold">{cap.titulo || `Parte ${index + 1}`}</span>
                  {!desbloqueado && <i className="fa-solid fa-lock text-[10px] opacity-70"></i>}
                </div>
                <span className="block text-[10px] opacity-80">hasta pág. {cap.pagina_fin}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Detalle del capítulo activo */}
      <section className="editorial-card p-5 space-y-4">
        <div className="border-b border-[#e8e4d9] pb-3">
          <p className="text-[10px] uppercase font-sans text-[#75706b]">{capActivo.titulo}</p>
          <h1 className="font-babydoll text-2xl font-bold text-[#23211e] mt-0.5">{capActivo.descripcion || capActivo.titulo}</h1>
          <p className="text-xs text-[#75706b] font-sans mt-1">Hasta la página {capActivo.pagina_fin}</p>
        </div>

        {/* Anotaciones al margen */}
        <div className="space-y-4">
          <h3 className="font-babydoll text-xl font-bold text-[#23211e]">Anotaciones al margen</h3>

          {!estaCapituloDesbloqueado ? (
            /* Pantalla de bloqueo Antispoiler */
            <div className="p-5 bg-[#ffffee] rounded-xl border border-[#e8e4d9] text-center space-y-2 font-sans">
              <div className="w-10 h-10 rounded-full bg-[#23211e] text-[#ffffee] flex items-center justify-center mx-auto text-sm font-bold">
                <i className="fa-solid fa-lock"></i>
              </div>
              <h4 className="font-babydoll text-lg font-bold text-[#23211e]">Zona protegida contra spoilers</h4>
              <p className="text-xs text-[#75706b] leading-relaxed max-w-xs mx-auto">
                Vas por la página <b>{miPagina}</b>. Para desbloquear las notas de {capActivo.titulo}, necesitas alcanzar al menos la página <b>{paginaCorteAntispoiler + 1}</b>.
              </p>
            </div>
          ) : (
            <>
              {/* Formulario nuevo comentario principal */}
              {!esRestringida ? (
                <form onSubmit={(e) => { e.preventDefault(); enviarComentario(null, nuevoComentario); }} className="space-y-2">
                  <textarea
                    value={nuevoComentario}
                    onChange={(e) => setNuevoComentario(e.target.value)}
                    id="chapter-note-input" name="chapterNote" autoComplete="off" placeholder="Escribe tu reflexión o nota sobre esta parte..."
                    className="w-full editorial-input p-3 text-xs h-20 resize-none font-sans"
                  />
                  <button type="submit" className="editorial-btn px-4 py-2 text-xs font-medium active:scale-95 transition-transform duration-100">
                    Publicar nota
                  </button>
                </form>
              ) : (
                <p className="text-xs text-[#75706b] font-sans italic bg-[#ffffee] p-3 rounded-xl border border-[#e8e4d9]">
                  Tu membresía permite leer las notas del club.
                </p>
              )}

              {/* Lista de comentarios */}
              <div className="space-y-3 pt-2">
                {comentariosPrincipales.length === 0 ? (
                  <p className="text-xs text-[#75706b] font-sans italic py-4 text-center">
                    Aún no hay notas en este bloque. Sé la primera gilda en escribir.
                  </p>
                ) : (
                  comentariosPrincipales.map(comentario => {
                    const nombreAutor = obtenerNombreReal(comentario.email, comentario.nombre);
                    const respuestas = comentariosCap.filter(r => String(r.parent_id) === String(comentario.id));

                    return (
                      <article key={comentario.id} className="p-3.5 rounded-xl bg-white border border-[#e8e4d9] space-y-2">
                        <div className="flex justify-between items-baseline font-sans">
                          <span className="font-bold text-xs text-[#23211e]">{nombreAutor}</span>
                          <span className="text-[10px] text-[#75706b]">
                            {comentario.timestamp ? new Date(comentario.timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : ''}
                          </span>
                        </div>

                        <p className="text-xs text-[#23211e] font-sans leading-relaxed">{comentario.comentario || comentario.texto}</p>

                        {!esRestringida && (
                          <button
                            onClick={() => setRespuestaA(respuestaA === comentario.id ? null : comentario.id)}
                            className="text-[11px] font-sans font-medium text-[#75706b] hover:text-[#23211e] transition-colors pt-1 active:scale-95 transition-transform duration-100"
                          >
                            {respuestaA === comentario.id ? 'Cancelar' : 'Responder'}
                          </button>
                        )}

                        {respuestaA === comentario.id && (
                          <div className="pt-2 pl-3 border-l-2 border-[#23211e] space-y-2 mt-2">
                            <textarea
                              value={textoRespuesta}
                              onChange={(e) => setTextoRespuesta(e.target.value)}
                              placeholder={`Responder a ${nombreAutor}...`}
                              className="w-full editorial-input p-2 text-xs h-16 resize-none font-sans"
                            />
                            <button
                              type="button"
                              onClick={() => enviarComentario(comentario.id, textoRespuesta)}
                              className="editorial-btn px-3 py-1.5 text-xs font-medium active:scale-95 transition-transform duration-100"
                            >
                              Enviar respuesta
                            </button>
                          </div>
                        )}

                        {respuestas.length > 0 && (
                          <div className="pl-3 mt-3 border-l border-[#e8e4d9] space-y-2.5 pt-1">
                            {respuestas.map(resp => {
                              const nombreAutorResp = obtenerNombreReal(resp.email, resp.nombre);
                              return (
                                <div key={resp.id} className="bg-[#ffffee]/50 p-2.5 rounded-lg border border-[#e8e4d9] space-y-1">
                                  <div className="flex justify-between items-baseline font-sans">
                                    <span className="font-bold text-[11px] text-[#23211e]">{nombreAutorResp}</span>
                                    <span className="text-[9px] text-[#75706b]">
                                      {resp.timestamp ? new Date(resp.timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : ''}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[#23211e] font-sans leading-relaxed">{resp.comentario || resp.texto}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </article>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}