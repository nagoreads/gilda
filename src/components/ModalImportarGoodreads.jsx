import { useState } from 'react';

export default function ModalImportarGoodreads({ onClose, onImportSuccess, mostrarToast }) {
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [librosProcesados, setLibrosProcesados] = useState([]);

  // Función sencilla para parsear CSV básico de Goodreads
  const procesarCSV = (texto) => {
    const lineas = texto.split('\n');
    if (lineas.length < 2) return [];

    // Detectar cabeceras
    const cabeceras = lineas[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const idxTitulo = cabeceras.findIndex(h => h.toLowerCase().includes('title'));
    const idxAutor = cabeceras.findIndex(h => h.toLowerCase().includes('author'));
    const idxEstante = cabeceras.findIndex(h => h.toLowerCase().includes('exclusive shelf') || h.toLowerCase().includes('shelf'));
    const idxCalificacion = cabeceras.findIndex(h => h.toLowerCase().includes('my rating'));

    const libros = [];

    for (let i = 1; i < lineas.length; i++) {
      const linea = lineas[i].trim();
      if (!linea) continue;

      // Parseo básico respetando comillas simples/dobles de CSV
      const columnas = linea.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || linea.split(',');
      
      const limpiar = (val) => val ? val.replace(/^"|"$/g, '').trim() : '';

      const titulo = idxTitulo !== -1 ? limpiar(columnas[idxTitulo] || '') : '';
      const autor = idxAutor !== -1 ? limpiar(columnas[idxAutor] || '') : '';
      const estante = idxEstante !== -1 ? limpiar(columnas[idxEstante] || '') : 'read';
      const calificacion = idxCalificacion !== -1 ? Number(limpiar(columnas[idxCalificacion] || '0')) : 0;

      if (titulo) {
        libros.push({
          id: 'gr_' + Math.random().toString(36).substring(2, 9),
          titulo,
          autor: autor || 'Desconocido',
          estante: estante.toLowerCase(),
          calificacion
        });
      }
    }
    return libros;
  };

  const manejarArchivo = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArchivo(file);
      setCargando(true);
      const lector = new FileReader();
      lector.onload = (evento) => {
        try {
          const contenido = evento.target.result;
          const parsed = procesarCSV(contenido);
          setLibrosProcesados(parsed);
          setCargando(false);
          if (mostrarToast) mostrarToast(`Se encontraron ${parsed.length} libros en el archivo.`);
        } catch (err) {
          console.error(err);
          setCargando(false);
          if (mostrarToast) mostrarToast('Error al leer el archivo CSV de Goodreads.');
        }
      };
      lector.readAsText(file);
    }
  };

  const confirmarImportacion = () => {
    if (librosProcesados.length === 0) return;
    if (onImportSuccess) {
      onImportSuccess(librosProcesados);
    }
    if (mostrarToast) mostrarToast('¡Lecturas de Goodreads importadas con éxito!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 fade-in">
      <div className="editorial-card max-w-md w-full p-6 space-y-4 bg-[#ffffee] relative modal-pop">
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-[#75706b] hover:text-[#23211e] p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <i className="fa-solid fa-xmark text-sm"></i>
        </button>

        <div className="space-y-1">
          <div className="w-10 h-10 bg-[#23211e] text-[#ffffee] rounded-full flex items-center justify-center mb-2">
            <i className="fa-solid fa-book-bookmark text-sm"></i>
          </div>
          <h3 className="font-babydoll text-2xl font-bold text-[#23211e]">Importar desde Goodreads</h3>
          <p className="text-xs text-[#75706b] font-sans leading-relaxed">
            Sube el archivo <code className="bg-[#e8e4d9] px-1 py-0.5 rounded text-[11px]">.csv</code> exportado desde tu cuenta de Goodreads (*My Books &gt; Import and Export*) para integrar tus lecturas en Gilda.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <label className="border-2 border-dashed border-[#e8e4d9] hover:border-[#23211e] bg-white/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all">
            <i className="fa-solid fa-cloud-arrow-up text-xl text-[#75706b] mb-1">span</i>
            <span className="text-xs font-semibold text-[#23211e]">
              {archivo ? archivo.name : 'Seleccionar archivo CSV'}
            </span>
            <span className="text-[10px] text-[#75706b] mt-0.5">Haz clic aquí para buscar el archivo</span>
            <input type="file" accept=".csv" onChange={manejarArchivo} className="hidden" />
          </label>

          {cargando && (
            <p className="text-center text-xs text-[#75706b] italic">Procesando estantería...</p>
          )}

          {librosProcesados.length > 0 && (
            <div className="bg-white p-3 rounded-xl border border-[#e8e4d9] max-h-40 overflow-y-auto space-y-2">
              <p className="text-xs font-bold text-[#23211e]">Libros detectados ({librosProcesados.length}):</p>
              {librosProcesados.slice(0, 5).map((lib, idx) => (
                <div key={idx} className="text-[11px] text-[#75706b] border-b border-[#e8e4d9]/50 pb-1 flex justify-between">
                  <span className="truncate max-w-[200px] font-medium text-[#23211e]">{lib.titulo}</span>
                  <span className="italic">{lib.autor}</span>
                </div>
              ))}
              {librosProcesados.length > 5 && (
                <p className="text-[10px] text-center text-[#75706b] italic">y {librosProcesados.length - 5} libros más...</p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <button 
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#e8e4d9] text-xs font-semibold text-[#75706b] hover:bg-[#e8e4d9]/30 transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={confirmarImportacion}
            disabled={librosProcesados.length === 0}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              librosProcesados.length > 0 
                ? 'bg-[#23211e] text-[#ffffee] hover:opacity-95' 
                : 'bg-[#e8e4d9] text-[#75706b] cursor-not-allowed'
            }`}
          >
            Importar estantería
          </button>
        </div>
      </div>
    </div>
  );
}
