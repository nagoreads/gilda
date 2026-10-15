const fs = require('fs');
const path = require('path');

// 1. Buscar archivos de fuente en public o src
function buscarFuente(dir) {
  if (!fs.existsSync(dir)) return null;
  const archivos = fs.readdirSync(dir, { recursive: true });
  for (const archivo of archivos) {
    if (archivo.toLowerCase().includes('babydoll') && (archivo.endsWith('.ttf') || archivo.endsWith('.woff') || archivo.endsWith('.woff2') || archivo.endsWith('.otf'))) {
      return archivo.replace(/\\/g, '/');
    }
  }
  return null;
}

let rutaFuente = buscarFuente('public') ? `/${buscarFuente('public')}` : null;

if (!rutaFuente) {
  console.log("🔍 Buscando fuentes en el proyecto...");
}

const htmlPath = 'index.html';
if (fs.existsSync(htmlPath)) {
  let html = fs.readFileSync(htmlPath, 'utf8');

  // Intentar deducir la ruta pública común si existe
  const fontHref = rutaFuente || '/fonts/BabyDoll.ttf'; 

  // Inyectar el link rel="preload" si no está ya
  if (!html.includes('rel="preload"') || !html.includes('BabyDoll')) {
    const preloadTag = `\n    <!-- Precarga instantánea de fuente BabyDoll -->\n    <link rel="preload" href="${fontHref}" as="font" type="font/ttf" crossorigin="anonymous">`;
    
    html = html.replace('</head>', `${preloadTag}\n  </head>`);
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log(`✅ Preload añadido en index.html para: ${fontHref}`);
  } else {
    console.log("ℹ️ La precarga ya estaba presente en index.html");
  }
}

// 2. Asegurar font-display: swap en CSS
const cssFiles = ['src/index.css', 'src/App.css'];
cssFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let css = fs.readFileSync(file, 'utf8');
    if (css.includes('@font-face') && !css.includes('font-display:')) {
      css = css.replace(/@font-face\s*\{/g, '@font-face {\n  font-display: swap;');
      fs.writeFileSync(file, css, 'utf8');
      console.log(`✅ Se añadió font-display: swap a ${file}`);
    }
  }
});
