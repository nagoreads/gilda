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
      const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=25`);
      if (!res.ok) throw new Error("Error en la red");
      const data = await res.json();

      let docs = data.docs || [];

      // Priorizar ediciones publicadas en castellano
      docs.sort((a, b) => {
        const aEsSpa = a.language?.some(l => l.toLowerCase().includes('spa')) ? 1 : 0;
        const bEsSpa = b.language?.some(l => l.toLowerCase().includes('spa')) ? 1 : 0;
        return bEsSpa - aEsSpa;
      });

      const librosFormateados = docs.slice(0, 10).map(doc => {
        let portadaUrl = 'https://books.google.com/books/content?pprint=1&printsec=frontcover&img=1&zoom=1&source=gbs_api';
        
        if (doc.cover_i) {
          portadaUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
        } else if (doc.isbn && doc.isbn.length > 0) {
          portadaUrl = `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-M.jpg`;
        }

        return {
          titulo: doc.title || 'Título desconocido',
          autora: doc.author_name ? doc.author_name.join(', ') : 'Autora desconocida',
          paginas: doc.number_of_pages_median || 200,
          portada: portadaUrl
        };
      });

      setResultados(librosFormateados);
    } catch (err) {
      console.error("Error buscando libros:", err);
    } finally {
      setBuscando(false);
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={buscarLibros} className="flex gap-2">
        <input
          id="openlibrary-search"
          name="openlibrarySearch"
          autoComplete="off"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar libro o autora..."
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
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <img 
                  src={item.portada} 
                  alt={item.titulo} 
                  className="w-10 h-14 object-cover rounded shadow-sm bg-[#f8f6f0] shrink-0"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://books.google.com/books/content?pprint=1&printsec=frontcover&img=1&zoom=1&source=gbs_api';
                  }}
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#23211e] line-clamp-1">{item.titulo}</p>
                  <p className="text-[10px] text-[#75706b] line-clamp-1">{item.autora}</p>
                </div>
              </div>
              <button
                onClick={() => onSeleccionarLibro(item)}
                className="px-3 py-1 bg-[#23211e] text-[#ffffee] text-[10px] font-semibold rounded-lg hover:opacity-90 transition-all shrink-0 min-h-[32px]"
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