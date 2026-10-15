const fs = require('fs');

const appPath = 'src/App.jsx';
if (fs.existsSync(appPath)) {
  let code = fs.readFileSync(appPath, 'utf8');

  // Bloque limpio que incluye el logo transparente entre el título y el subtítulo
  const nuevoBloqueCabecera = `<div className="text-center mb-6">
              <h1 className="font-babydoll text-6xl text-[#23211e] font-bold">gilda</h1>
              <div className="flex justify-center my-3">
                <img src="/gilda-logo.png" alt="Gilda" className="w-28 h-28 object-contain" />
              </div>
              <p className="text-xs text-[#75706b] font-sans">club de lectura, mailclub y comunidad</p>
            </div>`;

  // Buscar cualquier bloque antiguo de cabecera de bienvenida/login y reemplazarlo
  // Vamos a buscar el h1 de gilda seguido del p de club de lectura
  const regexCabecera = /<div className="text-center mb-4">\s*<h1 className="font-babydoll text-6xl text-[#23211e] font-bold">gilda<\/h1>\s*<p className="text-xs text-[#75706b] font-sans">club de lectura, mailclub y comunidad<\/p>\s*<\/div>/g;

  if (regexCabecera.test(code)) {
    code = code.replace(regexCabecera, nuevoBloqueCabecera);
    fs.writeFileSync(appPath, code, 'utf8');
    console.log("✅ ¡Cabecera actualizada con éxito en src/App.jsx usando /gilda-logo.png!");
  } else {
    // Si las clases del div diferían ligeramente, hacemos un reemplazo más directo del h1 y p
    const regexSimple = /<h1 className="font-babydoll text-6xl text-[#23211e] font-bold">gilda<\/h1>\s*<p className="text-xs text-[#75706b] font-sans">club de lectura, mailclub y comunidad<\/p>/g;
    if (regexSimple.test(code)) {
      code = code.replace(regexSimple, '<h1 className="font-babydoll text-6xl text-[#23211e] font-bold">gilda</h1>\n              <div className="flex justify-center my-3">\n                <img src="/gilda-logo.png" alt="Gilda" className="w-28 h-28 object-contain" />\n              </div>\n              <p className="text-xs text-[#75706b] font-sans">club de lectura, mailclub y comunidad</p>');
      fs.writeFileSync(appPath, code, 'utf8');
      console.log("✅ Cabecera reemplazada mediante alternativa simple.");
    } else {
      console.log("⚠️ No se encontró la estructura exacta de texto en src/App.jsx.");
    }
  }
}
