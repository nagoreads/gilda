const fs = require("fs");
const path = require("path");

console.log("=== 🛠️ REPARACIÓN INTEGRAL DE GILDA ===");

// 1. BUSCAR ARCHIVO DE FUENTE BABYDOLL Y CONFIGURAR INDEX.CSS
let rutaBabyDoll = null;
function buscarFuente(dir) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory() && item !== 'node_modules' && item !== '.git') {
      buscarFuente(full);
    } else if (item.toLowerCase().includes('babydoll')) {
      rutaBabyDoll = full.replace(/\\/g, '/');
    }
  }
}
buscarFuente('./public');
buscarFuente('./src');

let fontUrl = '/fonts/BabyDoll.ttf';
if (rutaBabyDoll) {
  if (rutaBabyDoll.startsWith('public/')) {
    fontUrl = '/' + rutaBabyDoll.replace('public/', '');
  } else {
    fontUrl = '/' + rutaBabyDoll;
  }
}

const indexPath = "src/index.css";
if (fs.existsSync(indexPath)) {
  let css = fs.readFileSync(indexPath, "utf8");

  // Limpiar versiones anteriores
  css = css.replace(/@import\s+url\(['"]https:\/\/fonts\.googleapis\.com\/css2\?[^'"]*['"]?\);?/g, "");
  css = css.replace(/@font-face\s*\{[^}]*font-family:\s*['"]BabyDoll['"][^}]*\}/gi, "");
  css = css.replace(/\.font-babydoll\s*\{[^}]*\}/gi, "");

  const googleImport = `@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`;

  const babyDollFontFace = `
@font-face {
  font-family: 'BabyDoll';
  src: url('${fontUrl}') format('truetype');
  font-weight: normal;
  font-style: normal;
}

.font-babydoll {
  font-family: 'BabyDoll', 'Lora', cursive, sans-serif !important;
}
`;

  fs.writeFileSync(indexPath, `${googleImport}\n${babyDollFontFace}\n\n${css.trim()}`, "utf8");
  console.log(`✅ Fuente BabyDoll restaurada en src/index.css (Ruta: ${fontUrl})`);
}

// 2. REPARAR Y REFORZAR MAPAGILDA.JSX (País Vasco / Euskadi)
const mapaPath = "src/MapaGilda.jsx";
if (fs.existsSync(mapaPath)) {
  let mapaCode = fs.readFileSync(mapaPath, "utf8");

  // Si existe función de normalizar ubicación, la reforzamos para variantes vascas
  if (mapaCode.includes("function normalizarUbicacion") || mapaCode.includes("const normalizar")) {
    mapaCode = mapaCode.replace(
      /(function\s+normalizarUbicacion\s*\([^)]*\)\s*\{)([\s\S]*?)(\})/,
      `$1
      if (!u) return 'no_especificado';
      const clean = u.toString().toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").trim();
      if (clean.includes('pais vasco') || clean.includes('euskadi') || clean.includes('bizkaia') || clean.includes('gipuzkoa') || clean.includes('alava') || clean.includes('araba') || clean.includes('vizcaya') || clean.includes('guipuzcoa')) {
        return 'pais_vasco';
      }
      $2
$3`
    );
    fs.writeFileSync(mapaPath, mapaCode, "utf8");
    console.log("✅ Reconocimiento de País Vasco / Euskadi asegurado en MapaGilda.jsx");
  } else {
    console.log("ℹ️ MapaGilda.jsx inspeccionado.");
  }
}

// 3. REESTRUCTURAR LIMPIAMENTE SECCIONHABITACION.JSX
const habPath = "src/components/SeccionHabitacion.jsx";
if (fs.existsSync(habPath)) {
  let habCode = fs.readFileSync(habPath, "utf8");

  // Quitar duplicados o inserciones previas
  habCode = habCode.replace(/\{\/\* Centro de Notificaciones Push \*\/\}[\s\S]*?<\/div>\n?/g, "");
  habCode = habCode.replace(/<SuscribirPush[^>]*\/>/g, "");

  // Reinsertar limpiamente al final de la habitación
  const posReturn = habCode.lastIndexOf("return");
  const posDivCierre = habCode.lastIndexOf("</div>");

  if (posDivCierre > posReturn) {
    const bloquePush = `
      {/* Centro de Notificaciones Push */}
      <div className="mt-8 pt-6 border-t border-[#e8e4d9]">
        <SuscribirPush sesion={sesion} supabase={supabase} />
      </div>
    `;
    habCode = habCode.slice(0, posDivCierre) + bloquePush + habCode.slice(posDivCierre);
    fs.writeFileSync(habPath, habCode, "utf8");
    console.log("✅ SeccionHabitacion.jsx estructurada limpiamente.");
  }
}

// 4. APLICAR FUENTE BABYDOLL EN SUSCRIBIRPUSH.JSX
const pushPath = "src/components/SuscribirPush.jsx";
if (fs.existsSync(pushPath)) {
  let pushCode = fs.readFileSync(pushPath, "utf8");
  pushCode = pushCode.replace(
    /h3 className="[^"]*"/,
    'h3 className="font-babydoll text-base text-[#23211e] tracking-wide"'
  );
  fs.writeFileSync(pushPath, pushCode, "utf8");
  console.log("✅ Aplicada la fuente 'font-babydoll' en el título de notificaciones.");
}

console.log("\n✨ Reparación completada.");
