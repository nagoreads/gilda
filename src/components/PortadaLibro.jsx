export default function PortadaLibro({ titulo, autora, autor, escritora, portada, cover, image, size = 'normal' }) {
    const [errorImg, setErrorImg] = useState(false);
    const [portadaDinamica, setPortadaDinamica] = useState('');
    const [autoraEncontrada, setAutoraEncontrada] = useState('');
    const [, setBuscandoOnline] = useState(false);

    const sizeClasses = 
      size === 'story' ? 'w-full h-full text-xs min-h-[112px]' : 
      size === 'large' ? 'w-24 h-36 text-xs' : 
      size === 'grid' ? 'w-16 h-24 text-[9px]' : 
      size === 'thumb' ? 'w-10 h-14 text-[8px]' : 'w-12 h-16 text-[8px]';

    const portadaOriginal = portada || cover || image || '';
    const tituloFinal = titulo || 'Sin título';
    const autoraCruda = autora || autor || escritora || '';
    const autoraFinal = useMemo(() => {
      if (!autoraCruda || typeof autoraCruda !== 'string') return '';
      const aLimpia = autoraCruda.trim();
      const lower = aLimpia.toLowerCase();
      if (['autora', 'autor', 'desconocida', 'escritora', 'undefined', 'null'].includes(lower)) return '';
      return aLimpia;
    }, [autoraCruda]);

    useEffect(() => {
      let activo = true;
      if ((!portadaOriginal || errorImg || !autoraFinal) && tituloFinal && tituloFinal !== 'Sin título' && !portadaDinamica) {
        setBuscandoOnline(true);
        const cacheKey = `gilda_portada_${tituloFinal.trim().toLowerCase()}_${autoraFinal.trim().toLowerCase()}`;
        const leerCache = () => {
          try {
            const valor = sessionStorage.getItem(cacheKey);
            return valor ? JSON.parse(valor) : {};
          } catch {
            return {};
          }
        };
        const guardarCache = (fuente, estado, datos = null) => {
          try {
            const cache = leerCache();
            cache[fuente] = { estado, datos };
            sessionStorage.setItem(cacheKey, JSON.stringify(cache));
          } catch {
            // sessionStorage puede estar bloqueado.
          }
        };
        const cargarFuente = async (fuente, url) => {
          const cache = leerCache()[fuente];
          if (cache?.estado === 'error') return null;
          if (cache?.estado === 'ok') return cache.datos;
          if (fuente === 'google' && googleBooksEnCooldown()) return null;

          const solicitudKey = `${cacheKey}:${fuente}`;
          const solicitudExistente = solicitudesPortadaEnCurso.get(solicitudKey);
          if (solicitudExistente) return solicitudExistente;

          const solicitud = solicitarJsonExterno(url)
            .then(datos => {
              if (datos === null) {
                guardarCache(fuente, 'error');
                return null;
              }
              guardarCache(fuente, 'ok', datos);
              return datos;
            })
            .finally(() => solicitudesPortadaEnCurso.delete(solicitudKey));

          solicitudesPortadaEnCurso.set(solicitudKey, solicitud);
          return solicitud;
        };

        const query = encodeURIComponent(`${tituloFinal} ${autoraFinal}`);
        Promise.all([
          cargarFuente('google', `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1&langRestrict=es`),
          cargarFuente('openLibrary', `https://openlibrary.org/search.json?q=${query}&limit=1&language=spa`)
        ]).then(([dataGoogle, dataOpenLibrary]) => {
          if (!activo) return;
          let imgEncontrada = '';
          let autEncontrada = '';
          const itemG = dataGoogle?.items?.[0]?.volumeInfo;
          if (itemG) {
            if (itemG.imageLinks?.thumbnail || itemG.imageLinks?.smallThumbnail) {
              imgEncontrada = itemG.imageLinks.thumbnail || itemG.imageLinks.smallThumbnail;
            }
            if (itemG.authors && itemG.authors.length > 0) autEncontrada = itemG.authors.join(', ');
          }
          const docOL = dataOpenLibrary?.docs?.[0];
          if (!imgEncontrada && docOL?.cover_i) imgEncontrada = `https://covers.openlibrary.org/b/id/${docOL.cover_i}-L.jpg`;
          if (!autEncontrada && docOL?.author_name?.length) autEncontrada = docOL.author_name.join(', ');
          if (imgEncontrada) {
            setPortadaDinamica(imgEncontrada.replace('http:', 'https:'));
          }
          if (autEncontrada && !autoraFinal) setAutoraEncontrada(autEncontrada);
        }).finally(() => { if (activo) setBuscandoOnline(false); });
      }
      return () => { activo = false; };
    }, [portadaOriginal, errorImg, tituloFinal, autoraFinal, portadaDinamica]);

    const urlSegura = useMemo(() => {
      const pFinal = portadaOriginal || portadaDinamica;
      if (!pFinal || typeof pFinal !== 'string') return '';
      let p = pFinal.trim();
      if (p.startsWith('data:image')) return p;
      if (p.startsWith('http://')) p = p.replace('http://', 'https://');
      if (p.startsWith('https://')) return `https://images.weserv.nl/?url=${encodeURIComponent(p)}&w=300&output=jpg`;
      return '';
    }, [portadaOriginal, portadaDinamica]);

    const autoraMostrar = autoraFinal || autoraEncontrada || '';
    const colorEditorialFallback = useMemo(() => {
      let hash = 0;
      for (let i = 0; i < tituloFinal.length; i++) { hash = tituloFinal.charCodeAt(i) + ((hash << 5) - hash); }
      const matices = ['#3d4220', '#34381b', '#523021', '#232820', '#633528', '#324854', '#543d30', '#3d3054', '#4a3429', '#324235'];
      return matices[Math.abs(hash) % matices.length];
    }, [tituloFinal]);

    if (urlSegura !== '' && !errorImg) {
      return <img src={urlSegura} alt={tituloFinal} onError={() => setErrorImg(true)} className={`${sizeClasses} object-cover rounded shadow-sm shrink-0 bg-gray-100`} />;
    }

    return (
      <div style={{ backgroundColor: colorEditorialFallback }} className={`${sizeClasses} text-[#ffffee] p-2 rounded shadow-sm border border-white/20 shrink-0 flex flex-col justify-between overflow-hidden text-left relative`}>
        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white/30"></div>
        <span className="font-bold tracking-tight line-clamp-3 leading-tight font-babydoll drop-shadow-sm" style={{ fontSize: (size === 'large' || size === 'story') ? '11px' : '9px' }}>
          {tituloFinal}
        </span>
        <span className="text-[7px] text-white/80 uppercase tracking-wider truncate font-sans">
          {autoraMostrar}
        </span>
      </div>
    );
  }