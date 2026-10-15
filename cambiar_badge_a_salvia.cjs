const fs = require("fs");
let code = fs.readFileSync("src/components/SeccionComunidad.jsx", "utf8");
code = code.replace(/\r\n/g, "\n");

// Reemplazar el verde anterior (#3a5a40) por verde salvia (#849673)
code = code.replaceAll('bg-[#3a5a40]', 'bg-[#849673]');

fs.writeFileSync("src/components/SeccionComunidad.jsx", code);
console.log("✅ Color del indicador actualizado a verde salvia (#849673).");
