const fs = require('fs');

console.log("=== 🫒 REEMPLAZANDO RAYO MORADO POR LA ACEITUNA LECTORA ===");

// 1. Sobrescribir public/favicon.svg usando la imagen de la aceituna png
if (fs.existsSync('public/icon-192.png')) {
  fs.copyFileSync('public/icon-192.png', 'public/favicon.png');
  console.log("✅ Creado public/favicon.png desde la aceituna lectora.");
}

// 2. Actualizar index.html para apuntar a la aceituna en lugar del favicon de Vite
if (fs.existsSync('index.html')) {
  let html = fs.readFileSync('index.html', 'utf8');

  // Eliminar referencias viejas a favicons o al rayo svg
  html = html.replace(/<link\s+rel=["'](icon|shortcut icon)["'][^>]*>/gi, "");

  // Inyectar el nuevo favicon de la aceituna justo antes de </head>
  const faviconTag = `\n    <link rel="icon" type="image/png" href="/favicon.png" />\n    <link rel="apple-touch-icon" href="/icon-192.png" />\n`;

  if (html.includes("</head>")) {
    html = html.replace("</head>", `${faviconTag}  </head>`);
    fs.writeFileSync('index.html', html, 'utf8');
    console.log("✅ index.html actualizado: Rayo morado eliminado y sustituido por la aceituna.");
  }
}

