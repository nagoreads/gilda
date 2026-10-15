const fs = require('fs');

const appPath = 'src/App.jsx';
if (fs.existsSync(appPath)) {
  let code = fs.readFileSync(appPath, 'utf8');

  // Buscar cualquier etiqueta h1 que contenga "gilda"
  const targetTag = '<h1 className="font-babydoll text-6xl text-[#23211e] font-bold">gilda</h1>';
  
  if (code.includes(targetTag)) {
    // Vamos a reemplazar todas las ocurrencias del título principal añadiendo la aceituna justo debajo
    const replacement = `${targetTag}\n              <div className="flex justify-center my-3">\n                <img src="/gilda-logo.png" alt="Gilda" className="w-28 h-28 object-contain" />\n              </div>`;
    
    // Solo reemplazamos la primera o las de la pantalla de bienvenida/login
    code = code.replace(targetTag, replacement);
    fs.writeFileSync(appPath, code, 'utf8');
    console.log("✅ ¡Logrado! La aceituna transparente (/gilda-logo.png) se ha insertado correctamente debajo del título 'gilda'.");
  } else {
    console.log("⚠️ No se encontró la etiqueta h1 exacta. Revisa si el nombre de la clase es diferente.");
  }
}
