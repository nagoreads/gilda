const fs = require("fs");

console.log("=== 1. CONSULTA A SUPABASE (CÓMO SE LEEN LOS MENSAJES) ===");
['src/App.jsx', 'src/components/SeccionComunidad.jsx'].forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.match(/from\(['"]chat_messages['"]\)\.select\([^)]*\)/g);
    if (matches) {
      console.log(`En ${file}:`, matches);
    }
  }
});

console.log("\n=== 2. CÓMO SE ENVÍA EL MENSAJE EN SeccionComunidad.jsx ===");
if (fs.existsSync('src/components/SeccionComunidad.jsx')) {
  const code = fs.readFileSync('src/components/SeccionComunidad.jsx', 'utf8');
  const lines = code.split(/\r?\n/);
  lines.forEach((l, idx) => {
    if (l.includes("chat_messages") && l.includes("insert")) {
      console.log(`--- Alrededor de línea ${idx + 1} ---`);
      console.log(lines.slice(Math.max(0, idx - 8), Math.min(lines.length, idx + 12)).join("\n"));
    }
  });
}
