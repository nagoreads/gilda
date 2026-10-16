import { useState, useEffect, useMemo, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

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
import CreaTuGilda from './components/CreaTuGilda';

import { BannerNotificaciones } from './BannerNotificaciones';

import { supabase } from './context/ClubContext.jsx';

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

  const safeSet = (key, val) => {
    try {
      localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith('gilda_cache_')) {
            localStorage.removeItem(k);
          }
        });
        try {
          localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
        } catch {}
      }
    }
  };

  const [supabaseSession, setSupabaseSession] = useState(null);
  const [emailLogin, setEmailLogin] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [tokenLogin, setTokenLogin] = useState("");
  const [esperandoToken, setEsperandoToken] = useState(false);
  const [esPaginaGracias] = useState(() => window.location.pathname === '/gracias');

  const [usuariasClub, setUsuariasClub] = useState(() => safeGetJSON('gilda_cache_usuarias_v2', []));
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

  const [miPagina, setMiPagina] = useState(0);
  const [miCiudadInput, setMiCiudadInput] = useState(() => safeGet('gilda_ciudad', ''));
  const [miCodigoPostalInput, setMiCodigoPostalInput] = useState(() => safeGet('gilda_codigo_postal', ''));
  const [isReadingNow, setIsReadingNow] = useState(() => safeGetJSON('gilda_is_reading', false));
  const [nombreUsuarioPersonalizado, setNombreUsuarioPersonalizado] = useState(() => safeGet('gilda_nombre_usuario', ''));
  const [fotoPerfilPersonalizada, setFotoPerfilPersonalizada] = useState(() => safeGet('gilda_foto_perfil', ''));

  const [modalImportarAbierto, setModalImportarAbierto] = useState(false);
  const [libroSeleccionadoDetalle, setLibroSeleccionadoDetalle] = useState(null);
  const [misCitas] = useState(() => safeGetJSON('gilda_mis_citas', []));

  const sesion = useMemo(() => {
    if (!supabaseSession) return null;
    const emailUser = supabaseSession.user.email.toLowerCase().trim();
    const socia = usuariasClub.find(u => (u.email || '').trim().toLowerCase() === emailUser);
    const nombreSocia = socia?.nombre && socia.nombre.trim() !== '' ? socia.nombre.trim() : emailUser.split('@')[0];
    return { nombre: nombreSocia, email: emailUser, modalidad: socia?.modalidad || 'gilda' };
  }, [supabaseSession, usuariasClub]);

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
    if (!sesion?.email) return { disponible: false, publicado: false, mensaje: "Inicia sesión para participar" };
    if (haPublicadoMomentoHoy) return { disponible: false, publicado: true, mensaje: "Foto de hoy publicada" };
    return { disponible: true, publicado: false, mensaje: "Publica tu foto de hoy para ver las de las demás" };
  }, [sesion, haPublicadoMomentoHoy]);

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
        supabase.from('chat_messages').select('*').order('timestamp', { ascending: true }).limit(50),
        supabase.from('proposals').select('*'),
        supabase.from('personal_readings').select('*'),
        supabase.from('calendar_events').select('*'),
        supabase.from('wall_posts').select('*').order('timestamp', { ascending: false }).limit(40),
        supabase.from('cafes').select('*')
      ]);

      if (profiles) {
        setUsuariasClub(profiles); safeSet('gilda_cache_usuarias_v2', profiles);
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
      if (chatMessages) {
        const msgsUnicos = Array.from(new Map(chatMessages.map(m => [m.id || (m.timestamp + m.usuario + m.mensaje), m])).values());
        setChatMsgs(msgsUnicos); safeSet("gilda_cache_chat", msgsUnicos);
      }
      if (proposals) { setPropuestas(proposals); safeSet('gilda_cache_propuestas', proposals); }
      if (personalReadings) { setLecturasPersonales(personalReadings); safeSet('gilda_cache_personales', personalReadings); }
      if (calendarEvents) { setEventosCalendario(calendarEvents); safeSet('gilda_cache_calendario', calendarEvents); }
      if (wallPosts) { setMuroActividad(wallPosts); safeSet('gilda_cache_muro', wallPosts); }
      if (cafes) { setCafecitos(cafes); safeSet('gilda_cache_cafecitos', cafes); }
    } catch (err) { console.error('Error sincronizando Supabase:', err); }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSupabaseSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSupabaseSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    cargarDatosSupabase();

    const canalRealtime = supabase
      .channel("realtime-gilda")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          if (payload.new) {
            setChatMsgs((prev) => {
              if (prev.some((m) => m.id === payload.new.id)) return prev;
              const actualizados = [...prev, payload.new];
              safeSet("gilda_cache_chat", actualizados);
              return actualizados;
            });
          }
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

  const guardarLibroPersonal = (tituloOpt, pagOpt, estadoOpt = "leyendo", autoraOpt = "", portadaOpt = "") => {
    const tituloLibro = String(tituloOpt || "").trim();
    if (!tituloLibro || !sesion?.email) return;
    const pagFinal = Number(pagOpt) || 0;

    const existente = lecturasPersonales.find(l => (l.email || "").toLowerCase() === sesion.email.toLowerCase() && (l.libro || "").toLowerCase() === tituloLibro.toLowerCase());

    if (existente) {
      const itemActualizado = { ...existente, pagina: pagFinal, paginas: pagFinal, estado: estadoOpt, autora: autoraOpt || existente.autora, portada: portadaOpt || existente.portada };
      const nuevas = lecturasPersonales.map(l => l.id === existente.id ? itemActualizado : l);
      setLecturasPersonales(nuevas); safeSet("gilda_cache_personales", nuevas);
      mostrarToast(`Guardado: ${tituloLibro}`);

      supabase.from("personal_readings").update({ pagina: pagFinal, paginas: pagFinal, estado: estadoOpt, autora: autoraOpt || existente.autora, portada: portadaOpt || existente.portada }).eq("id", existente.id).then(({ error }) => {
        if (error) console.error("Error actualizando libro en Supabase:", error);
      });
    } else {
      const tempId = "temp_" + Date.now();
      const nuevoItem = { id: tempId, email: sesion.email, nombre: nombreUsuarioPersonalizado || sesion.nombre, libro: tituloLibro, pagina: pagFinal, paginas: pagFinal, estado: estadoOpt, autora: autoraOpt, portada: portadaOpt };
      const nuevas = [...lecturasPersonales, nuevoItem];
      setLecturasPersonales(nuevas); safeSet("gilda_cache_personales", nuevas);
      mostrarToast(`Guardado: ${tituloLibro}`);

      supabase.from("personal_readings").insert([{ email: sesion.email, nombre: nombreUsuarioPersonalizado || sesion.nombre, libro: tituloLibro, pagina: pagFinal, paginas: pagFinal, estado: estadoOpt, autora: autoraOpt, portada: portadaOpt }]).select().then(({ data, error }) => {
        if (error) {
          console.error("Error creando libro en Supabase:", error);
        } else if (data && data[0]) {
          setLecturasPersonales(prev => prev.map(item => item.id === tempId ? data[0] : item));
        }
      });
    }
  };

  const libroActual = useMemo(() => lecturas[0] || { tituloEl log de Vercel marca el error exacto:

> `Could not resolve "./components/SuscribirPush" from "src/App.jsx"`

En la parte superior de tu archivo `src/App.jsx` había una línea importando `SuscribirPush`:
```javascript
import SuscribirPush from './components/SuscribirPush';