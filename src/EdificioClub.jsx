import { useState } from 'react';
import PortadaLibro from './PortadaLibro';

export default function EdificioClub({ usuarias, libroActual, onAddWantToRead, onAbrirPrivado, sesionEmail, chatBloqueado, AvatarUsuaria }) {
    const [usuariaActivaEmail, setUsuariaActivaEmail] = useState('');
    const listaUsuarias = usuarias.length > 0 ? usuarias : [];
    const usuariaActiva = listaUsuarias.find(u => (u.email || '').toLowerCase().trim() === usuariaActivaEmail) || listaUsuarias[0] || {};
    const usuariaActivaKey = (usuariaActiva.email || '').toLowerCase().trim();
    const tieneProgresoClub = Number(usuariaActiva.pagina || 0) > 0;
    const misLibrosPersonales = usuariaActiva.misLecturasPersonales || [];
    const esOtraSocia = usuariaActiva.email && sesionEmail && usuariaActiva.email.toLowerCase().trim() !== sesionEmail.toLowerCase().trim();

    return (
      <div className="flex flex-col items-center w-full max-w-[480px] mx-auto py-2 relative">
        <h2 className="text-[52px] font-babydoll text-center mb-0 text-[#1c1c1a] leading-none">gilda</h2>
        <p className="text-[13px] text-[#595750] text-center mb-5 leading-relaxed font-sans italic">comunidad de lectura, cartas y creatividad</p>
        
        {/* Fachada/Marco de Edificio Vintage */}
        <div className="w-full bg-[#f3eadb] border-2 border-[#d8cdb8] rounded-3xl p-5 shadow-sm relative overflow-hidden mb-6">
          <div className="flex justify-center items-center mb-4 pb-2 border-b border-[#d8cdb8]/60">
            <span className="font-babydoll text-xl font-bold text-[var(--primary-olive)] tracking-wide flex items-center gap-2">
              ✦ residencia gilda ✦
            </span>
          </div>

          <div className="grid grid-cols-3 gap-x-6 gap-y-7 w-full max-w-[260px] mx-auto">
            {listaUsuarias.map((usuaria, indice) => {
              const estaLeyendo = usuaria.estaLeyendo;
              const usuariaKey = (usuaria.email || `usuaria-${indice}`).toLowerCase().trim();
              const seleccionada = usuariaKey === usuariaActivaKey;
              const nombreMostrar = (usuaria.nombre || (usuaria.email ? usuaria.email.split('@')[0] : 'lectora')).split(' ')[0].toLowerCase();
              
              return (
                <div key={usuaria.email || indice} className="relative flex flex-col items-center">
                  {/* Ventana con efecto de resplandor cálido cuando está leyendo */}
                  <button
                    type="button"
                    onClick={() => setUsuariaActivaEmail(usuaria.email ? usuariaKey : '')}
                    aria-pressed={seleccionada}
                    aria-label={`Abrir la ventana de ${usuaria.nombre || usuaria.email || 'lectora'}`}
                    className={`w-[40px] h-[52px] rounded-t-lg rounded-b-xs cursor-pointer transition-all duration-300 hover:scale-105 relative border-2 flex flex-col items-center justify-between p-1 ${
                      estaLeyendo 
                        ? 'bg-[#fff8d6] border-[#e5c158] shadow-[0_0_16px_rgba(255,215,80,0.85)] text-[#8b6040]' 
                        : 'bg-[#d8d5c9] border-[#b8b5a3] text-[#757263]'
                    } ${seleccionada ? 'ring-2 ring-[var(--primary-olive)] ring-offset-2 scale-105' : ''}`}
                  >
                    {/* Cuadrícula de ventana vintage */}
                    <div className="w-full h-1/2 border-b border-current opacity-25 flex">
                      <div className="w-1/2 h-full border-r border-current"></div>
                    </div>
                    {/* Luz encendida parpadeante */}
                    {estaLeyendo && (
                      <span className="w-2 h-2 rounded-full bg-[#e5c158] animate-pulse shadow-xs mb-1"></span>
                    )}
                  </button>

                  <div className="flex items-center justify-center mt-1.5">
                    <span className="text-[12px] text-[#595750] font-bold tracking-tight truncate max-w-[65px] text-center font-sans">{nombreMostrar}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tarjeta Flotante Emergente (Habitación de la socia) */}
        <div key={usuariaActivaKey} className="editorial-card w-full p-5 flex flex-col gap-4 modal-pop">
          <div className="flex flex-col gap-2 w-full border-b border-[#e6e4dc] pb-2.5">
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-2 min-w-0">
                {AvatarUsuaria ? <AvatarUsuaria foto={usuariaActiva.foto_perfil} nombre={usuariaActiva.nombre} sizeClass="w-7 h-7" textClass="text-xs" /> : null}
                <span className="font-babydoll text-lg sm:text-xl font-bold text-[#1c1c1a] leading-tight">
                  la habitación de {
                    (
                      (usuariaActiva && usuariaActiva.nombre && usuariaActiva.nombre.trim() !== '') 
                        ? usuariaActiva.nombre 
                        : (usuariaActiva && usuariaActiva.email ? usuariaActiva.email.split('@')[0] : 'lectora')
                    ).toLowerCase()
                  }
                </span>
              </div>
              <span className="text-[10px] text-[#595750] font-bold font-sans shrink-0">@gilda.mailclub</span>
            </div>

            {esOtraSocia && (
              <div className="flex justify-end pt-0.5">
                <button 
                  onClick={() => onAbrirPrivado(usuariaActiva)} 
                  className="bg-[var(--primary-olive)] text-white px-3 py-1 rounded-xl text-[10px] font-bold font-sans flex items-center gap-1.5 hover:bg-black transition-colors shadow-xs"
                  title={chatBloqueado ? 'Mejora tu modalidad para usar el chat' : 'Enviar privado'}
                >
                  <i className={`fa-solid ${chatBloqueado ? 'fa-lock' : 'fa-envelope'} text-[9px]`}></i> {chatBloqueado ? 'Mejorar modalidad' : 'Enviar privado'}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 bg-[#ffffee] p-3 rounded-xl border border-[#e6e4dc]">
              <div className="flex items-center gap-3 overflow-hidden">
                <PortadaLibro titulo={libroActual.titulo} autora={libroActual.autora} portada={libroActual.portada} size="thumb" />
                <div className="text-xs text-[#1c1c1a] overflow-hidden">
                  <p className="font-bold truncate font-babydoll text-sm">{libroActual.titulo}</p>
                  <p className="text-[11px] text-[#595750] font-sans">pág. <b>{tieneProgresoClub ? usuariaActiva.pagina : 0}</b></p>
                </div>
              </div>
              <button onClick={() => onAddWantToRead(libroActual.titulo, libroActual.autora, libroActual.portada)} className="shrink-0 bg-[#FFFFFF] text-[#1c1c1a] border border-[#e6e4dc] hover:bg-[var(--primary-olive)] hover:text-white px-3 py-1.5 rounded-full text-[10px] font-semibold transition-colors flex items-center gap-1 font-sans">
                <i className="fa-solid fa-bookmark text-[9px]"></i> + Guardar
              </button>
            </div>
            {misLibrosPersonales.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 bg-[#ffffee] p-3 rounded-xl border border-[#e6e4dc]">
                <div className="flex items-center gap-3 overflow-hidden">
                  <PortadaLibro titulo={item.libro} autora={item.autora || ''} portada={item.portada || ''} size="thumb" />
                  <div className="text-xs text-[#1c1c1a] overflow-hidden">
                    <p className="font-bold truncate font-babydoll text-sm">{item.libro}</p>
                    <p className="text-[11px] text-[#595750] font-sans">pág. <b>{item.pagina || item.paginas || 0}</b></p>
                  </div>
                </div>
                <button onClick={() => onAddWantToRead(item.libro, item.autora || '', item.portada || '')} className="shrink-0 bg-[#FFFFFF] text-[#1c1c1a] border border-[#e6e4dc] hover:bg-[var(--primary-olive)] hover:text-white px-3 py-1.5 rounded-full text-[10px] font-semibold transition-colors flex items-center gap-1 font-sans">
                  <i className="fa-solid fa-bookmark text-[9px]"></i> + Guardar
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
}