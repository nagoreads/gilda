const fs = require("fs");
let code = fs.readFileSync("src/components/SeccionComunidad.jsx", "utf8");

// 1. Arreglar el envío global (nuevoMsg)
code = code.replace(
  `timestamp: new Date().toISOString()\n                };\n                await supabase.from('chat_messages').insert([nuevoMsg]);\n                await cargarDatosSupabase();\n                setNuevoChat('');`,
  `timestamp: new Date().toISOString(),\n                  respuesta_a_id: mensajeRespuesta?.id || null,\n                  respuesta_a_texto: mensajeRespuesta?.mensaje || null,\n                  respuesta_a_nombre: mensajeRespuesta?.usuario_nombre || null\n                };\n                await supabase.from('chat_messages').insert([nuevoMsg]);\n                await cargarDatosSupabase();\n                setNuevoChat('');\n                setMensajeRespuesta(null);`
);

// 2. Arreglar el envío privado (payload)
code = code.replace(
  `timestamp: new Date().toISOString()\n                };\n                await supabase.from('chat_messages').insert([payload]);\n                await cargarDatosSupabase();\n                setNuevoChatPrivado('');`,
  `timestamp: new Date().toISOString(),\n                  respuesta_a_id: mensajeRespuesta?.id || null,\n                  respuesta_a_texto: mensajeRespuesta?.mensaje || null,\n                  respuesta_a_nombre: mensajeRespuesta?.usuario_nombre || null\n                };\n                await supabase.from('chat_messages').insert([payload]);\n                await cargarDatosSupabase();\n                setNuevoChatPrivado('');\n                setMensajeRespuesta(null);`
);

fs.writeFileSync("src/components/SeccionComunidad.jsx", code);
console.log("✅ Objetos de envío y reseteo de estado configurados correctamente en global y privado.");
