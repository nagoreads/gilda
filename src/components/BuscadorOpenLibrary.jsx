import { useState } from 'react';

export default function BuscadorOpenLibrary({ onSeleccionarLibro }) {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);

  const buscarLibros = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setBuscando(true);

    try {
      // Búsqueda principal en Google Books restringida a español para portadas de calidad
      const resGB = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&langRestrict=es&maxResults=10`);
      const dataGB = await resGB.json();

      let libros = [];

      if (dataGB.items && dataGB.items.length > 0) {
        libros = dataGB.items.map(item => {
          const info = item.volumeInfo || {};
          let portadaUrl = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail;
          
          if (portadaUrl && portadaUrl.startsWith('http:')) {
            portadaUrl = portadaUrl.replace('http:', 'https:');
          }

          return {
            titulo: info.title || 'Título desconocido',
            autora: info.authors ? info.authors.join(', ') : 'Autora desconocida',
            paginas: info.pageCount || 200,
            portada: portadaUrl || 'https://books.google.com/books/content?pprint=1&printsec=frontcover&img=1&zoom=1&source=gbs_api'
          };
        });
      }

      // Si Google Books no devuelve suficientes resultados, se complementa con Open Library
      if (libros.length < 3) {
        const resOL = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`);
        const dataOL = await resOL.json();

        const librosOL = (dataOL.docs || []).map(doc => ({
          titulo: doc.title,
          autora: doc.author_name ? doc.author_name.join(', ') : 'Autora desconocida',
          paginas: doc.number_of_pages_median || 200,
          portada: doc.cover_i 
            ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
            : 'https://books.google.com/books/content?pprint=1&printsec=frontcover&img=1&zoom=1&source=gbs_api'
        }));

        libros = [...libros, ...librosOL];
      }

      setResultados(libros);
    } catch (err) {
      console.error("Error al buscar libros:", err);
    } finally {
      setBuscando(false);
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={buscarLibros} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar libro o autora (ediciones en español)..."
          className="flex-1 px-3 py-2 text-xs bg-white border border-[#e8e4d9] rounded-xl focus:outline-none focus:border-[#23211e]"
        />
        <button
          type="submit"
          disabled={buscando}
          className="px-4 py-2 bg-[#23211e] text-[#ffffee] text-xs font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
        >
          {buscando ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {resultados.length > 0 && (
        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {resultados.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-xl border border-[#e8e4d9]">
              <div className="flex items-center gap-3">
                <img 
                  src={item.portada} 
                  alt={item.titulo} 
                  className="w-10 h-14 object-cover rounded shadow-sm bg-[#f8f6f0]"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://books.google.com/books/content?pprint=1&printsec=frontcover&img=1&zoom=1&source=gbs_api';
                  }}
                />
                <div>
                  <p className="text-xs font-bold text-[#23211e] line-clamp-1">{item.titulo}</p>
                  <p className="text-[10px] text-[#75706b]">{item.autora}</p>
                </div>
              </div>
              <button
                onClick={() => onSeleccionarLibro(item)}
                className="px-3 py-1 bg-[#23211e] text-[#ffffee] text-[10px] font-semibold rounded-lg hover:opacity-90 transition-all min-h-[32px]"
              >
                Añadir
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}