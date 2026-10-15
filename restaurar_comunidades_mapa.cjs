const fs = require('fs');

const mapaPath = 'src/MapaGilda.jsx';
if (fs.existsSync(mapaPath)) {
  let code = fs.readFileSync(mapaPath, 'utf8');

  // Ajustar la clasificación de país y región para mantener las 9 ubicadas reales y 30 no especificadas
  const bloqueMapeo = `const infoLoc = buscarUbicacion(ciudadOriginal, paisOriginal) || buscarUbicacion(ciudad) || buscarUbicacion(u.provincia_region) || buscarUbicacion(u.comunidad_autonoma) || buscarUbicacion(u.localidad) || buscarUbicacion(u.ubicacion);
        const regionOriginal = String(u.comunidad_autonoma || u.comunidad || u.autonomous_community || u.region || u.state || u.provincia_region || u.province_region || u.province || '').trim();
        const regionNormalizada = normalizarUbicacion(regionOriginal);
        const regionGeocodificada = coordenadasExternas?.region || '';
        const regionExplicita = comunidadesEspanolas.get(regionNormalizada)
          || [...comunidadesEspanolas.entries()].find(([nombre]) => regionNormalizada.includes(nombre))?.[1]
          || comunidadesEspanolas.get(normalizarUbicacion(regionGeocodificada))
          || [...comunidadesEspanolas.entries()].find(([nombre]) => normalizarUbicacion(regionGeocodificada).includes(nombre))?.[1]
          || '';

        const tieneUbicacionReal = Boolean(infoLoc || regionExplicita || (regionOriginal && regionOriginal.length > 2));
        const paisAgrupado = tieneUbicacionReal ? 'España' : 'No especificado';
        const regionAgrupada = tieneUbicacionReal ? (regionExplicita || infoLoc?.ca || regionOriginal || 'Otras regiones') : 'No especificada';`;

  // Reemplazar la asignación previa
  code = code.replace(/const infoLoc = buscarUbicacion[\s\S]*?const regionAgrupada =[\s\S]*?;/, bloqueMapeo);

  // Garantizar el verde #849673 en el SVG del pin
  code = code.replace(/fill="[^"]*"/g, (match) => match.includes('none') ? match : 'fill="#849673"');

  fs.writeFileSync(mapaPath, code, 'utf8');
  console.log("✅ Lógica de regiones y desglose por comunidades actualizada.");
}
