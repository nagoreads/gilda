const fs = require('fs');
const mapaPath = 'src/MapaGilda.jsx';

if (fs.existsSync(mapaPath)) {
  let code = fs.readFileSync(mapaPath, 'utf8');
  
  // Quitar el <span>1</span> interno del SVG sin tocar nada de datos ni geocodificación
  code = code.replace(
    /<span style="position: absolute; top: 1\.5px; width: 100%; text-align: center; color: #FFFFFF; font-weight: bold; font-size: 8px; font-family: sans-serif;">1<\/span>/g,
    ''
  );

  fs.writeFileSync(mapaPath, code, 'utf8');
  console.log("✅ Mapa restaurado a su versión original de datos y pines limpios sin números.");
}
