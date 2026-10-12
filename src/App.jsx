import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { createClient } from '@supabase/supabase-js';
import BuscadorLibros from './BuscadorLibros';
import PortadaLibro from './PortadaLibro';
import MapaGilda from './MapaGilda';
import EdificioClub from './EdificioClub';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const solicitudesPortadaEnCurso = new Map();
const geocodificacionesEnCurso = new Map();
const respuestasJsonExternas = new Map();
const solicitudesJsonExternas = new Map();
const GOOGLE_BOOKS_COOLDOWN_KEY = 'gilda_google_books_cooldown';
let colaGeocodificacion = Promise.resolve();
let ultimaSolicitudGeocodificacion = 0;
const EMAIL_ADMINISTRADORA = 'ndnagore@gmail.com';

const googleBooksEnCooldown = () => {
  try {
    googleBooksCooldownUntil = Math.max(googleBooksCooldownUntil, Number(sessionStorage.getItem(GOOGLE_BOOKS_COOLDOWN_KEY)) || 0);
  } catch {
    // Continuar sin sessionStorage.
  }
  return googleBooksCooldownUntil > Date.now();
};

let googleBooksCooldownUntil = 0;

const solicitarJsonExterno = (url) => {
  const esGoogleBooks = url.includes('googleapis.com/books/');
  const ahora = Date.now();
  const cache = respuestasJsonExternas.get(url);
  if (cache && cache.expiresAt > ahora) return Promise.resolve(cache.data);
  if (esGoogleBooks && googleBooksEnCooldown()) return Promise.resolve(null);
  if (solicitudesJsonExternas.has(url)) return solicitudesJsonExternas.get(url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  const solicitud = fetch(url, { signal: controller.signal })
    .then(async respuesta => {
      if (!respuesta.ok) {
        const error = new Error(`HTTP ${respuesta.status}`);
        error.status = respuesta.status;
        throw error;
      }
      return respuesta.json();
    })
    .then(data => {
      respuestasJsonExternas.set(url, { data, expiresAt: Date.now() + 10 * 60 * 1000 });
      return data;
    })
    .catch(error => {
      const espera = error.status === 429 ? 60000 : 30000;
      respuestasJsonExternas.set(url, { data: null, expiresAt: Date.now() + espera });
      if (esGoogleBooks && error.status === 429) {
        googleBooksCooldownUntil = Date.now() + espera;
        try {
          sessionStorage.setItem(GOOGLE_BOOKS_COOLDOWN_KEY, String(googleBooksCooldownUntil));
        } catch {
          // Continuar sin sessionStorage.
        }
      }
      return null;
    })
    .finally(() => {
      clearTimeout(timeout);
      solicitudesJsonExternas.delete(url);
    });

  if (respuestasJsonExternas.size > 50) respuestasJsonExternas.delete(respuestasJsonExternas.keys().next().value);
  solicitudesJsonExternas.set(url, solicitud);
  return solicitud;
};

const normalizarUbicacion = (texto) => String(texto || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase()
  .replace(/\s+/g, ' ');

const formatearPais = (pais) => {
  const valor = String(pais || '').trim();
  const normalizado = normalizarUbicacion(valor);
  const alias = {
    es: 'España',
    espana: 'España',
    spain: 'España',
    us: 'Estados Unidos',
    usa: 'Estados Unidos',
    gb: 'Reino Unido',
    uk: 'Reino Unido'
  };
  if (alias[normalizado]) return alias[normalizado];
  if (/^[a-z]{2}$/i.test(valor) && typeof Intl.DisplayNames === 'function') {
    try {
      return new Intl.DisplayNames(['es'], { type: 'region' }).of(valor.toUpperCase()) || valor;
    } catch {
      return valor.toUpperCase();
    }
  }
  return valor.split(/\s+/).map(palabra => palabra.charAt(0).toLocaleUpperCase('es') + palabra.slice(1)).join(' ');
};

const normalizarResultadoGeo = (resultado) => {
  if (Array.isArray(resultado)) return { coords: resultado, country: '', region: '' };
  if (!resultado || !Array.isArray(resultado.coords)) return null;
  return resultado;
};

const geocodificarUbicacion = (consulta) => {
  const cacheKey = `gilda_geo_${normalizarUbicacion(consulta)}`;
  try {
    const cache = sessionStorage.getItem(cacheKey);
    if (cache !== null) return Promise.resolve(normalizarResultadoGeo(JSON.parse(cache)));
  } catch {
    // Continuar sin caché.
  }

  if (geocodificacionesEnCurso.has(cacheKey)) return geocodificacionesEnCurso.get(cacheKey);

  const solicitud = colaGeocodificacion.then(async () => {
    try {
      const cache = sessionStorage.getItem(cacheKey);
      if (cache !== null) return normalizarResultadoGeo(JSON.parse(cache));
    } catch {
      // Continuar sin caché.
    }

    const espera = Math.max(0, 1100 - (Date.now() - ultimaSolicitudGeocodificacion));
    if (espera > 0) await new Promise(resolve => setTimeout(resolve, espera));
    ultimaSolicitudGeocodificacion = Date.now();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&q=${encodeURIComponent(consulta)}`;
      const respuesta = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
      if (!respuesta.ok) throw new Error(`Geocoding HTTP ${respuesta.status}`);
      const resultados = await respuesta.json();
      const resultado = resultados[0];
      const coordenadas = resultado ? [Number(resultado.lat), Number(resultado.lon)] : null;
      const validas = coordenadas && coordenadas.every(Number.isFinite)
        ? {
            coords: coordenadas,
            country: resultado.address?.country || '',
            region: resultado.address?.state || resultado.address?.region || ''
          }
        : null;
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(validas));
      } catch {
        // Ignorar errores de almacenamiento.
      }
      return validas;
    } catch {
      try {
        sessionStorage.setItem(cacheKey, 'null');
      } catch {
        // Ignorar errores de almacenamiento.
      }
      return null;
    } finally {
      clearTimeout(timeout);
    }
  });

  colaGeocodificacion = solicitud.then(() => undefined, () => undefined);
  geocodificacionesEnCurso.set(cacheKey, solicitud);
  solicitud.finally(() => geocodificacionesEnCurso.delete(cacheKey));
  return solicitud;
};

export default function App() {
  const BuscadorLibrosEstable = useMemo(() => BuscadorLibros, []);
  const PortadaLibroEstable = useMemo(() => PortadaLibro, []);
  const MapaGildaEstable = useMemo(() => MapaGilda, []);

  const safeGet = (key, fallback) => {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? val : fallback;
    } catch {
      return fallback;
    }
  };

  const safeGetJSON = (key, fallback) => {
    try {
      const val = localStorage.getItem(key);
      if (val === null) return fallback;
      const parsed = JSON.parse(val);
      if (Array.isArray(fallback)) return Array.isArray(parsed) ? parsed : fallback;
      if (fallback === null) {
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback;
      }
      return typeof parsed === typeof fallback ? parsed : fallback;
    } catch {
      return fallback;
    }
  };

  const safeSet = (key, val) => {
    try {
      localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
    } catch (e) {
      console.error(e);
    }
  };

  const FRASES_INICIALES = [
    "Un lector vive mil vidas antes de morir. El que no lee vive solo una.",
    "La depresión... como la manifestación de algo que no se puede reducir a lo anecdótico porque es estructural y colectivo.",
    "No hay barrera, cerradura ni cerrojo que puedas imponer a la libertad de mi mente."
  ];

  const calcularEstadoConexion = (timestampStr) => {
    if (!timestampStr) return 'desconectada';
    const ahora = new Date();
    const ultima = new Date(timestampStr);
    const diffMinutos = (ahora - ultima) / 1000 / 60;
    if (isNaN(diffMinutos)) return 'desconectada';
    if (diffMinutos < 3) return 'conectada';
    if (diffMinutos < 15) return 'ausente';
    return 'desconectada';
  };

  const IndicadorPresencia = ({ timestamp }) => {
    const estado = calcularEstadoConexion(timestamp);
    if (estado === 'desconectada') return <span className="w-3 h-3 rounded-full bg-gray-300 inline-block shrink-0" title="Desconectada"></span>;
    const color = estado === 'conectada' ? 'bg-green-500 animate-pulse' : 'bg-amber-400';
    const titulo = estado === 'conectada' ? 'Conectada ahora' : 'Ausente';
    return <span className={`w-3 h-3 rounded-full ${color} inline-block shrink-0`} title={titulo}></span>;
  };

  const formatearHoraWhatsApp = (timestampOrStr, fechaFallback) => {
    if (timestampOrStr) {
      const d = new Date(timestampOrStr);
      if (!isNaN(d.getTime())) {
        const horas = String(d.getHours()).padStart(2, '0');
        const minutos = String(d.getMinutes()).padStart(2, '0');
        return `${horas}:${minutos}`;
      }
    }
    if (fechaFallback && fechaFallback !== 'Justo ahora') {
      const match = fechaFallback.match(/\b(\d{1,2}):(\d{2})(?::\d{2})?\b/);
      if (match) {
        return `${match[1].padStart(2, '0')}:${match[2]}`;
      }
    }
    const ahora = new Date();
    return `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
  };

  function ModalCompartirStory({ onClose, usuario, libro, pagina, citas, decoracion, misLibros, onPublicarCita }) {
    const [modo, setModo] = useState('progreso'); 
    const [textoCita, setTextoCita] = useState(FRASES_INICIALES[0]);
    const [tituloLibroStory, setTituloLibroStory] = useState(libro?.titulo || '');
    const [publicandoCita, setPublicandoCita] = useState(false);
    useEffect(() => {
      if (citas?.length) setTextoCita(citas[Math.floor(Math.random() * citas.length)]);
    }, [citas]);
    const librosStory = useMemo(() => {
      const candidatos = [libro, ...misLibros].filter(item => item?.titulo || item?.libro);
      const unicos = new Map();
      candidatos.forEach(item => {
        const titulo = String(item.titulo || item.libro || '').trim();
        if (!titulo) return;
        const clave = titulo.toLowerCase();
        if (!unicos.has(clave)) unicos.set(clave, { ...item, titulo });
      });
      return [...unicos.values()];
    }, [libro, misLibros]);
    const libroStory = librosStory.find(item => item.titulo === tituloLibroStory) || librosStory[0] || libro;
    const paginaStory = Number(libroStory?.pagina ?? libroStory?.paginas ?? pagina) || 0;

    const elegirOtraCita = () => {
      const opciones = citas?.length ? citas : FRASES_INICIALES;
      setTextoCita(opciones[Math.floor(Math.random() * opciones.length)]);
    };

    const handleDownload = () => {
      const el = document.getElementById('gilda-story-card');
      if (window.html2canvas) {
        window.html2canvas(el, { 
          scale: 3, 
          useCORS: true, 
          allowTaint: true, 
          backgroundColor: '#ffffee',
          logging: false,
          onclone: (clonedDoc) => {
            const clonedCard = clonedDoc.getElementById('gilda-story-card');
            if (clonedCard) {
              clonedCard.style.width = '310px';
              clonedCard.style.height = '551px';
            }
          }
        }).then(canvas => {
          const link = document.createElement('a');
          link.download = `gilda_story_${modo}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        }).catch(err => {
          console.error("Error al generar la imagen:", err);
          alert("Hubo un error al generar la imagen. Intenta hacer captura de pantalla.");
        });
      }
    };

    const nombreSocia = (
      usuario && String(usuario).trim() !== '' 
        ? String(usuario).trim() 
        : (sesion?.email ? sesion.email.split('@')[0] : 'lectora')
    ).toLowerCase();

    return (
      <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm flex flex-col items-center justify-start pt-6 pb-6 px-4 fade-in overflow-y-auto">
        <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-full mb-4 border border-white/20 shadow-lg shrink-0">
           <button onClick={() => setModo('progreso')} className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold rounded-full transition-colors min-h-[44px] ${modo==='progreso' ? 'bg-white text-[#1c1c1a] shadow-sm':'text-white hover:bg-white/10'}`}>Progreso</button>
           <button onClick={() => setModo('cita')} className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold rounded-full transition-colors min-h-[44px] ${modo==='cita' ? 'bg-white text-[#1c1c1a] shadow-sm':'text-white hover:bg-white/10'}`}>Cita</button>
           <button onClick={() => setModo('habitacion')} className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold rounded-full transition-colors min-h-[44px] ${modo==='habitacion' ? 'bg-white text-[#1c1c1a] shadow-sm':'text-white hover:bg-white/10'}`}>Habitación</button>
        </div>

        {librosStory.length > 0 && (
          <label className="w-full max-w-[310px] mb-3 flex items-center gap-2 text-xs font-sans text-white shrink-0">
            <span className="font-bold">Libro</span>
            <select value={libroStory.titulo} onChange={e => setTituloLibroStory(e.target.value)} className="min-w-0 flex-grow bg-white text-[#1c1c1a] border border-white/30 rounded-lg px-2.5 py-2 text-xs">
              {librosStory.map(item => <option key={item.titulo} value={item.titulo}>{item.titulo}</option>)}
            </select>
          </label>
        )}

        <div 
          id="gilda-story-card" 
          className="relative w-[310px] h-[551px] shadow-2xl rounded-2xl flex flex-col justify-between items-center p-6 bg-[#ffffee] border border-[#e6e4dc] shrink-0 box-border overflow-hidden modal-pop" 
        >
          <div className="w-full text-center pt-2 pb-2 shrink-0">
            <h2 className="font-babydoll text-xl text-[#1c1c1a] leading-tight tracking-wide">
              la habitación de {nombreSocia}
            </h2>
          </div>
          
          <div className="w-full flex-grow flex flex-col items-center justify-center py-2 box-border">
            {modo === 'cita' && (
              <div className="w-full px-2 text-center flex flex-col items-center justify-center space-y-3">
                <textarea aria-label="Texto de la cita para Stories" value={textoCita} onChange={e => setTextoCita(e.target.value)} maxLength={360} className="w-full min-h-36 resize-none border border-[#e6e4dc] rounded-xl bg-white/70 p-3 font-babydoll text-base text-[#1c1c1a] leading-relaxed text-center focus:outline-none focus:ring-2 focus:ring-[#8b6040]" />
                <button type="button" onClick={elegirOtraCita} className="text-[10px] font-bold text-[#3d4220] bg-white border border-[#e6e4dc] rounded-full px-3 py-1.5 min-h-[44px]">Otra cita</button>
                {libroStory?.titulo && <span className="font-sans text-[10px] text-[#595750]">{libroStory.titulo}{libroStory.autora ? ` · ${libroStory.autora}` : ''}</span>}
                <span className="font-sans text-xs font-semibold text-[#3d4220] tracking-wide block lowercase">
                  @gilda.mailclub
                </span>
              </div>
            )}
            
            {modo === 'progreso' && (
              <div className="w-full flex flex-col items-center text-center space-y-3">
                <span className="font-sans text-xs font-semibold text-[#3d4220] tracking-wide block lowercase">
                  @gilda.mailclub
                </span>
                
                <div className="shadow-xl w-20 h-28 rounded overflow-hidden shrink-0 flex items-center justify-center bg-gray-100">
                  <PortadaLibroEstable solicitarJsonExterno={solicitarJsonExterno} googleBooksEnCooldown={googleBooksEnCooldown} solicitudesPortadaEnCurso={solicitudesPortadaEnCurso} titulo={libroStory.titulo} autora={libroStory.autora} portada={libroStory.portada} size="story" />
                </div>

                <div className="w-full max-w-[210px] space-y-1.5 pt-1">
                  <p className="font-babydoll font-bold text-sm leading-snug text-[#1c1c1a] px-1 m-0 text-center">
                    {libroStory.titulo}
                  </p>
                  
                  <div className="w-full bg-[#e6e4dc] h-[4px] rounded-full overflow-hidden my-1">
                    <div 
                      className="bg-[#3d4220] h-full rounded-full" 
                      style={{ width: `${Math.min(100, Math.max(5, (paginaStory / (libroStory.paginas_totales || libro.paginas_totales || 280)) * 100))}%` }}
                    ></div>
                  </div>

                  <p className="text-[11px] text-[#595750] font-sans font-bold tracking-wide m-0 text-center">
                    pág. {paginaStory}
                  </p>
                </div>
              </div>
            )}
            
            {modo === 'habitacion' && (
              <div className="w-full flex flex-col items-center justify-center">
                <div className="estanteria-madera w-[240px] flex items-end justify-center px-2 pt-4 pb-6 min-h-[130px] shadow-sm relative box-border">
                  {misLibros.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="scale-75 transform origin-bottom -mx-2.5 shrink-0">
                      <LomoLibroEstanteria item={item} />
                    </div>
                  ))}
                  {decoracion !== 'ninguna' && (
                    <div className="shrink-0 pl-1 pb-1 scale-75 transform origin-bottom">
                      <IlustracionDecoracion tipo={decoracion} />
                    </div>
                  )}
                  
                  <span className="absolute bottom-1 right-2 font-sans text-[10px] font-bold text-[#3d4220] tracking-wide block lowercase z-10">
                    @gilda.mailclub
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="w-full h-4 shrink-0"></div>
        </div>

        <div className="mt-5 space-y-2.5 w-full max-w-[310px] shrink-0 font-sans">
           {modo === 'cita' && (
             <button
               type="button"
               disabled={!textoCita.trim() || publicandoCita}
               onClick={async () => {
                 setPublicandoCita(true);
                 try {
                   await onPublicarCita?.(textoCita.trim(), libroStory);
                 } finally {
                   setPublicandoCita(false);
                 }
               }}
               className="w-full bg-[#3d4220] text-white font-bold py-3.5 rounded-2xl text-xs shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
             >
               <i className="fa-solid fa-feather"></i> {publicandoCita ? 'Publicando...' : 'Publicar en el Muro'}
             </button>
           )}
           <button onClick={handleDownload} className="w-full bg-white text-[#1c1c1a] font-bold py-3.5 rounded-2xl text-xs shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform min-h-[44px]">
             <i className="fa-solid fa-download"></i> Descargar imagen
           </button>
           <button onClick={onClose} className="w-full bg-transparent text-white font-bold py-3.5 rounded-2xl text-xs border border-white/20 hover:bg-white/10 transition-colors min-h-[44px]">
             Cerrar
           </button>
           <p className="text-center text-white/70 text-xs px-4 pt-1 leading-relaxed">
             Consejo: También puedes hacer captura de pantalla para subirla directamente a tus Stories.
           </p>
        </div>
      </div>
    );
  }

  function ModalUpgrade({ onClose }) {
    return (
      <div className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 fade-in">
        <div className="editorial-card max-w-sm w-full p-6 space-y-4 text-center bg-white relative modal-pop">
          <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-black p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
          <div className="w-12 h-12 bg-[#ffffee] rounded-full flex items-center justify-center mx-auto text-[#3d4220] border border-[#e6e4dc]">
            <i className="fa-solid fa-lock text-lg"></i>
          </div>
          <div className="space-y-1">
            <h3 className="font-babydoll text-xl font-bold">Acceso restringido</h3>
            <p className="text-xs text-[#595750] font-sans leading-relaxed">
              Tu modalidad actual no incluye acceso a esta función. Actualiza tu suscripción para acceder a todas las secciones de gilda.
            </p>
          </div>
          <a href="https://nagoreads.github.io/gilda/" target="_blank" rel="noopener noreferrer" className="block w-full editorial-btn py-3 text-xs text-center font-semibold min-h-[44px] flex items-center justify-center">
            Actualizar modalidad
          </a>
        </div>
      </div>
    );
  }

  function ObjetoExternoEnmarcado({ urlImagen, titulo, onClick }) {
    const estiloImagenExterna = {
      filter: 'saturate(0.8) sepia(0.2) contrast(0.9)',
      objectFit: 'cover'
    };

    return (
      <button 
        onClick={onClick}
        className="relative cursor-pointer hover:scale-105 transition-transform shrink-0"
        title={titulo || "Pin importado"}
      >
        <div className="border-[1.5px] border-[#1c1c1a] rounded-sm bg-[#f7f3e8] p-1 shadow-sm w-16 h-20 flex flex-col items-center">
          <div className="absolute top-0 w-2 h-3 bg-[#595750] border-[1px] border-[#1c1c1a] rounded-full z-10 -mt-1"></div>
          <div className="w-full h-full overflow-hidden border-[1px] border-[#1c1c1a]">
            {urlImagen ? (
              <img src={urlImagen} alt={titulo} style={estiloImagenExterna} className="w-full h-full" />
            ) : (
              <div className="w-full h-full bg-[#e8e2d2] flex items-center justify-center">
                 <span className="text-[#595750] text-[10px] text-center font-sans">+ Pin</span>
              </div>
            )}
          </div>
        </div>
      </button>
    );
  }

  function ModalImportarPin({ onClose, onSave }) {
    const [urlInput, setUrlInput] = useState('');
    const [tituloInput, setTituloInput] = useState('');

    return (
      <div className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 fade-in">
        <div className="editorial-card max-w-sm w-full p-6 space-y-4 bg-white relative modal-pop">
          <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-black p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
          <h3 className="font-babydoll text-xl font-bold">Añadir pin o imagen externa</h3>
          <p className="text-xs text-[#595750] font-sans leading-relaxed">
            Pega la URL directa de la imagen (ej. de Pinterest o Cosmos).
          </p>
          <div className="space-y-3 font-sans">
            <div>
              <label className="block text-xs font-semibold text-[#1c1c1a] mb-1">Título del marco o moodboard</label>
              <input type="text" placeholder="Ej: Inspiración otoño..." value={tituloInput} onChange={(e) => setTituloInput(e.target.value)} className="w-full editorial-input p-2.5 text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1c1c1a] mb-1">URL directa de la imagen (.jpg, .png)</label>
              <input type="url" placeholder="https://..." value={urlInput} onChange={(e) => setUrlInput(e.target.value)} className="w-full editorial-input p-2.5 text-xs" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => { if (urlInput.trim()) { onSave(urlInput.trim(), tituloInput.trim()); } }} className="flex-1 editorial-btn py-2.5 text-xs font-semibold min-h-[44px]">
              Guardar marco
            </button>
            <button onClick={onClose} className="flex-1 bg-gray-100 text-[#595750] rounded-xl py-2.5 text-xs font-semibold hover:bg-gray-200 font-sans min-h-[44px]">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  function LomoLibroEstanteria({ item, onClick }) {
    const generarColorEditorial = (texto) => {
      let hash = 0;
      for (let i = 0; i < texto.length; i++) { hash = texto.charCodeAt(i) + ((hash << 5) - hash); }
      const matices = ['#3d4220', '#34381b', '#523021', '#232820', '#633528', '#324854', '#543d30', '#3d3054', '#4a3429', '#324235', '#523c2a', '#2c363d', '#422e2e', '#3a2e4a', '#323d3e'];
      return matices[Math.abs(hash) % matices.length];
    };
    const tituloLibro = item.libro || item.titulo || 'libro';

    return (
      <div onClick={onClick} style={{ backgroundColor: generarColorEditorial(tituloLibro) }} className="lomo-libro text-[#ffffee] w-12 h-36 shrink-0 cursor-pointer shadow-md relative rounded-t-sm overflow-hidden flex flex-col justify-start p-2 border-t border-white/20" title={`${tituloLibro} — ${item.autora || ''}`}>
        <div className="absolute top-1 left-1.5 w-1 h-2 rounded-full bg-white/20"></div>
        <div className="flex flex-col h-full justify-start pt-3">
          <span className="font-babydoll font-bold text-[9px] leading-tight text-left text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] overflow-hidden" style={{writingMode: 'vertical-rl', textOrientation: 'mixed', maxHeight: '110px'}}>
            {tituloLibro}
          </span>
        </div>
      </div>
    );
  }

  function IlustracionDecoracion({ tipo, onInteractuar }) {
    const [animado, setAnimado] = useState(false);
    const handleClick = () => {
      setAnimado(true);
      setTimeout(() => setAnimado(false), 400);
      if (onInteractuar) onInteractuar(tipo);
    };
    const wrapperClass = `interactiva-ilustracion ${animado ? 'animar-salto' : ''}`;

    if (tipo === 'monstera') return (
      <div onClick={handleClick} className={wrapperClass} title="¡Haz clic en tu plantita!">
        <svg width="44" height="48" viewBox="0 0 42 46" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 drop-shadow-sm">
          <path d="M14 34H28V44H14V34Z" fill="#b8784f" stroke="#1c1c1a" strokeWidth="1.5"/><path d="M12 34H30V37H12V34Z" fill="#9e6037" stroke="#1c1c1a" strokeWidth="1.5"/><path d="M21 34V16" stroke="#3d4220" strokeWidth="2" strokeLinecap="round"/><path d="M21 22C14 20 8 24 6 28C11 31 16 28 21 22Z" fill="#616c31" stroke="#1c1c1a" strokeWidth="1.5"/><path d="M21 18C28 16 34 20 36 24C31 27 26 24 21 18Z" fill="#525c27" stroke="#1c1c1a" strokeWidth="1.5"/><path d="M21 14C17 6 10 6 7 9C10 13 15 14 21 14Z" fill="#758237" stroke="#1c1c1a" strokeWidth="1.5"/><path d="M21 14C25 6 32 6 35 9C32 13 27 14 21 14Z" fill="#616c31" stroke="#1c1c1a" strokeWidth="1.5"/>
        </svg>
      </div>
    );
    if (tipo === 'maceta') return (
      <div onClick={handleClick} className={wrapperClass} title="¡Haz clic en tu maceta!">
        <svg width="42" height="44" viewBox="0 0 40 42" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 drop-shadow-sm">
          <path d="M10 28H30V40H10V28Z" fill="#d4c8b4" stroke="#1c1c1a" strokeWidth="1.5"/><path d="M8 25H32V29H8V25Z" fill="#e3d9cc" stroke="#1c1c1a" strokeWidth="1.5"/><path d="M20 25C15 16 11 10 9 6C15 10 18 16 20 25Z" fill="#616c31" stroke="#1c1c1a" strokeWidth="1.5"/><path d="M20 25C25 16 29 10 31 6C25 10 22 16 20 25Z" fill="#758237" stroke="#1c1c1a" strokeWidth="1.5"/>
        </svg>
      </div>
    );
    if (tipo === 'vela') return (
      <div onClick={handleClick} className={wrapperClass} title="¡Haz clic para encender o apagar la vela!">
        <svg width="34" height="46" viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 drop-shadow-sm">
          <path d="M8 20H24V42H8V20Z" fill="#f5f0e1" stroke="#1c1c1a" strokeWidth="1.5"/><path d="M15 16H17V20H15V16Z" fill="#1c1c1a"/><path className="vela-flama" d="M16 14C19 10 18 6 16 3C14 6 13 10 16 14Z" fill="#d96b14" stroke="#1c1c1a" strokeWidth="1.2"/>
        </svg>
      </div>
    );
    if (tipo === 'cafe') return (
      <div onClick={handleClick} className={wrapperClass} title="¡Haz clic para dar un sorbo a tu café!">
        <svg width="42" height="40" viewBox="0 0 40 38" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 drop-shadow-sm">
          <path d="M8 14H28V32H8V14Z" fill="#FFFFFF" stroke="#1c1c1a" strokeWidth="1.5"/><path d="M28 17H33C35 17 35 25 33 25H28" stroke="#1c1c1a" strokeWidth="1.5"/><path d="M8 14H28V18H8V14Z" fill="#523021" stroke="#1c1c1a" strokeWidth="1.5"/><path className="humo-taza" d="M14 10C15 7 13 5 15 2" stroke="#a69982" strokeWidth="1.5" strokeLinecap="round"/><path className="humo-taza" style={{animationDelay: '1s'}} d="M22 11C23 8 21 6 23 3" stroke="#a69982" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
    );
    if (tipo === 'cactus') return (
      <div onClick={handleClick} className={wrapperClass} title="¡Haz clic en tu cactus!">
        <svg width="38" height="44" viewBox="0 0 36 42" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 drop-shadow-sm">
          <path d="M10 32H26V40H10V32Z" fill="#9e6037" stroke="#1c1c1a" strokeWidth="1.5"/><path d="M15 12C15 8 21 8 21 12V32H15V12Z" fill="#4d5930" stroke="#1c1c1a" strokeWidth="1.5"/><path d="M10 18H15V22H10C8 22 8 18 10 18Z" fill="#4d5930" stroke="#1c1c1a" strokeWidth="1.5"/><path d="M21 16H26C28 16 28 20 26 20H21V16Z" fill="#4d5930" stroke="#1c1c1a" strokeWidth="1.5"/>
        </svg>
      </div>
    );
    if (tipo === 'auriculares') return (
      <div onClick={handleClick} className={wrapperClass} title="¡Tus auriculares cozy!">
        <svg width="40" height="40" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 drop-shadow-sm">
          <path d="M10 24V17C10 11 14 7 19 7C24 7 28 11 28 17V24" stroke="#1c1c1a" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          <rect x="7" y="22" width="6" height="10" rx="3" fill="#f7f3e8" stroke="#1c1c1a" strokeWidth="1.5"/>
          <rect x="25" y="22" width="6" height="10" rx="3" fill="#f7f3e8" stroke="#1c1c1a" strokeWidth="1.5"/>
        </svg>
      </div>
    );
    if (tipo === 'tocadiscos') return (
      <div onClick={handleClick} className={wrapperClass} title="¡Tu tocadiscos vintage!">
        <svg width="44" height="38" viewBox="0 0 42 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 drop-shadow-sm">
          <rect x="3" y="10" width="36" height="22" rx="3" fill="#c9bea3" stroke="#1c1c1a" strokeWidth="1.5"/>
          <circle cx="15" cy="21" r="7" fill="#1c1c1a"/>
          <circle cx="15" cy="21" r="2.5" fill="#ffffee" stroke="#1c1c1a" strokeWidth="1.2"/>
          <path d="M26 15L31 22" stroke="#1c1c1a" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="31" cy="22" r="1.5" fill="#ffffee" stroke="#1c1c1a" strokeWidth="1"/>
        </svg>
      </div>
    );
    if (tipo === 'camara') return (
      <div onClick={handleClick} className={wrapperClass} title="¡Tu cámara analógica!">
        <svg width="42" height="36" viewBox="0 0 40 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 drop-shadow-sm">
          <rect x="4" y="10" width="32" height="20" rx="3" fill="#595750" stroke="#1c1c1a" strokeWidth="1.5"/>
          <path d="M12 10V7H28V10" fill="#f7f3e8" stroke="#1c1c1a" strokeWidth="1.5"/>
          <circle cx="20" cy="20" r="6" fill="#f7f3e8" stroke="#1c1c1a" strokeWidth="1.5"/>
          <circle cx="20" cy="20" r="3" fill="#3d4220"/>
          <circle cx="10" cy="15" r="1.5" fill="#ffffee" stroke="#1c1c1a" strokeWidth="1"/>
        </svg>
      </div>
    );
    if (tipo === 'lampara') return (
      <div onClick={handleClick} className={wrapperClass} title="¡Tu lámpara de lectura!">
        <svg width="36" height="46" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 drop-shadow-sm">
          <path d="M12 40H22" stroke="#1c1c1a" strokeWidth="2" strokeLinecap="round"/>
          <path d="M17 40V22L9 12" stroke="#595750" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 12H16L19 6H9L6 12Z" fill="#3d4220" stroke="#1c1c1a" strokeWidth="1.5"/>
        </svg>
      </div>
    );
    return null;
  }

  function AvatarUsuaria({ foto, nombre, sizeClass = "w-9 h-9", textClass = "text-lg", editable = false, onFotoChange = () => {} }) {
    const [errorImg, setErrorImg] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setErrorImg(false);
          onFotoChange(reader.result);
        };
        reader.readAsDataURL(file);
      }
    };

    const renderContent = () => {
      if (foto && foto.trim() !== '' && !errorImg) {
        return <img src={foto} alt={nombre || 'Lector(a)'} onError={() => setErrorImg(true)} className={`${sizeClass} rounded-full object-cover border border-[#e6e4dc] shrink-0`} />;
      }
      return <div className={`${sizeClass} rounded-full bg-[#faf9f5] border border-[#e6e4dc] flex items-center justify-center font-babydoll ${textClass} text-[#3d4220] shrink-0 font-bold`}>{(nombre || 'L').charAt(0).toUpperCase()}</div>;
    };

    if (editable) {
      return (
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current && fileInputRef.current.click()} title="Cambiar foto de perfil desde tu galería">
          {renderContent()}
          <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <i className="fa-solid fa-camera text-white text-xs"></i>
          </div>
          <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="hidden" />
        </div>
      );
    }
    return renderContent();
  }

  function CalendarioInteractivo({ eventos }) {
    const [fechaActual, setFechaActual] = useState(new Date());
    const [diaSeleccionado, setDiaSeleccionado] = useState(null);
    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const anio = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();
    const primerDiaMes = new Date(anio, mes, 1);
    const ultimoDiaMes = new Date(anio, mes + 1, 0);

    let primerDiaSemanaIndice = primerDiaMes.getDay() - 1;
    if (primerDiaSemanaIndice === -1) primerDiaSemanaIndice = 6;
    const totalDiasMes = ultimoDiaMes.getDate();
    const hoy = new Date();
    const esMesActual = hoy.getFullYear() === anio && hoy.getMonth() === mes;

    const parsearFechaEvento = useCallback((strFecha) => {
      if (!strFecha) return null;
      const s = strFecha.toString().trim().toLowerCase();
      if (s.includes('-') || s.includes('/')) {
        const partes = s.split(/[/-]/);
        if (partes.length >= 2) {
          if (partes[0].length === 4) {
            return { dia: parseInt(partes[2], 10), mes: parseInt(partes[1], 10) - 1, anio: parseInt(partes[0], 10) };
          } else {
            return { dia: parseInt(partes[0], 10), mes: parseInt(partes[1], 10) - 1, anio: partes[2] ? parseInt(partes[2], 10) : anio };
          }
        }
      }
      const matchDia = s.match(/^(\d{1,2})/);
      if (matchDia) {
        const diaNum = parseInt(matchDia[1], 10);
        const mapaMeses = {
          ene: 0, enero: 0, feb: 1, febrero: 1, mar: 2, marzo: 2, abr: 3, abril: 3,
          may: 4, mayo: 4, jun: 5, junio: 5, jul: 6, julio: 6, ago: 7, agosto: 7,
          sep: 8, sept: 8, septiembre: 8, oct: 9, octubre: 9, nov: 10, noviembre: 10, dic: 11, diciembre: 11
        };
        for (const [clave, mesIndex] of Object.entries(mapaMeses)) {
          if (s.includes(clave)) {
            const matchAnio = s.match(/\b(20\d{2})\b/);
            return { dia: diaNum, mes: mesIndex, anio: matchAnio ? parseInt(matchAnio[1], 10) : anio };
          }
        }
      }
      return null;
    }, [anio]);

    const eventosDelMes = useMemo(() => {
      const mapa = {};
      (eventos || []).forEach(ev => {
        const est = (ev.estado || '').toLowerCase();
        if (est === 'pendiente' || est === 'por definir') return;
        const parsed = parsearFechaEvento(ev.fecha || ev.dia || ev.date || ev.fecha_evento);
        if (parsed && parsed.mes === mes && parsed.anio === anio) {
          if (!mapa[parsed.dia]) mapa[parsed.dia] = [];
          mapa[parsed.dia].push(ev);
        }
      });
      return mapa;
    }, [eventos, mes, anio, parsearFechaEvento]);

    const mesAnterior = () => { setFechaActual(new Date(anio, mes - 1, 1)); setDiaSeleccionado(null); };
    const mesSiguiente = () => { setFechaActual(new Date(anio, mes + 1, 1)); setDiaSeleccionado(null); };

    const celdas = [];
    for (let i = 0; i < primerDiaSemanaIndice; i++) {
      celdas.push(<div key={`empty-${i}`} className="h-9"></div>);
    }

    for (let dia = 1; dia <= totalDiasMes; dia++) {
      const esHoy = esMesActual && hoy.getDate() === dia;
      const evs = eventosDelMes[dia] || [];
      const tieneEventos = evs.length > 0;
      
      celdas.push(
        <div 
          key={dia} 
          onClick={() => {
            if (tieneEventos) {
              setDiaSeleccionado({ dia, eventos: evs });
            } else {
              setDiaSeleccionado(null);
            }
          }}
          className={`h-9 flex flex-col items-center justify-center rounded-xl relative transition-all text-xs font-sans cursor-pointer ${esHoy ? 'bg-[#3d4220] text-white font-bold shadow-sm' : 'hover:bg-[#faf9f5] text-[#1c1c1a]'} ${tieneEventos && !esHoy ? 'border border-[#3d4220]/40 font-bold bg-[#ffffee]' : ''}`}
        >
          <span>{dia}</span>
          {tieneEventos && <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${esHoy ? 'bg-amber-300' : 'bg-[#3d4220]'}`}></span>}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center bg-[#ffffee] p-2.5 rounded-xl border border-[#e6e4dc]">
          <button onClick={mesAnterior} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-[#1c1c1a] min-h-[44px] min-w-[44px]"><i className="fa-solid fa-chevron-left text-xs"></i></button>
          <h4 className="font-babydoll text-base font-bold text-[#1c1c1a]">{nombresMeses[mes]} {anio}</h4>
          <button onClick={mesSiguiente} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-[#1c1c1a] min-h-[44px] min-w-[44px]"><i className="fa-solid fa-chevron-right text-xs"></i></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center font-sans text-[10px] uppercase font-semibold text-[#595750] pb-1 border-b border-[#e6e4dc]">
          {diasSemana.map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">{celdas}</div>

        {diaSeleccionado && (
          <div className="bg-[#ffffee] border border-[#e6e4dc] p-3.5 rounded-xl space-y-2.5 mt-2 fade-in text-left shadow-sm">
            <div className="flex justify-between items-center border-b border-[#e6e4dc] pb-1.5">
              <span className="font-babydoll font-bold text-sm text-[#1c1c1a]">
                Eventos del {diaSeleccionado.dia} de {nombresMeses[mes]}
              </span>
              <button onClick={() => setDiaSeleccionado(null)} className="text-xs text-[#595750] hover:text-black p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {diaSeleccionado.eventos.map((ev, idx) => (
                <div key={idx} className="bg-white p-2.5 rounded-lg border border-[#e6e4dc] text-xs space-y-1">
                  <p className="font-bold text-[#1c1c1a] font-babydoll text-sm">{ev.evento || ev.titulo || 'Evento del club'}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#595750] font-sans">
                    <i className="fa-regular fa-clock text-[#3d4220]"></i>
                    <span>{ev.hora && ev.hora.trim() !== '' ? ev.hora : 'Durante todo el día'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- DECLARACIÓN INCONDICIONAL DE ESTADOS DE LA APLICACIÓN ---
  const [supabaseSession, setSupabaseSession] = useState(null);
  const [emailLogin, setEmailLogin] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [esPaginaGracias] = useState(() => window.location.pathname === '/gracias');

  const [usuariasClub, setUsuariasClub] = useState(() => safeGetJSON('gilda_cache_usuarias', []));

  const [vistaAcceso, setVistaAcceso] = useState('menu');
  const [modalidadSeleccionada, setModalidadSeleccionada] = useState(null);
  
  const [quizPaso, setQuizPaso] = useState(1);
  const [respuestaComunidad, setRespuestaComunidad] = useState(null);
  const [respuestaCarta, setRespuestaCarta] = useState(null);
  const [buscandoPlan, setBuscandoPlan] = useState(false);
  
  const [enviandoRegistro, setEnviandoRegistro] = useState(false);
  const [mostrarModalShare, setMostrarModalShare] = useState(false);

  const [seccionApp, setSeccionApp] = useState('inicio');
  const [subTabInicio, setSubTabInicio] = useState('progreso');
  const [subTabComunidad, setSubTabComunidad] = useState('chat');
  const [chatModo, setChatModo] = useState('global');
  const [destinatarioPrivado, setDestinatarioPrivado] = useState(null);

  const [tabEstanteria, setTabEstanteria] = useState('leyendo');
  const [toastMsg, setToastMsg] = useState(null);
  const [estadoNotificaciones, setEstadoNotificaciones] = useState('comprobando');
  const [mostrarModalUpgrade, setMostrarModalUpgrade] = useState(false);
  
  const [capitulos, setCapitulos] = useState(() => safeGetJSON('gilda_cache_capitulos', []));
  const [comentarios, setComentarios] = useState(() => safeGetJSON('gilda_cache_comentarios', []));
  const [lecturas, setLecturas] = useState(() => safeGetJSON('gilda_cache_lecturas', []));
  const [chatMsgs, setChatMsgs] = useState(() => safeGetJSON('gilda_cache_chat', []));
  const [propuestas, setPropuestas] = useState(() => safeGetJSON('gilda_cache_propuestas', []));
  const [lecturasPersonales, setLecturasPersonales] = useState(() => safeGetJSON('gilda_cache_personales', []));
  const [eventosCalendario, setEventosCalendario] = useState(() => safeGetJSON('gilda_cache_calendario', []));
  const [muroActividad, setMuroActividad] = useState(() => safeGetJSON('gilda_cache_muro', []));
  const [cafecitos, setCafecitos] = useState(() => safeGetJSON('gilda_cache_cafecitos', []));
  const [nuevaPropuestaTitulo, setNuevaPropuestaTitulo] = useState('');
  const [nuevaPropuestaAutora, setNuevaPropuestaAutora] = useState('');
  const [nuevaPropuestaPortada, setNuevaPropuestaPortada] = useState('');

  const [miPagina, setMiPagina] = useState(0);
  const [miCiudadInput, setMiCiudadInput] = useState(() => safeGet('gilda_ciudad', ''));
  const [miCodigoPostalInput, setMiCodigoPostalInput] = useState(() => safeGet('gilda_codigo_postal', ''));
  const [isReadingNow, setIsReadingNow] = useState(() => safeGetJSON('gilda_is_reading', false));
  const [nombreUsuarioPersonalizado, setNombreUsuarioPersonalizado] = useState(() => safeGet('gilda_nombre_usuario', ''));
  const [fotoPerfilPersonalizada, setFotoPerfilPersonalizada] = useState(() => safeGet('gilda_foto_perfil', ''));

  const [libroPersonal, setLibroPersonal] = useState('');
  const [paginaPersonalInput, setPaginaPersonalInput] = useState('');
  const [decoracionActual, setDecoracionActual] = useState(() => safeGet('gilda_decoracion', 'monstera'));

  const [objetosPersonalizados, setObjetosPersonalizados] = useState(() => safeGetJSON('gilda_objetos_personalizados', [{ id: 'pin-1', url: null, titulo: 'Mi moodboard' }]));
  const [modalImportarAbierto, setModalImportarAbierto] = useState(false);
  const [objetoActivoParaImportar, setObjetoActivoParaImportar] = useState(null);

  const [modoCreacionManual, setModoCreacionManual] = useState(false);
  const [manualTitulo, setManualTitulo] = useState('');
  const [manualAutora, setManualAutora] = useState('');
  const [manualPortada, setManualPortada] = useState('');

  const [libroSeleccionadoDetalle, setLibroSeleccionadoDetalle] = useState(null);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [editandoPortadaUrl, setEditandoPortadaUrl] = useState('');
  const [mostrarInputCorreccionPortada, setMostrarInputCorreccionPortada] = useState(false);
  const [estrellasSeleccionadas, setEstrellasSeleccionadas] = useState(5);

  const [misCitas] = useState(() => safeGetJSON('gilda_mis_citas', []));
  const [nuevoChat, setNuevoChat] = useState('');
  const [nuevoChatPrivado, setNuevoChatPrivado] = useState('');
  const [mensajeFundadora, setMensajeFundadora] = useState('');

  const [textoComentario, setTextoComentario] = useState({});
  const [respondiendoA, setRespondiendoA] = useState(null);
  const [textoRespuesta, setTextoRespuesta] = useState({});
  const chatEndRef = useRef(null);

  const modalidades = [
    { 
      id: 'cotilla', 
      nombre: 'gilda cotilla', 
      precio: 'Gratis', 
      esGratis: true, 
      enlaceStripe: '', 
      descripcion: 'para asomarte y curiosear: puedes leer todos los comentarios y debates para ver cómo es el club desde dentro.' 
    },
    { 
      id: 'satelite', 
      nombre: 'gilda satélite', 
      precio: '1 €/mes', 
      esGratis: false, 
      enlaceStripe: 'https://buy.stripe.com/cNi4gtfqV8cxeju0WV6Ri01', 
      descripcion: 'para leer a tu ritmo: control de tus lecturas y comentarios en los capítulos del libro del mes (no incluye chat de comunidad ni carta).' 
    },
    { 
      id: 'cafe', 
      nombre: 'gilda de café', 
      precio: '5 €/mes', 
      esGratis: false, 
      enlaceStripe: 'https://buy.stripe.com/3cI5kx0w1gJ3fny4976Ri02', 
      descripcion: 'toda la comunidad: acceso a la app, al chat con las demás socias y a los cafecitos virtuales en directo (no incluye carta).' 
    },
    { 
      id: 'nube', 
      nombre: 'gilda de nube', 
      precio: '5 €/mes', 
      esGratis: false, 
      enlaceStripe: 'https://buy.stripe.com/cNi5kx92xcsNb7i3536Ri03', 
      descripcion: 'carta digital: recibes cada mes en tu email la carta con actividades, pegatinas, la anti-guía de autora y plantillas (no incluye app ni chat).' 
    },
    { 
      id: 'papel', 
      nombre: 'gilda de papel', 
      precio: '10 €/mes', 
      esGratis: false, 
      enlaceStripe: 'https://buy.stripe.com/bJe8wJ7Yt50l1wIbBz6Ri04', 
      descripcion: 'carta en papel: te llega al buzón la carta física escrita a mano con marcapáginas, pegatinas y la anti-guía en un QR (no incluye app ni chat).' 
    },
    { 
      id: 'virtual', 
      nombre: 'gilda virtual', 
      precio: '8 €/mes', 
      esGratis: false, 
      destacado: true, 
      enlaceStripe: 'https://buy.stripe.com/bJe9ANguZ9gB6R27lj6Ri05', 
      descripcion: 'combo digital: la carta mensual en tu correo + acceso total a la app, al chat de lectoras y a los cafecitos.' 
    },
    { 
      id: 'absoluta', 
      nombre: 'gilda absoluta', 
      precio: '12 €/mes', 
      esGratis: false, 
      enlaceStripe: 'https://buy.stripe.com/14A5kxemReAV2AMcFD6Ri08', 
      descripcion: 'todo incluido: tu carta en papel en el buzón de casa + acceso total a la app, al chat y a los cafecitos.' 
    }
  ];

  const sesion = useMemo(() => {
    if (!supabaseSession) return null;
    const emailUser = supabaseSession.user.email.toLowerCase().trim();
    const socia = usuariasClub.find(u => (u.email || '').trim().toLowerCase() === emailUser);
    const nombreSocia = socia?.nombre && socia.nombre.trim() !== '' ? socia.nombre.trim() : emailUser.split('@')[0];
    const modalidadSocia = socia?.modalidad || 'gilda';
    return { nombre: nombreSocia, email: emailUser, modalidad: modalidadSocia };
  }, [supabaseSession, usuariasClub]);

  const mostrarToast = (texto) => { setToastMsg(texto); setTimeout(() => setToastMsg(null), 3000); };

  const manejarClickEnMarco = (id) => {
    setObjetoActivoParaImportar(id);
    setModalImportarAbierto(true);
  };

  const guardarEnlaceExterna = (id, url, titulo) => {
    const actualizado = objetosPersonalizados.map(obj => 
      obj.id === id ? { ...obj, url, titulo: titulo || obj.titulo } : obj
    );
    setObjetosPersonalizados(actualizado);
    safeSet('gilda_objetos_personalizados', actualizado);
    setModalImportarAbierto(false);
    setObjetoActivoParaImportar(null);
    mostrarToast('Marco actualizado');
  };

  const obtenerUbicacionActual = () => {
    if (!navigator.geolocation) {
      mostrarToast('La geolocalización no es compatible con tu navegador.');
      return;
    }
    mostrarToast('Obteniendo tu ubicación...');
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        const ciudad = data.address?.city || data.address?.town || data.address?.village || data.address?.state || '';
        const cp = data.address?.postcode || '';
        if (ciudad) setMiCiudadInput(ciudad);
        if (cp) setMiCodigoPostalInput(cp);
        mostrarToast('¡Ubicación detectada con éxito!');
      } catch {
        mostrarToast('No se pudo determinar la ciudad exacta.');
      }
    }, () => {
      mostrarToast('No se pudo obtener la posición. Revisa los permisos.');
    });
  };

  const cargarDatosSupabase = async () => {
    try {
      const [
        { data: profiles },
        { data: chapters },
        { data: comments },
        { data: clubReadings },
        { data: chatMessages },
        { data: proposals },
        { data: personalReadings },
        { data: calendarEvents },
        { data: wallPosts },
        { data: cafes }
      ] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('chapters').select('*'),
        supabase.from('comments').select('*'),
        supabase.from('club_readings').select('*'),
        supabase.from('chat_messages').select('*').order('timestamp', { ascending: true }),
        supabase.from('proposals').select('*'),
        supabase.from('personal_readings').select('*'),
        supabase.from('calendar_events').select('*'),
        supabase.from('wall_posts').select('*').order('timestamp', { ascending: false }),
        supabase.from('cafes').select('*')
      ]);

      if (profiles) {
        setUsuariasClub(profiles);
        safeSet('gilda_cache_usuarias', profiles);
        if (sesion && sesion.email) {
          const sociaActual = profiles.find(u => (u.email || '').trim().toLowerCase() === sesion.email.trim().toLowerCase());
          if (sociaActual) {
            if (sociaActual.nombre) setNombreUsuarioPersonalizado(sociaActual.nombre.trim());
            if (sociaActual.pagina !== undefined) setMiPagina(Number(sociaActual.pagina) || 0);
            if (sociaActual.ciudad) setMiCiudadInput(sociaActual.ciudad);
            if (sociaActual.codigo_postal) setMiCodigoPostalInput(sociaActual.codigo_postal);
            if (sociaActual.foto_perfil) setFotoPerfilPersonalizada(sociaActual.foto_perfil);
          }
        }
      }
      if (chapters) { setCapitulos(chapters); safeSet('gilda_cache_capitulos', chapters); }
      if (comments) { setComentarios(comments); safeSet('gilda_cache_comentarios', comments); }
      if (clubReadings) { setLecturas(clubReadings); safeSet('gilda_cache_lecturas', clubReadings); }
      if (chatMessages) { setChatMsgs(chatMessages); safeSet('gilda_cache_chat', chatMessages); }
      if (proposals) { setPropuestas(proposals); safeSet('gilda_cache_propuestas', proposals); }
      if (personalReadings) { setLecturasPersonales(personalReadings); safeSet('gilda_cache_personales', personalReadings); }
      if (calendarEvents) { setEventosCalendario(calendarEvents); safeSet('gilda_cache_calendario', calendarEvents); }
      if (wallPosts) { setMuroActividad(wallPosts); safeSet('gilda_cache_muro', wallPosts); }
      if (cafes) { setCafecitos(cafes); safeSet('gilda_cache_cafecitos', cafes); }
    } catch (err) {
      console.error('Error sincronizando con Supabase:', err);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSupabaseSession(session);
      if (session?.user) {
        const emailUser = session.user.email.toLowerCase().trim();
        const meta = session.user.user_metadata;
        const { data: existente } = await supabase.from('profiles').select('*').eq('email', emailUser).maybeSingle();
        if (!existente) {
          await supabase.from('profiles').upsert([{
            email: emailUser,
            nombre: meta?.nombre || emailUser.split('@')[0],
            modalidad: meta?.modalidad || 'gilda cotilla (Gratis)',
            pagina: 0,
            ultima_conexion: new Date().toISOString()
          }], { onConflict: 'email' });
          cargarDatosSupabase();
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSupabaseSession(session);
      if (session?.user) {
        const emailUser = session.user.email.toLowerCase().trim();
        const meta = session.user.user_metadata;
        const { data: existente } = await supabase.from('profiles').select('*').eq('email', emailUser).maybeSingle();
        if (!existente) {
          await supabase.from('profiles').upsert([{
            email: emailUser,
            nombre: meta?.nombre || emailUser.split('@')[0],
            modalidad: meta?.modalidad || 'gilda cotilla (Gratis)',
            pagina: 0,
            ultima_conexion: new Date().toISOString()
          }], { onConflict: 'email' });
          cargarDatosSupabase();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    cargarDatosSupabase();
    const interval = setInterval(cargarDatosSupabase, 8000);
    return () => clearInterval(interval);
  }, [sesion?.email]);

  const registrarActividadPresencia = async () => {
    if (!sesion || !sesion.email) return;
    const ahoraIso = new Date().toISOString();
    await supabase.from('profiles').update({ ultima_conexion: ahoraIso }).eq('email', sesion.email);
    setUsuariasClub(prev => prev.map(u => (u.email || '').trim().toLowerCase() === sesion.email.toLowerCase() ? { ...u, ultima_conexion: ahoraIso } : u));
  };

  useEffect(() => {
    if (sesion) {
      registrarActividadPresencia();
      const ping = setInterval(registrarActividadPresencia, 60000);
      return () => clearInterval(ping);
    }
  }, [sesion?.email]);

  const handleMagicLinkLogin = async (e) => {
    e.preventDefault();
    setLoadingAuth(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: emailLogin.trim().toLowerCase(),
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) {
      alert('Error al enviar el enlace: ' + error.message);
    } else {
      alert('¡Correo enviado! Revisa tu bandeja de entrada para acceder a gilda.');
    }
    setLoadingAuth(false);
  };

  const obtenerNombreReal = (emailComentario, usuarioOriginal) => {
    if (sesion && sesion.email && emailComentario && sesion.email.toLowerCase() === emailComentario.toLowerCase()) {
      if (nombreUsuarioPersonalizado) return nombreUsuarioPersonalizado;
    }
    if (emailComentario) {
      const encontrada = usuariasClub.find(u => (u.email || '').trim().toLowerCase() === emailComentario.trim().toLowerCase());
      if (encontrada && encontrada.nombre && encontrada.nombre.trim() !== '') return encontrada.nombre.trim();
    }
    if (usuarioOriginal && !usuarioOriginal.includes('@') && usuarioOriginal !== 'Lector/a') return usuarioOriginal;
    return (sesion && sesion.nombre) || (emailComentario ? emailComentario.split('@')[0] : 'lectora');
  };

  const handleFotoPerfilUpdate = async (base64Img) => {
    setFotoPerfilPersonalizada(base64Img);
    safeSet('gilda_foto_perfil', base64Img);
    if (sesion?.email) {
      await supabase.from('profiles').update({ foto_perfil: base64Img }).eq('email', sesion.email);
    }
    registrarActividadPresencia();
    mostrarToast('Foto de perfil actualizada');
  };

  const handleInteractuarIlustracion = (tipo) => {
    const opciones = ['monstera', 'maceta', 'vela', 'cafe', 'cactus', 'auriculares', 'tocadiscos', 'camara', 'lampara', 'ninguna'];
    const siguiente = opciones[(opciones.indexOf(tipo) + 1) % opciones.length];
    setDecoracionActual(siguiente);
    safeSet('gilda_decoracion', siguiente);
    registrarActividadPresencia();
    if (navigator.vibrate) navigator.vibrate(40);
  };

  const publicarCitaEnMuro = async (texto, libroCita) => {
    const cita = String(texto || '').trim();
    if (!cita || !sesion?.email) return;
    const publicacion = {
      tipo: 'cita',
      cita,
      email: sesion.email,
      nombre: nombreUsuarioPersonalizado || sesion.nombre,
      libro: libroCita?.titulo || '',
      portada: libroCita?.portada || '',
      estrellas: 5,
      timestamp: new Date().toISOString()
    };
    await supabase.from('wall_posts').insert([publicacion]);
    setMuroActividad(prev => [publicacion, ...prev]);
    registrarActividadPresencia();
    mostrarToast('Tu cita ya está publicada en el Muro.');
  };

  const votarCafecito = async (cafecito) => {
    const tituloCafecito = String(cafecito.titulo || cafecito.fecha || '').trim();
    const email = String(sesion?.email || '').trim().toLowerCase();
    if (!tituloCafecito || !email) return;

    const votantesActuales = [...new Set(String(cafecito.votantes || '').split(/[;,]/).map(v => v.trim().toLowerCase()).filter(Boolean))];
    const yaVoto = votantesActuales.includes(email);
    const nuevosVotantes = yaVoto ? votantesActuales.filter(v => v !== email) : [...votantesActuales, email];
    const nuevoTotal = Math.max(0, (Number(cafecito.votos) || votantesActuales.length) + (yaVoto ? -1 : 1));

    await supabase.from('cafes').update({ votos: nuevoTotal, votantes: nuevosVotantes.join(',') }).eq('id', cafecito.id);
    setCafecitos(prev => prev.map(c => c.id === cafecito.id ? { ...c, votos: nuevoTotal, votantes: nuevosVotantes.join(',') } : c));
    registrarActividadPresencia();
    mostrarToast(yaVoto ? 'Has retirado tu voto.' : '¡Tu voto para el cafecito está registrado!');
  };

  const activarNotificaciones = async () => {
    setEstadoNotificaciones('permiso-concedido');
    safeSet('gilda_notificaciones_activas', true);
    mostrarToast('Notificaciones activadas en este dispositivo.');
  };

  const calcularModalidadIdeal = (comunidad, carta) => {
    let idPlan = 'cotilla';
    if (comunidad === 'todo') {
      if (carta === 'buzon') idPlan = 'absoluta';
      else if (carta === 'email') idPlan = 'virtual';
      else if (carta === 'nada') idPlan = 'cafe';
    } else if (comunidad === 'mio') {
      if (carta === 'buzon') idPlan = 'papel';
      else if (carta === 'email') idPlan = 'nube';
      else if (carta === 'nada') idPlan = 'satelite'; 
    } else if (comunidad === 'ritmo') {
      if (carta === 'buzon') idPlan = 'papel';
      else if (carta === 'email') idPlan = 'virtual';
      else if (carta === 'nada') idPlan = 'satelite'; 
    }

    const planEncontrado = modalidades.find(m => m.id === idPlan);
    setBuscandoPlan(true);
    setTimeout(() => {
      setBuscandoPlan(false);
      setModalidadSeleccionada(planEncontrado);
      setQuizPaso(3);
    }, 1200);
  };

  const registrarYRedirigir = async (e) => {
    e.preventDefault();
    setEnviandoRegistro(true);
    const form = e.target;
    const formData = new FormData(form);
    const nombreSocia = String(formData.get('Nombre') || '').trim();
    const emailSocia = String(formData.get('Email') || '').trim().toLowerCase();
    const modalidadNombreCompleto = `${modalidadSeleccionada.nombre} (${modalidadSeleccionada.precio})`;

    try {
      if (modalidadSeleccionada.esGratis) {
        const { error: authError } = await supabase.auth.signInWithOtp({
          email: emailSocia,
          options: { 
            emailRedirectTo: window.location.origin,
            data: {
              nombre: nombreSocia || emailSocia.split('@')[0],
              modalidad: modalidadNombreCompleto
            }
          },
        });

        if (authError) throw authError;

        setEnviandoRegistro(false);
        window.location.assign('/gracias');
      } else {
        const enlaceStripe = new URL(modalidadSeleccionada.enlaceStripe);
        enlaceStripe.searchParams.set('prefilled_email', emailSocia);
        window.location.assign(enlaceStripe.toString());
      }
    } catch (err) {
      setEnviandoRegistro(false);
      alert('Hubo un error en el registro: ' + err.message);
    }
  };

  const guardarLibroPersonal = async (tituloOpt, pagOpt, estadoOpt = 'leyendo', autoraOpt = '', portadaOpt = '') => {
    registrarActividadPresencia();
    const tituloLibro = (tituloOpt !== undefined ? tituloOpt : libroPersonal).trim();
    if (!tituloLibro) return;
    const pagFinal = pagOpt !== undefined ? (Number(pagOpt) || 0) : (Number(paginaPersonalInput) || 0);

    const existente = lecturasPersonales.find(l => (l.email || '').toLowerCase() === sesion.email.toLowerCase() && (l.libro || '').toLowerCase() === tituloLibro.toLowerCase());

    if (existente) {
      await supabase.from('personal_readings').update({ pagina: pagFinal, paginas: pagFinal, estado: estadoOpt, autora: autoraOpt || existente.autora, portada: portadaOpt || existente.portada }).eq('id', existente.id);
    } else {
      await supabase.from('personal_readings').insert([{
        email: sesion.email,
        nombre: nombreUsuarioPersonalizado || sesion.nombre,
        libro: tituloLibro,
        pagina: pagFinal,
        paginas: pagFinal,
        estado: estadoOpt,
        autora: autoraOpt,
        portada: portadaOpt
      }]);
    }

    await cargarDatosSupabase();
    setLibroPersonal('');
    setPaginaPersonalInput('');
    setModoCreacionManual(false);
    mostrarToast(`Guardado: ${tituloLibro}`);
  };

  const adminGuardarLecturaActiva = async (event) => {
    event.preventDefault();
    if (!esAdministradora) return;
    const formData = new FormData(event.currentTarget);
    const lectura = {
      titulo: String(formData.get('titulo') || '').trim(),
      autora: String(formData.get('autora') || '').trim(),
      portada: String(formData.get('portada') || '').trim(),
      paginas_totales: Number(formData.get('paginas_totales')) || 280
    };
    if (lecturas[0]?.id) {
      await supabase.from('club_readings').update(lectura).eq('id', lecturas[0].id);
    } else {
      await supabase.from('club_readings').insert([lectura]);
    }
    await cargarDatosSupabase();
    mostrarToast('Lectura activa actualizada.');
  };

  const adminEliminarMensajeChat = async (idMsg) => {
    if (!esAdministradora || !idMsg) return;
    await supabase.from('chat_messages').delete().eq('id', idMsg);
    await cargarDatosSupabase();
    mostrarToast('Mensaje retirado.');
  };

  const adminEliminarPropuesta = async (idProp) => {
    if (!esAdministradora || !idProp) return;
    await supabase.from('proposals').delete().eq('id', idProp);
    await cargarDatosSupabase();
    mostrarToast('Propuesta retirada.');
  };

  const restablecerNavegacion = () => {
    setSeccionApp('inicio');
    setSubTabInicio('progreso');
    setSubTabComunidad('chat');
    setChatModo('global');
    setDestinatarioPrivado(null);
  };

  const cerrarSesion = () => {
    supabase.auth.signOut();
    setSupabaseSession(null);
    restablecerNavegacion();
  };

  const libroActual = useMemo(() => lecturas[0] || { titulo: 'La campana de cristal', autora: 'Sylvia Plath', paginas_totales: 280, portada: '' }, [lecturas]);
  const porcentajeLibro = useMemo(() => Math.min(Math.round((miPagina / Number(libroActual.paginas_totales || 280)) * 100), 100), [miPagina, libroActual]);
  
  const todosMisLibrosEstanteria = useMemo(() => {
    if (!sesion) return [];
    return lecturasPersonales.filter(l => (l.email || '').toLowerCase() === sesion.email.toLowerCase());
  }, [lecturasPersonales, sesion]);

  const librosBibliotecaVisibles = useMemo(() => (
    todosMisLibrosEstanteria.filter(item => (item.estado || 'leyendo') === tabEstanteria)
  ), [todosMisLibrosEstanteria, tabEstanteria]);

  const cafecitosConVotos = useMemo(() => {
    const opciones = cafecitos.map(cafecito => {
      const votantes = [...new Set(String(cafecito.votantes || '').split(/[;,]/).map(v => v.trim().toLowerCase()).filter(Boolean))];
      const votos = Number(cafecito.votos);
      return {
        ...cafecito,
        votos: Number.isFinite(votos) ? votos : votantes.length,
        votantes,
        yaVoto: votantes.includes(String(sesion?.email || '').trim().toLowerCase())
      };
    });
    const totalVotos = opciones.reduce((suma, op) => suma + op.votos, 0);
    return opciones.map(op => ({
      ...op,
      porcentaje: totalVotos ? Math.round((op.votos / totalVotos) * 100) : 0
    }));
  }, [cafecitos, sesion]);

  const miembrosEdificio = useMemo(() => {
    return usuariasClub.map(u => {
      const emailU = (u.email || '').toLowerCase().trim();
      const esYo = emailU === (sesion?.email || '').toLowerCase().trim();
      const nombreRealU = u.nombre ? u.nombre.trim() : (u.email ? u.email.split('@')[0] : 'lectora');
      const misPersonales = lecturasPersonales.filter(l => (l.email || '').toLowerCase().trim() === emailU && (l.estado || 'leyendo') === 'leyendo');
      return {
        ...u,
        nombre: esYo ? (nombreUsuarioPersonalizado || nombreRealU) : nombreRealU,
        foto_perfil: esYo ? (fotoPerfilPersonalizada || u.foto_perfil) : u.foto_perfil,
        pagina: esYo ? miPagina : Number(u.pagina || 0),
        estaLeyendo: esYo ? isReadingNow : (Number(u.pagina || 0) > 0 || misPersonales.length > 0),
        misLecturasPersonales: misPersonales
      };
    });
  }, [usuariasClub, sesion, nombreUsuarioPersonalizado, fotoPerfilPersonalizada, miPagina, isReadingNow, lecturasPersonales]);

  const cantidadSociasEnLinea = useMemo(() => {
    return usuariasClub.filter(u => calcularEstadoConexion(u.ultima_conexion) === 'conectada').length;
  }, [usuariasClub]);

  const modalidadLimpia = (sesion?.modalidad || '').toLowerCase().trim();
  const modalidadNormalizada = modalidadLimpia.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const esModalidadCorreo = modalidadNormalizada.includes('nube') || modalidadNormalizada.includes('papel');
  const esRestringida = modalidadNormalizada.includes('cotilla') || modalidadNormalizada.includes('satelite');
  const esAdministradora = String(sesion?.email || '').trim().toLowerCase() === EMAIL_ADMINISTRADORA;

  // --- VISTAS CONDICIONALES (SOLO TRAS LA EJECUCIÓN UNIFORME DE HOOKS) ---
  if (esPaginaGracias) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 w-full py-12 bg-[#ffffee]">
        <div className="editorial-card max-w-md w-full p-8 sm:p-10 space-y-6 text-center relative overflow-hidden shadow-xl border border-[#e6e4dc]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#3d4220]"></div>
          
          <div className="space-y-3 pt-4">
            <h1 className="font-babydoll text-6xl text-[#1c1c1a] font-bold tracking-tight">gracias :)</h1>
            <p className="text-xs uppercase tracking-widest text-[#3d4220] font-bold font-sans">tu espacio ya está listo</p>
          </div>

          <div className="editorial-card p-5 bg-[#faf9f5] text-left space-y-3 font-sans border border-[#e6e4dc]">
            <h3 className="font-babydoll text-base font-bold text-[#1c1c1a]">¿Cómo entrar a la app ahora?</h3>
            <p className="text-xs text-[#595750] leading-relaxed">
              Es muy fácil: haz clic en el botón de abajo, introduce el <b>mismo correo</b> con el que has hecho el pago o registro y te enviaremos tu llave de acceso al instante.
            </p>
          </div>

          <a href="/" className="block w-full editorial-btn py-3.5 text-xs font-bold text-center shadow-md">
            Ir a gilda e iniciar sesión
          </a>
        </div>
      </div>
    );
  }

  if (!supabaseSession) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 w-full py-12 bg-[#ffffee] fade-in">
        <div className="editorial-card max-w-md w-full p-8 sm:p-10 space-y-6 text-center relative overflow-hidden shadow-2xl border border-[#e6e4dc]">
          
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#3d4220]"></div>

          <div className="space-y-2 pt-2">
            <h1 className="font-babydoll text-6xl text-[#1c1c1a] font-bold tracking-tight">gilda</h1>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#3d4220] font-bold font-sans">
              comunidad de lectura, cartas y creatividad
            </p>
          </div>

          {vistaAcceso === 'menu' && (
            <div className="space-y-6 pt-2 fade-in">
              <form onSubmit={handleMagicLinkLogin} className="space-y-4 font-sans text-left">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#1c1c1a] ml-0.5">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="tuemail@ejemplo.com"
                    value={emailLogin}
                    onChange={e => setEmailLogin(e.target.value)}
                    required
                    className="w-full editorial-input px-4 py-3 text-xs placeholder-[#a09a8a]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingAuth}
                  className="w-full editorial-btn py-3.5 text-xs shadow-md mt-2 font-bold cursor-pointer min-h-[46px] flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {loadingAuth ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin text-xs"></i>
                      <span>Enviando enlace...</span>
                    </>
                  ) : (
                    <span>Enviar enlace mágico de acceso</span>
                  )}
                </button>
              </form>

              <div className="border-t border-[#e6e4dc] pt-5">
                <button
                  onClick={() => setVistaAcceso('modalidades')}
                  className="w-full bg-white text-[#3d4220] hover:text-[#1c1c1a] border border-[#d4cfbc] hover:border-[#3d4220] rounded-2xl py-3.5 text-xs font-bold transition-all hover:bg-[#faf9f5] text-center shadow-xs min-h-[46px] flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <span>Conocer las modalidades del club</span>
                  <i className="fa-solid fa-arrow-right text-[10px]"></i>
                </button>
              </div>
            </div>
          )}

          {vistaAcceso === 'modalidades' && (
            <div className="space-y-4 fade-in text-left">
              <button onClick={() => { if (quizPaso > 1) { setQuizPaso(quizPaso - 1); if (quizPaso === 3) setModalidadSeleccionada(null); } else { setVistaAcceso('menu'); } }} className="text-xs font-semibold text-[#595750] hover:text-[#1c1c1a] flex items-center group font-sans min-h-[44px]">
                <i className="fa-solid fa-arrow-left mr-2 text-xs"></i> volver
              </button>
              
              {quizPaso === 1 && (
                <div className="fade-in space-y-4">
                  <h2 className="text-2xl font-babydoll font-bold text-[#1c1c1a] leading-tight">¿cuánto te apetece interactuar con el club?</h2>
                  <div className="space-y-3">
                    <button onClick={() => { setRespuestaComunidad('todo'); setQuizPaso(2); }} className="w-full text-left p-5 bg-white border border-[#e6e4dc] hover:border-[#3d4220] hover:shadow-md transition-all rounded-2xl active:scale-[0.99]">
                      <span className="block font-babydoll text-lg font-bold text-[#1c1c1a]">lo quiero todo</span>
                      <span className="block text-xs text-[#595750] font-sans mt-1">chat, cafecitos virtuales, debates y sorteos.</span>
                    </button>
                    <button onClick={() => { setRespuestaComunidad('ritmo'); setQuizPaso(2); }} className="w-full text-left p-5 bg-white border border-[#e6e4dc] hover:border-[#3d4220] hover:shadow-md transition-all rounded-2xl active:scale-[0.99]">
                      <span className="block font-babydoll text-lg font-bold text-[#1c1c1a]">a mi ritmo</span>
                      <span className="block text-xs text-[#595750] font-sans mt-1">leer y participar lo justo sin presiones.</span>
                    </button>
                    <button onClick={() => { setRespuestaComunidad('mio'); setQuizPaso(2); }} className="w-full text-left p-5 bg-white border border-[#e6e4dc] hover:border-[#3d4220] hover:shadow-md transition-all rounded-2xl active:scale-[0.99]">
                      <span className="block font-babydoll text-lg font-bold text-[#1c1c1a]">voy a lo mío</span>
                      <span className="block text-xs text-[#595750] font-sans mt-1">no me interesa el chat, solo quiero leer.</span>
                    </button>
                  </div>
                </div>
              )}

              {quizPaso === 2 && !buscandoPlan && (
                <div className="fade-in space-y-4">
                  <h2 className="text-2xl font-babydoll font-bold text-[#1c1c1a] leading-tight">¿cómo quieres recibir la carta de gilda?</h2>
                  <div className="space-y-3">
                    <button onClick={() => { setRespuestaCarta('buzon'); calcularModalidadIdeal(respuestaComunidad, 'buzon'); }} className="w-full text-left p-5 bg-white border border-[#e6e4dc] hover:border-[#3d4220] hover:shadow-md transition-all rounded-2xl active:scale-[0.99]">
                      <span className="block font-babydoll text-lg font-bold text-[#1c1c1a]">en el buzón de mi casa</span>
                      <span className="block text-xs text-[#595750] font-sans mt-1">la experiencia física en papel en tu casa.</span>
                    </button>
                    <button onClick={() => { setRespuestaCarta('email'); calcularModalidadIdeal(respuestaComunidad, 'email'); }} className="w-full text-left p-5 bg-white border border-[#e6e4dc] hover:border-[#3d4220] hover:shadow-md transition-all rounded-2xl active:scale-[0.99]">
                      <span className="block font-babydoll text-lg font-bold text-[#1c1c1a]">en mi email</span>
                      <span className="block text-xs text-[#595750] font-sans mt-1">digital, práctico y rápido.</span>
                    </button>
                    <button onClick={() => { setRespuestaCarta('nada'); calcularModalidadIdeal(respuestaComunidad, 'nada'); }} className="w-full text-left p-5 bg-[#faf9f5] border border-[#e6e4dc] hover:border-[#3d4220] hover:shadow-md transition-all rounded-2xl opacity-90 active:scale-[0.99]">
                      <span className="block font-babydoll text-lg font-bold text-[#1c1c1a]">sin carta, gracias</span>
                      <span className="block text-xs text-[#595750] font-sans mt-1">prefiero centrarme únicamente en la lectura.</span>
                    </button>
                  </div>
                </div>
              )}

              {buscandoPlan && (
                 <div className="py-12 flex flex-col items-center justify-center space-y-4 fade-in">
                   <i className="fa-solid fa-spinner animate-spin text-2xl text-[#3d4220]"></i>
                   <p className="font-babydoll text-lg text-[#1c1c1a]">buscando tu rincón ideal...</p>
                 </div>
              )}

              {quizPaso === 3 && modalidadSeleccionada && (
                <div className="fade-in space-y-5 pt-2">
                  <div className="text-center space-y-1">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-[#3d4220] font-sans">match perfecto</span>
                    <h2 className="text-2xl font-babydoll font-bold text-[#1c1c1a]">esta es tu gilda ideal</h2>
                  </div>
                  <div className="editorial-card p-6 flex flex-col justify-between border-2 border-[#3d4220] bg-[#ffffee] shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-[#3d4220]/5 rounded-bl-full"></div>
                    <div className="flex justify-between items-start mb-3 relative z-10">
                      <h3 className="font-babydoll font-bold text-2xl text-[#1c1c1a]">{modalidadSeleccionada.nombre}</h3>
                      <span className="text-xs font-bold bg-[#3d4220] text-white px-3 py-1.5 rounded-full shadow-sm">{modalidadSeleccionada.precio}</span>
                    </div>
                    <p className="text-xs text-[#595750] font-sans mb-6 leading-relaxed relative z-10">{modalidadSeleccionada.descripcion}</p>
                    <button onClick={() => setVistaAcceso('formulario_registro')} className="w-full py-3.5 rounded-xl text-sm font-bold editorial-btn shadow-md flex items-center justify-center gap-2 min-h-[44px]">
                      elegir esta modalidad <i className="fa-solid fa-arrow-right text-xs"></i>
                    </button>
                  </div>
                  <div className="text-center pt-2 space-y-2">
                     <button onClick={() => setQuizPaso(1)} className="text-xs text-[#595750] underline font-sans block mx-auto p-2">rehacer el test</button>
                     <p className="text-xs text-[#595750] font-sans pt-2">¿prefieres ver el catálogo? <span onClick={() => setQuizPaso('catalogo')} className="underline cursor-pointer font-bold text-[#1c1c1a]">ver todas</span></p>
                  </div>
                </div>
              )}

              {quizPaso === 'catalogo' && (
                <div className="fade-in space-y-4 pt-1">
                  <div className="flex justify-between items-center border-b border-[#e6e4dc] pb-2">
                    <h2 className="text-xl font-babydoll font-bold text-[#1c1c1a]">catálogo completo</h2>
                    <button onClick={() => setQuizPaso(3)} className="text-xs text-[#595750] underline font-sans p-2">ver mi match</button>
                  </div>
                  <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                    {modalidades.map((m) => (
                      <div key={m.id} className="editorial-card p-5 space-y-3 bg-[#ffffee] border border-[#e6e4dc] text-left shadow-sm">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-babydoll font-bold text-xl text-[#1c1c1a] leading-tight">{m.nombre}</h3>
                          <span className="text-xs font-bold bg-[#3d4220] text-white px-3 py-1 rounded-full shrink-0">{m.precio}</span>
                        </div>
                        <p className="text-xs text-[#595750] font-sans leading-relaxed whitespace-normal">{m.descripcion}</p>
                        <button onClick={() => { setModalidadSeleccionada(m); setVistaAcceso('formulario_registro'); }} className="w-full mt-2 py-2.5 text-xs editorial-btn font-semibold shadow-xs min-h-[44px]">
                          Elegir esta modalidad
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {vistaAcceso === 'formulario_registro' && modalidadSeleccionada && (
            <div className="space-y-4 fade-in text-left">
              <button onClick={() => setVistaAcceso('modalidades')} className="text-xs font-semibold text-[#595750] hover:text-[#1c1c1a] flex items-center group font-sans min-h-[44px]">
                <i className="fa-solid fa-arrow-left mr-2 text-xs"></i> Volver
              </button>
              <div className="border-b border-[#e6e4dc] pb-3">
                <h2 className="text-2xl font-babydoll font-bold text-[#1c1c1a]">Ya casi estás dentro</h2>
                <p className="text-xs text-[#595750] font-sans leading-relaxed mt-1">Estás a punto de abrir la puerta a <b>{modalidadSeleccionada.nombre}</b> ({modalidadSeleccionada.precio}).</p>
              </div>
              <form onSubmit={registrarYRedirigir} className="space-y-4 font-sans">
                <div>
                  <label className="block text-xs font-semibold text-[#1c1c1a] mb-1">Nombre completo *</label>
                  <input type="text" name="Nombre" required placeholder="Tu nombre o alias" className="w-full editorial-input px-3.5 py-3 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1c1c1a] mb-1">Correo electrónico *</label>
                  <input type="email" name="Email" required placeholder="hola@ejemplo.com" className="w-full editorial-input px-3.5 py-3 text-xs" />
                </div>
                <button type="submit" disabled={enviandoRegistro} className="w-full editorial-btn py-3 text-xs mt-3 flex items-center justify-center gap-2 shadow-md min-h-[44px]">
                  {enviandoRegistro ? 'Procesando...' : (<><span>Apúntame</span><i className="fa-solid fa-arrow-right text-xs"></i></>)}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (esModalidadCorreo && !esAdministradora) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 w-full py-8 bg-[#ffffee]">
        <div className="editorial-card max-w-sm w-full p-8 space-y-4 text-center">
          <h1 className="font-babydoll text-4xl text-[#1c1c1a] font-bold">gilda</h1>
          <p className="text-xs text-[#595750] font-sans leading-relaxed">Tu modalidad actual ({sesion.modalidad}) está registrada exclusivamente para correo y no incluye acceso web.</p>
          <button onClick={cerrarSesion} className="editorial-btn px-4 py-2 text-xs min-h-[44px]">Cerrar sesión</button>
        </div>
      </div>
    );
  }

  // --- RENDER PRINCIPAL DE LA APLICACIÓN AUTENTICADA ---
  return (
    <div className="min-h-screen flex flex-col items-center pt-6 pb-28 px-4 sm:px-6 max-w-lg w-full mx-auto relative bg-[#ffffee]">
      {toastMsg && (
        <div className="fixed top-6 z-50 bg-[#1c1c1a] text-[#ffffee] text-xs px-4 py-2.5 rounded-full shadow-lg fade-in font-sans font-medium">
          {toastMsg}
        </div>
      )}

      {modalImportarAbierto && (
        <ModalImportarPin onClose={() => setModalImportarAbierto(false)} onSave={(url, tit) => guardarEnlaceExterna(objetoActivoParaImportar, url, tit)} />
      )}

      {mostrarModalUpgrade && <ModalUpgrade onClose={() => setMostrarModalUpgrade(false)} />}
      
      {mostrarModalShare && (
        <ModalCompartirStory 
          onClose={() => setMostrarModalShare(false)}
          usuario={nombreUsuarioPersonalizado || sesion.nombre}
          libro={libroActual}
          pagina={miPagina}
          citas={misCitas}
          decoracion={decoracionActual}
          misLibros={lecturasPersonales
            .filter(l => String(l.email || '').toLowerCase().trim() === String(sesion.email).toLowerCase().trim())
            .map(l => ({ ...l, titulo: l.titulo || l.libro }))
          }
          onPublicarCita={publicarCitaEnMuro}
        />
      )}

      {libroSeleccionadoDetalle && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 fade-in">
          <div className="editorial-card max-w-sm w-full p-6 space-y-4 text-center bg-white relative modal-pop">
            <button onClick={() => { setLibroSeleccionadoDetalle(null); setMostrarInputCorreccionPortada(false); setEditandoPortadaUrl(''); setConfirmandoEliminar(false); }} className="absolute top-3 right-3 text-gray-400 hover:text-black p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
            <div className="flex justify-center">
              <PortadaLibroEstable solicitarJsonExterno={solicitarJsonExterno} googleBooksEnCooldown={googleBooksEnCooldown} solicitudesPortadaEnCurso={solicitudesPortadaEnCurso} titulo={libroSeleccionadoDetalle.libro || libroSeleccionadoDetalle.titulo} autora={libroSeleccionadoDetalle.autora} portada={libroSeleccionadoDetalle.portada} size="large" />
            </div>
            <div className="space-y-1">
              <h3 className="font-babydoll text-xl font-bold">{libroSeleccionadoDetalle.libro || libroSeleccionadoDetalle.titulo}</h3>
              <p className="text-xs text-[#595750] italic font-sans">{libroSeleccionadoDetalle.autora || 'Autora desconocida'}</p>
              <p className="text-xs text-[#595750] uppercase tracking-wider pt-1 font-sans">Estado: <b>{libroSeleccionadoDetalle.estado || 'leyendo'}</b></p>
            </div>

            {mostrarInputCorreccionPortada ? (
              <div className="space-y-2 bg-[#faf9f5] p-3 rounded-xl border border-[#e6e4dc] font-sans">
                <input type="text" value={editandoPortadaUrl} onChange={(e) => setEditandoPortadaUrl(e.target.value)} placeholder="Pega la URL de la nueva portada..." className="w-full px-3 py-2 text-xs border border-[#e6e4dc] rounded-lg bg-white text-[#1c1c1a]" />
                <div className="flex gap-2">
                  <button onClick={async () => {
                    const tituloLibro = libroSeleccionadoDetalle.libro || libroSeleccionadoDetalle.titulo;
                    const nuevaPortada = editandoPortadaUrl.trim();
                    await supabase.from('personal_readings').update({ portada: nuevaPortada }).eq('email', sesion.email).eq('libro', tituloLibro);
                    await cargarDatosSupabase();
                    setLibroSeleccionadoDetalle({ ...libroSeleccionadoDetalle, portada: nuevaPortada });
                    registrarActividadPresencia();
                    mostrarToast('¡Portada actualizada!');
                    setMostrarInputCorreccionPortada(false);
                  }} className="flex-1 editorial-btn py-1.5 text-xs font-semibold min-h-[44px]">Guardar</button>
                  <button onClick={() => setMostrarInputCorreccionPortada(false)} className="flex-1 bg-white border border-[#e6e4dc] text-[#595750] py-1.5 rounded-xl text-xs font-semibold min-h-[44px]">Cancelar</button>
                </div>
              </div>
            ) : (
              <button onClick={() => { setEditandoPortadaUrl(libroSeleccionadoDetalle.portada || ''); setMostrarInputCorreccionPortada(true); }} className="w-full bg-[#faf9f5] border border-[#e6e4dc] text-[#3d4220] py-2 rounded-xl text-xs font-semibold min-h-[44px]">
                <i className="fa-solid fa-image mr-1"></i> Corregir portada o URL
              </button>
            )}

            <div className="py-3 px-3 my-2 bg-[#ffffee] rounded-xl border border-[#e6e4dc] flex flex-col items-center gap-2 font-sans">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#3d4220]">deja tu marca de tinta</span>
              <div className="flex gap-1 items-center">
                {[1, 2, 3, 4, 5].map((num) => (
                  <span 
                    key={num} 
                    onClick={() => setEstrellasSeleccionadas(num)} 
                    className={`cursor-pointer font-babydoll text-2xl transition-transform hover:scale-125 p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center ${num <= estrellasSeleccionadas ? 'text-[#1c1c1a]' : 'text-[#d4cfbc]'}`}
                  >
                    ✦
                  </span>
                ))}
              </div>
              <button onClick={async () => {
                const tituloLibro = libroSeleccionadoDetalle.libro || libroSeleccionadoDetalle.titulo;
                const postMuro = {
                  tipo: 'evaluacion',
                  email: sesion.email,
                  nombre: nombreUsuarioPersonalizado || sesion.nombre,
                  libro: tituloLibro,
                  estrellas: estrellasSeleccionadas,
                  portada: libroSeleccionadoDetalle.portada || '',
                  timestamp: new Date().toISOString()
                };
                await supabase.from('wall_posts').insert([postMuro]);
                await cargarDatosSupabase();
                registrarActividadPresencia();
                mostrarToast(`¡Marca de ${estrellasSeleccionadas}/5 ✦ guardada!`);
                setLibroSeleccionadoDetalle(null);
              }} className="w-full mt-2 editorial-btn py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[44px]">
                <i className="fa-solid fa-feather text-[10px]"></i> Estampar en el Muro
              </button>
            </div>

            <div className="pt-2 border-t border-[#e6e4dc] flex flex-col gap-2">
              {confirmandoEliminar ? (
                <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-center space-y-2.5 fade-in font-sans">
                  <p className="text-xs font-bold text-red-800">¿Segura que quieres eliminar este libro de tu estantería?</p>
                  <div className="flex gap-2">
                    <button onClick={async () => {
                      const tituloLibro = libroSeleccionadoDetalle.libro || libroSeleccionadoDetalle.titulo;
                      await supabase.from('personal_readings').delete().eq('email', sesion.email).eq('libro', tituloLibro);
                      await cargarDatosSupabase();
                      registrarActividadPresencia();
                      setLibroSeleccionadoDetalle(null);
                      setConfirmandoEliminar(false);
                      mostrarToast('Libro eliminado de la estantería');
                    }} className="flex-1 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 min-h-[44px]">Sí, eliminar</button>
                    <button onClick={() => setConfirmandoEliminar(false)} className="flex-1 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50 min-h-[44px]">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setConfirmandoEliminar(true)} className="flex-1 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors min-h-[44px]">Eliminar</button>
                  <button onClick={() => { setLibroSeleccionadoDetalle(null); setConfirmandoEliminar(false); }} className="flex-1 editorial-btn py-2 text-xs min-h-[44px]">Cerrar</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <header className="w-full mb-5 flex justify-between items-center bg-[#FFFFFF] text-[#1c1c1a] p-4 rounded-2xl border border-[#e6e4dc] shadow-sm">
        <div className="flex items-center gap-3 overflow-hidden">
          <AvatarUsuaria foto={fotoPerfilPersonalizada} nombre={nombreUsuarioPersonalizado || sesion.nombre} sizeClass="w-10 h-10" textClass="text-lg" editable={true} onFotoChange={handleFotoPerfilUpdate} />
          <div className="overflow-hidden">
            <h2 className="font-bold text-lg leading-none truncate font-babydoll">{nombreUsuarioPersonalizado || sesion.nombre}</h2>
            <span className="text-xs text-[#595750] uppercase font-sans tracking-wider">{sesion.modalidad}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {esAdministradora && (
            <button
              onClick={() => setSeccionApp('admin')}
              title="Panel de Administración"
              className={`p-2.5 rounded-xl border transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${seccionApp === 'admin' ? 'bg-[#3d4220] text-white border-[#3d4220]' : 'bg-[#faf9f5] text-[#3d4220] border-[#e6e4dc] hover:bg-gray-100'}`}
            >
              <i className="fa-solid fa-screwdriver-wrench text-xs"></i>
            </button>
          )}
          <button onClick={cerrarSesion} title="Cerrar sesión" className="text-[#595750] hover:text-black p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
          </button>
        </div>
      </header>

      <main className="w-full flex-grow space-y-4">
        <div style={{ display: seccionApp === 'inicio' ? 'block' : 'none' }} className="space-y-4 fade-in">
          <div className="flex bg-[#faf9f5] p-1 rounded-xl text-xs font-semibold border border-[#e6e4dc] font-sans mb-3">
            <button onClick={() => setSubTabInicio('progreso')} className={`flex-1 py-2 rounded-lg transition-all min-h-[44px] ${subTabInicio === 'progreso' ? 'bg-[#1c1c1a] text-[#ffffee] shadow-xs' : 'text-[#595750]'}`}>Mi actividad y lecturas</button>
            <button onClick={() => setSubTabInicio('muro')} className={`flex-1 py-2 rounded-lg transition-all min-h-[44px] ${subTabInicio === 'muro' ? 'bg-[#1c1c1a] text-[#ffffee] shadow-xs' : 'text-[#595750]'}`}>Muro del club</button>
          </div>

          {subTabInicio === 'progreso' && (
            <>
              <div className="editorial-card p-5 space-y-4" onClick={registrarActividadPresencia}>
                <div className="flex justify-between items-center border-b border-[#e6e4dc] pb-2.5 mb-2">
                   <h3 className="font-babydoll text-xl font-bold flex items-center gap-2 text-[#1c1c1a]">Progreso actual</h3>
                   <button onClick={() => setMostrarModalShare(true)} className="text-xs font-bold font-sans flex items-center gap-1.5 text-[#3d4220] bg-white border border-[#e6e4dc] px-3 py-1.5 rounded-full shadow-sm hover:bg-[#faf9f5] transition-all min-h-[44px]"><i className="fa-brands fa-instagram text-[#3d4220]"></i> Compartir en Stories</button>
                </div>

                <div className="flex gap-4 items-center">
                  <PortadaLibroEstable solicitarJsonExterno={solicitarJsonExterno} googleBooksEnCooldown={googleBooksEnCooldown} solicitudesPortadaEnCurso={solicitudesPortadaEnCurso} titulo={libroActual.titulo} autora={libroActual.autora} portada={libroActual.portada} size="large" />
                  <div className="space-y-2 w-full">
                    <span className="text-xs uppercase tracking-wider text-[#3d4220] font-bold font-sans">Lectura del club</span>
                    <h2 className="font-babydoll text-2xl font-bold leading-tight">{libroActual.titulo}</h2>
                    <p className="text-xs text-[#595750] italic font-sans">{libroActual.autora}</p>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-[#595750] mb-1 font-sans"><span>progreso</span><span>{porcentajeLibro}%</span></div>
                      <div className="w-full bg-[#faf9f5] rounded-full h-2 border border-[#e6e4dc]"><div className="bg-[#3d4220] h-full rounded-full" style={{width: `${porcentajeLibro}%`}}></div></div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-[#e6e4dc] flex items-center justify-between">
                  <span className="text-xs text-[#595750] font-sans">página actual:</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={miPagina} 
                      onChange={(e) => setMiPagina(Number(e.target.value))} 
                      onBlur={async () => {
                        await supabase.from('profiles').update({ pagina: miPagina }).eq('email', sesion.email);
                        registrarActividadPresencia();
                        setUsuariasClub(prev => prev.map(u => (u.email || '').trim().toLowerCase() === sesion.email.toLowerCase() ? { ...u, pagina: miPagina } : u));
                        mostrarToast('Progreso guardado automáticamente');
                      }}
                      className="editorial-