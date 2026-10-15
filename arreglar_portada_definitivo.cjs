const fs = require('fs');

const appPath = 'src/App.jsx';
if (fs.existsSync(appPath)) {
  let code = fs.readFileSync(appPath, 'utf8');

  // Reemplazar la sección de bienvenida de la vista crea-tu-gilda de forma limpia
  const bloqueAnterior = `<div className="text-center mb-4">`;
  
  // Vamos a buscar la estructura rota y unificarla correctamente
  const estructuraCorrecta = `<div className="text-center mb-6 space-y-2">
              <p className="text-xs text-[#75706b] font-sans tracking-wide">club de lectura, mailclub y comunidad</p>
              <div className="flex justify-center my-1">
                <img src="/icon-192.png" alt="Gilda" className="w-48 h-48 object-contain" />
              </div>
              <h1 className="font-babydoll text-6xl text-[#23211e] font-bold">gilda</h1>
            </div>`;

  // Limpiamos y reemplazamos el bloque superior defectuoso
  // Reemplazamos la parte superior de la vista crea-tu-gilda
  code = code.replace(/<div className="text-center mb-4">[\s\S]*?<\/div>/, estructuraCorrecta);

  // Hacemos lo mismo para la otra vista de acceso si estuviera presente
  code = code.replace(/<div className="text-center mb-6 space-y-2">[\s\S]*?<\/div>/g, estructuraCorrecta);

  fs.writeFileSync(appPath, code, 'utf8');
  console.log("✅ ¡Estructura de la portada corregida y optimizada con éxito!");
}
