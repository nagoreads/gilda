const fs = require("fs");
const path = "src/index.css";

if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, "utf8");

  // 1. Eliminar cualquier @import de Google Fonts malformado o roto
  content = content.replace(/@import\s+url\(['"]https:\/\/fonts\.googleapis\.com\/css2\?[^'"]*['"]?\);?/g, "");
  content = content.replace(/@import\s+['"]https:\/\/fonts\.googleapis\.com\/css2\?[^'"]*['"]?;?/g, "");

  // 2. Definir los imports limpios y válidos en la cabecera
  const googleFontsImport = `@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`;

  // Limpiar espacios en blanco sobrantes al inicio
  content = content.trim();

  // 3. Recomponer el archivo asegurando que la fuente quede arriba de todo
  const nuevoCSS = `${googleFontsImport}\n\n${content}`;

  fs.writeFileSync(path, nuevoCSS, "utf8");
  console.log("✅ src/index.css reparado con la comilla y URL de fuentes corregidas.");
} else {
  console.log("⚠️ No se encontró el archivo src/index.css");
}
