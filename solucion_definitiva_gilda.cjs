const fs = require("fs");
let code = fs.readFileSync("src/components/SeccionComunidad.jsx", "utf8");
code = code.replace(/\r\n/g, "\n");

// 1. Añadir el renderizado de la cita arriba de m.mensaje en todos los mensajes
const targetSpan = '<span className="block pr-6 pb-0.5">{m.mensaje}</span>';
const quoteMarkup = `{m.respuesta_a_texto && (
                <div className="mb-1.5 p-1.5 bg-[#23211e]/5 border-l-2 border-[#23211e] text-[10px] text-gray-600 rounded-r">
                  <span className="font-bold text-[#23211e]">{m.respuesta_a_nombre || 'gilda'}:</span>
                  <p className="truncate">{m.respuesta_a_texto}</p>
                </div>
              )}
              <span className="block pr-6 pb-0.5">{m.mensaje}</span>`;

if (code.includes(targetSpan)) {
  code = code.split(targetSpan).join(quoteMarkup);
  console.log("✅ Renderizado de citas añadido a los mensajes del chat.");
}

// 2. Reestructurar el formulario y el banner del Chat Global (L179-L215)
const formGlobalRegex = /<form onSubmit=\{async \(e\) => \{[\s\S]*?<\/form>/;
const newFormGlobal = `<div className="border-t border-[#e8e4d9] bg-white">
                {mensajeRespuesta && (
                  <div className="mx-3 mt-2.5 p-2 bg-[#23211e]/5 border-l-2 border-[#23211e] text-[11px] text-[#23211e] flex justify-between items-center rounded-r">
                    <div>
                      <span className="font-bold">Respondiendo a {typeof obtenerNombreReal === 'function' && mensajeRespuesta.email ? obtenerNombreReal(mensajeRespuesta.email, mensajeRespuesta.usuario) : (mensajeRespuesta.usuario || 'gilda')}:</span>
                      <p className="truncate max-w-xs">{mensajeRespuesta.mensaje}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMensajeRespuesta(null)}
                      className="text-gray-500 hover:text-black font-bold px-1.5 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!nuevoChat.trim()) return;
                  const nombreAutor = mensajeRespuesta ? (typeof obtenerNombreReal === 'function' && mensajeRespuesta.email ? obtenerNombreReal(mensajeRespuesta.email, mensajeRespuesta.usuario) : mensajeRespuesta.usuario) : null;
                  const nuevoMsg = {
                    email: sesion.email,
                    usuario: nombreUsuarioPersonalizado || sesion.nombre,
                    mensaje: nuevoChat.trim(),
                    tipo: 'global',
                    timestamp: new Date().toISOString(),
                    respuesta_a_id: mensajeRespuesta?.id || null,
                    respuesta_a_texto: mensajeRespuesta?.mensaje || null,
                    respuesta_a_nombre: nombreAutor || 'gilda'
                  };
                  const { error } = await supabase.from('chat_messages').insert([nuevoMsg]);
                  if (error) {
                    console.error('Error enviando mensaje:', error);
                    alert('Error al enviar mensaje: ' + error.message);
                  } else {
                    if (typeof cargarDatosSupabase === 'function') await cargarDatosSupabase();
                    setNuevoChat('');
                    setMensajeRespuesta(null);
                  }
                }} className="p-3 flex gap-2">
                  <input type="text" value={nuevoChat} onChange={e => setNuevoChat(e.target.value)} className="flex-grow editorial-input px-3 py-2 text-xs" placeholder="Escribe al grupo..." />
                  <button type="submit" className="editorial-btn px-4 py-2 text-xs">Enviar</button>
                </form>
              </div>`;

if (formGlobalRegex.test(code)) {
  code = code.replace(formGlobalRegex, newFormGlobal);
  console.log("✅ Formulario y banner del chat global corregidos.");
}

fs.writeFileSync("src/components/SeccionComunidad.jsx", code);
console.log("🎉 SeccionComunidad.jsx actualizado con éxito.");
