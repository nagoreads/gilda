const fs = require("fs");
let code = fs.readFileSync("src/components/SeccionComunidad.jsx", "utf8");

// 1. Añadir estado para el mensaje al que se responde si no existe
if (!code.includes("mensajeRespuesta")) {
  code = code.replace(
    "const [mensajeFundadora, setMensajeFundadora] = useState('');",
    "const [mensajeFundadora, setMensajeFundadora] = useState('');\n  const [mensajeRespuesta, setMensajeRespuesta] = useState(null);"
  );
}

// 2. Modificar la inserción del mensaje global para incluir datos de respuesta
const oldGlobalInsert = `const nuevoMsg = {
      mensaje: nuevoChat.trim(),
      usuario_email: sesion.email,
      usuario_nombre: nombreUsuarioPersonalizado || sesion.nombre,
      foto_perfil: fotoPerfilPersonalizada || sesion.foto_perfil,
      timestamp: new Date().toISOString()
    };
    await supabase.from('chat_messages').insert([nuevoMsg]);`;

const newGlobalInsert = `const nuevoMsg = {
      mensaje: nuevoChat.trim(),
      usuario_email: sesion.email,
      usuario_nombre: nombreUsuarioPersonalizado || sesion.nombre,
      foto_perfil: fotoPerfilPersonalizada || sesion.foto_perfil,
      timestamp: new Date().toISOString(),
      respuesta_a_id: mensajeRespuesta?.id || null,
      respuesta_a_texto: mensajeRespuesta?.mensaje || null,
      respuesta_a_nombre: mensajeRespuesta?.usuario_nombre || null
    };
    await supabase.from('chat_messages').insert([nuevoMsg]);
    setMensajeRespuesta(null);`;

if (code.includes("const nuevoMsg = {")) {
  code = code.replace(oldGlobalInsert, newGlobalInsert);
}

fs.writeFileSync("src/components/SeccionComunidad.jsx", code);
console.log("✅ SeccionComunidad.jsx actualizado con soporte de respuestas.");
