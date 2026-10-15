const fs = require("fs");
let code = fs.readFileSync("src/components/SeccionComunidad.jsx", "utf8");
code = code.replace(/\r\n/g, "\n");

// 1. Corregir el objeto global 'nuevoMsg'
const globalOld = `usuario: nombreUsuarioPersonalizado || sesion.nombre,
                  mensaje: nuevoChat.trim(),
                  tipo: 'global',
                  timestamp: new Date().toISOString(),
                  respuesta_a_id: mensajeRespuesta?.id || null,
                  respuesta_a_texto: mensajeRespuesta?.mensaje || null,
                  respuesta_a_nombre: mensajeRespuesta?.usuario_nombre || null
                };
                await supabase.from('chat_messages').insert([nuevoMsg]);
                await cargarDatosSupabase();
                setNuevoChat('');
    setMensajeRespuesta(null);
                setMensajeRespuesta(null);`;

const globalNew = `usuario: nombreUsuarioPersonalizado || sesion.nombre,
                  mensaje: nuevoChat.trim(),
                  tipo: 'global',
                  timestamp: new Date().toISOString(),
                  respuesta_a_id: mensajeRespuesta?.id || null,
                  respuesta_a_texto: mensajeRespuesta?.mensaje || null,
                  respuesta_a_nombre: mensajeRespuesta?.usuario || mensajeRespuesta?.usuario_nombre || mensajeRespuesta?.nombre || 'gilda'
                };
                const { error: errGlobal } = await supabase.from('chat_messages').insert([nuevoMsg]);
                if (errGlobal) {
                  console.error('Error Supabase Global:', errGlobal);
                  alert('Error al publicar mensaje: ' + errGlobal.message);
                } else {
                  if (typeof cargarDatosSupabase === 'function') await cargarDatosSupabase();
                  setNuevoChat('');
                  setMensajeRespuesta(null);
                }`;

if (code.includes("respuesta_a_nombre: mensajeRespuesta?.usuario_nombre || null")) {
  code = code.replace(/respuesta_a_nombre:\s*mensajeRespuesta\?\.usuario_nombre\s*\|\|\s*null/g, "respuesta_a_nombre: mensajeRespuesta?.usuario || mensajeRespuesta?.usuario_nombre || mensajeRespuesta?.nombre || 'gilda'");
}

// 2. Corregir banner visual de respuesta si decía usuario_nombre
code = code.replace(
  "Respondiendo a {mensajeRespuesta.usuario_nombre}:",
  "Respondiendo a {mensajeRespuesta.usuario || mensajeRespuesta.usuario_nombre || mensajeRespuesta.nombre}:"
);

// 3. Corregir visualización de cita
code = code.replace(
  "{m.respuesta_a_nombre}:",
  "{m.respuesta_a_nombre || 'gilda'}:"
);

fs.writeFileSync("src/components/SeccionComunidad.jsx", code);
console.log("✅ Corrección de campos de respuesta y control de errores aplicada.");
