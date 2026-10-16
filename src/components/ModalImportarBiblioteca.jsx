import { useState } from 'react';

export default function ModalImportarBiblioteca({ onClose, sesion, supabase, cargarDatosSupabase, mostrarToast }) {
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [progresoTexto, setProgresoTexto] = useState('');
  const [librosProcesados, setLibrosProcesados] = useState([]);

  const procesarCSV = (texto) => {
    try {
      if (!texto) return [];
      const lineas = texto.split('\n');
      if (lineas.length < 2) return [];

      const cabeceras = lineas[0].split(',').map(h => h ? h.trim().replace(/^"|"$/g, '').toLowerCase() : '');
      const idxTitulo = cabeceras.findIndex(h => h.includes('title') || h.includes('titulo') || h.includes('book title'));
      const idxAutor = cabeceras.findIndex(h => h.includes('author') || h.includes('autora') || h.includes('book author'));
      const idxEstante = cabeceras.findIndex(h => h.includes('shelf') || h.includes('estante') || h.includes('exclusive shelf'));

      const libros = [];

      for (let i = 1; i < lineas.length; i++) {
        const linea = lineas[i] ? lineas[i].trim() : '';
        if (!linea) continue;

        const columnas = linea.split(',');
        const limpiar = (val) => val ? val.replace(/^"|"$/g, '').trim() : '';

        const titulo = idxTitulo !== -1 && columnas[idxTitulo] ? limpiar(columnas[idxTitulo]) : (columnas[1] ? limpiar(columnas[1]) : '');
        const autor = idxAutor !== -1 && columnas[idxAutor] ? limpiar(columnas[idxAutor]) : (columnas[2] ? limpiar(columnas[2]) : 'Desconocido');
        const estante = idxEstante !== -1 && columnas[idxEstante] ? limpiar(columnas[idxEstante]) : 'read';

        if (titulo && titulo.toLowerCase() !== 'title') {
          let emailUsuario = sesion?.email;
          if (!emailUsuario) {
            try {
              emailUsuario = JSON.parse(localStorage.getItem('gilda_sesion') || '{}').email;
            } catch (e) {}
          }

          libros.push({
            email: emailUsuario ? emailUsuario.toLowerCase().trim() : 'invitada@gilda.app',
            nombre: sesion?.nombre || 'Socia',
            libro: titulo,
            autora: autor || 'Desconocido',
            estado: estante.toLowerCase().includes('read') && !estante.toLowerCase().includes('to-read') ? 'leido' : 'pendiente',
            pagina: estante.toLowerCase().includes('read') && !estante.toLowerCase().includes('to-read') ? 100 : 0,
            paginas: 100,
            portada: 'https://images.weserv.nl/?url=https://i.imgur.com/Q9yK5aI.png&w=300&h=450&fit=contain'
          });
        }
      }
      return libros;
    } catch (e) {
      console.error("Error parseando CSV:", e);
      return [];
    }
  };

  const manejarArchivo = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setArchivo(file);
      setCargando(true);
      setProgresoTexto('Leyendo archivo CSV de Goodreads...');
      const lector = new FileReader();
      lector.onload = (evento) => {
        try {
          const contenido = evento.target?.result || '';
          const parsed = procesarCSV(contenido);

          setLibrosProcesados(parsed);
          setCargando(false);
          setProgresoTexto('');
          if (typeof mostrarToast === 'function') {
            mostrarToast(`¡Se detectaron ${parsed.length} libros listos para guardar!`);
          }
        } catch (err) {
          console.error(err);
          setCargando(false);
          setProgresoTexto('');
          if (typeof mostrarToast === 'function') {
            mostrarToast('Error al procesar el archivo CSV.');
          }
        }
      };
      lector.readAsText(file);
    }
  };

  const confirmarImportacion = async () => {
    if (librosProcesados.length === 0 || !supabase) {
      if (typeof mostrarToast === 'function') mostrarToast('No hay libros para guardar o falta conexión.');
      return;
    }
    setCargando(true);

    try {
      const tamanoLote = 30; // Lotes de 30 en 30 para respetar los límites de Supabase
      const total = librosProcesados.length;

      for (let i = 0; i < total; i += tamanoLote) {
        const lote = librosProcesados.slice(i, i + tamanoLote);
        setProgresoTexto(`Guardando en Supabase: ${Math.min(i + tamanoLote, total)} de ${total} libros...`);

        // Usamos el cliente supabase autenticado que viene de la app principal
        const { error } = await supabase.from('personal_readings').insert(lote);
        if (error) {
          console.error("Error en lote de Supabase:", error);
          throw error;
        }
      }

      if (typeof cargarDatosSupabase === 'function') await cargarDatosSupabase();
      if (typeof mostrarToast === 'function') mostrarToast('¡Biblioteca importada y guardada en Supabase con éxito!');
      if (typeof onClose === 'function') onClose();
    } catch (err) {
      console.error("Excepción al guardar en Supabase:", err);
      if (typeof mostrarToast === 'function') mostrarToast('Hubo un error de permisos o de base de datos al guardar.');
      setCargando(false);
      setProgresoTexto('');
    }
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
          <h3 className="font-babydoll text-2xl font-bold text-[#23211e]">Importar mi biblioteca</h3>
          <p className="text-xs text-[#75706b] font-sans leading-relaxed">
            Sube tu archivo <code className="bg-[#e8e4d9] px-1 py-0.5 rounded text-[11px]">.csv</code> de Goodreads (compatible con miles de libros).
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <label className="border-2 border-dashed border-[#e8e4d9] hover:border-[#23211e] bg-white/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all">
            <i className="fa-solid fa-cloud-arrow-up text-xl text-[#75706b] mb-1"></i>
            <span className="text-xs font-semibold text-[#23211e]">
              {archivo ? archivo.name : 'Seleccionar archivo CSV'}
            </span>
            <span className="text-[10px] text-[#75706b] mt-0.5">Haz clic aquí para buscar tu archivo</span>
            <input type="file" accept=".csv" onChange={manejarArchivo} className="hidden" />
          </label>

          {cargando && (
            <div className="space-y-1 text-center">
              <p className="text-xs text-[#75706b] italic font-semibold">{progresoTexto || 'Procesando...'}</p>
              <div className="w-full bg-[#e8e4d9] rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#23211e] h-full animate-pulse w-full"></div>
              </div>
            </div>
          )}

          {librosProcesados.length > 0 && !cargando && (
            <div className="bg-white p-3 rounded-xl border border-[#e8e4d9] max-h-40 overflow-y-auto space-y-2">
              <p className="text-xs font-bold text-[#23211e]">¡Libros detectados ({librosProcesados.length})!</p>
              {librosProcesados.slice(0, 5).map((lib, idx) => (
                <div key={idx} className="text-[11px] text-[#75706b] border-b border-[#e8e4d9]/50 pb-1 flex justify-between items-center">
                  <div className="truncate max-w-[220px]">
                    <span className="font-medium text-[#23211e]">{lib.libro}</span>
                    <span className="block text-[10px] italic text-[#75706b]">{lib.autora}</span>
                  </div>
                  <span className="text-[9px] bg-[#ffffee] border border-[#e8e4d9] px-1.5 py-0.5 rounded text-[#23211e]">{lib.estado}</span>
                </div>
              ))}
              {librosProcesados.length > 5 && (
                <p className="text-[10px] text-center text-[#75706b] italic">y {librosProcesados.length - 5} libros más listos para importar...</p>
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
            disabled={librosProcesados.length === 0 || cargando}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              librosProcesados.length > 0 && !cargando
                ? 'bg-[#23211e] text-[#ffffee] hover:opacity-95'
                : 'bg-[#e8e4d9] text-[#75706b] cursor-not-allowed'
            }`}
          >
            Guardar en la base de datos
          </button>
        </div>
      </div>
    </div>
  );
}
