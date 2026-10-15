const fs = require('fs');

if (fs.existsSync('src/App.jsx')) {
  let code = fs.readFileSync('src/App.jsx', 'utf8');

  // Buscar el encabezado de bienvenida y añadir la imagen de la aceituna justo antes
  const target1 = '<h1 className="font-babydoll text-6xl text-[#23211e] font-bold">gilda</h1>';
  
  const logoImg = `<div className="flex justify-center mb-2">\n                <img src="/icon-192.png" alt="Gilda" className="w-16 h-16 object-contain" />\n              </div>\n              <h1 className="font-babydoll text-6xl text-[#23211e] font-bold">gilda</h1>`;

  if (code.includes(target1)) {
    // Reemplazar todas las ocurrencias (pantalla de crea-tu-gilda y login)
    code = code.split(target1).join(logoImg);
    fs.writeFileSync('src/App.jsx', code, 'utf8');
    console.log("✅ Imagen de la aceituna lectora añadida con éxito en las pantallas de acceso de src/App.jsx");
  } else {
    console.log("⚠️ No se encontró la etiqueta exacta en src/App.jsx, revisa manualmente.");
  }
}
