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
  const [textoComentario, setTextoComentario] = useState({});
  const [respondiendoA, setRespondiendoA] = useState(null);
  const [textoRespuesta, setTextoRespuesta] = useState({});

  return (
    <div className="space-y-6 fade-in">
      <div className="text-center pb-2 border-b border-[#e6e4dc]">
        <h2 className="font-babydoll text-3xl font-bold text-[#1c1c1a]">línea de tiempo</h2>
        <p className="text-xs text-[#595750] font-sans italic">tu viaje de lectura capítulo a capítulo</p>
      </div>

      <div className="relative border-l-2 border-[#3d4220]/30 ml-4 pl-6 space-y-6 my-4">
        {capitulos.map((cap, i) => {
          if (['oculto', 'borrador'].includes(String(cap.estado || '').toLowerCase())) return null;
          const paginaMinima = Number(cap.pagina_fin || cap.pagina_bloqueo || cap.pagina || cap.paginaminima || 0);
          const desbloqueado = miPagina >= paginaMinima;
          const identificadorCap = String(cap.id || cap.titulo || '').trim().toLowerCase();
          const comentariosCapitulo = comentarios.filter(c => {
            const cCap = String(c.capitulo || '').trim().toLowerCase();
            const padreId = String(c.parent_id || '').trim();
            const esPrincipal = !padreId || padreId === '' || padreId === 'undefined';
            const coincide = !cCap || cCap === identificadorCap || cCap.includes(String(i + 1));
            return coincide && esPrincipal;
          });

          return (
            <div key={i} className="relative group">
              <div className={`absolute -left-[35px] top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shadow-xs transition-all ${
                desbloqueado 
                  ? 'bg-[#3d4220] border-white text-white scale-110' 
                  : 'bg-[#e6e4dc] border-[#d4cfbc] text-[#595750]'
              }`}>
                {desbloqueado ? (i + 1) : <i className="fa-solid fa-lock text-[8px]"></i>}
              </div>

              <div className={`editorial-card p-5 space-y-4 transition-all ${!desbloqueado ? 'opacity-85 bg-[#faf9f5]' : ''}`} onClick={registrarActividadPresencia}>
                <div className="flex justify-between items-center">
                  <h3 className="font-babydoll text-2xl font-bold text-[#1c1c1a]">{cap.titulo}</h3>
                  <span className="text-xs text-[#595750] font-sans font-semibold">pág. {paginaMinima}</span>
                </div>

                {desbloqueado ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line font-sans text-left">{cap.descripcion || cap.contenido}</p>
                    <div className="pt-4 border-t border-[#e6e4dc] space-y-3">
                      <h4 className="font-babydoll text-base font-bold">Comentarios de lectoras</h4>
                      <div className="space-y-3">
                        {comentariosCapitulo.length === 0 ? (
                          <p className="text-xs text-[#595750] italic font-sans">Aún no hay comentarios. ¡Sé la primera!</p>
                        ) : (
                          comentariosCapitulo.map((com, cIdx) => {
                            const idComentario = String(com.id || '').trim();
                            const respuestasCom = comentarios.filter(r => String(r.parent_id || '').trim() === idComentario);
                            const nombreAutorComentario = obtenerNombreReal(com.autora, com.autora);

                            return (
                              <div key={cIdx} className="bg-[#ffffee] p-3 rounded-xl border border-[#e6e4dc] text-xs space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold font-sans text-[#3d4220]">{nombreAutorComentario}</span>
                                  <span className="text-[10px] text-[#595750]">{com.fecha || ''}</span>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-800 leading-relaxed font-sans text-left">{com.texto || ''}</p>
                                {!modalidadLimpia.includes('cotilla') && (
                                  <div className="flex justify-end">
                                    <button onClick={() => setRespondiendoA(respondiendoA === idComentario ? null : idComentario)} className="text-xs text-[#3d4220] font-bold hover:underline min-h-[44px]">
                                      {respondiendoA === idComentario ? 'Cancelar' : 'Responder'}
                                    </button>
                                  </div>
                                )}
                                {respuestasCom.length > 0 && (
                                  <div className="pl-3 mt-2 border-l-2 border-[#d4cfbc] space-y-2">
                                    {respuestasCom.map((resp, rIdx) => (
                                      <div key={rIdx} className="bg-white p-2 rounded-lg border border-[#e6e4dc] text-xs space-y-1">
                                        <div className="flex justify-between items-center">
                                          <span className="font-bold text-[#3d4220]">{obtenerNombreReal(resp.autora, resp.autora)}</span>
                                          <span className="text-[10px] text-[#595750]">{resp.fecha || ''}</span>
                                        </div>
                                        <p className="text-xs sm:text-sm text-gray-800 leading-relaxed font-sans text-left">{resp.texto || ''}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {respondiendoA === idComentario && !modalidadLimpia.includes('cotilla') && (
                                  <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const txtResp = textoRespuesta[idComentario];
                                    if (!txtResp || !txtResp.trim()) return;
                                    const nuevaRespObj = { capitulo: identificadorCap, parent_id: idComentario, autora: nombreUsuarioPersonalizado || sesion.nombre, texto: txtResp, fecha: 'Justo ahora', email: sesion.email };
                                    await supabase.from('comments').insert([nuevaRespObj]);
                                    await cargarDatosSupabase();
                                    registrarActividadPresencia();
                                    setTextoRespuesta({ ...textoRespuesta, [idComentario]: '' });
                                    setRespondiendoA(null);
                                    mostrarToast('Respuesta enviada');
                                  }} className="flex gap-2 pt-2">
                                    <input type="text" placeholder="Responde..." value={textoRespuesta[idComentario] || ''} onChange={(e) => setTextoRespuesta({ ...textoRespuesta, [idComentario]: e.target.value })} className="flex-grow editorial-input px-2.5 py-1.5 text-xs bg-white" />
                                    <button type="submit" className="editorial-btn px-2.5 py-1 text-xs min-h-[44px]">Enviar</button>
                                  </form>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      {!modalidadLimpia.includes('cotilla') && (
                        <form onSubmit={async (e) => {
                          e.preventDefault();
                          const clave = cap.id || cap.titulo;
                          const txt = textoComentario[clave];
                          if (!txt || !txt.trim()) return;
                          const nuevoCom = { capitulo: identificadorCap, parent_id: '', autora: nombreUsuarioPersonalizado || sesion.nombre, texto: txt, fecha: 'Justo ahora', email: sesion.email };
                          await supabase.from('comments').insert([nuevoCom]);
                          await cargarDatosSupabase();
                          registrarActividadPresencia();
                          setTextoComentario({ ...textoComentario, [clave]: '' });
                          mostrarToast('Comentario enviado');
                        }} className="flex gap-2 pt-1">
                          <input type="text" placeholder="Escribe tu reflexión..." value={textoComentario[cap.id || cap.titulo] || ''} onChange={(e) => setTextoComentario({ ...textoComentario, [cap.id || cap.titulo]: e.target.value })} className="flex-grow editorial-input px-3 py-2 text-xs" />
                          <button type="submit" className="editorial-btn px-3 text-xs min-h-[44px]">Comentar</button>
                        </form>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-[#ffffee] border border-[#e6e4dc] rounded-xl text-center space-y-1">
                    <i className="fa-solid fa-lock text-[#595750] text-xs"></i>
                    <p className="text-xs text-[#595750] font-sans">Capítulo bloqueado hasta alcanzar la pág. <b>{paginaMinima}</b> (vas por la {miPagina}).</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}