import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import MapaGilda from '../MapaGilda';
import BuscadorLibros from '../BuscadorLibros';
import PortadaLibro from '../PortadaLibro';

export default function SeccionComunidad({
  subTabComunidad,
  setSubTabComunidad,
  chatModo,
  setChatModo,
  destinatarioPrivado,
  setDestinatarioPrivado,
  usuariasClub,
  chatMsgs,
  cafecitos,
  propuestas,
  sesion,
  nombreUsuarioPersonalizado,
  supabase,
  cargarDatosSupabase,
  registrarActividadPresencia,
  mostrarToast,
  normalizarUbicacion,
  geocodificarUbicacion,
  formatearPais,
  formatearHoraWhatsApp,
  obtenerNombreReal,
  IndicadorPresencia,
  AvatarUsuaria
}) {
  const [nuevoChat, setNuevoChat] = useState('');
  const [mensajeRespuesta, setMensajeRespuesta] = useState(null);
  const [nuevoChatPrivado, setNuevoChatPrivado] = useState('');
  const [nuevaPropuestaTitulo, setNuevaPropuestaTitulo] = useState('');
  const [nuevaPropuestaAutora, setNuevaPropuestaAutora] = useState('');
  const [nuevaPropuestaPortada, setNuevaPropuestaPortada] = useState('');
  const [mensajeFundadora, setMensajeFundadora] = useState('');
  const chatEndRef = useRef(null);

  // Efecto unificado y optimizado para marcar mensajes privados como leídos sin duplicidades
  useEffect(() => {
    if (chatModo === 'privado' && destinatarioPrivado) {
      const emailSocia = (destinatarioPrivado.email || '').toLowerCase().trim();
      const miEmail = (sesion?.email || '').toLowerCase().trim();

      const unreadMsgs = chatMsgs.filter(m =>
        m.tipo === 'privado' &&
        (m.destinatario || '').toLowerCase().trim() === miEmail &&
        (m.remitente || m.email || '').toLowerCase().trim() === emailSocia &&
        !m.leido
      );

      if (unreadMsgs.length > 0) {
        const ids = unreadMsgs.map(m => m.id).filter(Boolean);
        if (ids.length > 0) {
          supabase.from('chat_messages').update({ leido: true }).in('id', ids).then(() => {
            if (typeof cargarDatosSupabase === 'function') cargarDatosSupabase();
          });
        }
      }
    }
  }, [chatModo, destinatarioPrivado, chatMsgs, sesion, supabase, cargarDatosSupabase]);

  // useLayoutEffect se ejecuta de forma síncrona ANTES de que el navegador pinte la pantalla,
  // evitando por completo el parpadeo y colocando el chat abajo del todo de forma instantánea.
  useLayoutEffect(() => {
    if (subTabComunidad === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [chatMsgs, chatModo, subTabComunidad, destinatarioPrivado]);

  const cantidadGildasEnLinea = usuariasClub.filter(u => {
    if (!u.ultima_conexion) return false;
    const diff = (new Date() - new Date(u.ultima_conexion)) / 1000 / 60;
    return diff < 3;
  }).length;

  const mensajesPrivadosNoLeidos = chatMsgs.filter(m => 
    m.tipo === 'privado' && 
    (m.destinatario || '').toLowerCase().trim() === (sesion?.email || '').toLowerCase().trim() && 
    !m.leido
  );
  const totalPrivadosNoLeidos = mensajesPrivadosNoLeidos.length;

  const votarCafecito = async (cafecito) => {
    const email = String(sesion?.email || '').toLowerCase();
    if (!email) return;
    const votantesArr = [...new Set(String(cafecito.votantes || '').split(/[;,]/).map(v => v.trim().toLowerCase()).filter(Boolean))];
    const yaVoto = votantesArr.includes(email);
    const nuevosVotantes = yaVoto ? votantesArr.filter(v => v !== email) : [...votantesArr, email];
    const nuevoTotal = Math.max(0, (Number(cafecito.votos) || votantesArr.length) + (yaVoto ? -1 : 1));

    await supabase.from('cafes').update({ votos: nuevoTotal, votantes: nuevosVotantes.join(',') }).eq('id', cafecito.id);
    await cargarDatosSupabase();
    mostrarToast(yaVoto ? 'Has retirado tu voto' : '¡Voto guardado!');
  };

  const cafecitosConVotos = cafecitos.map(cafecito => {
    const votantes = [...new Set(String(cafecito.votantes || '').split(/[;,]/).map(v => v.trim().toLowerCase()).filter(Boolean))];
    const votos = Number(cafecito.votos);
    const vTotal = Number.isFinite(votos) ? votos : votantes.length;
    return {
      ...cafecito,
      votos: vTotal,
      votantes,
      yaVoto: votantes.includes(String(sesion?.email || '').trim().toLowerCase())
    };
  });
  const sumaVotosCafes = cafecitosConVotos.reduce((s, c) => s + c.votos, 0);

  return (
    <div className="space-y-5 fade-in" onClick={registrarActividadPresencia}>
      {/* Navegación sobria */}
      <div className="flex overflow-x-auto gap-1.5 border-b border-[#e8e4d9] pb-2 font-sans no-scrollbar">
        {[
          { id: 'chat', label: 'Chat' },
          { id: 'mapa', label: `Mapa (${usuariasClub.length})` },
          { id: 'archivo', label: 'Propuestas' },
          { id: 'cafecitos', label: 'Cafecitos' },
          { id: 'buzon', label: 'Cartas' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTabComunidad(tab.id)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 active:scale-95 transition-transform duration-100 ${
              subTabComunidad === tab.id
                ? 'bg-[#23211e] text-[#ffffee]'
                : 'text-[#75706b] hover:text-[#23211e]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-tab 1: CHAT */}
      {subTabComunidad === 'chat' && (
        <div className="editorial-card h-[520px] flex flex-col justify-between relative overflow-hidden bg-[#ffffee]">
          <div className="p-3.5 border-b border-[#e8e4d9] flex items-center justify-between">
            <div>
              <h3 className="font-babydoll text-lg font-bold text-[#23211e]">El club</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#849673]"></span>
                <p className="text-[11px] font-sans text-[#75706b]">
                  {cantidadGildasEnLinea} {cantidadGildasEnLinea === 1 ? 'gilda en línea' : 'gildas en línea'}
                </p>
              </div>
            </div>
            <div className="flex gap-1 bg-[#ffffee] p-1 rounded-lg border border-[#e8e4d9]">
              <button
                onClick={() => { setChatModo('global'); setDestinatarioPrivado(null); }}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all active:scale-95 transition-transform duration-100 ${
                  chatModo === 'global' ? 'bg-[#23211e] text-[#ffffee]' : 'text-[#75706b]'
                }`}
              >
                General
              </button>
              <button
                onClick={() => {
                  setChatModo('privado');
                  if (mensajesPrivadosNoLeidos.length > 0) {
                    const primerNoLeido = mensajesPrivadosNoLeidos[0];
                    const emailRemitente = (primerNoLeido.remitente || primerNoLeido.email || '').toLowerCase().trim();
                    const sociaDirecta = usuariasClub.find(u => (u.email || '').toLowerCase().trim() === emailRemitente);
                    if (sociaDirecta) setDestinatarioPrivado(sociaDirecta);
                  }
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all relative flex items-center gap-1.5 active:scale-95 transition-transform duration-100 ${
                  chatModo === 'privado' ? 'bg-[#23211e] text-[#ffffee]' : 'text-[#75706b]'
                }`}
              >
                <span>Gildas</span>
                {totalPrivadosNoLeidos > 0 && chatModo !== 'privado' && (
                  <span className="w-2 h-2 rounded-full bg-[#d9534f] animate-pulse"></span>
                )}
              </button>
            </div>
          </div>

          {chatModo === 'global' && (
            <>
              <div className="flex-grow p-4 overflow-y-auto space-y-3 flex flex-col bg-[#ffffee]/30">
                {chatMsgs.filter(m => !m.tipo || m.tipo !== 'privado').map((m, i) => {
                  const nombreAutorChat = obtenerNombreReal(m.email, m.usuario);
                  const esMia = (m.email || '').toLowerCase() === sesion?.email?.toLowerCase();
                  const horaMensaje = formatearHoraWhatsApp(m.timestamp);

                  return (
                    <div key={m.id || i} className={`flex flex-col max-w-[80%] ${esMia ? 'self-end items-end' : 'self-start items-start'}`}>
                      {!esMia && <span className="text-[10px] font-medium text-[#75706b] font-sans mb-0.5 px-1">{nombreAutorChat}</span>}
                      <div className={`px-3.5 py-2 text-xs leading-relaxed font-sans relative ${
                        esMia
                          ? 'bg-[#23211e] text-[#ffffee] rounded-2xl rounded-br-xs'
                          : 'bg-white border border-[#e8e4d9] text-[#23211e] rounded-2xl rounded-bl-xs'
                      }`}>
                        {m.respuesta_a_texto && (
                          <div className="mb-1.5 p-1.5 bg-[#f2efe6] border-l-2 border-[#23211e] text-[11px] text-[#33312e] rounded-lg">
                            <span className="font-bold text-[#23211e]">{m.respuesta_a_nombre || 'gilda'}:</span>
                            <p className="truncate">{m.respuesta_a_texto}</p>
                          </div>
                        )}
                        <span className="block pr-6 pb-0.5">{m.mensaje}</span>
                        <button 
                          onClick={() => setMensajeRespuesta(m)} 
                          className="text-[10px] text-gray-400 hover:text-[#23211e] mt-1 block transition-colors active:scale-95 transition-transform duration-100"
                        >
                          responder
                        </button>
                        <span className={`block text-[8px] text-right font-sans ${esMia ? 'text-[#ffffee]/60' : 'text-[#75706b]'}`}>{horaMensaje}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              <div className="border-t border-[#e8e4d9] bg-white">
                {mensajeRespuesta && (
                  <div className="mx-3 mt-2.5 p-2 bg-[#23211e]/5 border-l-2 border-[#23211e] text-[11px] text-[#23211e] flex justify-between items-center rounded-lg">
                    <div>
                      <span className="font-bold">Respondiendo a {typeof obtenerNombreReal === 'function' && mensajeRespuesta.email ? obtenerNombreReal(mensajeRespuesta.email, mensajeRespuesta.usuario) : (mensajeRespuesta.usuario || 'gilda')}:</span>
                      <p className="truncate max-w-xs">{mensajeRespuesta.mensaje}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMensajeRespuesta(null)}
                      className="text-gray-500 hover:text-black font-bold px-1.5 text-xs active:scale-95 transition-transform duration-100"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const textoAEnviar = nuevoChat.trim();
                  if (!textoAEnviar) return;
                  const nombreAutor = mensajeRespuesta ? (typeof obtenerNombreReal === "function" && mensajeRespuesta.email ? obtenerNombreReal(mensajeRespuesta.email, mensajeRespuesta.usuario) : mensajeRespuesta.usuario) : null;
                  const nuevoMsg = {
                    email: sesion.email,
                    usuario: nombreUsuarioPersonalizado || sesion.nombre,
                    mensaje: textoAEnviar,
                    tipo: "global",
                    timestamp: new Date().toISOString(),
                    respuesta_a_id: mensajeRespuesta?.id || null,
                    respuesta_a_texto: mensajeRespuesta?.mensaje || null,
                    respuesta_a_nombre: nombreAutor || "gilda"
                  };
                  setNuevoChat("");
                  setMensajeRespuesta(null);
                  
                  const { error } = await supabase.from("chat_messages").insert([nuevoMsg]);
                  if (error) {
                    console.error("Error enviando mensaje:", error);
                    alert("Error al enviar mensaje: " + error.message);
                    setNuevoChat(textoAEnviar);
                  }
                }} className="p-3 flex gap-2">
                  <input id="auto-input-ge89w" name="auto-input-ge89w" autoComplete="off"undefined> setNuevoChat(e.target.value)} className="flex-grow editorial-input px-3 py-2 text-xs" placeholder="Escribe al grupo..." />
                  <button type="submit" className="editorial-btn px-4 py-2 text-xs active:scale-95 transition-transform duration-100">Enviar</button>
                </form>
              </div>
            </>
          )}

          {chatModo === 'privado' && !destinatarioPrivado && (
            <div className="flex-grow p-4 overflow-y-auto space-y-2 bg-[#ffffee]/20">
              <p className="text-xs text-[#75706b] font-sans pb-2">Escribe a una gilda en privado:</p>
              {usuariasClub
                .filter(u => (u.email || '').toLowerCase().trim() !== sesion?.email?.toLowerCase())
                .sort((a, b) => {
                  const unreadA = chatMsgs.filter(m => m.tipo === 'privado' && (m.destinatario || '').toLowerCase().trim() === (sesion?.email || '').toLowerCase().trim() && (m.remitente || m.email || '').toLowerCase().trim() === (a.email || '').toLowerCase().trim() && !m.leido).length;
                  const unreadB = chatMsgs.filter(m => m.tipo === 'privado' && (m.destinatario || '').toLowerCase().trim() === (sesion?.email || '').toLowerCase().trim() && (m.remitente || m.email || '').toLowerCase().trim() === (b.email || '').toLowerCase().trim() && !m.leido).length;
                  return unreadB - unreadA;
                })
                .map((socia, sIdx) => {
                  const nombreSociaReal = socia.nombre || socia.email.split('@')[0];
                  return (
                    <div key={sIdx} onClick={async () => {
                      setDestinatarioPrivado(socia);
                      const noLeidosDeSocia = mensajesPrivadosNoLeidos.filter(
                        m => (m.remitente || m.email || '').toLowerCase().trim() === (socia.email || '').toLowerCase().trim()
                      );
                      if (noLeidosDeSocia.length > 0) {
                        const idsToUpdate = noLeidosDeSocia.map(m => m.id).filter(Boolean);
                        if (idsToUpdate.length > 0) {
                          await supabase.from('chat_messages').update({ leido: true }).in('id', idsToUpdate);
                          if (typeof cargarDatosSupabase === 'function') await cargarDatosSupabase();
                        }
                      }
                    }} className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#e8e4d9] cursor-pointer hover:border-[#23211e] transition-all active:scale-[0.98] transition-transform duration-100">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <AvatarUsuaria foto={socia.foto_perfil} nombre={nombreSociaReal} sizeClass="w-7 h-7" textClass="text-xs" />
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-1.5">
                            <IndicadorPresencia timestamp={socia.ultima_conexion} />
                            <p className="font-babydoll font-bold text-base text-[#23211e]">{nombreSociaReal}</p>
                          </div>
                        </div>
                      </div>
                      {(() => {
                        const unreadFromSocia = chatMsgs.filter(m =>
                          m.tipo === 'privado' &&
                          (m.destinatario || '').toLowerCase().trim() === (sesion?.email || '').toLowerCase().trim() &&
                          (m.remitente || m.email || '').toLowerCase().trim() === (socia.email || '').toLowerCase().trim() &&
                          !m.leido
                        ).length;

                        return (
                          <div className="flex items-center gap-2">
                            {unreadFromSocia > 0 && (
                              <span className="px-2 py-0.5 text-[10px] bg-[#d9534f] text-white font-bold rounded-full animate-pulse">
                                {unreadFromSocia} nuevo{unreadFromSocia > 1 ? 's' : ''}
                              </span>
                            )}
                            <span className="text-xs text-[#23211e] font-medium bg-[#ffffee] px-2.5 py-1 rounded-lg border border-[#e8e4d9]">
                              Mensaje
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
            </div>
          )}

          {chatModo === 'privado' && destinatarioPrivado && (
            <>
              <div className="p-2.5 border-b border-[#e8e4d9] flex items-center justify-between text-xs">
                <button onClick={() => setDestinatarioPrivado(null)} className="text-[#23211e] font-medium flex items-center gap-1 active:scale-95 transition-transform duration-100">
                  ← Volver
                </button>
                <div className="flex items-center gap-1.5">
                  <IndicadorPresencia timestamp={destinatarioPrivado.ultima_conexion} />
                  <span className="font-babydoll font-bold text-base">{destinatarioPrivado.nombre || destinatarioPrivado.email.split('@')[0]}</span>
                </div>
              </div>
              
              <div className="flex-grow p-4 overflow-y-auto space-y-3 flex flex-col bg-[#ffffee]/30">
                {chatMsgs.filter(m => {
                  if (m.tipo !== 'privado') return false;
                  const rem = (m.remitente || m.email || '').toLowerCase().trim();
                  const dest = (m.destinatario || '').toLowerCase().trim();
                  const miEmail = sesion?.email?.toLowerCase();
                  const otroEmail = destinatarioPrivado.email.toLowerCase();
                  return (rem === miEmail && dest === otroEmail) || (rem === otroEmail && dest === miEmail);
                }).map((m, i) => {
                  const esMia = (m.remitente || m.email || '').toLowerCase() === sesion?.email?.toLowerCase();
                  const horaMensaje = formatearHoraWhatsApp(m.timestamp);

                  return (
                    <div key={m.id || i} className={`flex flex-col max-w-[80%] ${esMia ? 'self-end items-end' : 'self-start items-start'}`}>
                      <div className={`px-3.5 py-2 text-xs leading-relaxed font-sans relative ${
                        esMia
                          ? 'bg-[#23211e] text-[#ffffee] rounded-2xl rounded-br-xs'
                          : 'bg-white border border-[#e8e4d9] text-[#23211e] rounded-2xl rounded-bl-xs'
                      }`}>
                        {m.respuesta_a_texto && (
                          <div className="mb-1.5 p-1.5 bg-[#23211e]/5 border-l-2 border-[#23211e] text-[10px] text-gray-600 rounded-r">
                            <span className="font-bold text-[#23211e]">{m.respuesta_a_nombre || 'gilda'}:</span>
                            <p className="truncate">{m.respuesta_a_texto}</p>
                          </div>
                        )}
                        <span className="block pr-6 pb-0.5">{m.mensaje}</span>
                        <span className={`block text-[8px] text-right font-sans ${esMia ? 'text-[#ffffee]/60' : 'text-[#75706b]'}`}>{horaMensaje}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!nuevoChatPrivado.trim()) return;
                const payload = {
                  tipo: 'privado',
                  email: sesion.email,
                  remitente: sesion.email,
                  destinatario: destinatarioPrivado.email,
                  mensaje: nuevoChatPrivado.trim(),
                  timestamp: new Date().toISOString(),
                  respuesta_a_id: mensajeRespuesta?.id || null,
                  respuesta_a_texto: mensajeRespuesta?.mensaje || null,
                  respuesta_a_nombre: mensajeRespuesta?.usuario || mensajeRespuesta?.usuario_nombre || mensajeRespuesta?.nombre || 'gilda'
                };
                await supabase.from('chat_messages').insert([payload]);
                await cargarDatosSupabase();
                setNuevoChatPrivado('');
                setMensajeRespuesta(null);
              }} className="p-3 border-t border-[#e8e4d9] flex gap-2 bg-white">
                <input id="auto-input-59oas" name="auto-input-59oas" autoComplete="off"undefined> setNuevoChatPrivado(e.target.value)} className="flex-grow editorial-input px-3 py-2 text-xs" placeholder={`Escribe a ${destinatarioPrivado.nombre || 'gilda'}...`} />
                <button type="submit" className="editorial-btn px-4 py-2 text-xs active:scale-95 transition-transform duration-100">Enviar</button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Sub-tab 2: MAPA */}
      {subTabComunidad === 'mapa' && (
        <div className="editorial-card p-4 space-y-3">
          <div className="flex justify-between items-center text-xs px-1">
            <span className="font-babydoll text-xl font-bold">Dónde leemos</span>
            <span className="text-xs text-[#75706b] font-sans">{usuariasClub.length} gildas</span>
          </div>
          <MapaGilda usuarias={usuariasClub} normalizarUbicacion={normalizarUbicacion} geocodificarUbicacion={geocodificarUbicacion} formatearPais={formatearPais} />
        </div>
      )}

      {/* Sub-tab 3: CAFECITOS */}
      {subTabComunidad === 'cafecitos' && (
        <div className="space-y-3">
          <header className="px-1">
            <h2 className="font-babydoll text-2xl font-bold text-[#23211e]">Próximos cafecitos</h2>
            <p className="text-xs text-[#75706b] font-sans mt-0.5">Vota los días para encontrarnos.</p>
          </header>

          {cafecitosConVotos.length === 0 ? (
            <div className="editorial-card p-6 text-center">
              <p className="text-xs text-[#75706b] font-sans">Aún no hay fechas propuestas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cafecitosConVotos.map(cafecito => {
                const pct = sumaVotosCafes ? Math.round((cafecito.votos / sumaVotosCafes) * 100) : 0;
                return (
                  <article key={cafecito.id || cafecito.titulo} className="editorial-card p-4 space-y-3">
                    <div className="min-w-0 flex-grow">
                      <h3 className="font-babydoll text-lg font-bold text-[#23211e]">{cafecito.titulo || 'Encuentro del club'}</h3>
                      {cafecito.fecha && <p className="text-[11px] text-[#75706b] font-sans mt-0.5">{cafecito.fecha}</p>}
                      {cafecito.descripcion && <p className="mt-1 text-xs leading-relaxed text-[#75706b] font-sans">{cafecito.descripcion}</p>}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-[#75706b] font-sans">
                        <span>{cafecito.votos} {cafecito.votos === 1 ? 'voto' : 'votos'}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1 rounded-full bg-[#e8e4d9] overflow-hidden">
                        <div className="h-full rounded-full bg-[#23211e] transition-all duration-300" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                    <button type="button" onClick={() => votarCafecito(cafecito)} className={`w-full py-2 rounded-lg text-xs font-medium font-sans border transition-colors active:scale-95 transition-transform duration-100 ${
                      cafecito.yaVoto
                        ? 'bg-[#23211e] text-[#ffffee] border-[#23211e]'
                        : 'bg-white text-[#23211e] border-[#e8e4d9] hover:bg-[#ffffee]'
                    }`}>
                      {cafecito.yaVoto ? 'Guardado' : 'Me encaja'}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sub-tab 4: ARCHIVO DE PROPUESTAS */}
      {subTabComunidad === 'archivo' && (
        <div className="space-y-4">
          <div className="editorial-card p-4 space-y-3">
            <h3 className="font-babydoll text-xl font-bold">Proponer una lectura</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const tit = nuevaPropuestaTitulo?.trim();
              if (!tit) return;
              const nueva = {
                titulo: tit,
                autora: nuevaPropuestaAutora?.trim() || '',
                votos: 1,
                votantes: sesion.email.toLowerCase(),
                portada: nuevaPropuestaPortada?.trim() || ''
              };
              await supabase.from('proposals').insert([nueva]);
              await cargarDatosSupabase();
              setNuevaPropuestaTitulo(''); setNuevaPropuestaAutora(''); setNuevaPropuestaPortada('');
              mostrarToast('Propuesta añadida.');
            }} className="space-y-2">
              <BuscadorLibros placeholder="Título o autora..." valor={nuevaPropuestaTitulo} setValor={setNuevaPropuestaTitulo} onSelectLibro={(l) => { setNuevaPropuestaTitulo(l.titulo); setNuevaPropuestaAutora(l.autora); setNuevaPropuestaPortada(l.portada); }} />
              <input id="auto-input-dl9c0" name="auto-input-dl9c0" autoComplete="off"undefined>setNuevaPropuestaAutora(e.target.value)} className="w-full editorial-input p-2.5 text-xs" />
              <button type="submit" className="w-full editorial-btn py-2 text-xs active:scale-95 transition-transform duration-100">Añadir propuesta</button>
            </form>
          </div>

          <div className="editorial-card p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-babydoll text-xl font-bold">Sugerencias del mes</h3>
            </div>
            <div className="space-y-3">
              {[...propuestas].sort((a, b) => (Number(b.votos) || 0) - (Number(a.votos) || 0)).map((p, i) => (
                <div key={p.id || i} className="flex gap-3 border border-[#e8e4d9] p-3 rounded-xl bg-[#ffffee]/40">
                  <PortadaLibro titulo={p.titulo} autora={p.autora} portada={p.portada} size="small" />
                  <div className="flex flex-col justify-between w-full">
                    <div>
                      <h4 className="font-babydoll text-base font-bold text-[#23211e]">{p.titulo}</h4>
                      <p className="text-xs text-[#75706b] italic">{p.autora}</p>
                    </div>
                    <button onClick={async () => {
                      const votantesArr = String(p.votantes || '').toLowerCase().split(',').map(v => v.trim()).filter(Boolean);
                      const emailUser = sesion.email.toLowerCase();
                      const yaVoto = votantesArr.includes(emailUser);
                      const nuevosVotantes = yaVoto ? votantesArr.filter(v => v !== emailUser) : [...votantesArr, emailUser];
                      const nuevosVotos = Math.max(0, (Number(p.votos) || votantesArr.length) + (yaVoto ? -1 : 1));

                      await supabase.from('proposals').update({ votos: nuevosVotos, votantes: nuevosVotantes.join(',') }).eq('id', p.id);
                      await cargarDatosSupabase();
                      mostrarToast('Voto actualizado.');
                    }} className="self-start mt-2 px-3 py-1 text-xs rounded-lg font-medium bg-white text-[#23211e] border border-[#e8e4d9] hover:bg-[#23211e] hover:text-[#ffffee] transition-all active:scale-95 transition-transform duration-100">
                      Votar ({p.votos || 0})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 5: CARTAS / BUZÓN */}
      {subTabComunidad === 'buzon' && (
        <div className="editorial-card p-5 space-y-3">
          <h2 className="font-babydoll text-2xl font-bold">Carta a la fundadora</h2>
          <p className="text-xs text-[#75706b] font-sans">Cualquier idea, duda o nota que quieras compartir en privado.</p>
          <textarea id="auto-textarea-io8k6" name="auto-textarea-io8k6" autoComplete="off"undefined>setMensajeFundadora(e.target.value)} className="w-full editorial-input p-3 text-xs h-28 resize-none"></textarea>
          <button onClick={async () => {
            if (!mensajeFundadora.trim()) return;
            await supabase.from('wall_posts').insert([{ tipo: 'buzon', cita: mensajeFundadora.trim(), email: sesion.email, nombre: nombreUsuarioPersonalizado || sesion.nombre, timestamp: new Date().toISOString() }]);
            setMensajeFundadora('');
            mostrarToast('Mensaje enviado.');
          }} className="w-full editorial-btn py-2 text-xs active:scale-95 transition-transform duration-100">Enviar nota</button>
        </div>
      )}
    </div>
  );
}