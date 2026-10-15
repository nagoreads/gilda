const fs = require("fs");
let content = fs.readFileSync("src/App.jsx", "utf8");

// 1. Asegurar que cada burbuja de mensaje tenga el botón o la acción para responder
// Buscamos el lugar donde se muestran los mensajes del chat y añadimos un botón o evento para invocar setMensajeRespuesta
if (content.includes("chat_messages") || content.includes("mensajes")) {
  // Buscamos la renderización de la tarjeta de mensaje y añadimos la opción de responder si no la tiene
  if (!content.includes("setMensajeRespuesta")) {
    // Intentamos inyectar un botón de "Responder" discretamente en cada mensaje
    content = content.replace(
      /({msg\.contenido}|item\.contenido|mensaje\.contenido)/g,
      `$1\n                <button \n                  onClick={() => setMensajeRespuesta(msg || item || mensaje)}\n                  className="text-[10px] text-pink-500 hover:underline mt-1 block"\n                >\n                  ↩️ Responder\n                </button>`
    );
  }
}

// 2. Si el mensaje que se está mostrando tiene respuesta previa (cita), pintamos la cajita citada dentro del mensaje
if (!content.includes("msg.respuesta_a_texto") && !content.includes("item.respuesta_a_texto")) {
  content = content.replace(
    /({msg\.contenido}|item\.contenido|mensaje\.contenido)/g,
    `{ (msg.respuesta_a_texto || item?.respuesta_a_texto || mensaje?.respuesta_a_texto) && (\n                <div className="bg-pink-50 border-l-2 border-pink-400 p-1 mb-1 text-xs text-gray-600 rounded">\n                  <span className="font-bold text-pink-600">{msg.respuesta_a_nombre || item?.respuesta_a_nombre || mensaje?.respuesta_a_nombre}:</span>\n                  <p className="truncate">{msg.respuesta_a_texto || item?.respuesta_a_texto || mensaje?.respuesta_a_texto}</p>\n                </div>\n              )}\n              $1`
  );
}

fs.writeFileSync("src/App.jsx", content);
console.log("✅ Botones y visualización de respuestas integrados en el chat.");
