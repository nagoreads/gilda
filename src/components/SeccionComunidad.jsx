import { useState, useRef } from 'react';
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
  const [nuevoChatPrivado, setNuevoChatPrivado] = useState('');
  const [nuevaPropuestaTitulo, setNuevaPropuestaTitulo] = useState('');
  const [nuevaPropuestaAutora, setNuevaPropuestaAutora] = useState('');
  const [nuevaPropuestaPortada, setNuevaPropuestaPortada] = useState('');
  const [mensajeFundadora, setMensajeFundadora] = useState('');
  const chatEndRef = useRef(null);

  const cantidadSociasEnLinea = usuariasClub.filter(u => {
    if (!u.ultima_conexion) return false;
    const diff = (new Date() - new Date(u.ultima_conexion)) / 1000 / 60;
    return diff < 3;
  }).length;

  const votarCafecito = async (cafecito) => {
    const email = String(sesion?.email || '').toLowerCase();
    if (!email) return;
    const votantesArr = [...new Set(String(cafecito.votantes || '').split(/[;,]/).map(v => v.trim().toLowerCase()).filter(Boolean))];
    const yaVoto = votantesArr.includes(email);
    const nuevosVotantes = yaVoto ? votantesArr.filter(v => v !== email) : [...votantesArr, email];
    const nuevoTotal = Math.max(0, (Number(cafecito.votos) || votantesArr.length) + (yaVoto ? -1 : 1));

    await supabase.from('cafes').update({ votos: nuevoTotal, votantes: nuevosVotantes.join(',') }).eq('id', cafecito.id);
    await cargarDatosSupabase();
    mostrarToast(yaVoto ? 'Has retirado tu voto.' : '¡Voto registrado!');
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
    <div className="space-y-4 fade-in" onClick={registrarActividadPresencia}>
      {/* Selector de sub-pestañas */}
      <div className="flex overflow-x-auto gap-2 bg-[#eeeeff]/60 p-1.5 rounded-2xl border border-[#d0ceeb] font-sans no-scrollbar">
        {[
          { id: 'chat', label: 'Chat', icon: 'fa-comments' },
          { id: 'mapa', label: `Mapa (${usuariasClub.length})`, icon: 'fa-map-location-dot' },
          { id: 'archivo', label: 'Archivo', icon: 'fa-box-archive' },
          { id: 'cafecitos', label: 'Cafecitos', icon: 'fa-mug-hot' },
          { id: 'buzon', label: 'Buzón', icon: 'fa-inbox' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTabComunidad(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 min-h-[44px] ${
              subTabComunidad === tab.id
                ? 'bg-[var(--primary-olive)] text-[#ffffee] shadow-sm scale-[1.02]'
                : 'text-[#625f6e] hover:bg-white/80'
            }`}
          >
            <i className={`fa-solid ${tab.icon} text-[11px]`}></i>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Sub-tab 1: CHAT */}
      {subTabComunidad === 'chat' && (
        <div className="editorial-card h-[520px] flex flex-col justify-between relative overflow-hidden bg-[#faf9f5]">
          <div className="bg-white/90 p-3 border-b border-[#e8e4d9] flex items-center justify-between rounded-t-2xl shadow-xs">
            <div>
              <h3 className="font-babydoll text-lg font-bold text-[#23211e] leading-none">Chat de Lectoras</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-[10px] font-sans font-medium text-[#625f6e]">
                  {cantidadSociasEnLinea} {cantidadSociasEnLinea === 1 ? 'socia en línea' : 'socias en línea'}
                </p>
              </div>
            </div>
            <div className="flex bg-[#eeeeff] p-0.5 rounded-lg border border-[#d0ceeb]">
              <button
                onClick={() => { setChatModo('global'); setDestinatarioPrivado(null); }}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all min-h-[44px] ${
                  chatModo === 'global' ? 'bg-white text-[var(--primary-olive)] shadow-xs' : 'text-[#625f6e]'
                }`}
              >
                Global
              </button>
              <button
                onClick={() => setChatModo('privado')}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all min-h-[44px] ${
                  chatModo === 'privado' ? 'bg-white text-[var(--primary-olive)] shadow-xs' : 'text-[#625f6e]'
                }`}
              >
                Privados
              </button>
            </div>
          </div>

          {chatModo === 'global' && (
            <>
              <div className="flex-grow p-4 overflow-y-auto space-y-3 flex flex-col bg-[#ffffee]/40">
                {chatMsgs.filter(m => !m.tipo || m.tipo !== 'privado').map((m, i) => {
                  const nombreAutorChat = obtenerNombreReal(m.email, m.usuario);
                  const esMia = (m.email || '').toLowerCase() === sesion?.email?.toLowerCase();
                  const horaMensaje = formatearHoraWhatsApp(m.timestamp);

                  return (
                    <div key={m.id || i} className={`flex flex-col max-w-[82%] ${esMia ? 'self-end items-end' : 'self-start items-start'}`}>
                      {!esMia && <span className="text-[10px] font-bold text-[var(--primary-olive)] font-sans mb-0.5 px-1">{nombreAutorChat}</span>}
                      <div className={`px-3.5 py-2.5 text-xs leading-relaxed font-sans relative shadow-xs ${
                        esMia
                          ? 'bg-[var(--primary-olive)] text-[#ffffee] rounded-[18px] rounded-br-[4px]'
                          : 'bg-[#eeeeff] border border-[#d0ceeb] text-[#23211e] rounded-[18px] rounded-bl-[4px]'
                      }`}>
                        <span className="block pr-8 pb-1">{m.mensaje}</span>
                        <span className={`absolute bottom-1 right-2.5 text-[8.5px] font-sans ${esMia ? 'text-[#ffffee]/80' : 'text-[#625f6e]'}`}>{horaMensaje}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={async (e) => { 
                e.preventDefault(); 
                if (!nuevoChat.trim()) return; 
                const nuevoMsg = {
                  email: sesion.email,
                  usuario: nombreUsuarioPersonalizado || sesion.nombre,
                  mensaje: nuevoChat.trim(),
                  tipo: 'global',
                  timestamp: new Date().toISOString()
                };
                await supabase.from('chat_messages').insert([nuevoMsg]);
                await cargarDatosSupabase();
                setNuevoChat(''); 
              }} className="p-3 border-t border-[#e8e4d9] flex gap-2 bg-white/90">
                <input type="text" value={nuevoChat} onChange={e => setNuevoChat(e.target.value)} className="flex-grow editorial-input px-3.5 py-2.5 text-xs" placeholder="Escribe un mensaje al club..." />
                <button type="submit" className="editorial-btn px-4 py-2.5 text-xs shadow-sm min-h-[44px]"><i className="fa-solid fa-paper-plane"></i></button>
              </form>
            </>
          )}

          {chatModo === 'privado' && !destinatarioPrivado && (
            <div className="flex-grow p-4 overflow-y-auto space-y-2 bg-[#ffffee]/40">
              <p className="text-xs text-[#625f6e] font-sans italic pb-2">Selecciona una socia para abrir un chat privado:</p>
              {usuariasClub.filter(u => (u.email || '').toLowerCase().trim() !== sesion?.email?.toLowerCase()).map((socia, sIdx) => {
                const nombreSociaReal = socia.nombre || socia.email.split('@')[0];
                return (
                  <div key={sIdx} onClick={() => setDestinatarioPrivado(socia)} className="flex items-center justify-between p-3 bg-white/90 rounded-xl border border-[#e8e4d9] cursor-pointer hover:bg-[#eeeeff]/60 transition-all shadow-xs min-h-[44px]">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <AvatarUsuaria foto={socia.foto_perfil} nombre={nombreSociaReal} sizeClass="w-8 h-8" textClass="text-xs" />
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <IndicadorPresencia timestamp={socia.ultima_conexion} />
                          <p className="font-babydoll font-bold text-sm truncate text-[#23211e]">{nombreSociaReal}</p>
                        </div>
                        <p className="text-xs text-[#625f6e] truncate font-sans font-medium">{socia.modalidad || 'socia de gilda'}</p>
                      </div>
                    </div>
                    <span className="text-xs text-[var(--primary-olive)] font-bold bg-[#eeeeff] px-3 py-1.5 rounded-xl border border-[#d0ceeb] shadow-xs flex items-center gap-1">
                      <i className="fa-solid fa-envelope text-xs"></i> Chat
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {chatModo === 'privado' && destinatarioPrivado && (
            <>
              <div className="bg-white/90 p-2.5 border-b border-[#e8e4d9] flex items-center justify-between text-xs shadow-xs">
                <button onClick={() => setDestinatarioPrivado(null)} className="text-[var(--primary-olive)] font-bold flex items-center gap-1 p-2 min-h-[44px]">
                  <i className="fa-solid fa-arrow-left"></i> Volver
                </button>
                <div className="flex items-center gap-1.5">
                  <IndicadorPresencia timestamp={destinatarioPrivado.ultima_conexion} />
                  <span className="font-babydoll font-bold text-sm">{destinatarioPrivado.nombre || destinatarioPrivado.email.split('@')[0]}</span>
                </div>
              </div>
              
              <div className="flex-grow p-4 overflow-y-auto space-y-3 flex flex-col bg-[#ffffee]/40">
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
                    <div key={m.id || i} className={`flex flex-col max-w-[82%] ${esMia ? 'self-end items-end' : 'self-start items-start'}`}>
                      <div className={`px-3.5 py-2.5 text-xs leading-relaxed font-sans relative shadow-xs ${
                        esMia
                          ? 'bg-[var(--primary-olive)] text-[#ffffee] rounded-[18px] rounded-br-[4px]'
                          : 'bg-[#eeeeff] border border-[#d0ceeb] text-[#23211e] rounded-[18px] rounded-bl-[4px]'
                      }`}>
                        <span className="block pr-8 pb-1">{m.mensaje}</span>
                        <span className={`absolute bottom-1 right-2.5 text-[8.5px] font-sans ${esMia ? 'text-[#ffffee]/80' : 'text-[#625f6e]'}`}>{horaMensaje}</span>
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
                  timestamp: new Date().toISOString()
                };
                await supabase.from('chat_messages').insert([payload]);
                await cargarDatosSupabase();
                setNuevoChatPrivado('');
              }} className="p-3 border-t border-[#e8e4d9] flex gap-2 bg-white/90">
                <input type="text" value={nuevoChatPrivado} onChange={e => setNuevoChatPrivado(e.target.value)} className="flex-grow editorial-input px-3.5 py-2.5 text-xs" placeholder={`Escribe a ${destinatarioPrivado.nombre || 'socia'}...`} />
                <button type="submit" className="editorial-btn px-4 py-2.5 text-xs min-h-[44px]"><i className="fa-solid fa-paper-plane"></i></button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Sub-tab 2: MAPA */}
      {subTabComunidad === 'mapa' && (
        <div className="editorial-card p-4 space-y-3">
          <div className="flex justify-between items-center text-xs px-1">
            <span className="font-babydoll text-xl font-bold">Mapa global de lectoras</span>
            <span className="text-xs text-[var(--primary-olive)] font-bold font-sans">{usuariasClub.length} socia(s)</span>
          </div>
          <MapaGilda usuarias={usuariasClub} normalizarUbicacion={normalizarUbicacion} geocodificarUbicacion={geocodificarUbicacion} formatearPais={formatearPais} />
        </div>
      )}

      {/* Sub-tab 3: CAFECITOS */}
      {subTabComunidad === 'cafecitos' && (
        <div className="space-y-3">
          <header className="px-1">
            <p className="text-[10px] uppercase font-bold text-[#756a58] font-sans">encuentros del club</p>
            <h2 className="font-babydoll text-2xl font-bold text-[#23211e]">Votación de cafecitos</h2>
            <p className="text-xs text-[#625f6e] font-sans">Elige las fechas que te gustaría compartir con la comunidad.</p>
          </header>

          {cafecitosConVotos.length === 0 ? (
            <div className="editorial-card p-6 text-center">
              <i className="fa-solid fa-mug-hot text-xl text-[var(--primary-olive)]"></i>
              <p className="mt-2 text-xs text-[#625f6e] font-sans">Todavía no hay propuestas de cafecitos activas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cafecitosConVotos.map(cafecito => {
                const pct = sumaVotosCafes ? Math.round((cafecito.votos / sumaVotosCafes) * 100) : 0;
                return (
                  <article key={cafecito.id || cafecito.titulo} className="editorial-card p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 shrink-0 rounded-full bg-[#eeeeff] border border-[#d0ceeb] flex items-center justify-center text-[var(--primary-olive)]">
                        <i className="fa-solid fa-mug-hot text-sm"></i>
                      </div>
                      <div className="min-w-0 flex-grow">
                        <h3 className="font-babydoll text-lg font-bold leading-snug text-[#23211e]">{cafecito.titulo || 'Cafecito del club'}</h3>
                        {cafecito.fecha && <p className="text-[10px] uppercase font-bold text-[var(--primary-olive)] font-sans">{cafecito.fecha}</p>}
                        {cafecito.descripcion && <p className="mt-1 text-xs leading-relaxed text-[#625f6e] font-sans">{cafecito.descripcion}</p>}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] text-[#625f6e] font-sans">
                        <span>{cafecito.votos} {cafecito.votos === 1 ? 'voto' : 'votos'}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#e8e4d9] overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--primary-olive)] transition-all duration-300" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                    <button type="button" onClick={() => votarCafecito(cafecito)} className={`w-full py-2.5 rounded-xl text-xs font-bold font-sans border transition-colors min-h-[44px] ${
                      cafecito.yaVoto
                        ? 'bg-[#eeeeff] text-[var(--primary-olive)] border-[#d0ceeb]'
                        : 'bg-white text-[var(--primary-olive)] border-[#e8e4d9] hover:bg-[#eeeeff]/50'
                    }`}>
                      <i className={`fa-solid ${cafecito.yaVoto ? 'fa-check' : 'fa-heart'} mr-1.5`}></i>
                      {cafecito.yaVoto ? 'Retirar mi voto' : 'Votar este cafecito'}
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
          <div className="editorial-card p-5 space-y-3">
            <h3 className="font-babydoll text-xl font-bold">Proponer nueva lectura</h3>
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
              <BuscadorLibros placeholder="Título del libro o autora..." valor={nuevaPropuestaTitulo} setValor={setNuevaPropuestaTitulo} onSelectLibro={(l) => { setNuevaPropuestaTitulo(l.titulo); setNuevaPropuestaAutora(l.autora); setNuevaPropuestaPortada(l.portada); }} />
              <input type="text" placeholder="Autora..." value={nuevaPropuestaAutora || ''} onChange={e=>setNuevaPropuestaAutora(e.target.value)} className="w-full editorial-input p-2.5 text-xs" />
              <button type="submit" className="w-full editorial-btn py-2.5 text-xs min-h-[44px]">Añadir propuesta</button>
            </form>
          </div>

          <div className="editorial-card p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-babydoll text-xl font-bold">Votación del mes</h3>
              <span className="text-xs text-[#625f6e] font-sans uppercase">Propuestas del club</span>
            </div>
            <div className="space-y-3">
              {[...propuestas].sort((a, b) => (Number(b.votos) || 0) - (Number(a.votos) || 0)).map((p, i) => (
                <div key={p.id || i} className="flex gap-3 border border-[#d0ceeb] p-3.5 rounded-xl bg-[#eeeeff]/60">
                  <PortadaLibro titulo={p.titulo} autora={p.autora} portada={p.portada} size="small" />
                  <div className="flex flex-col justify-between w-full">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[var(--primary-olive)]">#{i + 1}</span>
                        <h4 className="font-bold text-base leading-tight font-babydoll text-[#23211e]">{p.titulo}</h4>
                      </div>
                      <p className="text-xs text-[#625f6e] italic">{p.autora}</p>
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
                    }} className="self-start mt-2 px-3.5 py-1.5 text-xs rounded-full font-bold bg-white text-[var(--primary-olive)] border border-[#d0ceeb] hover:bg-[var(--primary-olive)] hover:text-[#ffffee] transition-all min-h-[44px]">
                      Votar ({p.votos || 0})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 5: BUZÓN */}
      {subTabComunidad === 'buzon' && (
        <div className="editorial-card p-5 space-y-3">
          <h2 className="font-babydoll text-2xl font-bold">Buzón privado</h2>
          <p className="text-xs text-[#625f6e] font-sans">Sugerencias y comunicación directa con la administración del club.</p>
          <textarea placeholder="Escribe tu mensaje..." value={mensajeFundadora} onChange={e=>setMensajeFundadora(e.target.value)} className="w-full editorial-input p-3 text-xs h-28 resize-none"></textarea>
          <button onClick={async () => {
            if (!mensajeFundadora.trim()) return;
            await supabase.from('wall_posts').insert([{ tipo: 'buzon', cita: mensajeFundadora.trim(), email: sesion.email, nombre: nombreUsuarioPersonalizado || sesion.nombre, timestamp: new Date().toISOString() }]);
            setMensajeFundadora('');
            mostrarToast('Mensaje enviado al buzón.');
          }} className="w-full editorial-btn py-2.5 text-xs min-h-[44px]">Enviar mensaje</button>
        </div>
      )}
    </div>
  );
}