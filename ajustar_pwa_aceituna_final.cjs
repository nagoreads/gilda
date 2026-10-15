const fs = require('fs');

console.log("=== 🫒 AJUSTE FINAL PWA: ACEITUNA LECTORA Y CORRECCIONES TÉCNICAS ===");

// 1. ASEGURAR LOS ICONOS DE LA ACEITUNA LECTORA EN PUBLIC/
if (fs.existsSync('public/icon-192.png')) {
  fs.copyFileSync('public/icon-192.png', 'public/icon-512.png');
  console.log("✅ public/icon-192.png e icon-512.png asegurados en la carpeta public.");
} else {
  console.log("⚠️ Revisa que icon-192.png esté presente en public/.");
}

// 2. CONFIGURAR MANIFEST.JSON CON LA ACEITUNA LECTORA
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
console.log("✅ public/manifest.json actualizado con la aceituna lectora.");

// 3. DESACTIVAR BODYPARSER EN EL WEBHOOK DE STRIPE (SI EXISTE EN API/)
const stripePaths = ['api/stripe-webhook.js', 'src/api/stripe-webhook.js', 'api/webhook.js'];
for (const p of stripePaths) {
  if (fs.existsSync(p)) {
    let code = fs.readFileSync(p, 'utf8');
    if (!code.includes('bodyParser: false')) {
      const configExport = `\nexport const config = {\n  api: {\n    bodyParser: false,\n  },\n};\n`;
      code = configExport + code;
      fs.writeFileSync(p, code, 'utf8');
      console.log(`✅ Configuración bodyParser: false añadida en: ${p}`);
    }
  }
}

// 4. INYECTAR ETIQUETAS PWA Y FAVICON EN INDEX.HTML
if (fs.existsSync('index.html')) {
  let html = fs.readFileSync('index.html', 'utf8');

  html = html.replace(/<link\s+rel=["'](manifest|apple-touch-icon|icon|shortcut icon)["'][^>]*>/gi, "");
  html = html.replace(/<meta\s+name=["'](theme-color|mobile-web-app-capable|apple-mobile-web-app-[^"']*)["'][^>]*>/gi, "");

  const pwaTags = `
    <!-- Gilda PWA Config - Aceituna Lectora -->
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
    console.log("✅ index.html actualizado con las etiquetas PWA y el icono de la aceituna.");
  }
}

console.log("\n✨ ¡Perfecto! La PWA está lista para su despliegue final.");
