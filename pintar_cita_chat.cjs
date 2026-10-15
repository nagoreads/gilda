const fs = require("fs");
let code = fs.readFileSync("src/components/SeccionComunidad.jsx", "utf8");

const targetRender = `<span className="block pr-6 pb-0.5">{m.mensaje}</span>`;
const newRenderWithQuote = `{m.respuesta_a_texto && (
                <div className="mb-1.5 p-1.5 bg-[#23211e]/5 border-l-2 border-[#23211e] text-[10px] text-gray-600 rounded-r">
                  <span className="font-bold text-[#23211e]">{m.respuesta_a_nombre}:</span>
                  <p className="truncate">{m.respuesta_a_texto}</p>
                </div>
              )}
              <span className="block pr-6 pb-0.5">{m.mensaje}</span>`;

if (code.includes(targetRender) && !code.includes("m.respuesta_a_texto &&")) {
  code = code.replace(targetRender, newRenderWithQuote);
  fs.writeFileSync("src/components/SeccionComunidad.jsx", code);
  console.log("✅ Bloque visual de la cita añadido al renderizado del chat.");
} else {
  console.log("ℹ️ El bloque visual ya estaba presente o no se encontró la coincidencia exacta.");
}
