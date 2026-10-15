const fs = require('fs');

console.log("=== 🫒 CONFIGURANDO EL ICONO DE LA ACEITUNA EN GILDA ===");

// 1. Corregir el nombre del archivo si existe como icon-192.png.png
if (fs.existsSync('public/icon-192.png.png')) {
  fs.renameSync('public/icon-192.png.png', 'public/icon-192.png');
  console.log("✅ Renombrado public/icon-192.png.png -> public/icon-192.png");
}

// 2. Generar la versión de alta resolución icon-512.png si no existe
if (fs.existsSync('public/icon-192.png') && !fs.existsSync('public/icon-512.png')) {
  fs.copyFileSync('public/icon-192.png', 'public/icon-512.png');
  console.log("✅ Creado public/icon-512.png para pantallas retina/alta densidad.");
}

// 3. Vincular la aceituna en el manifest.json
const manifestPath = 'public/manifest.json';
const manifestContent = {
  short_name: "Gilda",
  name: "Gilda — Club de Lectura",
  description: "Tu espacio y club de lectura interactivo.",
  icons: [
    {
      src: "/icon-192.png",
      type: "image/png",
      sizes: "192x192",
      purpose: "any maskable"
    },
    {
      src: "/icon-512.png",
      type: "image/png",
      sizes: "512x512",
      purpose: "any maskable"
    }
  ],
  start_url: "/",
  background_color: "#fbf9f5",
  theme_color: "#fbf9f5",
  display: "standalone",
  orientation: "portrait"
};

fs.writeFileSync(manifestPath, JSON.stringify(manifestContent, null, 2), 'utf8');
console.log("✅ public/manifest.json actualizado con la aceituna.");

// 4. Inyectar los favicons de la aceituna en index.html
if (fs.existsSync('index.html')) {
  let html = fs.readFileSync('index.html', 'utf8');

  // Limpiar favicons previos
  html = html.replace(/<link\s+rel=["'](manifest|apple-touch-icon|icon|shortcut icon)["'][^>]*>/gi, "");
  html = html.replace(/<meta\s+name=["'](theme-color|mobile-web-app-capable|apple-mobile-web-app-[^"']*)["'][^>]*>/gi, "");

  const pwaTags = `
    <!-- Icono Aceituna Gilda & Configuración PWA -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#fbf9f5" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Gilda" />
    <link rel="apple-touch-icon" href="/icon-192.png" />
  `;

  if (html.includes("</head>")) {
    html = html.replace("</head>", `${pwaTags}\n  </head>`);
    fs.writeFileSync('index.html', html, 'utf8');
    console.log("✅ Favicons e icono de la aceituna enlazados en index.html.");
  }
}

console.log("\n🫒 ¡Listo! La aceituna con ojitos es oficialmente el icono de tu PWA.");
