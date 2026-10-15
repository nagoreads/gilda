const fs = require("fs");
let code = fs.readFileSync("src/components/SeccionComunidad.jsx", "utf8");
code = code.replace(/\r\n/g, "\n");

// Patron regex para detectar bloques de cita repetidos consecutivamente
const quotePattern = /(\s*\{m\.respuesta_a_texto\s*&&\s*\([\s\S]*?<\/div>\s*\}\)\s*){2,}/g;

const singleQuoteBlock = `\n              {m.respuesta_a_texto && (
                <div className="mb-1.5 p-1.5 bg-[#23211e]/5 border-l-2 border-[#23211e] text-[10px] text-gray-600 rounded-r">
                  <span className="font-bold text-[#23211e]">{m.respuesta_a_nombre || 'gilda'}:</span>
                  <p className="truncate">{m.respuesta_a_texto}</p>
                </div>
              )}\n`;

if (quotePattern.test(code)) {
  code = code.replace(quotePattern, singleQuoteBlock);
  fs.writeFileSync("src/components/SeccionComunidad.jsx", code);
  console.log("✅ Citas duplicadas eliminadas con éxito.");
} else {
  console.log("ℹ️ No se detectaron bloques duplicados o la estructura varía.");
}
