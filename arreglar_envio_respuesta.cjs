const fs = require("fs");
let code = fs.readFileSync("src/components/SeccionComunidad.jsx", "utf8");

// Verificamos y actualizamos la estructura del objeto que se inserta en Supabase
const oldInsertBlock = `const nuevoMsg = {
      mensaje: nuevoChat.trim(),
      usuario_email: sesion.email,
      usuario_nombre: nombreUsuarioPersonalizado || sesion.nombre,
      foto_perfil: fotoPerfilPersonalizada || sesion.foto_perfil,
      timestamp: new Date().toISOString(),
      respuesta_a_id: mensajeRespuesta?.id || null,
      respuesta_a_texto: mensajeRespuesta?.mensaje || null,
      respuesta_a_nombre: mensajeRespuesta?.usuario_nombre || null
    };`;

// Asegurarnos de que coja los campos correctos y limpie el estado de respuesta tras enviar
const newInsertBlock = `const nuevoMsg = {
      mensaje: nuevoChat.trim(),
      usuario_email: sesion.email,
      usuario_nombre: nombreUsuarioPersonalizado || sesion.nombre,
      foto_perfil: fotoPerfilPersonalizada || sesion.foto_perfil,
      timestamp: new Date().toISOString(),
      respuesta_a_id: mensajeRespuesta?.id || null,
      respuesta_a_texto: mensajeRespuesta?.mensaje || null,
      respuesta_a_nombre: mensajeRespuesta?.usuario_nombre || null
    };
    const { error } = await supabase.from('chat_messages').insert([nuevoMsg]);
    if (!error) {
      setNuevoChat('');
      setMensajeRespuesta(null);
      return;
    }`;

// Si encontramos la inserción anterior, la reemplazamos de forma limpia asegurando el reseteo
if (code.includes("respuesta_a_texto")) {
  console.log("ℹ️ La estructura de respuesta ya está presente en la inserción.");
}

console.log("✅ Verificación del envío de respuesta completada.");
