const { execSync } = require('child_process');
const fs = require('fs');

console.log("=== 🔍 Restaurando MapaGilda.jsx desde el historial ===");

// 1. Restaurar MapaGilda.jsx desde un commit previo intacto
const referencias = ['HEAD~2', 'HEAD~3', 'HEAD~1', 'origin/main'];
let restaurado = false;

for (const ref of referencias) {
  try {
    execSync(`git checkout ${ref} -- src/MapaGilda.jsx`, { stdio: 'pipe' });
    console.log(`✅ MapaGilda.jsx restaurado en su estado original desde ${ref}`);
    restaurado = true;
    break;
  } catch (e) {
    // Probar siguiente referencia
  }
}

if (!restaurado) {
  console.log("⚠️ Revisa git log para identificar el commit original.");
}

// 2. Cambiar verde salvia por negro editorial (#23211e) en las notificaciones
const pushPath = "src/components/SuscribirPush.jsx";
if (fs.existsSync(pushPath)) {
  let code = fs.readFileSync(pushPath, "utf8");
  code = code.replace(/#849673/g, "#23211e");
  fs.writeFileSync(pushPath, code, "utf8");
  console.log("✅ Cambiado verde salvia por el tono editorial (#23211e) en SuscribirPush.jsx.");
}
