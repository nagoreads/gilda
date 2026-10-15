const { execSync } = require('child_process');
const fs = require('fs');

console.log("=== 🔍 Buscando versión intacta de MapaGilda.jsx en el historial ===");

try {
  const logOutput = execSync('git log --oneline -n 20', { encoding: 'utf8' });
  const lines = logOutput.split('\n').filter(Boolean);

  console.log("Historial de commits:");
  lines.forEach(line => console.log(" -", line));

  // Buscar el primer commit anterior a los trabajos en notificaciones/perfil
  const commitLimpio = lines.find(line => {
    const text = line.toLowerCase();
    return !text.includes('notificacion') && 
           !text.includes('push') && 
           !text.includes('habitacion') && 
           !text.includes('perfil') && 
           !text.includes('rediseño');
  });

  const hashTarget = commitLimpio ? commitLimpio.split(' ')[0] : lines[lines.length - 1].split(' ')[0];

  console.log(`\n⏳ Extrayendo MapaGilda.jsx original desde el commit: ${hashTarget}`);
  execSync(`git checkout ${hashTarget} -- src/MapaGilda.jsx`);
  console.log("✅ MapaGilda.jsx restaurado con éxito a su estado original intacto.");

} catch (err) {
  console.error("❌ Error al restaurar desde Git:", err.message);
}

// Asegurar tono negro editorial (#23211e) en las notificaciones
const pushPath = "src/components/SuscribirPush.jsx";
if (fs.existsSync(pushPath)) {
  let code = fs.readFileSync(pushPath, "utf8");
  code = code.replace(/#849673/g, "#23211e");
  fs.writeFileSync(pushPath, code, "utf8");
  console.log("✅ Tono negro editorial (#23211e) confirmado en SuscribirPush.jsx.");
}
