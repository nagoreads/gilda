import { useRef, useState, useEffect, useMemo, useCallback, useId } from 'react';

export default function MapaGilda({ usuarias, normalizarUbicacion, geocodificarUbicacion, formatearPais }) {
    const mapRef = useRef(null);
    const leafletRef = useRef(null);
    const mapContainerRef = useRef(null);
    const markersGroupRef = useRef(null);
    const marcadoresKeyRef = useRef(null);
    const usuariasGeocodificadasRef = useRef([]);
    const peticionesEnCursoRef = useRef(new Set());
    const [regionSeleccionada, setRegionSeleccionada] = useState(null);
    const [paisExpandido, setPaisExpandido] = useState(null);
    const idContadorPais = useId();
    const [mapReady, setMapReady] = useState(false);
    const [coordenadasInternacionales, setCoordenadasInternacionales] = useState({});

    const GEO_INTERNA = useMemo(() => ({
      'madrid': { coords: [40.4168, -3.7038], ca: 'Comunidad de Madrid' },
      'barcelona': { coords: [41.3851, 2.1734], ca: 'Cataluña' },
      'eibar': { coords: [43.1827, -2.4729], ca: 'País Vasco' },
      'salamanca': { coords: [40.9701, -5.6635], ca: 'Castilla y León' },
      'as pontes': { coords: [43.4475, -7.8631], ca: 'Galicia' },
      'as pontes de garcia rodriguez': { coords: [43.4475, -7.8631], ca: 'Galicia' },
      'gasteiz': { coords: [42.8467, -2.6716], ca: 'País Vasco' },
      'vitoria': { coords: [42.8467, -2.6716], ca: 'País Vasco' },
      'santander': { coords: [43.4623, -3.8099], ca: 'Cantabria' },
      'tolosa': { coords: [43.1385, -2.0744], ca: 'País Vasco' },
      'bilbao': { coords: [43.2630, -2.9350], ca: 'País Vasco' },
      'sevilla': { coords: [37.3891, -5.9845], ca: 'Andalucía' },
      'valencia': { coords: [39.4699, -0.3763], ca: 'Comunidad Valenciana' },
      'zaragoza': { coords: [41.6488, -0.8891], ca: 'Aragón' },
      'málaga': { coords: [36.7213, -4.4214], ca: 'Andalucía' },
      'malaga': { coords: [36.7213, -4.4214], ca: 'Andalucía' },
      'murcia': { coords: [37.9922, -1.1307], ca: 'Región de Murcia' },
      'palma': { coords: [39.5696, 2.6502], ca: 'Islas Baleares' },
      'a coruña': { coords: [43.3623, -8.4115], ca: 'Galicia' },
      'granada': { coords: [37.1773, -3.5986], ca: 'Andalucía' }
    }), []);

    const buscarUbicacion = useCallback((texto, pais = '') => {
      if (!texto) return null;
      const partes = texto.split(',').map(parte => parte.trim()).filter(Boolean);
      const ciudad = partes[0] || texto.trim();
      const paisIndicado = pais || partes.slice(1).join(', ');
      const paisNormalizado = normalizarUbicacion(paisIndicado);
      const esEspana = !paisNormalizado || ['espana', 'spain', 'es', 'españa'].includes(paisNormalizado);
      if (!esEspana) return null;

      const limpio = ciudad.toLowerCase().trim();
      if (GEO_INTERNA[limpio]) return GEO_INTERNA[limpio];
      for (const [clave, val] of Object.entries(GEO_INTERNA)) {
        if (limpio.includes(clave) || clave.includes(limpio)) return val;
      }
      return null;
    }, [GEO_INTERNA, normalizarUbicacion]);

    const comunidadesEspanolas = useMemo(() => new Map([
      ['andalucia', 'Andalucía'],
      ['aragon', 'Aragón'],
      ['asturias', 'Asturias'],
      ['principado de asturias', 'Asturias'],
      ['islas baleares', 'Islas Baleares'],
      ['illes balears', 'Islas Baleares'],
      ['canarias', 'Canarias'],
      ['cantabria', 'Cantabria'],
      ['castilla-la mancha', 'Castilla-La Mancha'],
      ['castilla la mancha', 'Castilla-La Mancha'],
      ['castilla y leon', 'Castilla y León'],
      ['cataluna', 'Cataluña'],
      ['comunidad valenciana', 'Comunidad Valenciana'],
      ['comunitat valenciana', 'Comunidad Valenciana'],
      ['extremadura', 'Extremadura'],
      ['galicia', 'Galicia'],
      ['comunidad de madrid', 'Comunidad de Madrid'],
      ['madrid', 'Comunidad de Madrid'],
      ['region de murcia', 'Región de Murcia'],
      ['región de murcia', 'Región de Murcia'],
      ['murcia', 'Región de Murcia'],
      ['navarra', 'Navarra'],
      ['comunidad foral de navarra', 'Navarra'],
      ['pais vasco', 'País Vasco'],
      ['euskadi', 'País Vasco'],
      ['la rioja', 'La Rioja'],
      ['ceuta', 'Ceuta'],
      ['melilla', 'Melilla']
    ]), []);

    const usuariasGeocodificadas = useMemo(() => {
      const mapaCoordenadasSocio = {};
      return usuarias.map(u => {
        const ciudadOriginal = String(u.ciudad || u.city || u.localidad || u.provincia_region || u.province_region || '').trim();
        const partesCiudad = ciudadOriginal.split(',').map(parte => parte.trim()).filter(Boolean);
        const paisOriginal = String(u.pais || u.país || u.country || u.country_name || u.country_code || partesCiudad.slice(1).join(', ') || '').trim();
        const ciudad = partesCiudad[0] || ciudadOriginal;
        const consultaGeo = [ciudad, paisOriginal].filter(Boolean).join(', ') || ciudadOriginal;
        const infoLoc = buscarUbicacion(ciudadOriginal, paisOriginal);
        const coordenadasExternas = coordenadasInternacionales[normalizarUbicacion(consultaGeo)];
        const regionOriginal = String(u.comunidad_autonoma || u.comunidad || u.autonomous_community || u.region || u.state || u.provincia_region || u.province_region || u.province || '').trim();
        const regionNormalizada = normalizarUbicacion(regionOriginal);
        const regionGeocodificada = coordenadasExternas?.region || '';
        const regionExplicita = comunidadesEspanolas.get(regionNormalizada)
          || [...comunidadesEspanolas.entries()].find(([nombre]) => regionNormalizada.includes(nombre))?.[1]
          || comunidadesEspanolas.get(normalizarUbicacion(regionGeocodificada))
          || [...comunidadesEspanolas.entries()].find(([nombre]) => normalizarUbicacion(regionGeocodificada).includes(nombre))?.[1]
          || '';
        const paisAgrupado = formatearPais(paisOriginal || (infoLoc || regionExplicita ? 'España' : coordenadasExternas?.country)) || 'No especificado';
        const regionAgrupada = paisAgrupado === 'España'
          ? regionExplicita || infoLoc?.ca || 'No especificada'
          : regionOriginal || regionGeocodificada || 'No especificada';
        const latitudRaw = u.latitud ?? u.latitude ?? u.lat;
        const longitudRaw = u.longitud ?? u.longitude ?? u.lon ?? u.lng;
        const latitud = Number(latitudRaw);
        const longitud = Number(longitudRaw);
        const tieneCoordenadas = latitudRaw !== undefined && latitudRaw !== ''
          && longitudRaw !== undefined && longitudRaw !== ''
          && Number.isFinite(latitud) && Number.isFinite(longitud)
          && Math.abs(latitud) <= 90 && Math.abs(longitud) <= 180;
        const baseCoords = tieneCoordenadas
          ? [latitud, longitud]
          : infoLoc?.coords || coordenadasExternas?.coords;
        if (!baseCoords) {
          return { ...u, coords: null, paisAgrupado, regionAgrupada, consultaGeo };
        }

        const coordKey = `${baseCoords[0].toFixed(4)},${baseCoords[1].toFixed(4)}`;
        let coordsFinales = [...baseCoords];

        if (!mapaCoordenadasSocio[coordKey]) {
          mapaCoordenadasSocio[coordKey] = 1;
        } else {
          const count = mapaCoordenadasSocio[coordKey];
          mapaCoordenadasSocio[coordKey]++;
          
          const angle = count * 2.39996; 
          const radius = 0.015 * Math.sqrt(count);
          coordsFinales = [
            baseCoords[0] + radius * Math.cos(angle),
            baseCoords[1] + radius * Math.sin(angle)
          ];
        }
        return { ...u, coords: coordsFinales, paisAgrupado, regionAgrupada, consultaGeo };
      });
    }, [usuarias, coordenadasInternacionales, buscarUbicacion, comunidadesEspanolas, normalizarUbicacion, formatearPais]);

    useEffect(() => {
      const sinCoords = usuariasGeocodificadas.filter(u => !u.coords && u.consultaGeo);
      sinCoords.forEach(u => {
        const key = normalizarUbicacion(u.consultaGeo);
        if (!key || coordenadasInternacionales[key] || peticionesEnCursoRef.current.has(key)) return;

        peticionesEnCursoRef.current.add(key);
        geocodificarUbicacion(u.consultaGeo).then(coordenadas => {
          peticionesEnCursoRef.current.delete(key);
          if (!coordenadas) return;
          setCoordenadasInternacionales(prev => prev[key] ? prev : { ...prev, [key]: coordenadas });
        }).catch(() => peticionesEnCursoRef.current.delete(key));
      });
    }, [usuariasGeocodificadas, coordenadasInternacionales, geocodificarUbicacion, normalizarUbicacion]);

    const conteoPorPais = useMemo(() => {
      const conteo = new Map();
      usuariasGeocodificadas.forEach(u => {
        const pais = u.paisAgrupado || 'No especificado';
        const region = u.regionAgrupada || 'No especificada';
        if (!conteo.has(pais)) conteo.set(pais, { total: 0, regiones: new Map() });
        const grupo = conteo.get(pais);
        grupo.total += 1;
        grupo.regiones.set(region, (grupo.regiones.get(region) || 0) + 1);
      });
      return [...conteo.entries()]
        .map(([pais, grupo]) => ({
          pais,
          total: grupo.total,
          regiones: [...grupo.regiones.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
        }))
        .sort((a, b) => b.total - a.total || a.pais.localeCompare(b.pais, 'es'));
    }, [usuariasGeocodificadas]);

    const mapaDatosKey = useMemo(() => (
      JSON.stringify(usuariasGeocodificadas.map(u => ({
        email: (u.email || '').trim().toLowerCase(),
        nombre: u.nombre || '',
        pais: u.paisAgrupado || '',
        region: u.regionAgrupada || '',
        coords: u.coords || []
      })).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))))
    ), [usuariasGeocodificadas]);
    usuariasGeocodificadasRef.current = usuariasGeocodificadas;

    useEffect(() => {
      const container = mapContainerRef.current;
      if (!container) return;

      let retryTimer;
      let resizeTimer;
      let activo = true;
      let inicializando = false;
      const inicializarMapa = async () => {
        if (!activo || !container.isConnected) return;
        const estilos = window.getComputedStyle(container);
        const tieneDimensiones = estilos.display !== 'none'
          && estilos.visibility !== 'hidden'
          && container.offsetWidth > 0
          && container.offsetHeight > 0;
        if (!tieneDimensiones) {
          retryTimer = setTimeout(inicializarMapa, 150);
          return;
        }

        if (mapRef.current) {
          mapRef.current.invalidateSize();
          return;
        }
        if (inicializando) return;
        inicializando = true;

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

          resizeTimer = setTimeout(() => {
            if (activo && mapRef.current && container.offsetWidth > 0 && container.offsetHeight > 0) {
              mapRef.current.invalidateSize();
            }
          }, 100);
        } catch (error) {
          console.error('No se pudo cargar Leaflet:', error);
        } finally {
          inicializando = false;
        }
      };

      const observer = typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(inicializarMapa)
        : null;
      observer?.observe(container);
      inicializarMapa();

      return () => {
        activo = false;
        clearTimeout(retryTimer);
        clearTimeout(resizeTimer);
        observer?.disconnect();
        if (mapRef.current) {
          mapRef.current.stop();
          mapRef.current.remove();
          mapRef.current = null;
        }
        markersGroupRef.current = null;
        marcadoresKeyRef.current = null;
      };
    }, []);

    useEffect(() => {
      const map = mapRef.current;
      const Leaflet = leafletRef.current;
      const markersGroup = markersGroupRef.current;
      const container = mapContainerRef.current;
      if (!Leaflet || !map || !map._loaded || !markersGroup || !container || !container.isConnected) return;

      const estilos = window.getComputedStyle(container);
      if (estilos.display === 'none' || estilos.visibility === 'hidden' || container.offsetWidth === 0 || container.offsetHeight === 0) return;

      if (marcadoresKeyRef.current === mapaDatosKey) return;

      map.invalidateSize();
      markersGroup.clearLayers();
      const boundsArray = [];

      usuariasGeocodificadasRef.current.forEach(item => {
        const coor = item.coords;
        if (!Array.isArray(coor) || coor.length !== 2 || !coor.every(Number.isFinite)) return;
        boundsArray.push(coor);
        const piruletaHtml = `
          <div style="position: relative; width: 18px; height: 26px; display: flex; align-items: center; justify-content: center; cursor: pointer;" title="${item.nombre}">
            <svg viewBox="0 0 16 24" width="18" height="26" style="filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.3));">
              <line x1="8" y1="12" x2="8" y2="23" stroke="#23211e" stroke-width="2" stroke-linecap="round"/>
              <circle cx="8" cy="7" r="6" fill="#849673" stroke="#23211e" stroke-width="1.5"/>
            </svg>
          </div>
        `;
        if (!mapRef.current || !mapRef.current._loaded || !markersGroupRef.current) return;
        const customIcon = Leaflet.divIcon({ html: piruletaHtml, className: 'custom-piruleta-mini', iconSize: [18, 26], iconAnchor: [9, 25], popupAnchor: [0, -26] });
        const marker = Leaflet.marker(coor, { icon: customIcon });
        
        marker.on('click', () => {
          const usuariasActuales = usuariasGeocodificadasRef.current;
          setRegionSeleccionada({
            region: item.regionAgrupada,
            usuarias: usuariasActuales.filter(u => u.regionAgrupada === item.regionAgrupada && u.paisAgrupado === item.paisAgrupado)
          });
        });
        
        if (mapRef.current && mapRef.current._loaded && markersGroupRef.current) {
          markersGroupRef.current.addLayer(marker);
        }
      });

      if (boundsArray.length > 0 && mapRef.current && mapRef.current._loaded && markersGroupRef.current) {
        mapRef.current.fitBounds(boundsArray, { padding: [30, 30], maxZoom: 6 });
      }
      marcadoresKeyRef.current = mapaDatosKey;
    }, [mapaDatosKey, mapReady]);

    const limpiarRegion = () => {
      setRegionSeleccionada(null);
    };

    return (
      <div className="space-y-4 relative">
        <div className="relative">
          <div 
            ref={mapContainerRef} 
            style={{ height: '280px', width: '100%', zIndex: 1 }} 
            className="rounded-2xl border border-[#e8e4d9] shadow-sm overflow-hidden bg-[#faf9f5] transition-opacity duration-300"
          ></div>
          
          {regionSeleccionada && (
            <div className="absolute inset-0 z-[1000] bg-[#FFFFFF]/95 backdrop-blur-md p-4 flex flex-col rounded-2xl fade-in text-[#23211e] shadow-2xl max-h-[280px] overflow-hidden">
              <div className="flex justify-between items-center border-b border-[#e8e4d9] pb-2 mb-2 shrink-0">
                <h3 className="font-babydoll text-[#23211e] font-bold text-lg leading-none">{regionSeleccionada.region} ({regionSeleccionada.usuarias.length})</h3>
                <button onClick={limpiarRegion} className="text-[11px] font-bold text-[#75706b] bg-white border border-[#e8e4d9] px-2.5 py-1 rounded-lg hover:bg-gray-100 transition-colors">
                  cerrar
                </button>
              </div>
              <div className="overflow-y-auto flex-grow space-y-2 pr-1">
                {regionSeleccionada.usuarias.map((u, i) => (
                  <div key={i} className="flex justify-between items-center text-xs p-2.5 bg-white rounded-xl border border-[#e8e4d9] gap-2 shadow-xs">
                    <span className="font-bold font-babydoll text-sm text-[#23211e]">{u.nombre}</span>
                    <span className="text-[#75706b] font-sans text-[11px] italic">{u.ciudad || u.provincia_region || 'Sin localidad'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="editorial-card p-4 space-y-2.5">
          <h4 className="font-babydoll text-base font-bold text-[#23211e]">Usuarias por país</h4>
          <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
            {conteoPorPais.map(({ pais, total, regiones }, idx) => {
              const expandido = paisExpandido === pais;
              const regionesId = `${idContadorPais}-regiones-${idx}`;
              return (
                <div key={pais} className="rounded-lg border border-[#e8e4d9] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setPaisExpandido(expandido ? null : pais)}
                    aria-expanded={expandido}
                    aria-controls={regionesId}
                    className="w-full flex items-center justify-between gap-3 bg-[#ffffee] px-3 py-2.5 text-xs text-left hover:bg-[#faf9f5] transition-colors"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <i className={`fa-solid ${expandido ? 'fa-chevron-down' : 'fa-chevron-right'} text-[9px] text-[#75706b]`}></i>
                      <span className="font-bold font-babydoll truncate">{pais}</span>
                    </span>
                    <span className="bg-[#849673] text-white px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0">{total}</span>
                  </button>
                  {expandido && (
                    <div id={regionesId} className="px-3 py-2 space-y-1.5 border-t border-[#e8e4d9] bg-white">
                      <p className="text-[9px] uppercase font-bold text-[#75706b]">
                        {pais === 'España' ? 'Comunidades autónomas' : 'Regiones / provincias'}
                      </p>
                      {regiones.map(([region, cantidad]) => (
                        <div key={region} className="flex justify-between items-center gap-3 text-[11px] pl-2">
                          <span className="text-[#23211e] truncate">{region}</span>
                          <span className="text-[#75706b] font-bold shrink-0">{cantidad}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
}