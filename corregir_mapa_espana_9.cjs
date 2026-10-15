const fs = require('fs');

const mapaPath = 'src/MapaGilda.jsx';
if (fs.existsSync(mapaPath)) {
  let code = fs.readFileSync(mapaPath, 'utf8');

  // Reemplazar la asignación de país agrupado
  const regexAnterior = /const paisAgrupado =[\s\S]*?;/;
  const reemplazoLimpio = `const esPaisEspana = !paisOriginal || ['espana', 'españa', 'spain', 'es'].includes(normalizarUbicacion(paisOriginal));
        const tieneUbicacionEspanola = Boolean(infoLoc || regionExplicita || buscarUbicacion(ciudadOriginal));
        const paisAgrupado = (esPaisEspana || tieneUbicacionEspanola) ? 'España' : (formatearPais ? formatearPais(paisOriginal) : (paisOriginal || 'No especificado'));`;

  code = code.replace(regexAnterior, reemplazoLimpio);

  // Asegurar el color verde exacto #849673
  code = code.replace(/#58641d/gi, '#849673');
  code = code.replace(/fill="var\(--primary-olive\)"/g, 'fill="#849673"');

  fs.writeFileSync(mapaPath, code, 'utf8');
  console.log("✅ Corrección aplicada en src/MapaGilda.jsx");
}
