const fs = require("fs");
let code = fs.readFileSync("src/components/SeccionComunidad.jsx", "utf8");
code = code.replace(/\r\n/g, "\n");

// Reemplazar el bloque de la cita por una versión con contraste claro y legibilidad perfecta
const viejoEstiloCita = /<div className="mb-1\.5 p-1\.5 bg-[#23211e]\/5 border-l-2 border-[#23211e] text-[10px] text-gray-600 rounded-r">/g;

const nuevoEstiloCita = `<div className="mb-1.5 p-2 bg-[#f2efe6] border-l-2 border-[#23211e] text-[11px] text-[#33312e] rounded-r">`;

if (viejoEstiloCita.test(code)) {
  code = code.replace(viejoEstiloCita, nuevoEstiloCita);
  fs.writeFileSync("src/components/SeccionComunidad.jsx", code);
  console.log("✅ Color de texto y contraste de la cita actualizados con éxito.");
} else {
  // Reemplazo directo en el bloque si la coincidencia varía
  code = code.replace(
    'bg-[#23211e]/5 border-l-2 border-[#23211e] text-[10px] text-gray-600',
    'bg-[#f2efe6] border-l-2 border-[#23211e] text-[11px] text-[#33312e]'
  );
  fs.writeFileSync("src/components/SeccionComunidad.jsx", code);
  console.log("✅ Estilos de contraste aplicados.");
}
