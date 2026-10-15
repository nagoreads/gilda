const fs = require('fs');

// 1. Limpiar la regla problemática del CSS
const cssPath = fs.existsSync('src/index.css') ? 'src/index.css' : (fs.existsSync('src/App.css') ? 'src/App.css' : null);
if (cssPath) {
  let css = fs.readFileSync(cssPath, 'utf8');
  if (css.includes('PASO 1: SUBPESTAÑAS ESTILO DIARIO')) {
    css = css.split('/* ==========================================')[0];
    fs.writeFileSync(cssPath, css, 'utf8');
    console.log("✅ CSS limpiado de reglas genéricas.");
  }
}

// 2. Comprobar y asegurar MapaGilda.jsx con 9 socias y verde #849673
const mapaPath = 'src/MapaGilda.jsx';
if (fs.existsSync(mapaPath)) {
  let code = fs.readFileSync(mapaPath, 'utf8');

  // Lectura completa de campos de ciudad/provincia
  const busquedaCampos = `const ciudadOriginal = String(u.ciudad || u.city || u.localidad || u.poblacion || u.municipio || u.provincia || u.provincia_region || u.province_region || u.ubicacion || u.location || '').trim();`;
  if (!code.includes(busquedaCampos)) {
    code = code.replace(
      /const ciudadOriginal = String\(u\.ciudad \Vert{}\Vert{} u\.city \Vert{}\Vert{} u\.localidad \Vert{}\Vert{} u\.provincia_region \Vert{}\Vert{} u\.province_region \Vert{}\Vert{} ''\)\.trim\(\);/,
      busquedaCampos
    );
  }

  // Agrupación de país para España (9)
  if (!code.includes("const esEspana = !paisOriginal || ['espana', 'españa', 'spain', 'es']")) {
    code = code.replace(
      /const paisAgrupado = formatearPais\(paisOriginal \Vert{}\Vert{} \(infoLoc \Vert{}\Vert{} regionExplicita \? 'España' : coordenadasExternas\?\.country\)\) \|\| 'No especificado';/,
      `const esEspana = !paisOriginal || ['espana', 'españa', 'spain', 'es'].includes(normalizarUbicacion(paisOriginal)) || Boolean(infoLoc || regionExplicita);
        const paisAgrupado = esEspana ? 'España' : (formatearPais ? formatearPais(paisOriginal) : (paisOriginal || 'No especificado'));`
    );
  }

  // Color verde #849673 y pin limpio
  code = code.replace(/#58641d/g, '#849673');
  code = code.replace(/fill="var\(--primary-olive\)"/g, 'fill="#849673"');
  code = code.replace(/<span style="position: absolute; top: 1\.5px; width: 100%; text-align: center; color: #FFFFFF; font-weight: bold; font-size: 8px; font-family: sans-serif;">1<\/span>/g, '');

  fs.writeFileSync(mapaPath, code, 'utf8');
  console.log("✅ MapaGilda.jsx restaurado a la versión de 9 socias y verde #849673.");
}
