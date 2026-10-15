const fs = require("fs");
let code = fs.readFileSync("src/components/SeccionComunidad.jsx", "utf8");
code = code.replace(/\r\n/g, "\n");

// Reemplazar la clase del punto del indicador 'gildas en línea'
code = code.replace(
  '<span className="w-1.5 h-1.5 rounded-full bg-[#23211e]"></span>',
  '<span className="w-1.5 h-1.5 rounded-full bg-[#849673]"></span>'
);

fs.writeFileSync("src/components/SeccionComunidad.jsx", code);
console.log("✅ Indicador 'en línea' actualizado a verde salvia (#849673).");
