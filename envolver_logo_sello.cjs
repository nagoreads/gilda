const fs = require('fs');

if (fs.existsSync('src/App.jsx')) {
  let code = fs.readFileSync('src/App.jsx', 'utf8');

  // Buscar el bloque actual de la imagen
  const bloqueActual = `<div className="flex justify-center mb-3">\n                <img src="/icon-192.png" alt="Gilda" className="w-28 h-28 object-contain mix-blend-multiply" />\n              </div>`;

  // Nuevo bloque: un círculo elegante (badge) con el color de fondo de la app y borde editorial
  const bloqueSello = `<div className="flex justify-center mb-4">\n                <div className="w-28 h-28 rounded-full bg-[#fbf9f5] border-2 border-[#e8e4d9] flex items-center justify-center p-2 shadow-sm">\n                  <img src="/icon-192.png" alt="Gilda" className="w-full h-full object-contain" />\n                </div>\n              </div>`;

  if (code.includes(bloqueActual)) {
    code = code.split(bloqueActual).join(bloqueSello);
    fs.writeFileSync('src/App.jsx', code, 'utf8');
    console.log("✅ Logo transformado en un sello circular integrado en src/App.jsx");
  } else {
    // Alternativa por si las clases variaban ligeramente
    code = code.replace(/<img\s+src="\/icon-192\.png"[^>]*>/g, '<div className="w-28 h-28 rounded-full bg-[#fbf9f5] border-2 border-[#e8e4d9] flex items-center justify-center p-2 shadow-sm"><img src="/icon-192.png" alt="Gilda" className="w-full h-full object-contain" /></div>');
    fs.writeFileSync('src/App.jsx', code, 'utf8');
    console.log("✅ Contenedor circular aplicado con éxito.");
  }
}
