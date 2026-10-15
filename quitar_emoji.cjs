const fs = require("fs");
let code = fs.readFileSync("src/components/SeccionComunidad.jsx", "utf8");

// Reemplazar el botón con el emoji por un texto limpio y elegante
code = code.replace(
  'onClick={() => setMensajeRespuesta(m)} \n                className="text-[10px] text-gray-400 hover:text-[#23211e] mt-1 block transition-colors"\n              >\n                ↩️ Responder',
  'onClick={() => setMensajeRespuesta(m)} \n                className="text-[10px] text-gray-400 hover:text-[#23211e] mt-1 block transition-colors"\n              >\n                responder'
);

fs.writeFileSync("src/components/SeccionComunidad.jsx", code);
console.log("✅ Emoji eliminado. Ahora el botón muestra un texto limpio y minimalista.");
