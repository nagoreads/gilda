import { useState, useMemo, useCallback } from 'react';

export default function CalendarioInteractivo({ eventos }) {
  const [fechaActual, setFechaActual] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const anio = fechaActual.getFullYear();
  const mes = fechaActual.getMonth();
  const primerDiaMes = new Date(anio, mes, 1);
  const ultimoDiaMes = new Date(anio, mes + 1, 0);

  let primerDiaSemanaIndice = primerDiaMes.getDay() - 1;
  if (primerDiaSemanaIndice === -1) primerDiaSemanaIndice = 6;
  const totalDiasMes = ultimoDiaMes.getDate();
  const hoy = new Date();
  const esMesActual = hoy.getFullYear() === anio && hoy.getMonth() === mes;

  const parsearFechaEvento = useCallback((strFecha) => {
    if (!strFecha) return null;
    const s = strFecha.toString().trim().toLowerCase();
    if (s.includes('-') || s.includes('/')) {
      const partes = s.split(/[/-]/);
      if (partes.length >= 2) {
        if (partes[0].length === 4) {
          return { dia: parseInt(partes[2], 10), mes: parseInt(partes[1], 10) - 1, anio: parseInt(partes[0], 10) };
        } else {
          return { dia: parseInt(partes[0], 10), mes: parseInt(partes[1], 10) - 1, anio: partes[2] ? parseInt(partes[2], 10) : anio };
        }
      }
    }
    const matchDia = s.match(/^(\d{1,2})/);
    if (matchDia) {
      const diaNum = parseInt(matchDia[1], 10);
      const mapaMeses = {
        ene: 0, enero: 0, feb: 1, febrero: 1, mar: 2, marzo: 2, abr: 3, abril: 3,
        may: 4, mayo: 4, jun: 5, junio: 5, jul: 6, julio: 6, ago: 7, agosto: 7,
        sep: 8, sept: 8, septiembre: 8, oct: 9, octubre: 9, nov: 10, noviembre: 10, dic: 11, diciembre: 11
      };
      for (const [clave, mesIndex] of Object.entries(mapaMeses)) {
        if (s.includes(clave)) {
          const matchAnio = s.match(/\b(20\d{2})\b/);
          return { dia: diaNum, mes: mesIndex, anio: matchAnio ? parseInt(matchAnio[1], 10) : anio };
        }
      }
    }
    return null;
  }, [anio]);

  const eventosDelMes = useMemo(() => {
    const mapa = {};
    (eventos || []).forEach(ev => {
      const est = (ev.estado || '').toLowerCase();
      if (est === 'pendiente' || est === 'por definir') return;
      const parsed = parsearFechaEvento(ev.fecha || ev.dia || ev.date || ev.fecha_evento);
      if (parsed && parsed.mes === mes && parsed.anio === anio) {
        if (!mapa[parsed.dia]) mapa[parsed.dia] = [];
        mapa[parsed.dia].push(ev);
      }
    });
    return mapa;
  }, [eventos, mes, anio, parsearFechaEvento]);

  const mesAnterior = () => { setFechaActual(new Date(anio, mes - 1, 1)); setDiaSeleccionado(null); };
  const mesSiguiente = () => { setFechaActual(new Date(anio, mes + 1, 1)); setDiaSeleccionado(null); };

  const celdas = [];
  for (let i = 0; i < primerDiaSemanaIndice; i++) {
    celdas.push(<div key={`empty-${i}`} className="h-9"></div>);
  }

  for (let dia = 1; dia <= totalDiasMes; dia++) {
    const esHoy = esMesActual && hoy.getDate() === dia;
    const evs = eventosDelMes[dia] || [];
    const tieneEventos = evs.length > 0;
    
    celdas.push(
      <div 
        key={dia} 
        onClick={() => {
          if (tieneEventos) setDiaSeleccionado({ dia, eventos: evs });
          else setDiaSeleccionado(null);
        }}
        className={`h-9 flex flex-col items-center justify-center rounded-xl relative transition-all text-xs font-sans cursor-pointer ${esHoy ? 'bg-[#23211e] text-[#ffffee] font-bold shadow-sm' : 'hover:bg-[#faf9f5] text-[#23211e]'} ${tieneEventos && !esHoy ? 'border border-[var(--primary-olive)]/40 font-bold bg-[#ffffee]' : ''}`}
      >
        <span>{dia}</span>
        {tieneEventos && <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${esHoy ? 'bg-[#ffffee]' : 'bg-[#23211e]'}`}></span>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center bg-[#ffffee] p-2.5 rounded-xl border border-[#e8e4d9]">
        <button onClick={mesAnterior} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-[#23211e] min-h-[44px] min-w-[44px]"><i className="fa-solid fa-chevron-left text-xs"></i></button>
        <h4 className="font-babydoll text-base font-bold text-[#23211e]">{nombresMeses[mes]} {anio}</h4>
        <button onClick={mesSiguiente} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-[#23211e] min-h-[44px] min-w-[44px]"><i className="fa-solid fa-chevron-right text-xs"></i></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center font-sans text-[10px] uppercase font-semibold text-[#75706b] pb-1 border-b border-[#e8e4d9]">
        {diasSemana.map((d, i) => <div key={i}>{d}</div>)}
      </div>

      <div key={`${anio}-${mes}`} className="grid grid-cols-7 gap-1 text-center fade-in">
        {celdas}
      </div>

      {diaSeleccionado && (
        <div className="bg-[#ffffee] border border-[#e8e4d9] p-3.5 rounded-xl space-y-2.5 mt-2 fade-in text-left shadow-sm">
          <div className="flex justify-between items-center border-b border-[#e8e4d9] pb-1.5">
            <span className="font-babydoll font-bold text-sm text-[#23211e]">
              Eventos del {diaSeleccionado.dia} de {nombresMeses[mes]}
            </span>
            <button onClick={() => setDiaSeleccionado(null)} className="text-xs text-[#75706b] hover:text-black p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {diaSeleccionado.eventos.map((ev, idx) => (
              <div key={idx} className="bg-white p-2.5 rounded-lg border border-[#e8e4d9] text-xs space-y-1">
                <p className="font-bold text-[#23211e] font-babydoll text-sm">{ev.evento || ev.titulo || 'Evento del club'}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-[#75706b] font-sans">
                  <i className="fa-regular fa-clock text-[var(--primary-olive)]"></i>
                  <span>{ev.hora && ev.hora.trim() !== '' ? ev.hora : 'Durante todo el día'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}