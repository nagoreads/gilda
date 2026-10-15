const fs = require("fs");
let code = fs.readFileSync("src/components/SeccionComunidad.jsx", "utf8");
code = code.replace(/\r\n/g, "\n");

// Actualizar envío global con captura de errores
const antiguoGlobal = `await supabase.from('chat_messages').insert([nuevoMsg]);
                await cargarDatosSupabase();
                setNuevoChat('');
                setMensajeRespuesta(null);`;

const nuevoGlobal = `const { error } = await supabase.from('chat_messages').insert([nuevoMsg]);
                if (error) {
                  console.error('Error enviando mensaje:', error);
                  alert('Error al enviar mensaje: ' + error.message);
                } else {
                  await cargarDatosSupabase();
                  setNuevoChat('');
                  setMensajeRespuesta(null);
                }`;

if (code.includes(antiguoGlobal)) {
  code = code.replace(antiguoGlobal, nuevoGlobal);
}

fs.writeFileSync("src/components/SeccionComunidad.jsx", code);
console.log("✅ Control de errores configurado correctamente.");
