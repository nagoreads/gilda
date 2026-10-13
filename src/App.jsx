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
import { ModalUpgrade, ModalImportarPin, ModalDetalleLibro } from './components/ModalesAuxiliares';
import SeccionComunidad from './components/SeccionComunidad';
import SeccionHabitacion from './components/SeccionHabitacion';
import SeccionAdmin from './components/SeccionAdmin';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const EMAIL_ADMINISTRADORA = 'ndnagore@gmail.com';

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

const geocodificarUbicacion = async (consulta) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&q=${encodeURIComponent(consulta)}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const datos = await res.json();
    if (!datos[0]) return null;
    return {
      coords: [Number(datos[0].lat), Number(datos[0].lon)],
      country: datos[0].address?.country || '',
      region: datos[0].address?.state || datos[0].address?.region || ''
    };
  } catch {
    return null;
  }
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

  const [seccionApp, setSeccionApp] = useState('inicio');
  const [subTabInicio, setSubTabInicio] = useState('progreso');
  const [subTabComunidad, setSubTabComunidad] = useState('chat');
  const [chatModo, setChatModo] = useState('global');
  const [destinatarioPrivado, setDestinatarioPrivado] = useState(null);

  const [tabEstanteria, setTabEstanteria] = useState('leyendo');
  const [toastMsg, setToastMsg] = useState(null);
  const [mostrarModalUpgrade, setMostrarModalUpgrade] = useState(false);
  const [mostrarModalShare, setMostrarModalShare] = useState(false);

  const [capitulos, setCapitulos] = useState(() => safeGetJSON('gilda_cache_capitulos', []));
  const [comentarios, setComentarios] = useState(() => safeGetJSON('gilda_cache_comentarios', []));
  const [lecturas, setLecturas] = useState(() => safeGetJSON('gilda_cache_lecturas', []));
  const [chatMsgs, setChatMsgs] = useState(() => safeGetJSON('gilda_cache_chat', []));
  const [propuestas, setPropuestas] = useState(() => safeGetJSON('gilda_cache_propuestas', []));
  const [lecturasPersonales, setLecturasPersonales] = useState(() => safeGetJSON('gilda_cache_personales', []));
  const [eventosCalendario, setEventosCalendario] = useState(() => safeGetJSON('gilda_cache_calendario', []));
  const [muroActividad, setMuroActividad] = useState(() => safeGetJSON('gilda_cache_muro', []));
  const [cafecitos, setCafecitos] = useState(() => safeGetJSON('gilda_cache_cafecitos', []));

  const [miPagina, setMiPagina] = useState(0);
  const [miCiudadInput, setMiCiudadInput] = useState(() => safeGet('gilda_ciudad', ''));
  const [miCodigoPostalInput, setMiCodigoPostalInput] = useState(() => safeGet('gilda_codigo_postal', ''));
  const [isReadingNow, setIsReadingNow] = useState(() => safeGetJSON('gilda_is_reading', false));
  const [nombreUsuarioPersonalizado, setNombreUsuarioPersonalizado] = useState(() => safeGet('gilda_nombre_usuario', ''));
  const [fotoPerfilPersonalizada, setFotoPerfilPersonalizada] = useState(() => safeGet('gilda_foto_perfil', ''));

  const [decoracionActual, setDecoracionActual] = useState(() => safeGet('gilda_decoracion', 'monstera'));
  const [objetosPersonalizados, setObjetosPersonalizados] = useState(() => safeGetJSON('gilda_objetos_personalizados', [{ id: 'pin-1', url: null, titulo: 'Mi moodboard' }]));
  const [modalImportarAbierto, setModalImportarAbierto] = useState(false);
  const [objetoActivoParaImportar, setObjetoActivoParaImportar] = useState(null);
  const [libroSeleccionadoDetalle, setLibroSeleccionadoDetalle] = useState(null);
  const [misCitas] = useState(() => safeGetJSON('gilda_mis_citas', []));

  const modalidades = [
    { id: 'cotilla', nombre: 'gilda cotilla', precio: 'Gratis', esGratis: true, enlaceStripe: '', descripcion: 'Para curiosear comentarios y debates desde dentro.' },
    { id: 'satelite', nombre: 'gilda satélite', precio: '1 €/mes', esGratis: false, enlaceStripe: 'https://buy.stripe.com/cNi4gtfqV8cxeju0WV6Ri01', descripcion: 'Control de lecturas y comentarios en capítulos.' },
    { id: 'cafe', nombre: 'gilda de café', precio: '5 €/mes', esGratis: false, enlaceStripe: 'https://buy.stripe.com/3cI5kx0w1gJ3fny4976Ri02', descripcion: 'Acceso total a la app, chat de comunidad y cafecitos.' },
    { id: 'nube', nombre: 'gilda de nube', precio: '5 €/mes', esGratis: false, enlaceStripe: 'https://buy.stripe.com/cNi5kx92xcsNb7i3536Ri03', descripcion: 'Carta mensual digital en tu correo con actividades.' },
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

  const obtenerUbicacionActual = () => {
    if (!navigator.geolocation) { mostrarToast('Geolocalización no soportada.'); return; }
    mostrarToast('Obteniendo ubicación...');
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
        const data = await res.json();
        const ciudad = data.address?.city || data.address?.town || data.address?.village || '';
        const cp = data.address?.postcode || '';
        if (ciudad) setMiCiudadInput(ciudad);
        if (cp) setMiCodigoPostalInput(cp);
        mostrarToast('¡Ubicación detectada!');
      } catch { mostrarToast('No se detectó la ciudad.'); }
    });
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

  const AvatarUsuaria = ({ foto, nombre, sizeClass = "w-9 h-9", textClass = "text-lg", editable = false, onFotoChange = () => {} }) => {
    const fileInputRef = useRef(null);
    const [errorImg, setErrorImg] = useState(false);

    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => { setErrorImg(false); onFotoChange(reader.result); };
        reader.readAsDataURL(file);
      }
    };

    const content = (foto && foto.trim() !== '' && !errorImg)
      ? <img src={foto} alt={nombre || 'Lector(a)'} onError={() => setErrorImg(true)} className={`${sizeClass} rounded-full object-cover border border-[#e8e4d9] shrink-0`} />
      : <div className={`${sizeClass} rounded-full bg-[#faf9f5] border border-[#e8e4d9] flex items-center justify-center font-babydoll ${textClass} text-[var(--primary-olive)] shrink-0 font-bold`}>{(nombre || 'L').charAt(0).toUpperCase()}</div>;

    if (editable) {
      return (
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()} title="Cambiar foto de perfil">
          {content}
          <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <i className="fa-solid fa-camera text-white text-xs"></i>
          </div>
          <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="hidden" />
        </div>
      );
    }
    return content;
  };

  const IndicadorPresencia = ({ timestamp }) => {
    if (!timestamp) return <span className="w-3 h-3 rounded-full bg-gray-300 inline-block shrink-0" title="Desconectada"></span>;
    const diff = (new Date() - new Date(timestamp)) / 1000 / 60;
    if (isNaN(diff) || diff >= 15) return <span className="w-3 h-3 rounded-full bg-gray-300 inline-block shrink-0" title="Desconectada"></span>;
    return <span className={`w-3 h-3 rounded-full ${diff < 3 ? 'bg-green-500 animate-pulse' : 'bg-amber-400'} inline-block shrink-0`} title={diff < 3 ? 'Conectada' : 'Ausente'}></span>;
  };

  const formatearHoraWhatsApp = (timestampOrStr) => {
    if (timestampOrStr) {
      const d = new Date(timestampOrStr);
      if (!isNaN(d.getTime())) return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    const ahora = new Date();
    return `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
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

  const guardarLibroPersonal = async (tituloOpt, pagOpt, estadoOpt = 'leyendo', autoraOpt = '', portadaOpt = '') => {
    const tituloLibro = String(tituloOpt || '').trim();
    if (!tituloLibro || !sesion?.email) return;
    const pagFinal = Number(pagOpt) || 0;

    const existente = lecturasPersonales.find(l => (l.email || '').toLowerCase() === sesion.email.toLowerCase() && (l.libro || '').toLowerCase() === tituloLibro.toLowerCase());

    if (existente) {
      await supabase.from('personal_readings').update({ pagina: pagFinal, paginas: pagFinal, estado: estadoOpt, autora: autoraOpt || existente.autora, portada: portadaOpt || existente.portada }).eq('id', existente.id);
    } else {
      await supabase.from('personal_readings').insert([{ email: sesion.email, nombre: nombreUsuarioPersonalizado || sesion.nombre, libro: tituloLibro, pagina: pagFinal, paginas: pagFinal, estado: estadoOpt, autora: autoraOpt, portada: portadaOpt }]);
    }

    await cargarDatosSupabase();
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
        <div className="editorial-card max-w-md w-full p-8 text-center space-y-6 shadow-xl border border-[#e8e4d9]">
          <h1 className="font-babydoll text-6xl text-[#23211e] font-bold">gracias :)</h1>
          <p className="text-xs uppercase font-bold text-[var(--primary-olive)] font-sans">tu espacio ya está listo</p>
          <a href="/" className="block w-full editorial-btn py-3.5 text-xs font-bold text-center">Ir a gilda e iniciar sesión</a>
        </div>
      </div>
    );
  }

  if (!supabaseSession) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 w-full py-12 bg-[#ffffee] fade-in">
        <div className="editorial-card max-w-md w-full p-8 space-y-6 text-center border border-[#e8e4d9]">
          <h1 className="font-babydoll text-6xl text-[#23211e] font-bold">gilda</h1>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--primary-olive)] font-bold font-sans">comunidad de lectura, cartas y creatividad</p>

          {vistaAcceso === 'menu' && (
            <form onSubmit={handleMagicLinkLogin} className="space-y-4 font-sans text-left pt-2">
              <label className="block text-xs font-semibold text-[#23211e]">Correo electrónico</label>
              <input type="email" placeholder="tuemail@ejemplo.com" value={emailLogin} onChange={e => setEmailLogin(e.target.value)} required className="w-full editorial-input px-4 py-3 text-xs" />
              <button type="submit" disabled={loadingAuth} className="w-full editorial-btn py-3.5 text-xs shadow-md font-bold">{loadingAuth ? 'Enviando...' : 'Enviar enlace mágico'}</button>
              <button type="button" onClick={() => setVistaAcceso('modalidades')} className="w-full bg-white text-[var(--primary-olive)] border border-[#d4cfbc] rounded-2xl py-3.5 text-xs font-bold mt-3">Ver modalidades del club</button>
            </form>
          )}

          {vistaAcceso === 'modalidades' && (
            <div className="space-y-4 text-left fade-in">
              <button onClick={() => setVistaAcceso('menu')} className="text-xs font-semibold text-[#75706b] flex items-center"><i className="fa-solid fa-arrow-left mr-2"></i> Volver</button>
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {modalidades.map(m => (
                  <div key={m.id} className="editorial-card p-4 space-y-2 bg-[#ffffee] border border-[#e8e4d9]">
                    <div className="flex justify-between items-center"><h3 className="font-babydoll font-bold text-lg">{m.nombre}</h3><span className="text-xs font-bold bg-[var(--primary-olive)] text-white px-2.5 py-1 rounded-full">{m.precio}</span></div>
                    <p className="text-xs text-[#75706b] font-sans">{m.descripcion}</p>
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
        <div className="editorial-card-lavender p-5 space-y-4">
          <h1 className="font-babydoll text-4xl font-bold">gilda</h1>
          <p className="text-xs text-[#75706b] font-sans leading-relaxed">Tu modalidad ({sesion.modalidad}) está registrada para recibir correspondencia y no incluye acceso web.</p>
          <button onClick={() => supabase.auth.signOut()} className="editorial-btn px-4 py-2 text-xs">Cerrar sesión</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center pt-6 pb-28 px-4 sm:px-6 max-w-lg w-full mx-auto relative bg-[#ffffee]">
      {toastMsg && <div className="fixed top-6 z-50 bg-[#23211e] text-[#ffffee] text-xs px-4 py-2.5 rounded-full shadow-lg font-sans">{toastMsg}</div>}

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

      {libroSeleccionadoDetalle && (
        <ModalDetalleLibro libro={libroSeleccionadoDetalle} onClose={() => setLibroSeleccionadoDetalle(null)} sesion={sesion} supabase={supabase} cargarDatosSupabase={cargarDatosSupabase} registrarActividadPresencia={registrarActividadPresencia} mostrarToast={mostrarToast} nombreUsuarioPersonalizado={nombreUsuarioPersonalizado} />
      )}

      {/* Encabezado */}
      <header className="w-full mb-5 flex justify-between items-center bg-white p-4 rounded-2xl border border-[#e8e4d9] shadow-sm">
        <div className="flex items-center gap-3 overflow-hidden">
          <AvatarUsuaria foto={fotoPerfilPersonalizada} nombre={nombreUsuarioPersonalizado || sesion.nombre} sizeClass="w-10 h-10" textClass="text-lg" editable={true} onFotoChange={handleFotoPerfilUpdate} />
          <div className="overflow-hidden">
            <h2 className="font-bold text-lg leading-none truncate font-babydoll">{nombreUsuarioPersonalizado || sesion.nombre}</h2>
            <span className="text-xs text-[#75706b] uppercase font-sans tracking-wider">{sesion.modalidad}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {esAdministradora && (
            <button onClick={() => setSeccionApp('admin')} className={`p-2.5 rounded-xl border transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${seccionApp === 'admin' ? 'bg-[var(--primary-olive)] text-white' : 'bg-[#faf9f5] text-[var(--primary-olive)] border-[#e8e4d9]'}`}>
              <i className="fa-solid fa-screwdriver-wrench text-xs"></i>
            </button>
          )}
          <button onClick={() => supabase.auth.signOut()} className="text-[#75706b] hover:text-black p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center"><i className="fa-solid fa-arrow-right-from-bracket"></i></button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="w-full flex-grow space-y-4">
        {/* INICIO */}
        <div style={{ display: seccionApp === 'inicio' ? 'block' : 'none' }} className="space-y-4 fade-in">
          <div className="flex bg-[#faf9f5] p-1 rounded-xl text-xs font-semibold border border-[#e8e4d9] font-sans mb-3">
            <button onClick={() => setSubTabInicio('progreso')} className={`flex-1 py-2 rounded-lg ${subTabInicio === 'progreso' ? 'bg-[#23211e] text-[#ffffee]' : 'text-[#75706b]'}`}>Mi actividad y lecturas</button>
            <button onClick={() => setSubTabInicio('muro')} className={`flex-1 py-2 rounded-lg ${subTabInicio === 'muro' ? 'bg-[#23211e] text-[#ffffee]' : 'text-[#75706b]'}`}>Muro del club</button>
          </div>

          {subTabInicio === 'progreso' && (
            <>
              <div className="editorial-card p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-[#e8e4d9] pb-2">
                   <h3 className="font-babydoll text-xl font-bold">Progreso actual</h3>
                   <button onClick={() => setMostrarModalShare(true)} className="text-xs font-bold font-sans text-[var(--primary-olive)] bg-white border border-[#e8e4d9] px-3 py-1.5 rounded-full shadow-xs"><i className="fa-brands fa-instagram"></i> Compartir</button>
                </div>
                <div className="flex gap-4 items-center">
                  <PortadaLibro titulo={libroActual.titulo} autora={libroActual.autora} portada={libroActual.portada} size="large" />
                  <div className="space-y-2 w-full">
                    <span className="text-xs uppercase tracking-wider text-[var(--primary-olive)] font-bold font-sans">Lectura del club</span>
                    <h2 className="font-babydoll text-2xl font-bold leading-tight">{libroActual.titulo}</h2>
                    <p className="text-xs text-[#75706b] italic font-sans">{libroActual.autora}</p>
                    <div>
                      <div className="flex justify-between text-xs text-[#75706b] mb-1 font-sans"><span>progreso</span><span>{porcentajeLibro}%</span></div>
                      <div className="w-full bg-[#faf9f5] rounded-full h-2 border border-[#e8e4d9]"><div className="bg-[var(--primary-olive)] h-full rounded-full" style={{width: `${porcentajeLibro}%`}}></div></div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#e8e4d9] flex items-center justify-between">
                  <span className="text-xs text-[#75706b] font-sans">página actual:</span>
                  <input type="number" value={miPagina} onChange={e => setMiPagina(Number(e.target.value))} onBlur={async () => {
                    await supabase.from('profiles').update({ pagina: miPagina }).eq('email', sesion.email);
                    mostrarToast('Progreso guardado');
                  }} className="editorial-input w-20 text-center py-1.5 text-xs font-semibold" />
                </div>
              </div>

              <div className="editorial-card p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-babydoll text-xl font-bold flex items-center gap-2"><i className="fa-solid fa-location-dot text-[var(--primary-olive)]"></i> Tu localización</h3>
                  <button type="button" onClick={obtenerUbicacionActual} className="text-[10px] font-bold font-sans bg-[var(--primary-olive)] text-white px-3 py-1.5 rounded-xl"><i className="fa-solid fa-location-crosshairs"></i> Usar mi ubicación</button>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <input type="text" placeholder="Ciudad..." value={miCiudadInput} onChange={e => setMiCiudadInput(e.target.value)} className="editorial-input p-2.5 text-xs" />
                  <input type="text" placeholder="C. Postal..." value={miCodigoPostalInput} onChange={e => setMiCodigoPostalInput(e.target.value)} className="editorial-input p-2.5 text-xs" />
                </div>
                <button onClick={async () => {
                  safeSet('gilda_ciudad', miCiudadInput); safeSet('gilda_codigo_postal', miCodigoPostalInput);
                  await supabase.from('profiles').update({ ciudad: miCiudadInput, codigo_postal: miCodigoPostalInput }).eq('email', sesion.email);
                  mostrarToast('Ubicación guardada');
                }} className="w-full editorial-btn py-2.5 text-xs font-semibold min-h-[44px]">Guardar ubicación</button>
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
              <h3 className="font-babydoll text-2xl font-bold text-[#23211e]">El muro del club</h3>
              {muroActividad.length === 0 ? (
                <p className="text-xs text-[#75706b] italic font-sans py-4 text-center">Aún no hay publicaciones en el muro.</p>
              ) : (
                muroActividad.map((item, idx) => (
                  <div key={idx} className="bg-[#ffffff] p-3.5 rounded-xl border border-[#e8e4d9] flex gap-3 items-center">
                    <PortadaLibro titulo={item.libro} portada={item.portada} size="thumb" />
                    <div className="flex flex-col space-y-1 w-full">
                      <span className="font-bold font-sans text-xs text-[var(--primary-olive)]">{item.nombre || 'lectora'}</span>
                      {item.cita ? (
                        <blockquote className="border-l-2 border-[#8b6040] pl-2 font-babydoll text-sm">“{item.cita}”</blockquote>
                      ) : (
                        <p className="text-xs font-sans">Ha marcado <b>{item.libro}</b> con {item.estrellas}/5 ✦</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* EDIFICIO / CASA */}
        <div style={{ display: seccionApp === 'edificio' ? 'block' : 'none' }}>
          <EdificioClub AvatarUsuaria={AvatarUsuaria} usuarias={miembrosEdificio} libroActual={libroActual} sesionEmail={sesion?.email} chatBloqueado={esRestringida} onAddWantToRead={(t, a, p) => guardarLibroPersonal(t, 0, 'want_to_read', a, p)} onAbrirPrivado={(socia) => {
            if (esRestringida) { setMostrarModalUpgrade(true); return; }
            setSeccionApp('comunidad');
            setSubTabComunidad('chat');
            setChatModo('privado');
            setDestinatarioPrivado(socia);
          }} />
        </div>

        {/* HABITACIÓN */}
        <div style={{ display: seccionApp === 'habitacion' ? 'block' : 'none' }}>
          <SeccionHabitacion
            sesion={sesion}
            miPagina={miPagina}
            libroActual={libroActual}
            porcentajeLibro={porcentajeLibro}
            todosMisLibrosEstanteria={todosMisLibrosEstanteria}
            librosBibliotecaVisibles={librosBibliotecaVisibles}
            objetosPersonalizados={objetosPersonalizados}
            setObjetosPersonalizados={setObjetosPersonalizados}
            decoracionActual={decoracionActual}
            setDecoracionActual={setDecoracionActual}
            tabEstanteria={tabEstanteria}
            setTabEstanteria={setTabEstanteria}
            isReadingNow={isReadingNow}
            setIsReadingNow={setIsReadingNow}
            fotoPerfilPersonalizada={fotoPerfilPersonalizada}
            nombreUsuarioPersonalizado={nombreUsuarioPersonalizado}
            handleFotoPerfilUpdate={handleFotoPerfilUpdate}
            guardarLibroPersonal={guardarLibroPersonal}
            setLibroSeleccionadoDetalle={setLibroSeleccionadoDetalle}
            setMostrarModalShare={setMostrarModalShare}
            setObjetoActivoParaImportar={setObjetoActivoParaImportar}
            setModalImportarAbierto={setModalImportarAbierto}
            registrarActividadPresencia={registrarActividadPresencia}
            mostrarToast={mostrarToast}
            safeSet={safeSet}
            AvatarUsuaria={AvatarUsuaria}
          />
        </div>

        {/* CAPÍTULOS / TIMELINE */}
        <div style={{ display: seccionApp === 'capitulos' ? 'block' : 'none' }}>
          <TimelineCapitulos capitulos={capitulos} miPagina={miPagina} comentarios={comentarios} modalidadLimpia={modalidadLimpia} obtenerNombreReal={obtenerNombreReal} sesion={sesion} nombreUsuarioPersonalizado={nombreUsuarioPersonalizado} supabase={supabase} cargarDatosSupabase={cargarDatosSupabase} registrarActividadPresencia={registrarActividadPresencia} mostrarToast={mostrarToast} />
        </div>

        {/* COMUNIDAD */}
        <div style={{ display: seccionApp === 'comunidad' ? 'block' : 'none' }}>
          <SeccionComunidad
            subTabComunidad={subTabComunidad}
            setSubTabComunidad={setSubTabComunidad}
            chatModo={chatModo}
            setChatModo={setChatModo}
            destinatarioPrivado={destinatarioPrivado}
            setDestinatarioPrivado={setDestinatarioPrivado}
            usuariasClub={usuariasClub}
            chatMsgs={chatMsgs}
            cafecitos={cafecitos}
            propuestas={propuestas}
            sesion={sesion}
            nombreUsuarioPersonalizado={nombreUsuarioPersonalizado}
            supabase={supabase}
            cargarDatosSupabase={cargarDatosSupabase}
            registrarActividadPresencia={registrarActividadPresencia}
            mostrarToast={mostrarToast}
            normalizarUbicacion={normalizarUbicacion}
            geocodificarUbicacion={geocodificarUbicacion}
            formatearPais={formatearPais}
            formatearHoraWhatsApp={formatearHoraWhatsApp}
            obtenerNombreReal={obtenerNombreReal}
            IndicadorPresencia={IndicadorPresencia}
            AvatarUsuaria={AvatarUsuaria}
          />
        </div>

        {/* ADMIN */}
        <div style={{ display: seccionApp === 'admin' && esAdministradora ? 'block' : 'none' }}>
          <SeccionAdmin
            libroActual={libroActual}
            chatMsgs={chatMsgs}
            propuestas={propuestas}
            supabase={supabase}
            cargarDatosSupabase={cargarDatosSupabase}
            mostrarToast={mostrarToast}
          />
        </div>
      </main>

      {/* Navegación Inferior */}
      <nav className="editorial-nav fixed bottom-0 left-0 right-0 py-2.5 px-4 flex justify-around items-center max-w-lg mx-auto z-40 rounded-t-2xl shadow-lg bg-white border-t border-[#e8e4d9]">
        {[
          { id: 'inicio', icon: 'fa-house', label: 'inicio' },
          { id: 'edificio', icon: 'fa-building', label: 'casa' },
          { id: 'habitacion', icon: 'fa-bookmark', label: 'habitación' },
          { id: 'capitulos', icon: 'fa-book-open', label: 'capítulos' },
          { id: 'comunidad', icon: 'fa-mug-hot', label: 'comunidad' }
        ].map(tab => {
          const bloqueado = esRestringida && tab.id === 'comunidad';
          return (
            <button key={tab.id} onClick={() => { if (bloqueado) setMostrarModalUpgrade(true); else setSeccionApp(tab.id); }} className={`flex flex-col items-center justify-center gap-1 p-1.5 min-w-[48px] min-h-[48px] ${seccionApp === tab.id && !bloqueado ? 'text-[#23211e] font-bold bg-[#faf9f5] px-3.5 py-1.5 rounded-xl' : 'text-[#75706b]'} ${bloqueado ? 'opacity-50' : ''}`}>
              <i className={`fa-solid ${bloqueado ? 'fa-lock' : tab.icon} text-sm`}></i>
              <span className="text-[9px] font-bold lowercase font-sans">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}