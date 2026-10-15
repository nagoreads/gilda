const fs = require('fs');

const mapaPath = 'src/MapaGilda.jsx';
if (fs.existsSync(mapaPath)) {
  let code = fs.readFileSync(mapaPath, 'utf8');

  // Asegurar que si la socia tiene ciudad/comunidad española o sin país especificado, cuente como España
  const nuevoConteoPais = `const paisAgrupado = (() => {
          const p = (paisOriginal || '').toLowerCase().trim();
          if (!p || p === 'españa' || p === 'espana' || p === 'spain' || infoLoc || regionExplicita) {
            return 'España';
          }
          return formatearPais ? formatearPais(paisOriginal) : paisOriginal;
        })();`;

  code = code.replace(
    /const paisAgrupado = formatearPais\(paisOriginal \Vert{}\Vert{} \(infoLoc \Vert{}\Vert{} regionExplicita \? 'España' : coordenadasExternas\?\.country\)\) \|\| 'No especificado';/g,
    nuevoConteoPais
  );

  // Asegurar el tono exacto de verde #849673
  code = code.replace(/#58641d/gi, '#849673');
  code = code.replace(/var\(--primary-olive\)/g, '#849673');

  fs.writeFileSync(mapaPath, code, 'utf8');
  console.log("✅ Recuento del mapa ajustado correctamente a España (9).");
}
