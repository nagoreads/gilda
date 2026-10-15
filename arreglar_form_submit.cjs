const fs = require("fs");
let code = fs.readFileSync("src/components/SeccionComunidad.jsx", "utf8");
code = code.replace(/\r\n/g, "\n");

// 1. Arreglar el onSubmit del Chat Global
code = code.replace(
  /onSubmit=\{async\s*\(\)\s*=>\s*\{/g,
  "onSubmit={async (e) => {\n                e.preventDefault();"
);

// 2. Si tenía e en el argumento pero no el preventDefault
code = code.replace(
  /onSubmit=\{async\s*\(e\)\s*=>\s*\{(?!\s*e\.preventDefault\(\);)/g,
  "onSubmit={async (e) => {\n                e.preventDefault();"
);

fs.writeFileSync("src/components/SeccionComunidad.jsx", code);

if (code.includes("e.preventDefault()")) {
  console.log("✅ ÉXITO: e.preventDefault() añadido correctamente a los formularios de chat.");
} else {
  console.log("⚠️ Revisa el archivo si no se aplicó.");
}
