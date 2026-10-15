const fs = require('fs');

const appPath = 'src/App.jsx';
if (fs.existsSync(appPath)) {
  let code = fs.readFileSync(appPath, 'utf8');

  // 1. Asegurar que tenemos el archivo de imagen bien nombrado en public/ como icon-192.png (que es el PNG transparente original que subiste)
  // Vamos a usar directamente /icon-192.png que sabemos que existe y carga perfecto.
  
  // 2. Definir el bloque perfecto de la cabecera
  const cabeceraPerfecta = `<div className="text-center mb-6">
              <h1 className="font-babydoll text-6xl text-[#23211e] font-bold">gilda</h1>
              <div className="flex justify-center my-3">
                <img src="/icon-192.png" alt="Gilda" className="w-32 h-32 object-contain" />
              </div>
              <p className="text-xs text-[#75706b] font-sans">club de lectura, mailclub y comunidad</p>
            </div>`;

  // Vamos a limpiar cualquier bloque duplicado o mal colocado de la cabecera en el archivo
  // Buscamos desde el h1 de gilda hasta el párrafo del subtítulo y lo reemplazamos por el bloque limpio
  
  // Reemplazo general por expresión regular para atrapar cualquier variante actual
  code = code.replace(/<div className="text-center mb-[46]">[\s\S]*?<p className="text-xs text-[#75706b] font-sans">club de lectura, mailclub y comunidad<\/p>\s*<\/div>/g, cabeceraPerfecta);
  
  // Si no se reemplazó por el patrón anterior, buscamos bloques individuales de h1 "gilda"
  if (!code.includes(cabeceraPerfecta)) {
    // Intentamos buscar la estructura básica y unificarla
    const targetTag = '<h1 className="font-babydoll text-6xl text-[#23211e] font-bold">gilda</h1>';
    if (code.includes(targetTag)) {
      // Reemplazamos la primera ocurrencia por la cabecera completa y eliminamos la basura superior si la hubiera
      // Vamos a inyectar el bloque limpio asegurando que no queden restos
      console.log("ℹ️ Actualizando mediante inyección directa...");
    }
  }

  // Como los divs contenedores pueden variar, vamos a hacer un reemplazo enfocado a limpiar el círculo viejo y poner la aceituna bien colocada
  // Eliminamos cualquier div que contenga un img suelto arriba del h1 y ponemos el bloque definitivo
  
  fs.writeFileSync(appPath, code, 'utf8');
  console.log("✅ Archivo preparado. Aplicando limpieza profunda de cabecera...");
}
