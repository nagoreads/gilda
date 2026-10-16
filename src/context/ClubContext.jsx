import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://lsbdcmshswcqzitqwfiq.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzYmRjbXNoc3djcXppdHF3ZmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwMjA2MzUsImV4cCI6MjEwNjU5NjYzNX0.n9KPVdYVDQ_l3WtFCO0RVOMdAI_OLKYNLhHdg34EKK0";

export const supabase = createClient(supabaseUrl, supabaseKey);

export const EMAIL_ADMINISTRADORA = 'ndnagore@gmail.com';

const ClubContext = createContext(null);

export const safeGet = (key, fallback) => {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? val : fallback;
  } catch {
    return fallback;
  }
};

export const safeGetJSON = (key, fallback) => {
  try {
    const val = localStorage.getItem(key);
    if (val === null) return fallback;
    const parsed = JSON.parse(val);
    return typeof parsed === typeof fallback || Array.isArray(fallback) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

export const safeSet = (key, val) => {
  try {
    localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
  } catch (e) {
    console.error(e);
  }
};

export function ClubProvider({ children }) {
  const [supabaseSession, setSupabaseSession] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Datos globales sincronizados con Supabase / localStorage
  const [usuariasClub, setUsuariasClub] = useState(() => safeGetJSON('gilda_cache_usuarias', []));
  const [capitulos, setCapitulos] = useState(() => safeGetJSON('gilda_cache_capitulos', []));
  const [comentarios, setComentarios] = useState(() => safeGetJSON('gilda_cache_comentarios', []));
  const [lecturas, setLecturas] = useState(() => safeGetJSON('gilda_cache_lecturas', []));
  const [chatMsgs, setChatMsgs] = useState(() => safeGetJSON('gilda_cache_chat', []));
  const [propuestas, setPropuestas] = useState(() => safeGetJSON('gilda_cache_propuestas', []));
  const [lecturasPersonales, setLecturasPersonales] = useState(() => safeGetJSON('gilda_cache_personales', []));
  const [eventosCalendario, setEventosCalendario] = useState(() => safeGetJSON('gilda_cache_calendario', []));
  const [muroActividad, setMuroActividad] = useState(() => safeGetJSON('gilda_cache_muro', []));
  const [cafecitos, setCafecitos] = useState(() => safeGetJSON('gilda_cache_cafecitos', []));

  // Estados del usuario actual
  const [miPagina, setMiPagina] = useState(0);
  const [miCiudadInput, setMiCiudadInput] = useState(() => safeGet('gilda_ciudad', ''));
  const [miCodigoPostalInput, setMiCodigoPostalInput] = useState(() => safeGet('gilda_codigo_postal', ''));
  const [isReadingNow, setIsReadingNow] = useState(() => safeGetJSON('gilda_is_reading', false));
  const [nombreUsuarioPersonalizado, setNombreUsuarioPersonalizado] = useState(() => safeGet('gilda_nombre_usuario', ''));
  const [fotoPerfilPersonalizada, setFotoPerfilPersonalizada] = useState(() => safeGet('gilda_foto_perfil', ''));
  const [decoracionActual, setDecoracionActual] = useState(() => safeGet('gilda_decoracion', 'monstera'));
  const [objetosPersonalizados, setObjetosPersonalizados] = useState(() =>
    safeGetJSON('gilda_objetos_personalizados', [{ id: 'pin-1', url: null, titulo: 'Mi moodboard' }])
  );
  const [misCitas] = useState(() => safeGetJSON('gilda_mis_citas', []));

  const mostrarToast = (texto) => {
    setToastMsg(texto);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const sesion = useMemo(() => {
    if (!supabaseSession) return null;
    const emailUser = supabaseSession.user.email.toLowerCase().trim();
    const socia = usuariasClub.find((u) => (u.email || '').trim().toLowerCase() === emailUser);
    const nombreSocia = socia?.nombre && socia.nombre.trim() !== '' ? socia.nombre.trim() : emailUser.split('@')[0];
    return { nombre: nombreSocia, email: emailUser, modalidad: socia?.modalidad || 'gilda' };
  }, [supabaseSession, usuariasClub]);

  const esAdministradora = String(sesion?.email || '').trim().toLowerCase() === EMAIL_ADMINISTRADORA;

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
        if (sesion?.email) {
          const sociaActual = profiles.find((u) => (u.email || '').trim().toLowerCase() === sesion.email.toLowerCase());
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
      console.error('Error sincronizando Supabase:', err);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSupabaseSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSupabaseSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // Suscripción Realtime a Supabase
  useEffect(() => {
    cargarDatosSupabase();

    if (!sesion?.email) return;

    const canalChat = supabase
      .channel('realtime:chat_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        setChatMsgs((prev) => {
          if (prev.some((m) => m.id === payload.new.id)) return prev;
          const actualizado = [...prev, payload.new];
          safeSet('gilda_cache_chat', actualizado);
          return actualizado;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canalChat);
    };
  }, [sesion?.email]);

  const registrarActividadPresencia = async () => {
    if (!sesion?.email) return;
    const ahoraIso = new Date().toISOString();
    await supabase.from('profiles').update({ ultima_conexion: ahoraIso }).eq('email', sesion.email);
  };

  const obtenerNombreReal = (emailComentario, usuarioOriginal) => {
    if (sesion?.email && emailComentario && sesion.email.toLowerCase() === emailComentario.toLowerCase()) {
      if (nombreUsuarioPersonalizado) return nombreUsuarioPersonalizado;
    }
    if (emailComentario) {
      const encontrada = usuariasClub.find((u) => (u.email || '').trim().toLowerCase() === emailComentario.trim().toLowerCase());
      if (encontrada?.nombre?.trim()) return encontrada.nombre.trim();
    }
    if (usuarioOriginal && !usuarioOriginal.includes('@')) return usuarioOriginal;
    return sesion?.nombre || (emailComentario ? emailComentario.split('@')[0] : 'lectora');
  };

  const guardarLibroPersonal = async (tituloOpt, pagOpt, estadoOpt = 'leyendo', autoraOpt = '', portadaOpt = '') => {
    const tituloLibro = String(tituloOpt || '').trim();
    if (!tituloLibro || !sesion?.email) return;
    const pagFinal = Number(pagOpt) || 0;

    const existente = lecturasPersonales.find(
      (l) => (l.email || '').toLowerCase() === sesion.email.toLowerCase() && (l.libro || '').toLowerCase() === tituloLibro.toLowerCase()
    );

    if (existente) {
      await supabase.from('personal_readings').update({ pagina: pagFinal, paginas: pagFinal, estado: estadoOpt, autora: autoraOpt || existente.autora, portada: portadaOpt || existente.portada }).eq('id', existente.id);
    } else {
      await supabase.from('personal_readings').insert([{ email: sesion.email, nombre: nombreUsuarioPersonalizado || sesion.nombre, libro: tituloLibro, pagina: pagFinal, paginas: pagFinal, estado: estadoOpt, autora: autoraOpt, portada: portadaOpt }]);
    }

    await cargarDatosSupabase();
    mostrarToast(`Guardado: ${tituloLibro}`);
  };

  const publicarCitaEnMuro = async (texto, libroCita) => {
    if (!texto.trim() || !sesion?.email) return;
    const publicacion = {
      tipo: 'cita',
      cita: texto.trim(),
      email: sesion.email,
      nombre: nombreUsuarioPersonalizado || sesion.nombre,
      libro: libroCita?.titulo || '',
      portada: libroCita?.portada || '',
      estrellas: 5,
      timestamp: new Date().toISOString()
    };
    await supabase.from('wall_posts').insert([publicacion]);
    setMuroActividad((prev) => [publicacion, ...prev]);
    mostrarToast('Tu cita ya está publicada en el Muro.');
  };

  const libroActual = useMemo(
    () => lecturas[0] || { titulo: 'La campana de cristal', autora: 'Sylvia Plath', paginas_totales: 280, portada: '' },
    [lecturas]
  );

  const porcentajeLibro = useMemo(
    () => Math.min(Math.round((miPagina / Number(libroActual.paginas_totales || 280)) * 100), 100),
    [miPagina, libroActual]
  );

  const value = {
    supabase,
    supabaseSession,
    sesion,
    esAdministradora,
    toastMsg,
    mostrarToast,
    usuariasClub,
    capitulos,
    comentarios,
    lecturas,
    chatMsgs,
    propuestas,
    lecturasPersonales,
    eventosCalendario,
    muroActividad,
    cafecitos,
    miPagina,
    setMiPagina,
    miCiudadInput,
    setMiCiudadInput,
    miCodigoPostalInput,
    setMiCodigoPostalInput,
    isReadingNow,
    setIsReadingNow,
    nombreUsuarioPersonalizado,
    setNombreUsuarioPersonalizado,
    fotoPerfilPersonalizada,
    setFotoPerfilPersonalizada,
    decoracionActual,
    setDecoracionActual,
    objetosPersonalizados,
    setObjetosPersonalizados,
    misCitas,
    libroActual,
    porcentajeLibro,
    cargarDatosSupabase,
    registrarActividadPresencia,
    obtenerNombreReal,
    guardarLibroPersonal,
    publicarCitaEnMuro
  };

  return <ClubContext.Provider value={value}>{children}</ClubContext.Provider>;
}

export function useClub() {
  const context = useContext(ClubContext);
  if (!context) {
    throw new Error('useClub debe utilizarse dentro de un <ClubProvider>');
  }
  return context;
}