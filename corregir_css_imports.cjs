const fs = require("fs");
const path = require("path");

function corregirArchivoCSS(filePath) {
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  
  const imports = [];
  const resto = [];

  for (const line of lines) {
    if (line.trim().startsWith("@import ")) {
      imports.push(line);
    } else {
      resto.push(line);
    }
  }

  if (imports.length > 0) {
    const nuevoContenido = [...imports, "", ...resto].join("\n");
    fs.writeFileSync(filePath, nuevoContenido);
    console.log(`✅ @import movidos al inicio en: ${filePath}`);
  }
}

// Buscar todos los CSS en src/
const files = fs.readdirSync("src").filter(f => f.endsWith(".css"));
files.forEach(f => corregirArchivoCSS(path.join("src", f)));
