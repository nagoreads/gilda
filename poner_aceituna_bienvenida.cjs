const fs = require('fs');
const path = require('path');

console.log("=== 🫒 AÑADIENDO ACEITUNA LECTORA A LA PANTALLA DE ENTRADA ===");

// Buscar componentes donde se renderice la pantalla de bienvenida o login
const componentesPosibles = [
  'src/components/Bienvenida.jsx',
  'src/components/Login.jsx',
  'src/components/Splash.jsx',
  'src/App.jsx'
];

let cambiado = false;

// Script de reemplazo visual
function reemplazarLogoEnArchivo(filePath) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Reemplazar referencias a SVGs viejos o imágenes previas en la cabecera/bienvenida
    const patronLogo = /src=["']\/?(favicon\.svg|icons\.svg|logo[^"']*|vite\.svg)["']/gi;
    
    if (patronLogo.test(content)) {
      content = content.replace(patronLogo, 'src="/icon-192.png"');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Imagen del logo actualizada a la Aceituna Lectora en: ${filePath}`);
      cambiado = true;
    }
  }
}

componentesPosibles.forEach(reemplazarLogoEnArchivo);

if (!cambiado) {
  console.log("ℹ️ Revisa si el componente de bienvenida tiene otro nombre específico en src/components/.");
}

