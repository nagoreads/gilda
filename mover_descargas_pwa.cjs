const fs = require('fs');
const path = require('path');
const os = require('os');

const downloadsDir = path.join(os.homedir(), 'Downloads');
const publicDir = path.join(process.cwd(), 'public');

console.log("🔍 Buscando imágenes en:", downloadsDir);

if (!fs.existsSync(downloadsDir)) {
  console.log("❌ No se encontró la carpeta de Descargas.");
  process.exit(1);
}

const files = fs.readdirSync(downloadsDir);

// Filtrar archivos de imagen recientes que coincidan con los iconos
const imgFiles = files
  .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
  .map(f => ({
    name: f,
    fullPath: path.join(downloadsDir, f),
    mtime: fs.statSync(path.join(downloadsDir, f)).mtimeMs
  }))
  .sort((a, b) => b.mtime - a.mtime);

if (imgFiles.length === 0) {
  console.log("⚠️ No se encontraron archivos de imagen recientes en Descargas.");
} else {
  // Intentar buscar icon-192 e icon-512 o coger los 2 más recientes
  let target192 = imgFiles.find(f => f.name.includes('192')) || imgFiles[0];
  let target512 = imgFiles.find(f => f.name.includes('512')) || imgFiles[1] || imgFiles[0];

  if (target192) {
    fs.copyFileSync(target192.fullPath, path.join(publicDir, 'icon-192.png'));
    console.log(`✅ Copiado ${target192.name} -> public/icon-192.png`);
  }

  if (target512) {
    fs.copyFileSync(target512.fullPath, path.join(publicDir, 'icon-512.png'));
    console.log(`✅ Copiado ${target512.name} -> public/icon-512.png`);
  }
}
