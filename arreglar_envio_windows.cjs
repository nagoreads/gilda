const fs = require("fs");
let code = fs.readFileSync("src/components/SeccionComunidad.jsx", "utf8");

// 1. Normalizar saltos de línea de Windows (\r\n -> \n)
code = code.replace(/\r\n/g, "\n");

// 2. Inyectar los campos de respuesta en nuevoMsg (chat global)
const viejoGlobal = `const nuevoMsg = {
      mensaje: nuevoChat.trim(),
      usuario_email: sesion.email,
      usuario_nombre: nombreUsuarioPersonalizado || sesion.nombre,
      foto_perfil: fotoPerfilPersonalizada || sesion.foto_perfil,
      timestamp: new Date().toISOString()
    };`;

const nuevoGlobal = `const nuevoMsg = {
      mensaje: nuevoChat.trim(),
      usuario_email: sesion.email,
      usuario_nombre: nombreUsuarioPersonalizado || sesion.nombre,
      foto_perfil: fotoPerfilPersonalizada || sesion.foto_perfil,
      timestamp: new Date().toISOString(),
      respuesta_a_id: mensajeRespuesta?.id || null,
      respuesta_a_texto: mensajeRespuesta?.mensaje || null,
      respuesta_a_nombre: mensajeRespuesta?.usuario_nombre || null
    };`;

if (code.includes(viejoGlobal)) {
  code = code.replace(viejoGlobal, nuevoGlobal);
} else {
  // Búsqueda flexible con regex por si acaso
  code = code.replace(
    /timestamp:\s*new Date\(\)\.toISOString\(\)\s*\n\s*\};\s*\n\s*await supabase\.from\('chat_messages'\)\.insert\(\[nuevoMsg\]\);/,
    `timestamp: new Date().toISOString(),\n      respuesta_a_id: mensajeRespuesta?.id || null,\n      respuesta_a_texto: mensajeRespuesta?.mensaje || null,\n      respuesta_a_nombre: mensajeRespuesta?.usuario_nombre || null\n    };\n    await supabase.from('chat_messages').insert([nuevoMsg]);`
  );
}

// 3. Inyectar los campos de respuesta en payload (chat privado)
const viejoPrivado = `const payload = {
      mensaje: nuevoChatPrivado.trim(),
      usuario_email: sesion.email,
      usuario_nombre: nombreUsuarioPersonalizado || sesion.nombre,
      foto_perfil: fotoPerfilPersonalizada || sesion.foto_perfil,
      destinatario_email: destinatarioPrivado.email,
      destinatario_nombre: destinatarioPrivado.nombre,
      tipo: 'privado',
      timestamp: new Date().toISOString()
    };`;

const nuevoPrivado = `const payload = {
      mensaje: nuevoChatPrivado.trim(),
      usuario_email: sesion.email,
      usuario_nombre: nombreUsuarioPersonalizado || sesion.nombre,
      foto_perfil: fotoPerfilPersonalizada || sesion.foto_perfil,
      destinatario_email: destinatarioPrivado.email,
      destinatario_nombre: destinatarioPrivado.nombre,
      tipo: 'privado',
      timestamp: new Date().toISOString(),
      respuesta_a_id: mensajeRespuesta?.id || null,
      respuesta_a_texto: mensajeRespuesta?.mensaje || null,
      respuesta_a_nombre: mensajeRespuesta?.usuario_nombre || null
    };`;

if (code.includes(viejoPrivado)) {
  code = code.replace(viejoPrivado, nuevoPrivado);
}

// 4. Limpiar el estado mensajeRespuesta tras el envío
if (code.includes("setNuevoChat('');") && !code.includes("setNuevoChat('');\n    setMensajeRespuesta(null);")) {
  code = code.replace("setNuevoChat('');", "setNuevoChat('');\n    setMensajeRespuesta(null);");
}
if (code.includes("setNuevoChatPrivado('');") && !code.includes("setNuevoChatPrivado('');\n    setMensajeRespuesta(null);")) {
  code = code.replace("setNuevoChatPrivado('');", "setNuevoChatPrivado('');\n    setMensajeRespuesta(null);");
}

fs.writeFileSync("src/components/SeccionComunidad.jsx", code);

if (code.includes("respuesta_a_texto:")) {
  console.log("✅ ÉXITO: SeccionComunidad.jsx se ha modificado correctamente.");
} else {
  console.log("⚠️ No se encontró la coincidencia exacta.");
}
