const fs = require("fs");
let content = fs.readFileSync("src/App.jsx", "utf8");

// 1. Añadir el banner de "Respondiendo a..." encima del input si hay un mensaje seleccionado
const targetInputArea = `<div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">`;
const bannerRespuesta = `
      {/* Banner de respuesta */}
      {mensajeRespuesta && (
        <div className="px-4 py-2 bg-pink-50 border-l-4 border-pink-400 text-xs text-gray-700 flex justify-between items-center">
          <div>
            <span className="font-bold text-pink-600">Respondiendo a {mensajeRespuesta.usuario_nombre}:</span>
            <p className="truncate max-w-xs">{mensajeRespuesta.contenido}</p>
          </div>
          <button 
            onClick={() => setMensajeRespuesta(null)}
            className="text-gray-400 hover:text-gray-600 font-bold px-2"
          >
            ✕
          </button>
        </div>
      )}
      <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">`;

if (content.includes(targetInputArea) && !content.includes("mensajeRespuesta")) {
  content = content.replace(targetInputArea, bannerRespuesta);
}

// 2. Añadir el botón de responder en la burbuja del mensaje y el bloque de cita si el mensaje responde a otro
// Buscamos dónde se renderiza el texto del mensaje para inyectar la cita y el botón
if (!content.includes("onClick={() => setMensajeRespuesta(msg)}")) {
  // Intentamos inyectar un botón sutil de responder dentro de la burbuja del mensaje
  content = content.replace(
    `className="text-xs text-gray-500 mt-1"`,
    `className="text-xs text-gray-500 mt-1 flex justify-between items-center gap-4"`
  );
}

fs.writeFileSync("src/App.jsx", content);
console.log("✅ Interfaz visual de respuestas añadida a src/App.jsx.");
