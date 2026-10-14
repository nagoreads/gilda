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
import ModalMomentoGilda from './components/ModalMomentoGilda';
import { ModalUpgrade, ModalImportarPin, ModalDetalleLibro } from './components/ModalesAuxiliares';
import SeccionComunidad from './components/SeccionComunidad';
import SeccionHabitacion from './components/SeccionHabitacion';
import SeccionAdmin from './components/SeccionAdmin';
import SuscribirPush from './components/SuscribirPush';
import CreaTuGilda from './components/CreaTuGilda';

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
  const [tokenLogin, setTokenLogin] = useState("");
  const [esperandoToken, setEsperandoToken] = useState(false);
  const [esPaginaGracias] = useState(() => window.location.pathname === '/gracias');

  const [usuariasClub, setUsuariasClub] = useState(() => safeGetJSON('gilda_cache_usuarias', []));
  const [vistaAcceso, setVistaAcceso] = useState('crea-tu-gilda');

  const [seccionApp, setSeccionApp] = useState('inicio');
  const [subTabInicio, setSubTabInicio] = useState('progreso');
  const [subTabComunidad, setSubTabComunidad] = useState('chat');
  const [chatModo, setChatModo] = useState('global');
  const [destinatarioPrivado, setDestinatarioPrivado] = useState(null);

  const [tabEstanteria, setTabEstanteria] = useState('leyendo');
  const [toastMsg, setToastMsg] = useState(null);
  const [mostrarModalUpgrade, setMostrarModalUpgrade] = useState(false);
  const [mostrarModalShare, setMostrarModalShare] = useState(false);
  const [mostrarModalMomento, setMostrarModalMomento] = useState(false);

  const [capitulos, setCapitulos] = useState(() => safeGetJSON('gilda_cache_capitulos', []));
  const [comentarios, setComentarios] = useState(() => safeGetJSON('gilda_cache_comentarios', []));
  const [lecturas, setLecturas] = useState(() => safeGetJSON('gilda_cache_lecturas', []));
  const [chatMsgs, setChatMsgs] = useState(() => safeGetJSON('gilda_cache_chat', []));
  const [propuestas, setPropuestas] = useState(() => safeGetJSON('gilda_cache_propuestas', []));
  const [lecturasPersonales, setLecturasPersonales] = useState(() => safeGetJSON('gilda_cache_personales', []));
  const [eventosCalendario, setEventosCalendario] = useState(() => safeGetJSON('gilda_cache_calendario', []));
  const [muroActividad, setMuroActividad] = useState(() => safeGetJSON('gilda_cache_muro', []));
  const [cafecitos, setCafecitos] = useState(() => safeGetJSON('gilda_cache_cafecitos', []));
  const [alertaMomento, setAlertaMomento] = useState(null);

  const [miPagina, setMiPagina] = useState(0);
  const [miCiudadInput, setMiCiudadInput] = useState(() => safeGet('gilda_ciudad', ''));
  const [miCodigoPostalInput, setMiCodigoPostalInput] = useState(() => safeGet('gilda_codigo_postal', ''));
  const [isReadingNow, setIsReadingNow] = useState(() => safeGetJSON('gilda_is_reading', false));
  const [nombreUsuarioPersonalizado, setNombreUsuarioPersonalizado] = useState(() => safeGet('gilda_nombre_usuario', ''));
  const [fotoPerfilPersonalizada, setFotoPerfilPersonalizada] = useState(() => safeGet('gilda_foto_perfil', ''));

  const [modalImportarAbierto, setModalImportarAbierto] = useState(false);
  const [libroSeleccionadoDetalle, setLibroSeleccionadoDetalle] = useState(null);
  const [misCitas] = useState(() => safeGetJSON('gilda_mis_citas', []));

  const modalidades = [
    { id: 'cotilla', nombre: 'gilda cotilla', precio: 'Gratis', esGratis: true, enlaceStripe: '', descripcion: 'asómate, lee los comentarios de las demás y forma parte de la comunidad de forma libre y gratuita.' },
    { id: 'satelite', nombre: 'gilda satélite', precio: '1 €/mes', esGratis: false, enlaceStripe: 'https://buy.stripe.com/cNi4gtfqV8cxeju0WV6Ri01', descripcion: 'forma parte de la comunidad y lee a tu ritmo mientras vas comentando y leyendo a las demás. para que te hagas una idea, es como una lectura conjunta, pero a través de una app diseñada específicamente para eso.' },
    { id: 'cafe', nombre: 'gilda de café', precio: '5 €/mes', esGratis: false, enlaceStripe: 'https://buy.stripe.com/3cI5kx0w1gJ3fny4976Ri02', descripcion: 'forma parte de la comunidad al completo, chat y cafecitos virtuales.' },
    { id: 'nube', nombre: 'gilda de nube', precio: '5 €/mes', esGratis: false, enlaceStripe: 'https://buy.stripe.com/cNi5kx92xcsNb7i3536Ri03', descripcion: 'recibe por correo electrónico la carta sorpresa de gilda, con distintas actividades creativas, pasatiempos, pegatinas, anti - guía de lectura de autora, marcapáginas, plantillas para stories... y muchas sorpresas más.' },
    { id: 'papel', nombre: 'gilda de papel', precio: '10 €/mes', esGratis: false, enlaceStripe: 'https://buy.stripe.com/bJe8wJ7Yt50l1wIbBz6Ri04', descripcion: 'recibe por correo postal (sí, llega hasta el buzón de tu casa porque solo soy una chica que adora escribir cartas a mano) la carta sorpresa de gilda, con distintas actividades creativas, pasatiempos, pegatinas, anti - guía de lectura de autora (esto lo recibirás a través de un qr monísimo porque algunas guías son demasiado largas como para meterlas en un sobre), marcapáginas, y muchas sorpresas más.' },
    { id: 'virtual', nombre: 'gilda virtual', precio: '8 €/mes', esGratis: false, enlaceStripe: 'https://buy.stripe.com/bJe9ANguZ9gB6R27lj6Ri05', descripcion: 'recibe todo el contenido digital en tu correo electrónico más acceso total a la app.' },
    { id: 'absoluta', nombre: 'gilda absoluta', precio: '12 €/mes', esGratis: false, enlaceStripe: 'https://buy.stripe.com/14A5kxemReAV2AMcFD6Ri08', descripcion: 'la experiencia completa: recibe todo el contenido en papel en tu buzón de casa y acceso total a la app, al chat y a los cafecitos del club.' }
  ];

  const sesion = useMemo(() => {
    if (!supabaseSession) return null;
    const emailUser = supabaseSession.user.email.toLowerCase().trim();
    const socia = usuariasClub.find(u => (u.email || '').trim().toLowerCase() === emailUser);
    const nombreSocia = socia?.nombre && socia.nombre.trim() !== '' ? socia.nombre.trim() : emailUser.split('@')[0];
    return { nombre: nombreSocia, email: emailUser, modalidad: socia?.modalidad || 'gilda' };
  }, [supabaseSession, usuariasClub]);

  // Comprobación directa de publicación de hoy (Mecánica BeReal)
  const haPublicadoMomentoHoy = useMemo(() => {
    if (!sesion?.email) return false;
    const hoyStr = new Date().toISOString().split('T')[0];
    return muroActividad.some(item => {
      if (item.tipo !== 'momento_gilda') return false;
      const esMismoEmail = (item.email || '').toLowerCase().trim() === sesion.email.toLowerCase();
      if (!item.timestamp) return false;
      const fechaFotoStr = new Date(item.timestamp).toISOString().split('T')[0];
      return esMismoEmail && fechaFotoStr === hoyStr;
    });
  }, [muroActividad, sesion]);

  const estadoBeReal = useMemo(() => {
    if (!sesion?.email) {
      return { disponible: false, publicado: false, mensaje: "Inicia sesión para participar" };
    }

    if (haPublicadoMomentoHoy) {
      return { disponible: false, publicado: true, mensaje: "Foto de hoy publicada" };
    }

    return { 
      disponible: true, 
      publicado: false, 
      mensaje: "Publica tu foto de hoy para ver las de las demás" 
    };
  }, [sesion, haPublicadoMomentoHoy]);

  const mostrarToast = (texto) => { setToastMsg(texto); setTimeout(() => setToastMsg(null), 3000); };

  const cargarDatosSupabase = async () => {
    try {
      const [
        { data: profiles }, { data: chapters }, { data: comments },
        { data: clubReadings }, { data: chatMessages }, { data: proposals },
        { data: personalReadings }, { data: calendarEvents }, { data: wallPosts }, { data: cafes },
        { data: configMomento }
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
        supabase.from('cafes').select('*'),
        supabase.from('momento_gilda_config').select('*').limit(1)
      ]);

      if (configMomento && configMomento.length > 0) {
        const conf = configMomento[0];
        setAlertaMomento(conf.ultima_alerta || conf.created_at || conf.fecha || null);
      }

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

  // Carga inicial + Suscripción en tiempo real (Realtime) para actualizar chat e interacción en directo
  useEffect(() => {
    cargarDatosSupabase();

    const canalRealtime = supabase
      .channel('realtime-gilda')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        () => {
          cargarDatosSupabase();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalRealtime);
    };
  }, [sesion?.email]);

  const registrarActividadPresencia = async () => {
    if (!sesion?.email) return;
    const ahoraIso = new Date().toISOString();
    await supabase.from('profiles').update({ ultima_conexion: ahoraIso }).eq('email', sesion.email);
  };

  const obtenerUbicacionActual = () => {
    if (!navigator.geolocation) { mostrarToast('Geolocalización no soportada'); return; }
    mostrarToast('Buscando ubicación...');
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
        const data = await res.json();
        const ciudad = data.address?.city || data.address?.town || data.address?.village || '';
        const cp = data.address?.postcode || '';
        if (ciudad) setMiCiudadInput(ciudad);
        if (cp) setMiCodigoPostalInput(cp);
        mostrarToast('Ubicación guardada');
      } catch { mostrarToast('No se pudo encontrar la ciudad'); }
    });
  };

  const handleMagicLinkLogin = async (e) => {
    e.preventDefault();
    if (!esperandoToken) {
      setLoadingAuth(true);
      const { error } = await supabase.auth.signInWithOtp({ email: emailLogin.trim().toLowerCase() });
      if (error) {
        alert("Error: " + error.message);
      } else {
        setEsperandoToken(true);
      }
      setLoadingAuth(false);
    } else {
      setLoadingAuth(true);
      const { data, error } = await supabase.auth.verifyOtp({
        email: emailLogin.trim().toLowerCase(),
        token: tokenLogin.trim(),
        type: "email"
      });
      if (error) alert("Código incorrecto o caducado.");
      setLoadingAuth(false);
    }
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
    return sesion?.nombre || (emailComentario ? emailComentario.split('@')[0] : 'gilda');
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
      ? <img src={foto} alt={nombre || 'Gilda'} onError={() => setErrorImg(true)} className={`${sizeClass} rounded-full object-cover border border-[#e8e4d9] shrink-0 interactive-lift`} />
      : <div className={`${sizeClass} rounded-full bg-[#ffffee] border border-[#e8e4d9] flex items-center justify-center font-babydoll ${textClass} text-[#23211e] shrink-0 font-bold interactive-lift`}>{(nombre || 'G').charAt(0).toUpperCase()}</div>;

    if (editable) {
      return (
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()} title="Cambiar foto de perfil">
          {content}
          <div className="absolute inset-0 rounded-full bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <i className="fa-solid fa-camera text-white text-xs"></i>
          </div>
          <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="hidden" />
        </div>
      );
    }
    return content;
  };

  const IndicadorPresencia = ({ timestamp }) => {
    if (!timestamp) return <span className="w-2 h-2 rounded-full bg-[#e8e4d9] inline-block shrink-0"></span>;
    const diff = (new Date() - new Date(timestamp)) / 1000 / 60;
    if (isNaN(diff) || diff >= 15) return <span className="w-2 h-2 rounded-full bg-[#e8e4d9] inline-block shrink-0"></span>;
    return <span className={`w-2 h-2 rounded-full ${diff < 3 ? 'bg-[#23211e] animate-pulse' : 'bg-[#75706b]'} inline-block shrink-0`}></span>;
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
    mostrarToast('Foto actualizada');
  };

  const publicarCitaEnMuro = async (texto, libroCita) => {
    if (!texto.trim() || !sesion?.email) return;
    const publicacion = { tipo: 'cita', cita: texto.trim(), email: sesion.email, nombre: nombreUsuarioPersonalizado || sesion.nombre, libro: libroCita?.titulo || '', portada: libroCita?.portada || '', estrellas: 5, timestamp: new Date().toISOString() };
    await supabase.from('wall_posts').insert([publicacion]);
    setMuroActividad(prev => [publicacion, ...prev]);
    mostrarToast('Cita publicada en el Muro');
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
      const nombreRealU = u.nombre ? u.nombre.trim() : (u.email ? u.email.split('@')[0] : 'gilda');
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

  const momentosGilda = useMemo(() => muroActividad.filter(item => item.tipo === 'momento_gilda'), [muroActividad]);
  const publicacionesMuro = useMemo(() => muroActividad.filter(item => item.tipo !== 'momento_gilda'), [muroActividad]);

  if (esPaginaGracias) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 w-full py-12 bg-[#ffffee]">
        <div className="editorial-card max-w-md w-full p-8 text-center space-y-6 border border-[#e8e4d9] modal-elastic">
          <h1 className="font-babydoll text-6xl text-[#23211e] font-bold">gracias</h1>
          <p className="text-xs text-[#75706b] font-sans">Tu espacio ya está listo para empezar.</p>
          <a href="/" className="block w-full editorial-btn py-3 text-xs font-medium text-center">Ir al club</a>
        </div>
      </div>
    );
  }

  if (!supabaseSession) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 w-full py-12 bg-[#ffffee] page-transition">
        {vistaAcceso === 'crea-tu-gilda' ? (
          <div className="w-full max-w-md">
            <div className="text-center mb-4">
              <h1 className="font-babydoll text-6xl text-[#23211e] font-bold">gilda</h1>
              <p className="text-xs text-[#75706b] font-sans">club de lectura, mailclub y comunidad</p>
            </div>
            <div className="editorial-card p-4 border border-[#e8e4d9] modal-elastic">
              <CreaTuGilda
                enEntrarGratis={() => setVistaAcceso('menu')}
                enIrALogin={() => setVistaAcceso('menu')}
              />
            </div>
          </div>
        ) : (
          <div className="editorial-card max-w-md w-full p-8 space-y-6 text-center border border-[#e8e4d9] modal-elastic">
            <h1 className="font-babydoll text-6xl text-[#23211e] font-bold">gilda</h1>
            <p className="text-xs text-[#75706b] font-sans">club de lectura, mailclub y comunidad</p>

            {vistaAcceso === 'menu' && (
              <form onSubmit={handleMagicLinkLogin} className="space-y-4 font-sans text-left pt-2">
                <label className="block text-xs font-medium text-[#23211e]">Correo electrónico</label>
                <input type="email" placeholder="tuemail@ejemplo.com" value={emailLogin} onChange={e => setEmailLogin(e.target.value)} disabled={esperandoToken} required className="w-full editorial-input px-3.5 py-2.5 text-xs disabled:opacity-50" />
                
                {esperandoToken && (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-medium text-[#23211e] mt-3 mb-1">Código de 6 dígitos recibido</label>
                    <input type="text" placeholder="123456" value={tokenLogin} onChange={e => setTokenLogin(e.target.value)} required className="w-full editorial-input px-3.5 py-2.5 text-xs text-center tracking-[0.5em] font-bold" maxLength={6} />
                  </div>
                )}

                <button type="submit" disabled={loadingAuth} className="w-full editorial-btn py-3 text-xs font-medium">
                  {loadingAuth ? "procesando..." : (esperandoToken ? "entrar al club" : "enviadme la llave por correo")}
                </button>
                
                {!esperandoToken && (
                  <div className="space-y-2 pt-2">
                    <button type="button" onClick={() => setVistaAcceso("crea-tu-gilda")} className="w-full bg-[#23211e] text-white rounded-xl py-3 text-xs font-medium hover:bg-[#383531] transition-colors">crear una gilda propia</button>
                    <button type="button" onClick={() => setVistaAcceso("modalidades")} className="w-full bg-white text-[#23211e] border border-[#e8e4d9] rounded-xl py-3 text-xs font-medium hover:bg-[#ffffee] transition-colors">Ver todas las membresías</button>
                  </div>
                )}
              </form>
            )}

            {vistaAcceso === 'modalidades' && (
              <div className="space-y-4 text-left page-transition">
                <button onClick={() => setVistaAcceso('crea-tu-gilda')} className="text-xs font-medium text-[#75706b] flex items-center">← Volver al test</button>
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {modalidades.map(m => (
                    <div key={m.id} className="editorial-card p-4 space-y-2 bg-white border border-[#e8e4d9]">
                      <div className="flex justify-between items-center"><h3 className="font-babydoll font-bold text-lg">{m.nombre}</h3><span className="text-xs font-medium bg-[#23211e] text-[#ffffee] px-2.5 py-1 rounded-full">{m.precio}</span></div>
                      <p className="text-xs text-[#75706b] font-sans">{m.descripcion}</p>
                      <a href={m.esGratis ? '#' : m.enlaceStripe} onClick={e => { if (m.esGratis) setVistaAcceso('menu'); }} className="block w-full mt-2 py-2 text-center text-xs editorial-btn font-medium">{m.esGratis ? 'Probar gratis' : 'Elegir esta modalidad'}</a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center pt-6 pb-28 px-4 sm:px-6 max-w-lg w-full mx-auto relative bg-[#ffffee]">
      <SuscribirPush sesion={sesion} supabase={supabase} />

      {toastMsg && <div className="fixed top-6 z-50 bg-[#23211e] text-[#ffffee] text-xs px-4 py-2 rounded-full shadow-md font-sans modal-elastic">{toastMsg}</div>}

      {modalImportarAbierto && (
        <ModalImportarPin onClose={() => setModalImportarAbierto(false)} onSave={() => setModalImportarAbierto(false)} />
      )}

      {mostrarModalUpgrade && <ModalUpgrade onClose={() => setMostrarModalUpgrade(false)} />}

      {mostrarModalShare && (
        <ModalCompartirStory onClose={() => setMostrarModalShare(false)} usuario={nombreUsuarioPersonalizado || sesion.nombre} libro={libroActual} pagina={miPagina} citas={misCitas} decoracion="ninguna" misLibros={lecturasPersonales.filter(l => (l.email || '').toLowerCase() === sesion.email.toLowerCase())} onPublicarCita={publicarCitaEnMuro} sesion={sesion} />
      )}

      {mostrarModalMomento && (
        <ModalMomentoGilda onClose={() => setMostrarModalMomento(false)} sesion={sesion} supabase={supabase} cargarDatosSupabase={cargarDatosSupabase} mostrarToast={mostrarToast} />
      )}

      {libroSeleccionadoDetalle && (
        <ModalDetalleLibro libro={libroSeleccionadoDetalle} onClose={() => setLibroSeleccionadoDetalle(null)} sesion={sesion} supabase={supabase} cargarDatosSupabase={cargarDatosSupabase} registrarActividadPresencia={registrarActividadPresencia} mostrarToast={mostrarToast} nombreUsuarioPersonalizado={nombreUsuarioPersonalizado} />
      )}

      {/* Encabezado */}
      <header className="w-full mb-5 flex justify-between items-center bg-white p-3.5 rounded-2xl border border-[#e8e4d9] interactive-lift">
        <div className="flex items-center gap-3 overflow-hidden">
          <AvatarUsuaria foto={fotoPerfilPersonalizada} nombre={nombreUsuarioPersonalizado || sesion.nombre} sizeClass="w-9 h-9" textClass="text-base" editable={true} onFotoChange={handleFotoPerfilUpdate} />
          <div className="overflow-hidden">
            <h2 className="font-babydoll font-bold text-lg leading-none truncate text-[#23211e]">{nombreUsuarioPersonalizado || sesion.nombre}</h2>
            <span className="text-[11px] text-[#75706b] font-sans">{sesion.modalidad}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {esAdministradora && (
            <button onClick={() => setSeccionApp('admin')} className={`p-2 rounded-xl border transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center ${seccionApp === 'admin' ? 'bg-[#23211e] text-[#ffffee]' : 'bg-white text-[#23211e] border-[#e8e4d9]'}`}>
              <i className="fa-solid fa-screwdriver-wrench text-xs"></i>
            </button>
          )}
          <button onClick={() => supabase.auth.signOut()} className="text-[#75706b] hover:text-[#23211e] p-2 min-h-[40px] min-w-[40px] flex items-center justify-center"><i className="fa-solid fa-arrow-right-from-bracket text-xs"></i></button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="w-full flex-grow space-y-4">
        {/* INICIO */}
        <div style={{ display: seccionApp === 'inicio' ? 'block' : 'none' }} className="space-y-4 page-transition">
          
          {/* Sub-Pestañas Niveladas */}
          <div className="flex bg-white p-1 rounded-xl text-xs font-medium border border-[#e8e4d9] font-sans mb-3 gap-1">
            <button
              onClick={() => setSubTabInicio('progreso')}
              className={`flex-1 py-1.5 rounded-lg transition-all min-h-[40px] ${subTabInicio === 'progreso' ? 'bg-[#23211e] text-[#ffffee]' : 'text-[#75706b]'}`}
            >
              Lecturas
            </button>
            <button
              onClick={() => setSubTabInicio('aqui_ahora')}
              className={`flex-1 py-1.5 rounded-lg transition-all min-h-[40px] relative ${subTabInicio === 'aqui_ahora' ? 'bg-[#23211e] text-[#ffffee]' : 'text-[#75706b]'}`}
            >
              aquí y ahora ✦
              {!haPublicadoMomentoHoy && (
                <span className="absolute top-1.5 right-2 w-1.5 h-1.5 bg-[#23211e] rounded-full animate-pulse"></span>
              )}
            </button>
            <button
              onClick={() => {
                if (esRestringida) setMostrarModalUpgrade(true);
                else setSubTabInicio('muro');
              }}
              className={`flex-1 py-1.5 rounded-lg transition-all min-h-[40px] ${subTabInicio === 'muro' ? 'bg-[#23211e] text-[#ffffee]' : 'text-[#75706b]'} ${esRestringida ? 'opacity-60' : ''}`}
            >
              Muro {esRestringida && '✦'}
            </button>
          </div>

          {/* SUBTAB 1: LECTURAS */}
          {subTabInicio === 'progreso' && (
            <>
              <div className="editorial-card p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-[#e8e4d9] pb-2">
                   <h3 className="font-babydoll text-xl font-bold">Progreso</h3>
                   <button onClick={() => setMostrarModalShare(true)} className="text-xs font-medium font-sans text-[#23211e] bg-white border border-[#e8e4d9] px-3 py-1 rounded-lg hover:bg-[#ffffee] transition-colors">
                     Compartir
                   </button>
                </div>
                <div className="flex gap-4 items-center">
                  <PortadaLibro titulo={libroActual.titulo} autora={libroActual.autora} portada={libroActual.portada} size="large" />
                  <div className="space-y-1.5 w-full">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-[#75706b] font-sans">Leyendo juntas</span>
                    <h2 className="font-babydoll text-2xl font-bold leading-tight text-[#23211e]">{libroActual.titulo}</h2>
                    <p className="text-xs text-[#75706b] italic font-sans">{libroActual.autora}</p>
                    <div className="pt-1">
                      <div className="flex justify-between text-xs text-[#75706b] mb-1 font-sans"><span>Avance</span><span>{porcentajeLibro}%</span></div>
                      <div className="w-full bg-[#ffffee] rounded-full h-1.5 border border-[#e8e4d9]"><div className="bg-[#23211e] h-full rounded-full transition-all duration-300" style={{width: `${porcentajeLibro}%`}}></div></div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#e8e4d9] flex items-center justify-between">
                  <span className="text-xs text-[#75706b] font-sans">Página actual:</span>
                  <input type="number" value={miPagina} onChange={e => setMiPagina(Number(e.target.value))} onBlur={async () => {
                    await supabase.from('profiles').update({ pagina: miPagina }).eq('email', sesion.email);
                    mostrarToast('Progreso guardado');
                  }} className="editorial-input w-20 text-center py-1 text-xs font-medium" />
                </div>
              </div>

              <div className="editorial-card p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-babydoll text-xl font-bold">Ubicación</h3>
                  <button type="button" onClick={obtenerUbicacionActual} className="text-xs font-medium font-sans bg-white border border-[#e8e4d9] text-[#23211e] px-2.5 py-1 rounded-lg hover:bg-[#ffffee] transition-colors">Detectar</button>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <input type="text" placeholder="Ciudad..." value={miCiudadInput} onChange={e => setMiCiudadInput(e.target.value)} className="editorial-input p-2.5 text-xs" />
                  <input type="text" placeholder="C. Postal..." value={miCodigoPostalInput} onChange={e => setMiCodigoPostalInput(e.target.value)} className="editorial-input p-2.5 text-xs" />
                </div>
                <button onClick={async () => {
                  safeSet('gilda_ciudad', miCiudadInput); safeSet('gilda_codigo_postal', miCodigoPostalInput);
                  await supabase.from('profiles').update({ ciudad: miCiudadInput, codigo_postal: miCodigoPostalInput }).eq('email', sesion.email);
                  mostrarToast('Ubicación guardada');
                }} className="w-full editorial-btn py-2 text-xs font-medium">Guardar ubicación</button>
              </div>

              <div className="editorial-card p-5 space-y-4">
                <h3 className="font-babydoll text-xl font-bold">Calendario</h3>
                <CalendarioInteractivo eventos={eventosCalendario} />
              </div>

              <div className="editorial-card p-4 space-y-3">
                <MapaGilda usuarias={usuariasClub} normalizarUbicacion={normalizarUbicacion} geocodificarUbicacion={geocodificarUbicacion} formatearPais={formatearPais} />
              </div>
            </>
          )}

          {/* SUBTAB 2: AQUÍ Y AHORA ✦ */}
          {subTabInicio === 'aqui_ahora' && (
            <div className="editorial-card p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-[#e8e4d9] pb-3">
                <div>
                  <h3 className="font-babydoll text-2xl font-bold text-[#23211e]">aquí y ahora ✦</h3>
                  <p className="text-[11px] text-[#75706b] font-sans">Instantáneas diarias de la comunidad</p>
                </div>
                {estadoBeReal.publicado ? (
                  <span className="text-[11px] font-sans font-medium text-[#23211e] bg-[#e8e4d9]/60 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold">
                    ✦ Foto de hoy publicada
                  </span>
                ) : (
                  <button onClick={() => setMostrarModalMomento(true)} className="editorial-btn px-3.5 py-1.5 text-xs font-medium animate-pulse flex items-center gap-1.5 active:scale-95 transition-transform duration-100">
                    <i className="fa-solid fa-camera"></i> publicar foto
                  </button>
                )}
              </div>

              {!haPublicadoMomentoHoy && (
                <div 
                  onClick={() => setMostrarModalMomento(true)}
                  className="p-4 bg-[#23211e] text-[#ffffee] rounded-2xl flex justify-between items-center modal-elastic cursor-pointer hover:bg-[#383531] transition-all active:scale-[0.98] duration-100 shadow-md border border-[#23211e]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#ffffee] text-[#23211e] flex items-center justify-center shrink-0 shadow-sm font-bold text-lg">
                      ✦
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-babydoll font-bold text-base leading-tight">¡Sube tu instantánea de hoy!</p>
                      <p className="text-[11px] opacity-85 font-sans leading-tight">Comparte tu lectura para desbloquear la comunidad</p>
                    </div>
                  </div>
                  <i className="fa-solid fa-chevron-right text-xs opacity-70"></i>
                </div>
              )}

              {momentosGilda.length === 0 ? (
                <p className="text-xs text-[#75706b] italic font-sans py-8 text-center">Aún no hay instantáneas subidas hoy. ¡Sé la primera!</p>
              ) : (
                <div className="space-y-4">
                  {momentosGilda.map((item, idx) => {
                    const esMio = sesion?.email && (item.email || '').toLowerCase().trim() === sesion.email.toLowerCase();
                    const estaBloqueado = !esMio && !haPublicadoMomentoHoy;

                    return (
                      <div key={idx} className="bg-white p-3.5 rounded-xl border border-[#e8e4d9] space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium font-sans text-xs text-[#23211e]">{item.nombre || 'gilda'}</span>
                          <span className="text-[10px] font-babydoll font-bold text-[#75706b]">aquí y ahora ✦</span>
                        </div>

                        <div className="relative rounded-xl overflow-hidden border border-[#e8e4d9] aspect-[4/5] bg-[#ffffee] max-h-80">
                          <img
                            src={item.portada}
                            alt="aquí y ahora"
                            className={`w-full h-full object-cover transition-all duration-300 ${
                              estaBloqueado ? 'blur-xl scale-105 select-none' : ''
                            }`}
                          />

                          {estaBloqueado && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center space-y-3">
                              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white text-xl shadow-lg animate-pulse font-bold">
                                ✦
                              </div>
                              <div className="space-y-1">
                                <p className="font-babydoll text-lg text-[#ffffee] font-bold">Instante reservado ✦</p>
                                <p className="text-[11px] text-white/85 font-sans max-w-[210px] leading-relaxed mx-auto">
                                  Comparte tu instantánea de hoy para ver qué está leyendo {item.nombre || 'esta gilda'}.
                                </p>
                              </div>
                              <button
                                onClick={() => setMostrarModalMomento(true)}
                                className="mt-1 bg-white text-[#23211e] px-4 py-2 rounded-xl text-xs font-bold font-sans shadow-lg hover:bg-[#ffffee] active:scale-95 transition-all duration-100 flex items-center gap-1.5"
                              >
                                <span>Desbloquear instante</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SUBTAB 3: EL MURO */}
          {subTabInicio === 'muro' && (
            <div className="editorial-card p-5 space-y-3">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-babydoll text-2xl font-bold text-[#23211e]">El muro del club</h3>
              </div>
              {publicacionesMuro.length === 0 ? (
                <p className="text-xs text-[#75706b] italic font-sans py-4 text-center">Aún no hay publicaciones en el muro.</p>
              ) : (
                publicacionesMuro.map((item, idx) => (
                  <div key={idx} className="bg-white p-3.5 rounded-xl border border-[#e8e4d9] flex gap-3 items-center interactive-lift">
                    <PortadaLibro titulo={item.libro} portada={item.portada} size="thumb" />
                    <div className="flex flex-col space-y-1 w-full">
                      <span className="font-medium font-sans text-xs text-[#23211e]">{item.nombre || 'gilda'}</span>
                      {item.cita ? (
                        <blockquote className="border-l border-[#23211e] pl-2 font-babydoll text-base text-[#23211e]">“{item.cita}”</blockquote>
                      ) : (
                        <p className="text-xs font-sans text-[#75706b]">Ha leído <b>{item.libro}</b></p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

        {/* EDIFICIO / CASA */}
        <div style={{ display: seccionApp === 'edificio' ? 'block' : 'none' }} className="page-transition">
          <EdificioClub AvatarUsuaria={AvatarUsuaria} usuarias={miembrosEdificio} libroActual={libroActual} sesionEmail={sesion?.email} chatBloqueado={esRestringida} onAddWantToRead={(t, a, p) => guardarLibroPersonal(t, 0, 'want_to_read', a, p)} onAbrirPrivado={(socia) => {
            if (esRestringida) { setMostrarModalUpgrade(true); return; }
            setSeccionApp('comunidad');
            setSubTabComunidad('chat');
            setChatModo('privado');
            setDestinatarioPrivado(socia);
          }} />
        </div>

        {/* HABITACIÓN */}
        <div style={{ display: seccionApp === 'habitacion' ? 'block' : 'none' }} className="page-transition">
          <SeccionHabitacion
            sesion={sesion}
            miPagina={miPagina}
            libroActual={libroActual}
            porcentajeLibro={porcentajeLibro}
            todosMisLibrosEstanteria={todosMisLibrosEstanteria}
            librosBibliotecaVisibles={librosBibliotecaVisibles}
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
            registrarActividadPresencia={registrarActividadPresencia}
            safeSet={safeSet}
            AvatarUsuaria={AvatarUsuaria}
          />
        </div>

        {/* CAPÍTULOS / TIMELINE */}
        <div style={{ display: seccionApp === 'capitulos' ? 'block' : 'none' }} className="page-transition">
          <TimelineCapitulos capitulos={capitulos} miPagina={miPagina} comentarios={comentarios} modalidadLimpia={modalidadLimpia} obtenerNombreReal={obtenerNombreReal} sesion={sesion} nombreUsuarioPersonalizado={nombreUsuarioPersonalizado} supabase={supabase} cargarDatosSupabase={cargarDatosSupabase} registrarActividadPresencia={registrarActividadPresencia} mostrarToast={mostrarToast} />
        </div>

        {/* COMUNIDAD */}
        <div style={{ display: seccionApp === 'comunidad' ? 'block' : 'none' }} className="page-transition">
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
        <div style={{ display: seccionApp === 'admin' && esAdministradora ? 'block' : 'none' }} className="page-transition">
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

      {/* Navegación Inferior Flotante */}
      <nav className="editorial-nav fixed bottom-0 left-0 right-0 py-3 px-4 pb-safe flex justify-around items-center max-w-lg mx-auto z-40 rounded-t-3xl bg-[#ffffee]/90 backdrop-blur-md border-t border-[#e8e4d9] shadow-lg">
        {[
          { id: 'inicio', label: 'inicio' },
          { id: 'edificio', label: 'casa' },
          { id: 'habitacion', label: 'habitación' },
          { id: 'capitulos', label: 'capítulos' },
          { id: 'comunidad', label: 'comunidad' }
        ].map(tab => {
          const bloqueado = esRestringida && tab.id === 'comunidad';
          return (
            <button
              key={tab.id}
              onClick={() => { if (bloqueado) setMostrarModalUpgrade(true); else setSeccionApp(tab.id); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium font-sans transition-all capitalize min-h-[40px] ${
                seccionApp === tab.id && !bloqueado
                  ? 'bg-[#23211e] text-[#ffffee]'
                  : 'text-[#75706b] hover:text-[#23211e]'
              } ${bloqueado ? 'opacity-40' : ''}`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}