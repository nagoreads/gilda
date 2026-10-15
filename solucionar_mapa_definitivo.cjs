const fs = require('fs');

const mapaPath = 'src/MapaGilda.jsx';
if (!fs.existsSync(mapaPath)) {
  console.log('Error: No se encontró src/MapaGilda.jsx');
  process.exit(1);
}

const nuevoMapaGilda = `import { useRef, useState, useEffect, useMemo, useCallback } from 'react';

export default function MapaGilda({ usuarias = [], formatearPais }) {
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersGroupRef = useRef(null);
  const usuariasGeocodificadasRef = useRef([]);
  const [regionSeleccionada, setRegionSeleccionada] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  const GEO_INTERNA = useMemo(() => ({
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
    'baleares': { coords: [39.5696, 2.6502], ca: 'Islas Baleares' },
    'las palmas': { coords: [28.1235, -15.4363], ca: 'Canarias' },
    'canarias': { coords: [28.1235, -15.4363], ca: 'Canarias' },
    'alicante': { coords: [38.3452, -0.4810], ca: 'Comunidad Valenciana' },
    'córdoba': { coords: [37.8882, -4.7794], ca: 'Andalucía' },
    'cordoba': { coords: [37.8882, -4.7794], ca: 'Andalucía' },
    'valladolid': { coords: [41.6523, -4.7245], ca: 'Castilla y León' },
    'vigo': { coords: [42.2406, -8.7207], ca: 'Galicia' },
    'gijón': { coords: [43.5357, -5.6615], ca: 'Asturias' },
    'gijon': { coords: [43.5357, -5.6615], ca: 'Asturias' },
    'asturias': { coords: [43.3619, -5.8494], ca: 'Asturias' },
    'a coruña': { coords: [43.3623, -8.4115], ca: 'Galicia' },
    'coruña': { coords: [43.3623, -8.4115], ca: 'Galicia' },
    'la coruna': { coords: [43.3623, -8.4115], ca: 'Galicia' },
    'galicia': { coords: [42.8782, -8.5448], ca: 'Galicia' },
    'granada': { coords: [37.1773, -3.5986], ca: 'Andalucía' },
    'andalucia': { coords: [37.3891, -5.9845], ca: 'Andalucía' },
    'vitoria': { coords: [42.8467, -2.6716], ca: 'País Vasco' },
    'vitoria-gasteiz': { coords: [42.8467, -2.6716], ca: 'País Vasco' },
    'pais vasco': { coords: [43.2630, -2.9350], ca: 'País Vasco' },
    'euskadi': { coords: [43.2630, -2.9350], ca: 'País Vasco' },
    'santa cruz de tenerife': { coords: [28.4636, -16.2518], ca: 'Canarias' },
    'tenerife': { coords: [28.4636, -16.2518], ca: 'Canarias' },
    'pamplona': { coords: [42.8125, -1.6458], ca: 'Navarra' },
    'navarra': { coords: [42.8125, -1.6458], ca: 'Navarra' },
    'almería': { coords: [36.8340, -2.4637], ca: 'Andalucía' },
    'almeria': { coords: [36.8340, -2.4637], ca: 'Andalucía' },
    'san sebastian': { coords: [43.3183, -1.9812], ca: 'País Vasco' },
    'donostia': { coords: [43.3183, -1.9812], ca: 'País Vasco' },
    'burgos': { coords: [42.3440, -3.6969], ca: 'Castilla y León' },
    'albacete': { coords: [38.9942, -1.8585], ca: 'Castilla-La Mancha' },
    'santander': { coords: [43.4623, -3.8099], ca: 'Cantabria' },
    'cantabria': { coords: [43.4623, -3.8099], ca: 'Cantabria' },
    'girona': { coords: [41.9794, 2.8214], ca: 'Cataluña' },
    'gerona': { coords: [41.9794, 2.8214], ca: 'Cataluña' },
    'cataluña': { coords: [41.3851, 2.1734], ca: 'Cataluña' },
    'cataluna': { coords: [41.3851, 2.1734], ca: 'Cataluña' },
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
    'aragon': { coords: [41.6488, -0.8891], ca: 'Aragón' },
    'leon': { coords: [42.5987, -5.5671], ca: 'Castilla y León' },
    'león': { coords: [42.5987, -5.5671], ca: 'Castilla y León' },
    'salamanca': { coords: [40.9701, -5.6635], ca: 'Castilla y León' },
    'badajoz': { coords: [38.8794, -6.9707], ca: 'Extremadura' },
    'cáceres': { coords: [39.4765, -6.3722], ca: 'Extremadura' },
    'extremadura': { coords: [38.8794, -6.9707], ca: 'Extremadura' },
    'castellón': { coords: [39.9864, -0.0513], ca: 'Comunidad Valenciana' },
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
    'logroño': { coords: [42.4650, -2.4456], ca: 'La Rioja' },
    'la rioja': { coords: [42.4650, -2.4456], ca: 'La Rioja' },
    'ceuta': { coords: [35.8894, -5.3213], ca: 'Ceuta' },
    'melilla': { coords: [35.2923, -2.9381], ca: 'Melilla' },
    'ibiza': { coords: [38.9067, 1.4206], ca: 'Islas Baleares' },
    'menorca': { coords: [39.9496, 4.1036], ca: 'Islas Baleares' },
    'lanzarote': { coords: [28.9630, -13.5477], ca: 'Canarias' },
    'santiago': { coords: [42.8782, -8.5448], ca: 'Galicia' },
    'jerez': { coords: [36.6850, -6.1261], ca: 'Andalucía' },
    'marbella': { coords: [36.5101, -4.8824], ca: 'Andalucía' },
    'méxico': { coords: [19.4326, -99.1332], ca: 'México' },
    'mexico': { coords: [19.4326, -99.1332], ca: 'México' },
    'argentina': { coords: [-34.6037, -58.3816], ca: 'Argentina' },
    'colombia': { coords: [4.7110, -74.0721], ca: 'Colombia' },
    'chile': { coords: [-33.4489, -70.6693], ca: 'Chile' },
    'reino unido': { coords: [51.5074, -0.1278], ca: 'Reino Unido' },
    'uk': { coords: [51.5074, -0.1278], ca: 'Reino Unido' },
    'francia': { coords: [48.8566, 2.3522], ca: 'Francia' },
    'portugal': { coords: [38.7223, -9.1393], ca: 'Portugal' },
    'alemania': { coords: [52.5200, 13.4050], ca: 'Alemania' },
    'italia': { coords: [41.9028, 12.4964], ca: 'Italia' },
    'estados unidos': { coords: [40.7128, -74.0060], ca: 'Estados Unidos' },
    'usa': { coords: [40.7128, -74.0060], ca: 'Estados Unidos' }
  }), []);

  const normalizarLocal = useCallback((txt) => {
    return String(txt || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  }, []);

  const buscarUbicacion = useCallback((texto) => {
    if (!texto) return null;
    const limpio = normalizarLocal(texto);
    if (GEO_INTERNA[limpio]) return GEO_INTERNA[limpio];
    
    for (const [clave, val] of Object.entries(GEO_INTERNA)) {
      if (limpio.includes(clave) || clave.includes(limpio)) return val;
    }
    return null;
  }, [GEO_INTERNA, normalizarLocal]);

  const usuariasGeocodificadas = useMemo(() => {
    const mapaCoordenadasSocio = {};
    
    return usuarias.map((u, index) => {
      const ciudadRaw = String(u.ciudad || u.city || u.localidad || u.poblacion || u.municipio || '').trim();
      const regionRaw = String(u.provincia_region || u.province_region || u.comunidad_autonoma || u.comunidad || u.region || u.provincia || u.state || '').trim();
      const paisRaw = String(u.pais || u.país || u.country || u.country_name || '').trim();
      const ubicacionGeneral = String(u.ubicacion || u.location || u.direccion || '').trim();

      const latRaw = u.latitud ?? u.latitude ?? u.lat;
      const lonRaw = u.longitud ?? u.longitude ?? u.lon ?? u.lng;
      const lat = Number(latRaw);
      const lon = Number(lonRaw);
      const tieneCoordsValidas = Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;

      let baseCoords = null;
      let caEncontrada = regionRaw || 'Comunidad de Madrid';

      if (tieneCoordsValidas) {
        baseCoords = [lat, lon];
      } else {
        const locCiudad = buscarUbicacion(ciudadRaw) || buscarUbicacion(ubicacionGeneral) || buscarUbicacion(regionRaw) || buscarUbicacion(paisRaw);
        if (locCiudad) {
          baseCoords = locCiudad.coords;
          caEncontrada = locCiudad.ca;
        } else {
          baseCoords = [40.4168, -3.7038];
        }
      }

      const coordKey = `${baseCoords[0].toFixed(3)},${baseCoords[1].toFixed(3)}`;
      let coordsFinales = [...baseCoords];

      if (!mapaCoordenadasSocio[coordKey]) {
        mapaCoordenadasSocio[coordKey] = 1;
      } else {
        const count = mapaCoordenadasSocio[coordKey];
        mapaCoordenadasSocio[coordKey]++;
        const angle = count * 2.39996;
        const radius = 0.035 * Math.sqrt(count);
        coordsFinales = [
          baseCoords[0] + radius * Math.cos(angle),
          baseCoords[1] + radius * Math.sin(angle)
        ];
      }

      const paisAgrupado = formatearPais ? formatearPais(paisRaw || 'España') : (paisRaw || 'España');
      const regionAgrupada = caEncontrada || 'No especificada';

      return {
        ...u,
        nombre: u.nombre || u.email?.split('@')[0] || `Socio ${index + 1}`,
        coords: coordsFinales,
        paisAgrupado,
        regionAgrupada
      };
    });
  }, [usuarias, buscarUbicacion, normalizarLocal, formatearPais]);

  usuariasGeocodificadasRef.current = usuariasGeocodificadas;

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    let activo = true;

    const inicializarMapa = async () => {
      if (!activo || !container.isConnected) return;
      if (mapRef.current) {
        mapRef.current.invalidateSize();
        return;
      }

      try {
        const moduloLeaflet = await import('leaflet');
        if (!activo || !container.isConnected) return;
        const Leaflet = moduloLeaflet.default || moduloLeaflet;
        leafletRef.current = Leaflet;

        if (!mapRef.current) {
          const map = Leaflet.map(container, {
            zoomControl: false,
            attributionControl: false,
            zoomAnimation: false,
            fadeAnimation: false,
            markerZoomAnimation: false
          }).setView([40.4167, -3.7037], 5);

          Leaflet.control.zoom({ position: 'topright' }).addTo(map);
          Leaflet.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', { maxZoom: 16 }).addTo(map);

          markersGroupRef.current = Leaflet.layerGroup().addTo(map);
          mapRef.current = map;
          setMapReady(true);
        }
      } catch (error) {
        console.error('Error al inicializar Leaflet:', error);
      }
    };

    inicializarMapa();

    return () => {
      activo = false;
      if (mapRef.current) {
        mapRef.current.stop();
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const Leaflet = leafletRef.current;
    const markersGroup = markersGroupRef.current;
    if (!Leaflet || !map || !markersGroup) return;

    map.invalidateSize();
    markersGroup.clearLayers();
    const boundsArray = [];

    usuariasGeocodificadasRef.current.forEach(item => {
      const coor = item.coords;
      if (!Array.isArray(coor) || coor.length !== 2 || !coor.every(Number.isFinite)) return;
      boundsArray.push(coor);

      const piruletaHtml = `
        <div style="position: relative; width: 16px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer;" title="${item.nombre}">
          <svg viewBox="0 0 16 24" width="16" height="24" style="filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.25));">
            <line x1="8" y1="11" x2="8" y2="23" stroke="#23211e" stroke-width="2" stroke-linecap="round"/>
            <circle cx="8" cy="7" r="5.5" fill="#58641d" stroke="#23211e" stroke-width="1.5"/>
          </svg>
        </div>
      `;

      const customIcon = Leaflet.divIcon({
        html: piruletaHtml,
        className: 'custom-piruleta-clean',
        iconSize: [16, 24],
        iconAnchor: [8, 23],
        popupAnchor: [0, -24]
      });

      const marker = Leaflet.marker(coor, { icon: customIcon });

      marker.on('click', () => {
        const usuariasActuales = usuariasGeocodificadasRef.current;
        setRegionSeleccionada({
          region: item.regionAgrupada,
          usuarias: usuariasActuales.filter(u => u.regionAgrupada === item.regionAgrupada)
        });
      });

      markersGroup.addLayer(marker);
    });

    if (boundsArray.length > 0 && map) {
      map.fitBounds(boundsArray, { padding: [30, 30], maxZoom: 6 });
    }
  }, [mapReady, usuariasGeocodificadas]);

  return (
    <div className="space-y-4 relative font-sans">
      <div className="relative">
        <div
          ref={mapContainerRef}
          style={{ height: '280px', width: '100%', zIndex: 1 }}
          className="rounded-2xl border border-[#e8e4d9] shadow-xs overflow-hidden bg-[#faf9f5]"
        ></div>

        {regionSeleccionada && (
          <div className="absolute inset-0 z-[1000] bg-white/95 backdrop-blur-md p-4 flex flex-col rounded-2xl text-[#23211e] shadow-lg max-h-[280px] overflow-hidden">
            <div className="flex justify-between items-center border-b border-[#e8e4d9] pb-2 mb-2 shrink-0">
              <h3 className="font-babydoll text-[#23211e] font-bold text-lg leading-none">
                {regionSeleccionada.region} ({regionSeleccionada.usuarias.length})
              </h3>
              <button
                onClick={() => setRegionSeleccionada(null)}
                className="text-[11px] font-bold text-[#75706b] bg-white border border-[#e8e4d9] px-2.5 py-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                cerrar
              </button>
            </div>
            <div className="overflow-y-auto flex-grow space-y-2 pr-1">
              {regionSeleccionada.usuarias.map((u, i) => (
                <div key={i} className="flex justify-between items-center text-xs p-2.5 bg-white rounded-xl border border-[#e8e4d9] gap-2">
                  <span className="font-bold font-babydoll text-sm text-[#23211e]">{u.nombre}</span>
                  <span className="text-[#75706b] text-[11px] italic">{u.ciudad || u.provincia_region || 'Sin localidad'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
`;

fs.writeFileSync(mapaPath, nuevoMapaGilda, 'utf8');
console.log('✅ Mapa corregido con éxito.');
