const fs = require('fs');

const mapaPath = 'src/MapaGilda.jsx';
if (fs.existsSync(mapaPath)) {
  let code = fs.readFileSync(mapaPath, 'utf8');

  // Reemplazar la extracción de ciudadOriginal para que busque en todos los atributos posibles
  const busquedaCampos = `const ciudadOriginal = String(u.ciudad || u.city || u.localidad || u.poblacion || u.municipio || u.provincia || u.provincia_region || u.province_region || u.ubicacion || u.location || '').trim();`;

  code = code.replace(
    /const ciudadOriginal = String\(u\.ciudad \Vert{}\Vert{} u\.city \Vert{}\Vert{} u\.localidad \Vert{}\Vert{} u\.provincia_region \Vert{}\Vert{} u\.province_region \Vert{}\Vert{} ''\)\.trim\(\);/,
    busquedaCampos
  );

  // Asegurar el color exacto #849673
  code = code.replace(/#58641d/g, '#849673');
  code = code.replace(/fill="var\(--primary-olive\)"/g, 'fill="#849673"');

  fs.writeFileSync(mapaPath, code, 'utf8');
  console.log("✅ Lectura de campos del mapa actualizada en src/MapaGilda.jsx");
}
