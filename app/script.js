const { useState, useEffect } = React;

const SHEET_ID = "1YTlw2FAtoRzE_Ei-n4UmAGAnZA7Kg0PrRUuLUVPsJAM";
const SHEET_TAB_NAME = "usuarias";
const URL_API_DIRECTA = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_TAB_NAME}`;

const LIBRO_ACTUAL = {
  titulo: "la campana de cristal",
  paginasTotales: 264
};

const listaDeRespaldo = [
  { nombre: "nagore", pagina: 20, leyendo: true },
  { nombre: "urtzi", pagina: 20, leyendo: true },
  { nombre: "ane", pagina: 0, leyendo: false },
  { nombre: "maialen", pagina: 20, leyendo: true },
  { nombre: "lau", pagina: 40, leyendo: true }
];

function App() {
  const [usuariasClub, setUsuariasClub] = useState([...listaDeRespaldo]);
  const [usuariaActivaIndice, setUsuariaActivaIndice] = useState(null);
  const [modoScreenshot, setModoScreenshot] = useState(false);

  const cargarDatosDesdeSheets = async () => {
    try {
      const respuesta = await fetch(URL_API_DIRECTA);
      const textoRaw = await respuesta.text();
      
      const textoLimpio = textoRaw.substring(textoRaw.indexOf('{'), textoRaw.lastIndexOf('}') + 1);
      const objetoJson = JSON.parse(textoLimpio);
      const filas = objetoJson.table.rows;
      
      const usuariasMapeadas = filas.map(fila => {
        if (!fila || !fila.c) return null;
        
        const celdaNombre = fila.c[0]; 
        const celdaPagina = fila.c[1]; 
        
        const nombreVal = celdaNombre && celdaNombre.v ? String(celdaNombre.v).trim() : null;
        const paginaVal = celdaPagina && celdaPagina.v ? parseInt(celdaPagina.v) || 0 : 0;
        
        if (!nombreVal || nombreVal.toLowerCase() === "nombre") return null;
        
        return {
          nombre: nombreVal,
          pagina: paginaVal,
          leyendo: paginaVal > 0
        };
      }).filter(u => u !== null);

      if (usuariasMapeadas.length > 0) {
        setUsuariasClub(usuariasMapeadas);
      }
    } catch (error) {
      console.error("Conexión activa mediante respaldo:", error);
    }
  };

  useEffect(() => {
    cargarDatosDesdeSheets();
    const intervalo = setInterval(cargarDatosDesdeSheets, 20000);
    return () => clearInterval(intervalo);
  }, []);

  const toggleLectura = (index) => {
    setUsuariasClub(prev => {
      const copia = [...prev];
      copia[index] = {
        ...copia[index],
        leyendo: !copia[index].leyendo
      };
      return copia;
    });
    setUsuariaActivaIndice(index);
  };

  const usuariaActiva = usuariaActivaIndice !== null ? usuariasClub[usuariaActivaIndice] : null;

  return (
    <div className={`w-full max-w-md mx-auto p-4 space-y-6 ${modoScreenshot ? 'opacity-90 border-2 border-[#555816] rounded-xl p-6 bg-white' : ''}`}>
      
      {/* Cabecera Principal */}
      <header className="text-center space-y-1 py-2">
        <h1 className="font-editorial-title text-3xl font-medium text-[#1A1A1A]">gilda</h1>
        <p className="text-xs text-gray-500 font-medium">club de lectura digital</p>
      </header>

      {/* Edificio de Ventanas */}
      <div className="craft-card p-6 flex flex-col items-center space-y-4">
        <h2 className="text-xs uppercase tracking-wider font-bold text-gray-400">Edificio de lectoras</h2>
        
        <div className="grid grid-cols-3 gap-6 w-full max-w-[220px] mx-auto py-2">
          {usuariasClub.map((usuaria, index) => {
            const esSeleccionada = usuariaActivaIndice === index;
            const textoProgreso = usuaria.pagina > 0 && usuaria.leyendo ? `pág. ${usuaria.pagina}` : "en pausa";

            return (
              <div key={index} className="flex flex-col items-center group relative">
                <button
                  onClick={() => toggleLectura(index)}
                  className={`w-[32px] h-[44px] rounded-[3px] border transition-all duration-200 hover:scale-105 cursor-pointer ${
                    usuaria.leyendo 
                      ? 'bg-[#555816] border-[#555816] shadow-sm' 
                      : 'bg-white border-[#E6E4DF]'
                  } ${esSeleccionada ? 'ring-2 ring-[#1A1A1A] ring-offset-2' : ''}`}
                  title={`${usuaria.nombre.toLowerCase()}: ${textoProgreso}`}
                />
                <span className="text-[10px] text-gray-600 font-medium mt-1.5 truncate max-w-[60px] text-center">
                  {usuaria.nombre.toLowerCase()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Habitación Propia (Módulo elástico) */}
      {usuariaActiva && (
        <div 
          onClick={() => { if (modoScreenshot) setModoScreenshot(false); }}
          className="craft-card p-5 space-y-3 fade-in cursor-pointer hover:border-[#555816] transition-colors"
        >
          <div className="border-b border-[#E6E4DF] pb-2 flex justify-between items-center">
            <h3 className="font-editorial-title text-base font-medium text-[#1A1A1A]">
              la habitación propia de {usuariaActiva.nombre.toLowerCase()}
            </h3>
            <span className="text-[10px] text-gray-400 font-bold uppercase">@gilda</span>
          </div>

          <div className="flex items-center gap-3 bg-[#FAF9F5] p-3 rounded-lg border border-[#E6E4DF]">
            <div className={`w-3 h-8 rounded-full shrink-0 ${usuariaActiva.leyendo && usuariaActiva.pagina > 0 ? 'bg-[#555816]' : 'bg-gray-300'}`} />
            
            <p className="text-xs text-[#1A1A1A] leading-normal">
              {!usuariaActiva.leyendo || usuariaActiva.pagina === 0 ? (
                <>esperando en el umbral de <i>{LIBRO_ACTUAL.titulo}</i>.</>
              ) : usuariaActiva.pagina >= LIBRO_ACTUAL.paginasTotales ? (
                <>ha cerrado las páginas de <i>{LIBRO_ACTUAL.titulo}</i>.</>
              ) : (
                <>leyendo la página <b>{usuariaActiva.pagina}</b> de <i>{LIBRO_ACTUAL.titulo}</i>.</>
              )}
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setModoScreenshot(!modoScreenshot);
              }}
              className="craft-btn px-3 py-1.5 text-[11px] font-medium flex items-center gap-1.5"
            >
              <i className="fa-solid fa-camera text-[10px]"></i>
              {modoScreenshot ? "Salir de captura" : "Modo captura"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const containerRoot = ReactDOM.createRoot(document.getElementById('root'));
containerRoot.render(<App />);
