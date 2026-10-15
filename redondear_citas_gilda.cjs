const fs = require("fs");
let code = fs.readFileSync("src/components/SeccionComunidad.jsx", "utf8");
code = code.replace(/\r\n/g, "\n");

// 1. Redondear las citas en los mensajes del chat
code = code.replace(
  'rounded-r">',
  'rounded-lg">'
);

// 2. Redondear el banner de vista previa al escribir
code = code.replace(
  'rounded-r">',
  'rounded-lg">'
);

fs.writeFileSync("src/components/SeccionComunidad.jsx", code);
console.log("✅ Esquinas de las citas y banners redondeadas con éxito.");
