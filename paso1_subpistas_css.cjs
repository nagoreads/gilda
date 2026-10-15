const fs = require('fs');

const cssPath = fs.existsSync('src/index.css') ? 'src/index.css' : (fs.existsSync('src/App.css') ? 'src/App.css' : null);

if (cssPath) {
  let css = fs.readFileSync(cssPath, 'utf8');

  const estilosPaso1 = `

/* ==========================================
   PASO 1: SUBPESTAÑAS ESTILO DIARIO / FANZINE
   ========================================== */

/* Suavizar el contenedor de las pestañas superiores */
div:has(> button[onClick*="setSubTabInicio"]) {
  background-color: rgba(255, 255, 255, 0.6) !important;
  border-color: #e8e4d9 !important;
  border-radius: 9999px !important;
  padding: 3px !important;
}

/* Estilo táctil suave para los botones activos e inactivos de Inicio */
button[onClick*="setSubTabInicio"] {
  font-family: inherit !important;
  letter-spacing: -0.01em !important;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}

button[onClick*="setSubTabInicio"]:hover {
  opacity: 0.9 !important;
}

button[onClick*="setSubTabInicio"]:active {
  transform: scale(0.96) !important;
}
`;

  if (!css.includes('PASO 1: SUBPESTAÑAS ESTILO DIARIO')) {
    css += estilosPaso1;
    fs.writeFileSync(cssPath, css, 'utf8');
    console.log("✅ Paso 1 aplicado con éxito en el CSS.");
  } else {
    console.log("ℹ️ El Paso 1 ya estaba presente en el CSS.");
  }
}
