const fs = require('fs');
const mapaPath = 'src/MapaGilda.jsx';

if (fs.existsSync(mapaPath)) {
  let code = fs.readFileSync(mapaPath, 'utf8');

  // Ajustar la asignación del país para agrupar las 9 socias españolas
  code = code.replace(
    /const paisAgrupado = formatearPais\(paisOriginal \Vert{}\Vert{} \(infoLoc \Vert{}\Vert{} regionExplicita \? 'España' : coordenadasExternas\?\.country\)\) \|\| 'No especificado';/,
    `const esEspana = !paisOriginal || ['espana', 'españa', 'spain', 'es'].includes(normalizarUbicacion(paisOriginal)) || Boolean(infoLoc || regionExplicita);
        const paisAgrupado = esEspana ? 'España' : (formatearPais ? formatearPais(paisOriginal) : (paisOriginal || 'No especificado'));`
  );

  // Reemplazar color de piruletas a #849673 y quitar el texto '1'
  code = code.replace(/var\(--primary-olive\)/g, '#849673');
  code = code.replace(/#58641d/g, '#849673');
  code = code.replace(/<span style="position: absolute; top: 1\.5px; width: 100%; text-align: center; color: #FFFFFF; font-weight: bold; font-size: 8px; font-family: sans-serif;">1<\/span>/g, '');

  fs.writeFileSync(mapaPath, code, 'utf8');
  console.log("✅ MapaGilda.jsx reparado con éxito.");
}
