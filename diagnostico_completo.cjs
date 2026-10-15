const fs = require("fs");
const code = fs.readFileSync("src/components/SeccionComunidad.jsx", "utf8");
const lines = code.split(/\r?\n/);

console.log("=== 1. CÓMO SE RENDERIZAN LOS MENSAJES Y BOTÓN RESPONDER ===");
lines.forEach((l, i) => {
  if (l.includes("m.usuario") || l.includes("m.mensaje") || l.includes("responder") || l.includes("setMensajeRespuesta")) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
});

console.log("\n=== 2. BLOQUE DEL FORMULARIO Y SUBMIT DE CHAT ===");
let insideForm = false;
lines.forEach((l, i) => {
  if (l.includes("<form") || l.includes("onSubmit")) insideForm = true;
  if (insideForm) {
    console.log(`L${i+1}: ${l}`);
    if (l.includes("</form>")) insideForm = false;
  }
});
