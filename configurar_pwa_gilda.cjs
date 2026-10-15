const fs = require("fs");

console.log("=== 🚀 CONFIGURANDO PWA DE GILDA ===");

// 1. CORREGIR NOMBRE DE ICONO Y CREAR COPIA DE 512
if (fs.existsSync("public/icon-192.png.png")) {
  fs.renameSync("public/icon-192.png.png", "public/icon-192.png");
  console.log("✅ Renombrado public/icon-192.png.png a public/icon-192.png");
}

if (fs.existsSync("public/icon-192.png") && !fs.existsSync("public/icon-512.png")) {
  fs.copyFileSync("public/icon-192.png", "public/icon-512.png");
  console.log("✅ Creada copia public/icon-512.png para alta resolución.");
}

// 2. CREAR PUBLIC/MANIFEST.JSON
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

fs.writeFileSync("public/manifest.json", JSON.stringify(manifestContent, null, 2), "utf8");
console.log("✅ Archivo public/manifest.json generado correctamente.");

// 3. INYECTAR ETIQUETAS PWA EN INDEX.HTML
if (fs.existsSync("index.html")) {
  let html = fs.readFileSync("index.html", "utf8");

  // Limpiar etiquetas PWA previas si existieran
  html = html.replace(/<link\s+rel=["']manifest["'][^>]*>/gi, "");
  html = html.replace(/<meta\s+name=["']theme-color["'][^>]*>/gi, "");
  html = html.replace(/<meta\s+name=["']apple-mobile-web-app-[^"']*["'][^>]*>/gi, "");
  html = html.replace(/<link\s+rel=["']apple-touch-icon["'][^>]*>/gi, "");

  const pwaTags = `
    <!-- PWA Config (Gilda) -->
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#fbf9f5" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Gilda" />
    <link rel="apple-touch-icon" href="/icon-192.png" />
  `;

  // Insertar justo antes de </head>
  if (html.includes("</head>")) {
    html = html.replace("</head>", `${pwaTags}\n  </head>`);
    fs.writeFileSync("index.html", html, "utf8");
    console.log("✅ Etiquetas PWA e iOS inyectadas en index.html.");
  }
}

console.log("\n✨ ¡PWA de Gilda configurada con éxito!");
