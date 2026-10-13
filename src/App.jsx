import { useState, useEffect, useMemo, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { createClient } from '@supabase/supabase-js';

import BuscadorLibros from './BuscadorLibros';
import PortadaLibro from './PortadaLibro';
import MapaGilda from './MapaGilda';
import EdificioClub from './EdificioClub';

import CalendarioInteractivo from './components/CalendarioInteractivo';
import ModalCompartirStory from './components/ModalCompartirStory';
import TimelineCapitulos from './components/TimelineCapitulos';
import { LomoLibroEstanteria, ObjetoExternoEnmarcado, IlustracionDecoracion } from './components/DecoracionesHabitacion';
import { ModalUpgrade, ModalImportarPin } from './components/ModalesAuxiliares';

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
let googleBooksCooldownUntil = 0;
const EMAIL_ADMINISTRADORA = 'ndnagore@gmail.com';

const googleBooksEnCooldown = () => {
  try {
    googleBooksCooldownUntil = Math.max(googleBooksCooldownUntil, Number(sessionStorage.getItem(GOOGLE_BOOKS_COOLDOWN_KEY)) || 0);
  } catch {}
  return googleBooksCooldownUntil > Date.now();
};

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
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
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
        try { sessionStorage.setItem(GOOGLE_BOOKS_COOLDOWN_KEY, String(googleBooksCooldownUntil)); } catch {}
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

const normalizarUbicacion = (texto) => String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');

const formatearPais = (pais) => {
  const valor = String(pais || '').trim();
  const normalizado = normalizarUbicacion(valor);
  const alias = { es: 'España', espana: 'España', spain: 'España', us: 'Estados Unidos', usa: 'Estados Unidos', gb: 'Reino Unido', uk: 'Reino Unido' };
  if (alias[normalizado]) return alias[normalizado];
  if (/^[a-z]{2}$/i.test(valor) && typeof Intl.DisplayNames === 'function') {
    try { return new Intl.DisplayNames(['es'], { type: 'region' }).of(valor.toUpperCase()) || valor; } catch { return valor.toUpperCase(); }
  }
  return valor.split(/\s+/).map(p => p.charAt(0).toLocaleUpperCase('es') + p.slice(1)).join(' ');
};

const geocodificarUbicacion = (consulta) => {
  const cacheKey = `gilda_geo_${normalizarUbicacion(consulta)}`;
  try {
    const cache = sessionStorage.getItem(cacheKey);
    if (cache !== null) {
      const parsed = JSON.parse(cache);
      return Promise.resolve(Array.isArray(parsed) ? { coords: parsed, country: '', region: '' } : parsed);
    }
  } catch {}

  if (geocodificacionesEnCurso.has(cacheKey)) return geocodificacionesEnCurso.get(cacheKey);

  const solicitud = colaGeocodificacion.then(async () => {
    const espera = Math.max(0, 1100 - (Date.now() - ultimaSolicitudGeocodificacion));
    if (espera > 0) await new Promise(r => setTimeout(r, espera));
    ultimaSolicitudGeocodificacion = Date.now();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&q=${encodeURIComponent(consulta)}`;
      const respuesta = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
      const resultados = await respuesta.json();
      const resultado = resultados[0];
      const coordenadas = resultado ? [Number(resultado.lat), Number(resultado.lon)] : null;
      const validas = coordenadas && coordenadas.every(Number.isFinite) ? { coords: coordenadas, country: resultado.address?.country || '', region: resultado.address?.state || resultado.address?.region || '' } : null;
      try { sessionStorage.setItem(cacheKey, JSON.stringify(validas)); } catch {}
      return validas;
    } catch {
      try { sessionStorage.setItem(cacheKey, 'null'); } catch {}
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
  const safeGet = (key, fallback) => { try { const val = localStorage.getItem(key); return val !== null ? val : fallback; } catch { return fallback; } };
  const safeGetJSON = (key, fallback) => {
    try {
      const val = localStorage.getItem(key);
      if (val === null) return fallback;
      const parsed = JSON.parse(val);
      return typeof parsed === typeof fallback || Array.isArray(fallback) ? parsed : fallback;
    } catch { return fallback; }
  };
  const safeSet = (key, val) => { try { localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val)); } catch (e) { console.error(e); } };

  const calcularEstadoConexion = (timestampStr) => {
    if (!timestampStr) return 'desconectada';
    const diffMinutos = (new Date() - new Date(timestampStr)) / 1000 / 60;
    if (isNaN(diffMinutos)) return 'desconectada';
    if (diffMinutos < 3) return 'conectada';
    if (diffMinutos < 15) return 'ausente';
    return 'desconectada';
  };

  const IndicadorPresencia = ({ timestamp }) => {
    const estado = calcularEstadoConexion(timestamp);
    if (estado === 'desconectada') return <span className="w-3 h-3 rounded-full bg-gray-300 inline-block shrink-0" title="Desconectada"></span>;
    return <span className={`w-3 h-3 rounded-full ${estado === 'conectada' ? 'bg-green-500 animate-pulse' : 'bg-amber-400'} inline-block shrink-0`} title={estado === 'conectada' ? 'Conectada' : 'Ausente'}></span>;
  };

  const formatearHoraWhatsApp = (timestampOrStr) => {
    if (timestampOrStr) {
      const d = new Date(timestampOrStr);
      if (!isNaN(d.getTime())) return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    const ahora = new Date();
    return `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
  };

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
  const [estadoNotificaciones, setEstadoNotificaciones] = useState('desactivadas');
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
  const chatEndRef = useRef(null);

  const modalidades = [
    { id: 'cotilla', nombre: 'gilda cotilla', precio: 'Gratis', esGratis: true, enlaceStripe: '', descripcion: 'Para curiosear comentarios y debates desde dentro.' },
    { id: 'satelite', nombre: 'gilda satélite', precio: '1 €/mes', esGratis: false, enlaceStripe: 'https://buy.stripe.com/cNi4gtfqV8cxeju0WV6Ri01', descripcion: 'Control de lecturas y comentarios en capítulos.' },
    { id: 'cafe', nombre: 'gilda de café', precio: '5 €/mes', esGratis: false, enlaceStripe: 'https://buy.stripe.com/3cI5kx0w1gJ3fny4976Ri02', descripcion: 'Acceso total a la app, chat de comunidad y cafecitos.' },
    { id: 'nube', nombre: 'gilda de nube', precio: '5 €/mes', esGratis: false, enlaceStripe: 'https://buy.stripe.com/cNi5kx92xcsNb7i3536Ri03', descripcion: 'Carta mensual digital en tu correo con actividades y pegatinas.' },
    { id: 'papel', nombre: 'gilda de papel', precio: '10 €/mes', esGratis: false, enlaceStripe: 'https://buy.stripe.com/bJe8wJ7Yt50l1wIbBz6Ri04', descripcion: 'Carta física en papel en tu buzón con marcapáginas.' },
    { id: 'virtual', nombre: 'gilda virtual', precio: '8 €/mes', esGratis: false, enlaceStripe: 'https://buy.stripe.com/bJe9ANguZ9gB6R27lj6Ri05', descripcion: 'Carta digital + acceso a la app, chat y cafecitos.' },
    { id: 'absoluta', nombre: 'gilda absoluta', precio: '12 €/mes', esGratis: false, enlaceStripe: 'https://buy.stripe.com/14A5kxemReAV2AMcFD6Ri08', descripcion: 'Todo incluido: carta física + app, chat y cafecitos.' }
  ];

  const sesion = useMemo(() => {
    if (!supabaseSession) return null;
    const emailUser = supabaseSession.user.email.toLowerCase().trim();
    const socia = usuariasClub.find(u => (u.email || '').trim().toLowerCase() === emailUser);
    const nombreSocia = socia?.nombre && socia.nombre.trim() !== '' ? socia.nombre.trim() : emailUser.split('@')[0];
    return { nombre: nombreSocia, email: emailUser, modalidad: socia?.modalidad || 'gilda' };
  }, [supabaseSession, usuariasClub]);

  const mostrarToast = (texto) => { setToastMsg(texto); setTimeout(() => setToastMsg(null), 3000); };

  const cargarDatosSupabase = async () => {
    try {
      const [
        { data: profiles }, { data: chapters }, { data: comments },
        { data: clubReadings }, { data: chatMessages }, { data: proposals },
        { data: personalReadings }, { data: calendarEvents }, { data: wallPosts }, { data: cafes }
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
        setUsuariasClub(profiles); safeSet('gilda_cache_usuarias', profiles);
        if (sesion?.email) {
          const sociaActual = profiles.find(u => (u.email || '').trim().toLowerCase() === sesion.email.toLowerCase());
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
    } catch (err) { console.error('Error sincronizando:', err); }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSupabaseSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSupabaseSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    cargarDatosSupabase();
    const interval = setInterval(cargarDatosSupabase, 8000);
    return () => clearInterval(interval);
  }, [sesion?.email]);

  const registrarActividadPresencia = async () => {
    if (!sesion?.email) return;
    const ahoraIso = new Date().toISOString();
    await supabase.from('profiles').update({ ultima_conexion: ahoraIso }).eq('email', sesion.email);
  };

  const handleMagicLinkLogin = async (e) => {
    e.preventDefault();
    setLoadingAuth(true);
    const { error } = await supabase.auth.signInWithOtp({ email: emailLogin.trim().toLowerCase(), options: { emailRedirectTo: window.location.origin } });
    if (error) alert('Error: ' + error.message);
    else alert('¡Correo enviado! Revisa tu bandeja de entrada.');
    setLoadingAuth(false);
  };

  const obtenerNombreReal = (emailComentario, usuarioOriginal) => {
    if (sesion?.email && emailComentario && sesion.email.toLowerCase() === emailComentario.toLowerCase()) {
      if (nombreUsuarioPersonalizado) return nombreUsuarioPersonalizado;
    }
    if (emailComentario) {
      const encontrada = usuariasClub.find(u => (u.email || '').trim().toLowerCase() === emailComentario.trim().toLowerCase());
      if (encontrada?.nombre?.trim()) return encontrada.nombre.trim();
    }
    if (usuarioOriginal && !usuarioOriginal.includes('@')) return usuarioOriginal;
    return sesion?.nombre || (emailComentario ? emailComentario.split('@')[0] : 'lectora');
  };

  const handleFotoPerfilUpdate = async (base64Img) => {
    setFotoPerfilPersonalizada(base64Img);
    safeSet('gilda_foto_perfil', base64Img);
    if (sesion?.email) await supabase.from('profiles').update({ foto_perfil: base64Img }).eq('email', sesion.email);
    mostrarToast('Foto de perfil actualizada');
  };

  const publicarCitaEnMuro = async (texto, libroCita) => {
    if (!texto.trim() || !sesion?.email) return;
    const publicacion = { tipo: 'cita', cita: texto.trim(), email: sesion.email, nombre: nombreUsuarioPersonalizado || sesion.nombre, libro: libroCita?.titulo || '', portada: libroCita?.portada || '', estrellas: 5, timestamp: new Date().toISOString() };
    await supabase.from('wall_posts').insert([publicacion]);
    setMuroActividad(prev => [publicacion, ...prev]);
    mostrarToast('Tu cita ya está publicada en el Muro.');
  };

  const votarCafecito = async (cafecito) => {
    const email = String(sesion?.email || '').toLowerCase();
    if (!email) return;
    const votantesArr = [...new Set(String(cafecito.votantes || '').split(/[;,]/).map(v => v.trim().toLowerCase()).filter(Boolean))];
    const yaVoto = votantesArr.includes(email);
    const nuevosVotantes = yaVoto ? votantesArr.filter(v => v !== email) : [...votantesArr, email];
    const nuevoTotal = Math.max(0, (Number(cafecito.votos) || votantesArr.length) + (yaVoto ? -1 : 1));

    await supabase.from('cafes').update({ votos: nuevoTotal, votantes: nuevosVotantes.join(',') }).eq('id', cafecito.id);
    await cargarDatosSupabase();
    mostrarToast(yaVoto ? 'Has retirado tu voto.' : '¡Voto registrado!');
  };

  const guardarLibroPersonal = async (tituloOpt, pagOpt, estadoOpt = 'leyendo', autoraOpt = '', portadaOpt = '') => {
    const tituloLibro = (tituloOpt !== undefined ? tituloOpt : libroPersonal).trim();
    if (!tituloLibro || !sesion?.email) return;
    const pagFinal = pagOpt !== undefined ? (Number(pagOpt) || 0) : (Number(paginaPersonalInput) || 0);

    const existente = lecturasPersonales.find(l => (l.email || '').toLowerCase() === sesion.email.toLowerCase() && (l.libro || '').toLowerCase() === tituloLibro.toLowerCase());

    if (existente) {
      await supabase.from('personal_readings').update({ pagina: pagFinal, paginas: pagFinal, estado: estadoOpt, autora: autoraOpt || existente.autora, portada: portadaOpt || existente.portada }).eq('id', existente.id);
    } else {
      await supabase.from('personal_readings').insert([{ email: sesion.email, nombre: nombreUsuarioPersonalizado || sesion.nombre, libro: tituloLibro, pagina: pagFinal, paginas: pagFinal, estado: estadoOpt, autora: autoraOpt, portada: portadaOpt }]);
    }

    await cargarDatosSupabase();
    setLibroPersonal(''); setPaginaPersonalInput(''); setModoCreacionManual(false);
    mostrarToast(`Guardado: ${tituloLibro}`);
  };

  const libroActual = useMemo(() => lecturas[0] || { titulo: 'La campana de cristal', autora: 'Sylvia Plath', paginas_totales: 280, portada: '' }, [lecturas]);
  const porcentajeLibro = useMemo(() => Math.min(Math.round((miPagina / Number(libroActual.paginas_totales || 280)) * 100), 100), [miPagina, libroActual]);

  const todosMisLibrosEstanteria = useMemo(() => sesion ? lecturasPersonales.filter(l => (l.email || '').toLowerCase() === sesion.email.toLowerCase()) : [], [lecturasPersonales, sesion]);
  const librosBibliotecaVisibles = useMemo(() => todosMisLibrosEstanteria.filter(item => (item.estado || 'leyendo') === tabEstanteria), [todosMisLibrosEstanteria, tabEstanteria]);

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

  const modalidadLimpia = (sesion?.modalidad || '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const esModalidadCorreo = modalidadLimpia.includes('nube') || modalidadLimpia.includes('papel');
  const esRestringida = modalidadLimpia.includes('cotilla') || modalidadLimpia.includes('satelite');
  const esAdministradora = String(sesion?.email || '').trim().toLowerCase() === EMAIL_ADMINISTRADORA;

  if (esPaginaGracias) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 w-full py-12 bg-[#ffffee]">
        <div className="editorial-card max-w-md w-full p-8 text-center space-y-6 shadow-xl border border-[#e6e4dc]">
          <h1 className="font-babydoll text-6xl text-[#1c1c1a] font-bold">gracias :)</h1>
          <p className="text-xs uppercase font-bold text-[#3d4220] font-sans">tu espacio ya está listo</p>
          <a href="/" className="block w-full editorial-btn py-3.5 text-xs font-bold text-center">Ir a gilda e iniciar sesión</a>
        </div>
      </div>
    );
  }

  if (!supabaseSession) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 w-full py-12 bg-[#ffffee] fade-in">
        <div className="editorial-card max-w-md w-full p-8 space-y-6 text-center border border-[#e6e4dc]">
          <h1 className="font-babydoll text-6xl text-[#1c1c1a] font-bold">gilda</h1>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#3d4220] font-bold font-sans">comunidad de lectura, cartas y creatividad</p>

          {vistaAcceso === 'menu' && (
            <form onSubmit={handleMagicLinkLogin} className="space-y-4 font-sans text-left pt-2">
              <label className="block text-xs font-semibold text-[#1c1c1a]">Correo electrónico</label>
              <input type="email" placeholder="tuemail@ejemplo.com" value={emailLogin} onChange={e => setEmailLogin(e.target.value)} required className="w-full editorial-input px-4 py-3 text-xs" />
              <button type="submit" disabled={loadingAuth} className="w-full editorial-btn py-3.5 text-xs shadow-md font-bold">{loadingAuth ? 'Enviando...' : 'Enviar enlace mágico'}</button>
              <button type="button" onClick={() => setVistaAcceso('modalidades')} className="w-full bg-white text-[#3d4220] border border-[#d4cfbc] rounded-2xl py-3.5 text-xs font-bold mt-3">Ver modalidades del club</button>
            </form>
          )}

          {vistaAcceso === 'modalidades' && (
            <div className="space-y-4 text-left fade-in">
              <button onClick={() => setVistaAcceso('menu')} className="text-xs font-semibold text-[#595750] flex items-center"><i className="fa-solid fa-arrow-left mr-2"></i> Volver</button>
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {modalidades.map(m => (
                  <div key={m.id} className="editorial-card p-4 space-y-2 bg-[#ffffee] border border-[#e6e4dc]">
                    <div className="flex justify-between items-center"><h3 className="font-babydoll font-bold text-lg">{m.nombre}</h3><span className="text-xs font-bold bg-[#3d4220] text-white px-2.5 py-1 rounded-full">{m.precio}</span></div>
                    <p className="text-xs text-[#595750] font-sans">{m.descripcion}</p>
                    <a href={m.esGratis ? '#' : m.enlaceStripe} onClick={e => { if (m.esGratis) setVistaAcceso('menu'); }} className="block w-full mt-2 py-2 text-center text-xs editorial-btn font-semibold">{m.esGratis ? 'Probar gratis' : 'Elegir esta modalidad'}</a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (esModalidadCorreo && !esAdministradora) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 w-full py-8 bg-[#ffffee]">
        <div className="editorial-card max-w-sm w-full p-8 text-center space-y-4">
          <h1 className="font-babydoll text-4xl font-bold">gilda</h1>
          <p className="text-xs text-[#595750] font-sans leading-relaxed">Tu modalidad ({sesion.modalidad}) está registrada para recibir correspondencia y no incluye acceso web.</p>
          <button onClick={() => supabase.auth.signOut()} className="editorial-btn px-4 py-2 text-xs">Cerrar sesión</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center pt-6 pb-28 px-4 sm:px-6 max-w-lg w-full mx-auto relative bg-[#ffffee]">
      {toastMsg && <div className="fixed top-6 z-50 bg-[#1c1c1a] text-[#ffffee] text-xs px-4 py-2.5 rounded-full shadow-lg font-sans">{toastMsg}</div>}

      {modalImportarAbierto && (
        <ModalImportarPin onClose={() => setModalImportarAbierto(false)} onSave={(url, tit) => {
          const act = objetosPersonalizados.map(o => o.id === objetoActivoParaImportar ? { ...o, url, titulo: tit || o.titulo } : o);
          setObjetosPersonalizados(act); safeSet('gilda_objetos_personalizados', act); setModalImportarAbierto(false);
        }} />
      )}

      {mostrarModalUpgrade && <ModalUpgrade onClose={() => setMostrarModalUpgrade(false)} />}

      {mostrarModalShare && (
        <ModalCompartirStory onClose={() => setMostrarModalShare(false)} usuario={nombreUsuarioPersonalizado || sesion.nombre} libro={libroActual} pagina={miPagina} citas={misCitas} decoracion={decoracionActual} misLibros={lecturasPersonales.filter(l => (l.email || '').toLowerCase() === sesion.email.toLowerCase())} onPublicarCita={publicarCitaEnMuro} sesion={sesion} />
      )}

      <header className="w-full mb-5 flex justify-between items-center bg-white p-4 rounded-2xl border border-[#e6e4dc] shadow-sm">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-full bg-[#faf9f5] border border-[#e6e4dc] flex items-center justify-center font-babydoll text-lg font-bold text-[#3d4220]">
            {(nombreUsuarioPersonalizado || sesion.nombre || 'L').charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <h2 className="font-bold text-lg leading-none truncate font-babydoll">{nombreUsuarioPersonalizado || sesion.nombre}</h2>
            <span className="text-xs text-[#595750] uppercase font-sans tracking-wider">{sesion.modalidad}</span>
          </div>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="text-[#595750] hover:text-black p-2.5"><i className="fa-solid fa-arrow-right-from-bracket"></i></button>
      </header>

      <main className="w-full flex-grow space-y-4">
        <div style={{ display: seccionApp === 'inicio' ? 'block' : 'none' }} className="space-y-4 fade-in">
          <div className="flex bg-[#faf9f5] p-1 rounded-xl text-xs font-semibold border border-[#e6e4dc] font-sans mb-3">
            <button onClick={() => setSubTabInicio('progreso')} className={`flex-1 py-2 rounded-lg ${subTabInicio === 'progreso' ? 'bg-[#1c1c1a] text-[#ffffee]' : 'text-[#595750]'}`}>Mi actividad y lecturas</button>
            <button onClick={() => setSubTabInicio('muro')} className={`flex-1 py-2 rounded-lg ${subTabInicio === 'muro' ? 'bg-[#1c1c1a] text-[#ffffee]' : 'text-[#595750]'}`}>Muro del club</button>
          </div>

          {subTabInicio === 'progreso' && (
            <>
              <div className="editorial-card p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-[#e6e4dc] pb-2">
                   <h3 className="font-babydoll text-xl font-bold">Progreso actual</h3>
                   <button onClick={() => setMostrarModalShare(true)} className="text-xs font-bold font-sans text-[#3d4220] bg-white border border-[#e6e4dc] px-3 py-1.5 rounded-full"><i className="fa-brands fa-instagram"></i> Compartir</button>
                </div>
                <div className="flex gap-4 items-center">
                  <PortadaLibro titulo={libroActual.titulo} autora={libroActual.autora} portada={libroActual.portada} size="large" />
                  <div className="space-y-1 w-full">
                    <span className="text-xs uppercase tracking-wider text-[#3d4220] font-bold font-sans">Lectura del club</span>
                    <h2 className="font-babydoll text-2xl font-bold leading-tight">{libroActual.titulo}</h2>
                    <p className="text-xs text-[#595750] italic font-sans">{libroActual.autora}</p>
                  </div>
                </div>
              </div>

              <div className="editorial-card p-5 space-y-4">
                <h3 className="font-babydoll text-xl font-bold">Calendario del club</h3>
                <CalendarioInteractivo eventos={eventosCalendario} />
              </div>

              <div className="editorial-card p-4 space-y-3">
                <MapaGilda usuarias={usuariasClub} normalizarUbicacion={normalizarUbicacion} geocodificarUbicacion={geocodificarUbicacion} formatearPais={formatearPais} />
              </div>
            </>
          )}

          {subTabInicio === 'muro' && (
            <div className="editorial-card p-5 space-y-3">
              <h3 className="font-babydoll text-2xl font-bold text-[#1c1c1a]">El muro del club</h3>
              {muroActividad.map((item, idx) => (
                <div key={idx} className="bg-[#ffffee] p-3.5 rounded-xl border border-[#e6e4dc] flex gap-3 items-center">
                  <PortadaLibro titulo={item.libro} portada={item.portada} size="thumb" />
                  <div className="flex flex-col space-y-1">
                    <span className="font-bold font-sans text-xs text-[#3d4220]">{item.nombre || 'lectora'}</span>
                    {item.cita ? <p className="font-babydoll text-sm">“{item.cita}”</p> : <p className="text-xs font-sans">Marca en <b>{item.libro}</b> ({item.estrellas}/5 ✦)</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: seccionApp === 'edificio' ? 'block' : 'none' }}>
          <EdificioClub usuarias={miembrosEdificio} libroActual={libroActual} sesionEmail={sesion?.email} chatBloqueado={esRestringida} onAddWantToRead={(t, a, p) => guardarLibroPersonal(t, 0, 'want_to_read', a, p)} onAbrirPrivado={() => setSeccionApp('comunidad')} />
        </div>

        <div style={{ display: seccionApp === 'habitacion' ? 'block' : 'none' }} className="space-y-4">
          <div className="editorial-card p-5 space-y-3">
            <h2 className="font-babydoll text-2xl font-bold">Mi habitación</h2>
            <div className="pt-4 pb-6 px-3 estanteria-madera min-h-[200px] flex items-end justify-between overflow-x-auto">
              <div className="flex items-end gap-3 flex-grow">
                {todosMisLibrosEstanteria.map((item, idx) => (
                  <LomoLibroEstanteria key={idx} item={item} onClick={() => setLibroSeleccionadoDetalle(item)} />
                ))}
                {objetosPersonalizados.map(obj => (
                  <ObjetoExternoEnmarcado key={obj.id} urlImagen={obj.url} titulo={obj.titulo} onClick={() => { setObjetoActivoParaImportar(obj.id); setModalImportarAbierto(true); }} />
                ))}
              </div>
              <IlustracionDecoracion tipo={decoracionActual} onInteractuar={(t) => setDecoracionActual(t)} />
            </div>
          </div>
        </div>

        <div style={{ display: seccionApp === 'capitulos' ? 'block' : 'none' }}>
          <TimelineCapitulos capitulos={capitulos} miPagina={miPagina} comentarios={comentarios} modalidadLimpia={modalidadLimpia} obtenerNombreReal={obtenerNombreReal} sesion={sesion} nombreUsuarioPersonalizado={nombreUsuarioPersonalizado} supabase={supabase} cargarDatosSupabase={cargarDatosSupabase} registrarActividadPresencia={registrarActividadPresencia} mostrarToast={mostrarToast} />
        </div>

        <div style={{ display: seccionApp === 'comunidad' ? 'block' : 'none' }} className="space-y-4">
          <div className="editorial-card h-[500px] flex flex-col justify-between p-4 bg-[#faf9f5]">
            <h3 className="font-babydoll text-xl font-bold">Chat de Lectoras</h3>
            <div className="flex-grow p-2 overflow-y-auto space-y-2">
              {chatMsgs.filter(m => m.tipo !== 'privado').map((m, i) => (
                <div key={i} className="bg-white p-2.5 rounded-xl border border-[#e6e4dc] text-xs">
                  <span className="font-bold text-[#3d4220] block font-sans">{obtenerNombreReal(m.email, m.usuario)}</span>
                  <p className="font-sans text-gray-800">{m.mensaje}</p>
                </div>
              ))}
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!nuevoChat.trim()) return;
              await supabase.from('chat_messages').insert([{ email: sesion.email, usuario: nombreUsuarioPersonalizado || sesion.nombre, mensaje: nuevoChat.trim(), tipo: 'global', timestamp: new Date().toISOString() }]);
              await cargarDatosSupabase(); setNuevoChat('');
            }} className="flex gap-2 pt-2">
              <input type="text" value={nuevoChat} onChange={e=>setNuevoChat(e.target.value)} className="editorial-input flex-grow px-3 py-2 text-xs" placeholder="Escribe un mensaje..." />
              <button type="submit" className="editorial-btn px-4 py-2 text-xs">Enviar</button>
            </form>
          </div>
        </div>
      </main>

      <nav className="editorial-nav fixed bottom-0 left-0 right-0 py-2.5 px-4 flex justify-around items-center max-w-lg mx-auto z-40 rounded-t-2xl shadow-lg bg-white border-t border-[#e6e4dc]">
        {[
          { id: 'inicio', icon: 'fa-house', label: 'inicio' },
          { id: 'edificio', icon: 'fa-building', label: 'casa' },
          { id: 'habitacion', icon: 'fa-bookmark', label: 'habitación' },
          { id: 'capitulos', icon: 'fa-book-open', label: 'capítulos' },
          { id: 'comunidad', icon: 'fa-mug-hot', label: 'comunidad' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setSeccionApp(tab.id)} className={`flex flex-col items-center gap-1 p-1.5 ${seccionApp === tab.id ? 'text-[#1c1c1a] font-bold' : 'text-[#595750]'}`}>
            <i className={`fa-solid ${tab.icon} text-sm`}></i>
            <span className="text-[9px] font-bold lowercase font-sans">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}