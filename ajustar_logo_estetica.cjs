const fs = require('fs');

if (fs.existsSync('src/App.jsx')) {
  let code = fs.readFileSync('src/App.jsx', 'utf8');

  // El bloque que habíamos puesto antes
  const bloqueAnterior = `<div className="flex justify-center mb-2">\n                <img src="/icon-192.png" alt="Gilda" className="w-16 h-16 object-contain" />\n              </div>`;
  
  // Nuevo bloque con mayor tamaño (w-28 h-28 o w-32 h-32) y mix-blend-mode para eliminar el fondo visualmente
  const bloqueNuevo = `<div className="flex justify-center mb-3">\n                <img src="/icon-192.png" alt="Gilda" className="w-28 h-28 object-contain mix-blend-multiply" />\n              </div>`;

  if (code.includes(bloqueAnterior)) {
    code = code.split(bloqueAnterior).join(bloqueNuevo);
    fs.writeFileSync('src/App.jsx', code, 'utf8');
    console.log("✅ Logo ampliado y configurado sin fondo (mix-blend-multiply) en src/App.jsx");
  } else {
    // Por si acaso el bloque anterior tenía ligeras diferencias de formato
    console.log("ℹ️ Buscando y reemplazando cualquier variante del logo en src/App.jsx...");
    // Reemplazamos cualquier etiqueta img de icon-192.png en la vista de acceso
    code = code.replace(/<img\s+src="\/icon-192\.png"[^>]*>/g, '<img src="/icon-192.png" alt="Gilda" className="w-28 h-28 object-contain mix-blend-multiply" />');
    fs.writeFileSync('src/App.jsx', code, 'utf8');
    console.log("✅ Actualización de tamaño y estilo aplicada.");
  }
}
