const fs = require('fs');

// 1. Asegurar MapaGilda.jsx con la geolocalización completa de las 9 socias y verde #849673
const mapaPath = 'src/MapaGilda.jsx';
if (fs.existsSync(mapaPath)) {
  let code = fs.readFileSync(mapaPath, 'utf8');

  // Lectura completa de campos de ubicación
  const busquedaCampos = `const ciudadOriginal = String(u.ciudad || u.city || u.localidad || u.poblacion || u.municipio || u.provincia || u.provincia_region || u.province_region || u.ubicacion || u.location || '').trim();`;
  if (!code.includes(busquedaCampos)) {
    code = code.replace(
      /const ciudadOriginal = String\(u\.ciudad \Vert{}\Vert{} u\.city \Vert{}\Vert{} u\.localidad \Vert{}\Vert{} u\.provincia_region \Vert{}\Vert{} u\.province_region \Vert{}\Vert{} ''\)\.trim\(\);/,
      busquedaCampos
    );
  }

  // Lógica para reconocer a las 9 españolas
  if (!code.includes("const esEspana = !paisOriginal || ['espana', 'españa', 'spain', 'es']")) {
    code = code.replace(
      /const paisAgrupado = formatearPais\(paisOriginal \Vert{}\Vert{} \(infoLoc \Vert{}\Vert{} regionExplicita \? 'España' : coordenadasExternas\?\.country\)\) \|\| 'No especificado';/,
      `const esEspana = !paisOriginal || ['espana', 'españa', 'spain', 'es'].includes(normalizarUbicacion(paisOriginal)) || Boolean(infoLoc || regionExplicita);
        const paisAgrupado = esEspana ? 'España' : (formatearPais ? formatearPais(paisOriginal) : (paisOriginal || 'No especificado'));`
    );
  }

  // Color verde #849673 y pin limpio sin números
  code = code.replace(/#58641d/g, '#849673');
  code = code.replace(/fill="var\(--primary-olive\)"/g, 'fill="#849673"');
  code = code.replace(/<span style="position: absolute; top: 1\.5px; width: 100%; text-align: center; color: #FFFFFF; font-weight: bold; font-size: 8px; font-family: sans-serif;">1<\/span>/g, '');

  fs.writeFileSync(mapaPath, code, 'utf8');
  console.log("✅ MapaGilda.jsx configurado para 9 socias y verde #849673.");
}

// 2. Limpiar la clave del caché en App.jsx para forzar la recarga de la lista completa de socias
const appPath = 'src/App.jsx';
if (fs.existsSync(appPath)) {
  let appCode = fs.readFileSync(appPath, 'utf8');
  // Cambiamos el nombre de la clave del caché local a gilda_cache_usuarias_v2 para forzar la carga completa
  appCode = appCode.replace(/gilda_cache_usuarias/g, 'gilda_cache_usuarias_v2');
  fs.writeFileSync(appPath, appCode, 'utf8');
  console.log("✅ Caché de usuarias actualizado en src/App.jsx para recargar la lista de socias.");
}
