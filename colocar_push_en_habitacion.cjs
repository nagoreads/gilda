const fs = require("fs");

// 1. Asegurar que App.jsx le pasa `supabase` a SeccionHabitacion
if (fs.existsSync("src/App.jsx")) {
  let appCode = fs.readFileSync("src/App.jsx", "utf8");
  
  // Limpiar renderizado flotante previo en App.jsx si existiera
  appCode = appCode.replace(/<SuscribirPush\s+sesion=\{sesion\}\s+supabase=\{supabase\}\s*\/>/g, "");
  
  // Inyectar prop supabase si no la tenía
  if (appCode.includes("<SeccionHabitacion") && !appCode.includes("supabase={supabase}")) {
    appCode = appCode.replace("<SeccionHabitacion", "<SeccionHabitacion\n            supabase={supabase}");
  }
  
  fs.writeFileSync("src/App.jsx", appCode);
  console.log("✅ App.jsx actualizado para pasar 'supabase' a SeccionHabitacion.");
}

// 2. Inyectar SuscribirPush dentro de SeccionHabitacion.jsx
const rutaHabitacion = "src/components/SeccionHabitacion.jsx";

if (fs.existsSync(rutaHabitacion)) {
  let code = fs.readFileSync(rutaHabitacion, "utf8");
  
  // Añadir import si no existe
  if (!code.includes("SuscribirPush")) {
    code = "import SuscribirPush from './SuscribirPush';\n" + code;
  }
  
  // Asegurar que SeccionHabitacion acepte la prop `supabase`
  if (!code.includes("supabase")) {
    code = code.replace(/function\s+SeccionHabitacion\s*\(\s*\{/, "function SeccionHabitacion({ supabase, ");
  }

  // Inyectar el componente de notificaciones al final antes del último </div>
  if (!code.includes("<SuscribirPush")) {
    const lastDivIndex = code.lastIndexOf("</div>");
    if (lastDivIndex !== -1) {
      const bloquePush = `\n      {/* Centro de Notificaciones Push */}\n      <div className="mt-6 pt-4 border-t border-[#e8e4d9] px-4">\n        <SuscribirPush sesion={sesion} supabase={supabase} />\n      </div>\n`;
      code = code.slice(0, lastDivIndex) + bloquePush + code.slice(lastDivIndex);
    }
  }

  fs.writeFileSync(rutaHabitacion, code);
  console.log("✅ SuscribirPush insertado correctamente dentro de SeccionHabitacion.jsx");
} else {
  console.log("⚠️ No se encontró src/components/SeccionHabitacion.jsx");
}
