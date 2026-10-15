const fs = require("fs");
let code = fs.readFileSync("src/components/SeccionComunidad.jsx", "utf8");

// 1. Añadir el banner de respuesta encima del input de chat global si 'mensajeRespuesta' no es nulo
const targetInputGlobal = `<input type="text" value={nuevoChat} onChange={e => setNuevoChat(e.target.value)} className="flex-grow editorial-input px-3 py-2 text-xs" placeholder="Escribe al grupo..." />`;

const bannerYInputGlobal = `{/* Banner de respuesta */}
      {mensajeRespuesta && (
        <div className="mx-4 mb-2 p-2 bg-[#23211e]/10 border-l-2 border-[#23211e] text-[11px] text-[#23211e] flex justify-between items-center rounded-r">
          <div>
            <span className="font-bold">Respondiendo a {mensajeRespuesta.usuario_nombre}:</span>
            <p className="truncate max-w-xs">{mensajeRespuesta.mensaje}</p>
          </div>
          <button 
            onClick={() => setMensajeRespuesta(null)}
            className="text-gray-500 hover:text-black font-bold px-1.5 text-xs"
          >
            ✕
          </button>
        </div>
      )}
      <input type="text" value={nuevoChat} onChange={e => setNuevoChat(e.target.value)} className="flex-grow editorial-input px-3 py-2 text-xs" placeholder="Escribe al grupo..." />`;

if (code.includes(targetInputGlobal) && !code.includes("Respondiendo a")) {
  code = code.replace(targetInputGlobal, bannerYInputGlobal);
}

// 2. Añadir el botón de responder y la cita dentro de la burbuja del mensaje global
const targetMensajeGlobal = `<span className="block pr-6 pb-0.5">{m.mensaje}</span>`;
const renderMensajeGlobalConRespuesta = `{m.respuesta_a_texto && (
                <div className="mb-1 p-1.5 bg-black/5 border-l-2 border-[#23211e] text-[10px] text-gray-700 rounded-r">
                  <span className="font-bold">{m.respuesta_a_nombre}:</span>
                  <p className="truncate">{m.respuesta_a_texto}</p>
                </div>
              )}
              <span className="block pr-6 pb-0.5">{m.mensaje}</span>
              <button 
                onClick={() => setMensajeRespuesta(m)} 
                className="text-[10px] text-gray-400 hover:text-[#23211e] mt-1 block transition-colors"
              >
                ↩️ Responder
              </button>`;

if (code.includes(targetMensajeGlobal) && !code.includes("↩️ Responder")) {
  code = code.replace(targetMensajeGlobal, renderMensajeGlobalConRespuesta);
}

fs.writeFileSync("src/components/SeccionComunidad.jsx", code);
console.log("✅ UI de respuestas integrada con éxito en SeccionComunidad.jsx con la estética de Gilda Club.");
