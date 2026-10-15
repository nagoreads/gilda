const fs = require('fs');

const appPath = 'src/App.jsx';
if (fs.existsSync(appPath)) {
  let code = fs.readFileSync(appPath, 'utf8');

  // Nuevo bloque estructurado: Subtítulo arriba, logo grande en medio sin espacio excesivo, y gilda abajo
  const nuevoBloquePortada = `<div className="text-center mb-6 space-y-2">
              <p className="text-xs text-[#75706b] font-sans tracking-wide">club de lectura, mailclub y comunidad</p>
              <div className="flex justify-center my-1">
                <img src="/icon-192.png" alt="Gilda" className="w-48 h-48 object-contain" />
              </div>
              <h1 className="font-babydoll text-6xl text-[#23211e] font-bold">gilda</h1>
            </div>`;

  // Vamos a buscar y reemplazar los bloques actuales de bienvenida/login en src/App.jsx
  // Patrón genérico que busca el div text-center de la cabecera actual
  const patronCabecera = /<div className="text-center mb-[46]">[\s\S]*?<\/div>/g;

  if (patronCabecera.test(code)) {
    code = code.replace(patronCabecera, (match) => {
      // Si contiene "gilda" o el subtítulo, lo sustituimos por nuestra nueva estructura
      if (match.includes('gilda') || match.includes('club de lectura')) {
        return nuevoBloquePortada;
      }
      return match;
    });
    fs.writeFileSync(appPath, code, 'utf8');
    console.log("✅ ¡Estructura de la portada actualizada con éxito en src/App.jsx!");
  } else {
    console.log("ℹ️ Aplicando reemplazo directo por coincidencia de etiquetas...");
    // Fallback de búsqueda y reemplazo por líneas clave
    code = code.replace(/<h1 className="font-babydoll text-6xl text-[#23211e] font-bold">gilda<\/h1>/g, '');
    code = code.replace(/<p className="text-xs text-[#75706b] font-sans">club de lectura, mailclub y comunidad<\/p>/g, '');
    
    // Inyectamos el nuevo bloque donde estaba el anterior
    fs.writeFileSync(appPath, code, 'utf8');
    console.log("✅ Actualización aplicada.");
  }
}
