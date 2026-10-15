const fs = require("fs");
let code = fs.readFileSync("src/components/SeccionComunidad.jsx", "utf8");

// Reemplazar la línea 152 (chat global) incluyendo la cita si existe
code = code.replace(
  '<span className="block pr-6 pb-0.5">{m.mensaje}</span>',
  `{m.respuesta_a_texto && (
                <div className="mb-1.5 p-1.5 bg-[#23211e]/5 border-l-2 border-[#23211e] text-[10px] text-gray-600 rounded-r">
                  <span className="font-bold text-[#23211e]">{m.respuesta_a_nombre}:</span>
                  <p className="truncate">{m.respuesta_a_texto}</p>
                </div>
              )}
              <span className="block pr-6 pb-0.5">{m.mensaje}</span>`
);

// Reemplazar la línea 258 (chat privado) incluyendo la cita si existe
code = code.replace(
  '<span className="block pr-6 pb-0.5">{m.mensaje}</span>',
  `{m.respuesta_a_texto && (
                <div className="mb-1.5 p-1.5 bg-[#23211e]/5 border-l-2 border-[#23211e] text-[10px] text-gray-600 rounded-r">
                  <span className="font-bold text-[#23211e]">{m.respuesta_a_nombre}:</span>
                  <p className="truncate">{m.respuesta_a_texto}</p>
                </div>
              )}
              <span className="block pr-6 pb-0.5">{m.mensaje}</span>`
);

fs.writeFileSync("src/components/SeccionComunidad.jsx", code);
console.log("✅ Citas integradas correctamente en el chat global y privado.");
