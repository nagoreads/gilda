import { useState } from 'react';

export default function BuscadorOpenLibrary({ onSeleccionarLibro }) {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);

  const buscarEnOpenLibrary = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setBuscando(true);
    try {
      const respuesta = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`);
      const data = await respuesta.json();
      
      const librosFormateados = (data.docs || []).map(libro => ({
        titulo: libro.title || 'Título desconocido',
        autora: libro.author_name ? libro.author_name.join(', ') : 'Autor desconocido',
        paginas: libro.number_of_pages_median || 200,
        portada: libro.cover_i 
          ? `https://covers.openlibrary.org/b/id/${libro.cover_i}-M.jpg` 
          : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&q=80'
      }));

      setResultados(librosFormateados);
    } catch (error) {
      console.error("Error buscando en Open Library:", error);
    } finally {
      setBuscando(false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-[#ffffee] rounded-2xl border border-[#e8e4d9]">
      <h4 className="font-babydoll text-lg font-bold text-[#23211e]">Buscar libro en Open Library</h4>
      
      <form onSubmit={buscarEnOpenLibrary} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Escribe el título o autora..."
          className="flex-1 px-3 py-2 text-xs bg-white rounded-xl border border-[#e8e4d9] text-[#23211e] focus:outline-none focus:border-[#23211e]"
        />
        <button
          type="submit"
          disabled={buscando}
          className="px-4 py-2 bg-[#23211e] text-[#ffffee] text-xs font-semibold rounded-xl hover:opacity-95 transition-all"
        >
          {buscando ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      <div className="max-h-60 overflow-y-auto space-y-2">
        {resultados.map((libro, index) => (
          <div 
            key={index} 
            className="flex items-center justify-between p-2 bg-white rounded-xl border border-[#e8e4d9]/60 hover:border-[#23211e] transition-all"
          >
            <div className="flex items-center gap-3">
              <img 
                src={libro.portada} 
                alt={libro.titulo} 
                className="w-10 h-14 object-cover rounded shadow-sm"
              />
              <div>
                <p className="text-xs font-bold text-[#23211e]">{libro.titulo}</p>
                <p className="text-[10px] italic text-[#75706b]">{libro.autora}</p>
              </div>
            </div>
            
            <button
              onClick={() => onSeleccionarLibro && onSeleccionarLibro(libro)}
              className="px-3 py-1.5 bg-[#e8e4d9]/50 hover:bg-[#23211e] hover:text-[#ffffee] text-[#23211e] text-[11px] font-semibold rounded-lg transition-all"
            >
              Añadir
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
