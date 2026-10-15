const fs = require("fs");

// 1. Limpiar App.jsx
if (fs.existsSync("src/App.jsx")) {
  let codeApp = fs.readFileSync("src/App.jsx", "utf8").replace(/\r\n/g, "\n");
  codeApp = codeApp.replace(/<SuscribirPush\s+sesion=\{sesion\}\s+supabase=\{supabase\}\s*\/>/g, "");
  fs.writeFileSync("src/App.jsx", codeApp);
  console.log("✅ Limpiado App.jsx");
}

// 2. Colocar en SeccionPerfil.jsx
const rutas = ["src/components/SeccionPerfil.jsx", "src/SeccionPerfil.jsx"];
let rutaEncontrada = rutas.find(r => fs.existsSync(r));

if (rutaEncontrada) {
  let codePerfil = fs.readFileSync(rutaEncontrada, "utf8").replace(/\r\n/g, "\n");
  
  if (!codePerfil.includes("SuscribirPush")) {
    const importPath = rutaEncontrada.includes("components") ? "./SuscribirPush" : "./components/SuscribirPush";
    codePerfil = `import SuscribirPush from '${importPath}';\n` + codePerfil;
    
    const lastDivIndex = codePerfil.lastIndexOf("</div>");
    if (lastDivIndex !== -1) {
      const bloque = `\n      {/* Centro de Notificaciones Push */}\n      <div className="mt-6 pt-4 border-t border-[#e8e4d9]">\n        <SuscribirPush sesion={sesion} supabase={supabase} />\n      </div>\n`;
      codePerfil = codePerfil.slice(0, lastDivIndex) + bloque + codePerfil.slice(lastDivIndex);
      fs.writeFileSync(rutaEncontrada, codePerfil);
      console.log(`✅ Añadido a ${rutaEncontrada}`);
    }
  }
}
