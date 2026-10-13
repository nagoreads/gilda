import { useState } from 'react';

export function LomoLibroEstanteria({ item, onClick }) {
  const generarColorEditorial = (texto) => {
    let hash = 0;
    for (let i = 0; i < texto.length; i++) { hash = texto.charCodeAt(i) + ((hash << 5) - hash); }
    const matices = ['#3d4220', '#34381b', '#523021', '#232820', '#633528', '#324854', '#543d30', '#3d3054', '#4a3429', '#324235', '#523c2a', '#2c363d', '#422e2e', '#3a2e4a', '#323d3e'];
    return matices[Math.abs(hash) % matices.length];
  };
  const tituloLibro = item.libro || item.titulo || 'libro';

  return (
    <div 
      onClick={onClick} 
      style={{ backgroundColor: generarColorEditorial(tituloLibro) }} 
      className="lomo-libro text-[#ffffee] w-12 h-36 shrink-0 cursor-pointer shadow-md relative rounded-t-sm overflow-hidden flex flex-col justify-start p-2 border-t border-white/20" 
      title={`${tituloLibro} — ${item.autora || ''}`}
    >
      <div className="absolute top-1 left-1.5 w-1 h-2 rounded-full bg-white/20"></div>
      <div className="flex flex-col h-full justify-start pt-3">
        <span 
          className="font-babydoll font-bold text-[9px] leading-tight text-left text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] overflow-hidden" 
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', maxHeight: '110px' }}
        >
          {tituloLibro}
        </span>
      </div>
    </div>
  );
}

export function ObjetoExternoEnmarcado({ urlImagen, titulo, onClick }) {
  const estiloImagenExterna = {
    filter: 'saturate(0.8) sepia(0.2) contrast(0.9)',
    objectFit: 'cover'
  };

  return (
    <button 
      onClick={onClick}
      className="relative cursor-pointer hover:scale-105 transition-transform shrink-0"
      title={titulo || "Pin importado"}
    >
      <div className="border-[1.5px] border-[#1c1c1a] rounded-sm bg-[#f7f3e8] p-1 shadow-sm w-16 h-20 flex flex-col items-center">
        <div className="absolute top-0 w-2 h-3 bg-[#595750] border-[1px] border-[#1c1c1a] rounded-full z-10 -mt-1"></div>
        <div className="w-full h-full overflow-hidden border-[1px] border-[#1c1c1a]">
          {urlImagen ? (
            <img src={urlImagen} alt={titulo} style={estiloImagenExterna} className="w-full h-full" />
          ) : (
            <div className="w-full h-full bg-[#e8e2d2] flex items-center justify-center">
               <span className="text-[#595750] text-[10px] text-center font-sans">+ Pin</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export function IlustracionDecoracion({ tipo, onInteractuar }) {
  const [animado, setAnimado] = useState(false);
  const handleClick = () => {
    setAnimado(true);
    setTimeout(() => setAnimado(false), 400);
    if (onInteractuar) onInteractuar(tipo);
  };
  const wrapperClass = `interactiva-ilustracion ${animado ? 'animar-salto' : ''}`;

  if (tipo === 'monstera') return (
    <div onClick={handleClick} className={wrapperClass} title="¡Haz clic en tu plantita!">
      <svg width="44" height="48" viewBox="0 0 42 46" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 drop-shadow-sm">
        <path d="M14 34H28V44H14V34Z" fill="#b8784f" stroke="#1c1c1a" strokeWidth="1.5"/><path d="M12 34H30V37H12V34Z" fill="#9e6037" stroke="#1c1c1a" strokeWidth="1.5"/><path d="M21 34V16" stroke="#3d4220" strokeWidth="2" strokeLinecap="round"/><path d="M21 22C14 20 8 24 6 28C11 31 16 28 21 22Z" fill="#616c31" stroke="#1c1c1a" strokeWidth="1.5"/><path d="M21 18C28 16 34 20 36 24C31 27 26 24 21 18Z" fill="#525c27" stroke="#1c1c1a" strokeWidth="1.5"/><path d="M21 14C17 6 10 6 7 9C10 13 15 14 21 14Z" fill="#758237" stroke="#1c1c1a" strokeWidth="1.5"/><path d="M21 14C25 6 32 6 35 9C32 13 27 14 21 14Z" fill="#616c31" stroke="#1c1c1a" strokeWidth="1.5"/>
      </svg>
    </div>
  );
  if (tipo === 'maceta') return (
    <div onClick={handleClick} className={wrapperClass} title="¡Haz clic en tu maceta!">
      <svg width="42" height="44" viewBox="0 0 40 42" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 drop-shadow-sm">
        <path d="M10 28H30V40H10V28Z" fill="#d4c8b4" stroke="#1c1c1a" strokeWidth="1.5"/><path d="M8 25H32V29H8V25Z" fill="#e3d9cc" stroke="#1c1c1a" strokeWidth="1.5"/><path d="M20 25C15 16 11 10 9 6C15 10 18 16 20 25Z" fill="#616c31" stroke="#1c1c1a" strokeWidth="1.5"/><path d="M20 25C25 16 29 10 31 6C25 10 22 16 20 25Z" fill="#758237" stroke="#1c1c1a" strokeWidth="1.5"/>
      </svg>
    </div>
  );
  if (tipo === 'vela') return (
    <div onClick={handleClick} className={wrapperClass} title="¡Haz clic para encender o apagar la vela!">
      <svg width="34" height="46" viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 drop-shadow-sm">
        <path d="M8 20H24V42H8V20Z" fill="#f5f0e1" stroke="#1c1c1a" strokeWidth="1.5"/><path d="M15 16H17V20H15V16Z" fill="#1c1c1a"/><path className="vela-flama" d="M16 14C19 10 18 6 16 3C14 6 13 10 16 14Z" fill="#d96b14" stroke="#1c1c1a" strokeWidth="1.2"/>
      </svg>
    </div>
  );
  if (tipo === 'cafe') return (
    <div onClick={handleClick} className={wrapperClass} title="¡Haz clic para dar un sorbo a tu café!">
      <svg width="42" height="40" viewBox="0 0 40 38" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 drop-shadow-sm">
        <path d="M8 14H28V32H8V14Z" fill="#FFFFFF" stroke="#1c1c1a" strokeWidth="1.5"/><path d="M28 17H33C35 17 35 25 33 25H28" stroke="#1c1c1a" strokeWidth="1.5"/><path d="M8 14H28V18H8V14Z" fill="#523021" stroke="#1c1c1a" strokeWidth="1.5"/><path className="humo-taza" d="M14 10C15 7 13 5 15 2" stroke="#a69982" strokeWidth="1.5" strokeLinecap="round"/><path className="humo-taza" style={{animationDelay: '1s'}} d="M22 11C23 8 21 6 23 3" stroke="#a69982" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
  if (tipo === 'cactus') return (
    <div onClick={handleClick} className={wrapperClass} title="¡Haz clic en tu cactus!">
      <svg width="38" height="44" viewBox="0 0 36 42" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 drop-shadow-sm">
        <path d="M10 32H26V40H10V32Z" fill="#9e6037" stroke="#1c1c1a" strokeWidth="1.5"/><path d="M15 12C15 8 21 8 21 12V32H15V12Z" fill="#4d5930" stroke="#1c1c1a" strokeWidth="1.5"/><path d="M10 18H15V22H10C8 22 8 18 10 18Z" fill="#4d5930" stroke="#1c1c1a" strokeWidth="1.5"/><path d="M21 16H26C28 16 28 20 26 20H21V16Z" fill="#4d5930" stroke="#1c1c1a" strokeWidth="1.5"/>
      </svg>
    </div>
  );
  if (tipo === 'auriculares') return (
    <div onClick={handleClick} className={wrapperClass} title="¡Tus auriculares cozy!">
      <svg width="40" height="40" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 drop-shadow-sm">
        <path d="M10 24V17C10 11 14 7 19 7C24 7 28 11 28 17V24" stroke="#1c1c1a" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <rect x="7" y="22" width="6" height="10" rx="3" fill="#f7f3e8" stroke="#1c1c1a" strokeWidth="1.5"/>
        <rect x="25" y="22" width="6" height="10" rx="3" fill="#f7f3e8" stroke="#1c1c1a" strokeWidth="1.5"/>
      </svg>
    </div>
  );
  if (tipo === 'tocadiscos') return (
    <div onClick={handleClick} className={wrapperClass} title="¡Tu tocadiscos vintage!">
      <svg width="44" height="38" viewBox="0 0 42 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 drop-shadow-sm">
        <rect x="3" y="10" width="36" height="22" rx="3" fill="#c9bea3" stroke="#1c1c1a" strokeWidth="1.5"/>
        <circle cx="15" cy="21" r="7" fill="#1c1c1a"/>
        <circle cx="15" cy="21" r="2.5" fill="#ffffee" stroke="#1c1c1a" strokeWidth="1.2"/>
        <path d="M26 15L31 22" stroke="#1c1c1a" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="31" cy="22" r="1.5" fill="#ffffee" stroke="#1c1c1a" strokeWidth="1"/>
      </svg>
    </div>
  );
  if (tipo === 'camara') return (
    <div onClick={handleClick} className={wrapperClass} title="¡Tu cámara analógica!">
      <svg width="42" height="36" viewBox="0 0 40 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 drop-shadow-sm">
        <rect x="4" y="10" width="32" height="20" rx="3" fill="#595750" stroke="#1c1c1a" strokeWidth="1.5"/>
        <path d="M12 10V7H28V10" fill="#f7f3e8" stroke="#1c1c1a" strokeWidth="1.5"/>
        <circle cx="20" cy="20" r="6" fill="#f7f3e8" stroke="#1c1c1a" strokeWidth="1.5"/>
        <circle cx="20" cy="20" r="3" fill="#3d4220"/>
        <circle cx="10" cy="15" r="1.5" fill="#ffffee" stroke="#1c1c1a" strokeWidth="1"/>
      </svg>
    </div>
  );
  if (tipo === 'lampara') return (
    <div onClick={handleClick} className={wrapperClass} title="¡Tu lámpara de lectura!">
      <svg width="36" height="46" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 drop-shadow-sm">
        <path d="M12 40H22" stroke="#1c1c1a" strokeWidth="2" strokeLinecap="round"/>
        <path d="M17 40V22L9 12" stroke="#595750" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 12H16L19 6H9L6 12Z" fill="#3d4220" stroke="#1c1c1a" strokeWidth="1.5"/>
      </svg>
    </div>
  );
  return null;
}