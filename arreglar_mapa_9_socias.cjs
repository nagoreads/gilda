const fs = require('fs');

const mapaPath = 'src/MapaGilda.jsx';
if (fs.existsSync(mapaPath)) {
  let code = fs.readFileSync(mapaPath, 'utf8');

  // 1. Mejorar la función buscarUbicacion para que reconozca ciudades con provincia (ej. "Vigo, Pontevedra")
  const nuevaBuscarUbicacion = `const buscarUbicacion = useCallback((texto, pais = '') => {
      if (!texto) return null;
      const norm = (str) => String(str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      const partes = String(texto).split(',').map(p => norm(p)).filter(Boolean);

      // Buscar coincidencia exacta de cualquier parte en GEO_INTERNA
      for (const p of partes) {
        for (const [clave, val] of Object.entries(GEO_INTERNA)) {
          if (norm(clave) === p) return val;
        }
      }

      // Buscar coincidencia parcial
      const textoLimpio = norm(texto);
      for (const [clave, val] of Object.entries(GEO_INTERNA)) {
        const claveNorm = norm(clave);
        if (textoLimpio.includes(claveNorm) || claveNorm.includes(textoLimpio)) return val;
        for (const p of partes) {
          if (p.includes(claveNorm) || claveNorm.includes(p)) return val;
        }
      }
      return null;
    }, [GEO_INTERNA]);`;

  code = code.replace(/const buscarUbicacion = useCallback\([\s\S]*?\), \[GEO_INTERNA\]\);/, nuevaBuscarUbicacion);

  // 2. Hacer que la asignación de coordenadas busque en todos los campos de ubicación disponibles
  code = code.replace(
    /const infoLoc = buscarUbicacion\(ciudadOriginal, paisOriginal\);/g,
    'const infoLoc = buscarUbicacion(ciudadOriginal, paisOriginal) || buscarUbicacion(ciudad) || buscarUbicacion(u.provincia_region) || buscarUbicacion(u.comunidad_autonoma) || buscarUbicacion(u.localidad) || buscarUbicacion(u.ubicacion);'
  );

  // 3. Garantizar que las piruletas sean 100% limpias (sin texto ni números)
  const piruletaLimpia = `const piruletaHtml = \`
          <div style="position: relative; width: 18px; height: 26px; display: flex; align-items: center; justify-content: center; cursor: pointer;" title="\${item.nombre}">
            <svg viewBox="0 0 16 24" width="18" height="26" style="filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.25));">
              <line x1="8" y1="12" x2="8" y2="23" stroke="#23211e" stroke-width="2" stroke-linecap="round"/>
              <circle cx="8" cy="7" r="6" fill="#58641d" stroke="#23211e" stroke-width="1.5"/>
            </svg>
          </div>
        \`;`;

  code = code.replace(/const piruletaHtml = `[\s\S]*?`;/, piruletaLimpia);

  fs.writeFileSync(mapaPath, code, 'utf8');
  console.log("✅ Búsqueda de ubicaciones y pines limpios actualizados en src/MapaGilda.jsx");
}
