import { useState, useEffect, useMemo } from 'react';
import PortadaLibro from '../PortadaLibro';
import { LomoLibroEstanteria, IlustracionDecoracion } from './DecoracionesHabitacion';

export default function ModalCompartirStory({ onClose, usuario, libro, pagina, citas, decoracion, misLibros, onPublicarCita, sesion }) {
  const FRASES_INICIALES = [
    "Un lector vive mil vidas antes de morir. El que no lee vive solo una.",
    "La depresión... como la manifestación de algo que no se puede reducir a lo anecdótico porque es estructural y colectivo.",
    "No hay barrera, cerradura ni cerrojo que puedas imponer a la libertad de mi mente."
  ];

  const [modo, setModo] = useState('progreso'); 
  const [textoCita, setTextoCita] = useState(FRASES_INICIALES[0]);
  const [tituloLibroStory, setTituloLibroStory] = useState(libro?.titulo || '');
  const [publicandoCita, setPublicandoCita] = useState(false);

  useEffect(() => {
    if (citas?.length) setTextoCita(citas[Math.floor(Math.random() * citas.length)]);
  }, [citas]);

  const librosStory = useMemo(() => {
    const candidatos = [libro, ...misLibros].filter(item => item?.titulo || item?.libro);
    const unicos = new Map();
    candidatos.forEach(item => {
      const titulo = String(item.titulo || item.libro || '').trim();
      if (!titulo) return;
      const clave = titulo.toLowerCase();
      if (!unicos.has(clave)) unicos.set(clave, { ...item, titulo });
    });
    return [...unicos.values()];
  }, [libro, misLibros]);

  const libroStory = librosStory.find(item => item.titulo === tituloLibroStory) || librosStory[0] || libro;
  const paginaStory = Number(libroStory?.pagina ?? libroStory?.paginas ?? pagina) || 0;

  const elegirOtraCita = () => {
    const opciones = citas?.length ? citas : FRASES_INICIALES;
    setTextoCita(opciones[Math.floor(Math.random() * opciones.length)]);
  };

  const handleDownload = () => {
    const el = document.getElementById('gilda-story-card');
    if (window.html2canvas) {
      window.html2canvas(el, { 
        scale: 3, 
        useCORS: true, 
        allowTaint: true, 
        backgroundColor: '#ffffee',
        logging: false,
        onclone: (clonedDoc) => {
          const clonedCard = clonedDoc.getElementById('gilda-story-card');
          if (clonedCard) {
            clonedCard.style.width = '310px';
            clonedCard.style.height = '551px';
          }
        }
      }).then(canvas => {
        const link = document.createElement('a');
        link.download = `gilda_story_${modo}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }).catch(err => {
        console.error("Error al generar la imagen:", err);
        alert("Hubo un error al generar la imagen. Intenta hacer captura de pantalla.");
      });
    }
  };

  const nombreSocia = (
    usuario && String(usuario).trim() !== '' 
      ? String(usuario).trim() 
      : (sesion?.email ? sesion.email.split('@')[0] : 'lectora')
  ).toLowerCase();

  return (
    <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm flex flex-col items-center justify-start pt-6 pb-6 px-4 fade-in overflow-y-auto">
      <div className="flex bg-white/20 backdrop-blur-md p-1.5 rounded-full mb-4 border border-white/30 shadow-xl shrink-0">
         <button onClick={() => setModo('progreso')} className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold rounded-full transition-all min-h-[44px] ${modo==='progreso' ? 'bg-white text-[#1c1c1a] shadow-md scale-105':'text-white hover:bg-white/10'}`}>Progreso</button>
         <button onClick={() => setModo('cita')} className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold rounded-full transition-all min-h-[44px] ${modo==='cita' ? 'bg-white text-[#1c1c1a] shadow-md scale-105':'text-white hover:bg-white/10'}`}>Cita</button>
         <button onClick={() => setModo('habitacion')} className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold rounded-full transition-all min-h-[44px] ${modo==='habitacion' ? 'bg-white text-[#1c1c1a] shadow-md scale-105':'text-white hover:bg-white/10'}`}>Habitación</button>
      </div>

      {librosStory.length > 0 && (
        <label className="w-full max-w-[310px] mb-3 flex items-center gap-2 text-xs font-sans text-white shrink-0">
          <span className="font-bold">Libro</span>
          <select value={libroStory.titulo} onChange={e => setTituloLibroStory(e.target.value)} className="min-w-0 flex-grow bg-white text-[#1c1c1a] border border-white/30 rounded-lg px-2.5 py-2 text-xs">
            {librosStory.map(item => <option key={item.titulo} value={item.titulo}>{item.titulo}</option>)}
          </select>
        </label>
      )}

      <div 
        id="gilda-story-card" 
        className="relative w-[310px] h-[551px] shadow-2xl rounded-3xl flex flex-col justify-between items-center p-6 bg-[#ffffee] border border-[#e6e4dc] shrink-0 box-border overflow-hidden modal-pop" 
      >
        <div className="w-full text-center pt-2 pb-2 shrink-0">
          <h2 className="font-babydoll text-xl text-[#1c1c1a] leading-tight tracking-wide">
            la habitación de {nombreSocia}
          </h2>
        </div>
        
        <div className="w-full flex-grow flex flex-col items-center justify-center py-2 box-border">
          {modo === 'cita' && (
            <div className="w-full px-2 text-center flex flex-col items-center justify-center space-y-3">
              <textarea aria-label="Texto de la cita para Stories" value={textoCita} onChange={e => setTextoCita(e.target.value)} maxLength={360} className="w-full min-h-36 resize-none border border-[#e6e4dc] rounded-xl bg-white/70 p-3 font-babydoll text-base text-[#1c1c1a] leading-relaxed text-center focus:outline-none focus:ring-2 focus:ring-[#8b6040]" />
              <button type="button" onClick={elegirOtraCita} className="text-[10px] font-bold text-[#3d4220] bg-white border border-[#e6e4dc] rounded-full px-3 py-1.5 min-h-[44px]">Otra cita</button>
              {libroStory?.titulo && <span className="font-sans text-[10px] text-[#595750]">{libroStory.titulo}{libroStory.autora ? ` · ${libroStory.autora}` : ''}</span>}
              <span className="font-sans text-xs font-semibold text-[#3d4220] tracking-wide block lowercase">
                @gilda.mailclub
              </span>
            </div>
          )}
          
          {modo === 'progreso' && (
            <div className="w-full flex flex-col items-center text-center space-y-3">
              <span className="font-sans text-xs font-semibold text-[#3d4220] tracking-wide block lowercase">
                @gilda.mailclub
              </span>
              
              <div className="shadow-xl w-20 h-28 rounded overflow-hidden shrink-0 flex items-center justify-center bg-gray-100">
                <PortadaLibro titulo={libroStory.titulo} autora={libroStory.autora} portada={libroStory.portada} size="story" />
              </div>

              <div className="w-full max-w-[210px] space-y-1.5 pt-1">
                <p className="font-babydoll font-bold text-sm leading-snug text-[#1c1c1a] px-1 m-0 text-center">
                  {libroStory.titulo}
                </p>
                
                <div className="w-full bg-[#e6e4dc] h-[4px] rounded-full overflow-hidden my-1">
                  <div 
                    className="bg-[#3d4220] h-full rounded-full" 
                    style={{ width: `${Math.min(100, Math.max(5, (paginaStory / (libroStory.paginas_totales || libro.paginas_totales || 280)) * 100))}%` }}
                  ></div>
                </div>

                <p className="text-[11px] text-[#595750] font-sans font-bold tracking-wide m-0 text-center">
                  pág. {paginaStory}
                </p>
              </div>
            </div>
          )}
          
          {modo === 'habitacion' && (
            <div className="w-full flex flex-col items-center justify-center">
              <div className="estanteria-madera w-[240px] flex items-end justify-center px-2 pt-4 pb-6 min-h-[130px] shadow-sm relative box-border">
                {misLibros.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="scale-75 transform origin-bottom -mx-2.5 shrink-0">
                    <LomoLibroEstanteria item={item} />
                  </div>
                ))}
                {decoracion !== 'ninguna' && (
                  <div className="shrink-0 pl-1 pb-1 scale-75 transform origin-bottom">
                    <IlustracionDecoracion tipo={decoracion} />
                  </div>
                )}
                
                <span className="absolute bottom-1 right-2 font-sans text-[10px] font-bold text-[#3d4220] tracking-wide block lowercase z-10">
                  @gilda.mailclub
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="w-full h-4 shrink-0"></div>
      </div>

      <div className="mt-5 space-y-2.5 w-full max-w-[310px] shrink-0 font-sans">
         {modo === 'cita' && (
           <button
             type="button"
             disabled={!textoCita.trim() || publicandoCita}
             onClick={async () => {
               setPublicandoCita(true);
               try {
                 await onPublicarCita?.(textoCita.trim(), libroStory);
               } finally {
                 setPublicandoCita(false);
               }
             }}
             className="w-full bg-[#3d4220] text-white font-bold py-3.5 rounded-2xl text-xs shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
           >
             <i className="fa-solid fa-feather"></i> {publicandoCita ? 'Publicando...' : 'Publicar en el Muro'}
           </button>
         )}
         <button onClick={handleDownload} className="w-full bg-white text-[#1c1c1a] font-bold py-3.5 rounded-2xl text-xs shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform min-h-[44px]">
           <i className="fa-solid fa-download"></i> Descargar imagen
         </button>
         <button onClick={onClose} className="w-full bg-transparent text-white font-bold py-3.5 rounded-2xl text-xs border border-white/20 hover:bg-white/10 transition-colors min-h-[44px]">
           Cerrar
         </button>
      </div>
    </div>
  );
}