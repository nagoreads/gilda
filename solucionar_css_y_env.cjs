const fs = require("fs");
const path = require("path");

// 1. REPARAR ARCHIVOS CSS (Mover @import arriba de todo)
function arreglarCss(dir) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      if (item !== 'node_modules' && item !== '.git') arreglarCss(fullPath);
    } else if (item.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const importRegex = /@import\s+[^;]+;/g;
      const imports = content.match(importRegex) || [];
      
      if (imports.length > 0) {
        let sinImports = content.replace(importRegex, '');
        const nuevoContenido = imports.join('\n') + '\n\n' + sinImports.trimStart();
        fs.writeFileSync(fullPath, nuevoContenido, 'utf8');
        console.log(`✅ En ordenados @import en: ${fullPath}`);
      }
    }
  }
}

arreglarCss('./src');

// 2. VERIFICAR/CREAR VITE.CONFIG.JS CON ENVPREFIX
let viteConfig = fs.existsSync("vite.config.js") ? fs.readFileSync("vite.config.js", "utf8") : "";
if (viteConfig && !viteConfig.includes("envPrefix")) {
  viteConfig = viteConfig.replace(
    "defineConfig({",
    "defineConfig({\n  envPrefix: ['VITE_', 'VAPID_'],"
  );
  fs.writeFileSync("vite.config.js", viteConfig);
  console.log("✅ vite.config.js actualizado con envPrefix.");
}

// 3. MENSAJE EN SUSCRIBIRPUSH.JSX PARA ENTORNO LOCAL
const pathPush = "src/components/SuscribirPush.jsx";
if (fs.existsSync(pathPush)) {
  let codePush = fs.readFileSync(pathPush, "utf8");
  codePush = codePush.replace(
    "setMensaje('Falta configurar la clave VAPID en Vercel.');",
    "setMensaje('Clave VAPID no detectada en .env.local (se activará al desplegar en Vercel).');"
  );
  fs.writeFileSync(pathPush, codePush);
}

