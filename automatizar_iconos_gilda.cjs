const fs = require('fs');
const path = require('path');
const os = require('os');

const downloadsDir = path.join(os.homedir(), 'Downloads');
const publicDir = path.join(process.cwd(), 'public');

console.log("🔍 Buscando la imagen sin fondo en la carpeta de Descargas...");

if (!fs.existsSync(downloadsDir)) {
  console.log("❌ No se encontró la carpeta de Descargas.");
  process.exit(1);
}

// Listar y ordenar archivos de imagen en Descargas por fecha de modificación (el más reciente primero)
const files = fs.readdirSync(downloadsDir);
const imgFiles = files
  .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
  .map(f => ({
    name: f,
    fullPath: path.join(downloadsDir, f),
    mtime: fs.statSync(path.join(downloadsDir, f)).mtimeMs
  }))
  .sort((a, b) => b.mtime - a.mtime);

if (imgFiles.length === 0) {
  console.log("⚠️ No se encontraron imágenes recientes en Descargas.");
  process.exit(1);
}

// El archivo más reciente es el que acabas de descargar
const latestImage = imgFiles[0];
console.log(`✨ Imagen encontrada: ${latestImage.name}`);

// Copiar y renombrar a icon-192.png e icon-512.png
const dest192 = path.join(publicDir, 'icon-192.png');
const dest512 = path.join(publicDir, 'icon-512.png');

fs.copyFileSync(latestImage.fullPath, dest192);
fs.copyFileSync(latestImage.fullPath, dest512);

console.log("✅ ¡Copiado con éxito a public/icon-192.png!");
console.log("✅ ¡Copiado con éxito a public/icon-512.png!");
console.log("🫒 Tu PWA y la pantalla de bienvenida ya están listas con la nueva aceituna transparente.");
