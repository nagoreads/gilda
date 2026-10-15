const fs = require('fs');

const mapaPath = 'src/MapaGilda.jsx';
if (fs.existsSync(mapaPath)) {
  let code = fs.readFileSync(mapaPath, 'utf8');

  // 1. Ampliar el diccionario GEO_INTERNA con todas las provincias, islas y principales ciudades
  const geoInternaExpandida = `const GEO_INTERNA = useMemo(() => ({
      'madrid': { coords: [40.4168, -3.7038], ca: 'Comunidad de Madrid' },
      'barcelona': { coords: [41.3851, 2.1734], ca: 'Cataluña' },
      'bilbao': { coords: [43.2630, -2.9350], ca: 'País Vasco' },
      'sevilla': { coords: [37.3891, -5.9845], ca: 'Andalucía' },
      'valencia': { coords: [39.4699, -0.3763], ca: 'Comunidad Valenciana' },
      'zaragoza': { coords: [41.6488, -0.8891], ca: 'Aragón' },
      'málaga': { coords: [36.7213, -4.4214], ca: 'Andalucía' },
      'malaga': { coords: [36.7213, -4.4214], ca: 'Andalucía' },
      'murcia': { coords: [37.9922, -1.1307], ca: 'Región de Murcia' },
      'palma': { coords: [39.5696, 2.6502], ca: 'Islas Baleares' },
      'las palmas': { coords: [28.1235, -15.4363], ca: 'Canarias' },
      'alicante': { coords: [38.3452, -0.4810], ca: 'Comunidad Valenciana' },
      'córdoba': { coords: [37.8882, -4.7794], ca: 'Andalucía' },
      'cordoba': { coords: [37.8882, -4.7794], ca: 'Andalucía' },
      'valladolid': { coords: [41.6523, -4.7245], ca: 'Castilla y León' },
      'vigo': { coords: [42.2406, -8.7207], ca: 'Galicia' },
      'gijón': { coords: [43.5357, -5.6615], ca: 'Asturias' },
      'gijon': { coords: [43.5357, -5.6615], ca: 'Asturias' },
      'a coruña': { coords: [43.3623, -8.4115], ca: 'Galicia' },
      'la coruna': { coords: [43.3623, -8.4115], ca: 'Galicia' },
      'granada': { coords: [37.1773, -3.5986], ca: 'Andalucía' },
      'vitoria': { coords: [42.8467, -2.6716], ca: 'País Vasco' },
      'vitoria-gasteiz': { coords: [42.8467, -2.6716], ca: 'País Vasco' },
      'santa cruz de tenerife': { coords: [28.4636, -16.2518], ca: 'Canarias' },
      'pamplona': { coords: [42.8125, -1.6458], ca: 'Navarra' },
      'almería': { coords: [36.8340, -2.4637], ca: 'Andalucía' },
      'almeria': { coords: [36.8340, -2.4637], ca: 'Andalucía' },
      'san sebastian': { coords: [43.3183, -1.9812], ca: 'País Vasco' },
      'san sebastián': { coords: [43.3183, -1.9812], ca: 'País Vasco' },
      'donostia': { coords: [43.3183, -1.9812], ca: 'País Vasco' },
      'burgos': { coords: [42.3440, -3.6969], ca: 'Castilla y León' },
      'albacete': { coords: [38.9942, -1.8585], ca: 'Castilla-La Mancha' },
      'santander': { coords: [43.4623, -3.8099], ca: 'Cantabria' },
      'girona': { coords: [41.9794, 2.8214], ca: 'Cataluña' },
      'gerona': { coords: [41.9794, 2.8214], ca: 'Cataluña' },
      'tarragona': { coords: [41.1189, 1.2445], ca: 'Cataluña' },
      'lleida': { coords: [41.6176, 0.6200], ca: 'Cataluña' },
      'lérida': { coords: [41.6176, 0.6200], ca: 'Cataluña' },
      'oviedo': { coords: [43.3619, -5.8494], ca: 'Asturias' },
      'toledo': { coords: [39.8628, -4.0273], ca: 'Castilla-La Mancha' },
      'cadiz': { coords: [36.5271, -6.2886], ca: 'Andalucía' },
      'cádiz': { coords: [36.5271, -6.2886], ca: 'Andalucía' },
      'huelva': { coords: [37.2664, -6.9400], ca: 'Andalucía' },
      'jaen': { coords: [37.7796, -3.7849], ca: 'Andalucía' },
      'jaén': { coords: [37.7796, -3.7849], ca: 'Andalucía' },
      'huesca': { coords: [42.1401, -0.4089], ca: 'Aragón' },
      'teruel': { coords: [40.3456, -1.1065], ca: 'Aragón' },
      'leon': { coords: [42.5987, -5.5671], ca: 'Castilla y León' },
      'león': { coords: [42.5987, -5.5671], ca: 'Castilla y León' },
      'salamanca': { coords: [40.9701, -5.6635], ca: 'Castilla y León' },
      'badajoz': { coords: [38.8794, -6.9707], ca: 'Extremadura' },
      'cáceres': { coords: [39.4765, -6.3722], ca: 'Extremadura' },
      'caceres': { coords: [39.4765, -6.3722], ca: 'Extremadura' },
      'castellón': { coords: [39.9864, -0.0513], ca: 'Comunidad Valenciana' },
      'castellon': { coords: [39.9864, -0.0513], ca: 'Comunidad Valenciana' },
      'ciudad real': { coords: [38.9863, -3.9271], ca: 'Castilla-La Mancha' },
      'cuenca': { coords: [40.0704, -2.1374], ca: 'Castilla-La Mancha' },
      'guadalajara': { coords: [40.6327, -3.1669], ca: 'Castilla-La Mancha' },
      'lugo': { coords: [43.0125, -7.5558], ca: 'Galicia' },
      'ourense': { coords: [42.3358, -7.8639], ca: 'Galicia' },
      'orense': { coords: [42.3358, -7.8639], ca: 'Galicia' },
      'palencia': { coords: [42.0095, -4.5241], ca: 'Castilla y León' },
      'pontevedra': { coords: [42.4310, -8.6444], ca: 'Galicia' },
      'segovia': { coords: [40.9481, -4.1184], ca: 'Castilla y León' },
      'soria': { coords: [41.7640, -2.4688], ca: 'Castilla y León' },
      'zamora': { coords: [41.5063, -5.7446], ca: 'Castilla y León' },
      'ávila': { coords: [40.6565, -4.6818], ca: 'Castilla y León' },
      'avila': { coords: [40.6565, -4.6818], ca: 'Castilla y León' },
      'logroño': { coords: [42.4650, -2.4456], ca: 'La Rioja' },
      'logrono': { coords: [42.4650, -2.4456], ca: 'La Rioja' },
      'la rioja': { coords: [42.4650, -2.4456], ca: 'La Rioja' },
      'ceuta': { coords: [35.8894, -5.3213], ca: 'Ceuta' },
      'melilla': { coords: [35.2923, -2.9381], ca: 'Melilla' },
      'ibiza': { coords: [38.9067, 1.4206], ca: 'Islas Baleares' },
      'eivissa': { coords: [38.9067, 1.4206], ca: 'Islas Baleares' },
      'menorca': { coords: [39.9496, 4.1036], ca: 'Islas Baleares' },
      'mahón': { coords: [39.8885, 4.2658], ca: 'Islas Baleares' },
      'maó': { coords: [39.8885, 4.2658], ca: 'Islas Baleares' },
      'tenerife': { coords: [28.4636, -16.2518], ca: 'Canarias' },
      'lanzarote': { coords: [28.9630, -13.5477], ca: 'Canarias' },
      'arrecife': { coords: [28.9630, -13.5477], ca: 'Canarias' },
      'fuerteventura': { coords: [28.5004, -13.8627], ca: 'Canarias' },
      'la palma': { coords: [28.6835, -17.7642], ca: 'Canarias' },
      'santiago de compostela': { coords: [42.8782, -8.5448], ca: 'Galicia' },
      'santiago': { coords: [42.8782, -8.5448], ca: 'Galicia' },
      'mérida': { coords: [38.9161, -6.3437], ca: 'Extremadura' },
      'merida': { coords: [38.9161, -6.3437], ca: 'Extremadura' },
      'jerez': { coords: [36.6850, -6.1261], ca: 'Andalucía' },
      'marbella': { coords: [36.5101, -4.8824], ca: 'Andalucía' },
      'algeciras': { coords: [36.1408, -5.4562], ca: 'Andalucía' }
    }), []);`;

  code = code.replace(/const GEO_INTERNA = useMemo\(\(\) => \(\{[\s\S]*?\}\), \[\]\);/, geoInternaExpandida);

  // 2. Aumentar el radio de dispersión de piruletas superpuestas (de 0.015 a 0.04) para que no se tapen
  code = code.replace(
    /const radius = 0\.015 \* Math\.sqrt\(count\);/g,
    'const radius = 0.04 * Math.sqrt(count);'
  );

  // 3. Mostrar la inicial del nombre o el contador dentro del círculo de la piruleta
  code = code.replace(
    /<span style="position: absolute; top: 1\.5px; width: 100%; text-align: center; color: #FFFFFF; font-weight: bold; font-size: 8px; font-family: sans-serif;">1<\/span>/g,
    `<span style="position: absolute; top: 1.5px; width: 100%; text-align: center; color: #FFFFFF; font-weight: bold; font-size: 8px; font-family: sans-serif;">\${(item.nombre || 'G')[0].toUpperCase()}</span>`
  );

  fs.writeFileSync(mapaPath, code, 'utf8');
  console.log("✅ Coordenadas y dispersión de piruletas actualizadas en src/MapaGilda.jsx");
}
