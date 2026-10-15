const fs = require("fs");
let code = fs.readFileSync("src/components/SeccionComunidad.jsx", "utf8");
code = code.replace(/\r\n/g, "\n");

// Bloque de cita único
const singleQuote = `{m.respuesta_a_texto && (
                <div className="mb-1.5 p-1.5 bg-[#23211e]/5 border-l-2 border-[#23211e] text-[10px] text-gray-600 rounded-r">
                  <span className="font-bold text-[#23211e]">{m.respuesta_a_nombre || 'gilda'}:</span>
                  <p className="truncate">{m.respuesta_a_texto}</p>
                </div>
              )}`;

// Detectar una o más repeticiones consecutivas de la cita y dejar solo una
const regex = /(\s*\{m\.respuesta_a_texto && \([\s\S]*?<\/div>\s*\}\)\s*)+/g;

if (regex.test(code)) {
  code = code.replace(regex, "\n              " + singleQuote + "\n              ");
  fs.writeFileSync("src/components/SeccionComunidad.jsx", code);
  console.log("✅ Citas duplicadas consolidadas en una sola cita limpia.");
} else {
  console.log("⚠️ No se encontró el patrón de cita.");
}
