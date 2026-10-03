import { useState, useEffect } from 'react';

export default function BuscadorLibros({ placeholder, valor, setValor, onSelectLibro, solicitarJsonExterno }) {
    const [sugerencias, setSugerencias] = useState([]);
    const [buscando, setBuscando] = useState(false);
    const [mostrarDropdown, setMostrarDropdown] = useState(false);

    useEffect(() => {
      let activo = true;
      if (!valor || valor.trim().length < 2) {
        setSugerencias([]);
        setMostrarDropdown(false);
        return () => { activo = false; };
      }
      const timer = setTimeout(async () => {
        setBuscando(true);
        try {
          const query = encodeURIComponent(valor.trim());
          const [dataG, dataOL] = await Promise.all([
            solicitarJsonExterno(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=8&printType=books&langRestrict=es`),
            solicitarJsonExterno(`https://openlibrary.org/search.json?q=${query}&limit=6&language=spa`)
          ]);
          if (!activo) return;
          let listaCombinada = [];
          if (dataG?.items) {
            dataG.items.forEach(item => {
              const info = item.volumeInfo || {};
              let thumb = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || '';
              if (thumb) {
                thumb = thumb.replace('http:', 'https:').replace('&edge=curl', '');
              }
              listaCombinada.push({ titulo: info.title || '', autora: info.authors ? info.authors.join(', ') : '', portada: thumb });
            });
          }
          if (dataOL?.docs) {
            dataOL.docs.forEach(doc => {
              listaCombinada.push({ titulo: doc.title || '', autora: doc.author_name ? doc.author_name.join(', ') : '', portada: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : '' });
            });
          }
          const unicos = [];
          const titulosVistos = new Set();
          listaCombinada.forEach(item => {
            const tLimpio = item.titulo.toLowerCase().trim();
            if (tLimpio && !titulosVistos.has(tLimpio)) { 
              titulosVistos.add(tLimpio); 
              unicos.push(item); 
            }
          });
          setSugerencias(unicos.slice(0, 8));
          setMostrarDropdown(unicos.length > 0);
        } catch { 
          if (activo) setSugerencias([]);
        } finally {
          if (activo) setBuscando(false);
        }
      }, 500);
      return () => {
        activo = false;
        clearTimeout(timer);
      };
    }, [valor, solicitarJsonExterno]);

    return (
      <div className="relative w-full">
        <div className="relative flex items-center">
          <input type="text" placeholder={placeholder} value={valor} onChange={(e) => { setValor(e.target.value); setMostrarDropdown(true); }} className="w-full editorial-input p-2.5 text-xs italic pr-8" />
          {buscando && <i className="fa-solid fa-spinner animate-spin absolute right-2.5 text-xs text-[#3d4220]"></i>}
        </div>
        {mostrarDropdown && sugerencias.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 bg-[#FFFFFF] border border-[#e6e4dc] rounded-b-xl shadow-xl max-h-56 overflow-y-auto mt-1">
            {sugerencias.map((item, idx) => (
              <div key={idx} onClick={() => { onSelectLibro(item); setMostrarDropdown(false); }} className="flex items-center gap-2.5 p-2 hover:bg-[#ffffee] cursor-pointer border-b border-[#e6e4dc] last:border-0 text-left">
                {item.portada ? <img src={`https://images.weserv.nl/?url=${encodeURIComponent(item.portada)}&w=100&output=jpg`} alt="" className="w-7 h-10 object-cover rounded shrink-0 shadow-sm" /> : <div className="w-7 h-10 bg-[#faf9f5] rounded shrink-0 flex items-center justify-center text-[7px] text-[#595750] border border-[#e6e4dc]">Sin foto</div>}
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-[#1c1c1a] truncate leading-tight font-babydoll">{item.titulo}</p>
                  <p className="text-[10px] text-[#595750] italic truncate font-sans">{item.autora || ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
