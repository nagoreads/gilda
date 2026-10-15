const fs = require('fs');

const appPath = 'src/App.jsx';
if (fs.existsSync(appPath)) {
  let code = fs.readFileSync(appPath, 'utf8');

  // Marcadores de inicio y fin del bloque de la pestaña Inicio
  const startMarker = '{/* Pestañas Niveladas */}';
  const endMarker = '{/* SUBTAB 2: AQUI Y AHORA */}';

  const startIndex = code.indexOf(startMarker);
  const endIndex = code.indexOf(endMarker);

  if (startIndex !== -1 && endIndex !== -1) {
    const nuevoBloqueInicio = `{/* Navegación Artesanal de Inicio */}
          <div className="flex justify-center items-center gap-6 text-xs font-sans mb-5 pt-1 border-b border-dashed border-[#e8e4d9] pb-3">
            <button
              onClick={() => setSubTabInicio('progreso')}
              className={\`transition-all capitalize pb-1 \${subTabInicio === 'progreso' ? 'font-bold text-[#23211e] border-b-2 border-[#23211e]' : 'text-[#75706b] hover:text-[#23211e]'}\`}
            >
              lecturas
            </button>
            <button
              onClick={() => setSubTabInicio('aqui_ahora')}
              className={\`relative transition-all capitalize pb-1 \${subTabInicio === 'aqui_ahora' ? 'font-bold text-[#23211e] border-b-2 border-[#23211e]' : 'text-[#75706b] hover:text-[#23211e]'}\`}
            >
              aquí y ahora
              {!haPublicadoMomentoHoy && (
                <span className="inline-block ml-1 w-1.5 h-1.5 bg-[#23211e] rounded-full animate-pulse"></span>
              )}
            </button>
            <button
              onClick={() => {
                if (esRestringida) setMostrarModalUpgrade(true);
                else setSubTabInicio('muro');
              }}
              className={\`transition-all capitalize pb-1 \${subTabInicio === 'muro' ? 'font-bold text-[#23211e] border-b-2 border-[#23211e]' : 'text-[#75706b] hover:text-[#23211e]'} \${esRestringida ? 'opacity-60' : ''}\`}
            >
              muro {esRestringida && '✦'}
            </button>
          </div>

          {/* SUBTAB 1: LECTURAS */}
          {subTabInicio === 'progreso' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-5 rounded-2xl bg-white/70 border border-[#e8e4d9] hover:border-[#23211e] transition-colors space-y-4">
                <div className="flex justify-between items-center border-b border-[#e8e4d9]/60 pb-2">
                  <span className="text-[10px] uppercase tracking-widest text-[#75706b] font-sans font-medium">✦ lectura en curso</span>
                  <button 
                    onClick={() => setMostrarModalShare(true)} 
                    className="text-xs text-[#75706b] hover:text-[#23211e] transition-colors font-sans border-b border-transparent hover:border-[#23211e]"
                  >
                    compartir en story
                  </button>
                </div>
                <div className="flex gap-4 items-center">
                  <PortadaLibro titulo={libroActual.titulo} autora={libroActual.autora} portada={libroActual.portada} size="large" />
                  <div className="space-y-1.5 w-full">
                    <span className="text-[10px] text-[#75706b] font-sans italic">leyendo juntas</span>
                    <h2 className="font-babydoll text-2xl font-bold leading-tight text-[#23211e]">{libroActual.titulo}</h2>
                    <p className="text-xs text-[#75706b] italic font-sans">{libroActual.autora}</p>
                    <div className="pt-2">
                      <div className="flex justify-between text-[11px] text-[#75706b] mb-1 font-sans">
                        <span>avance</span>
                        <span className="font-medium text-[#23211e]">{porcentajeLibro}%</span>
                      </div>
                      <div className="w-full bg-[#ffffee] rounded-full h-1 border border-[#e8e4d9]">
                        <div className="bg-[#23211e] h-full rounded-full transition-all duration-300" style={{width: \`\${porcentajeLibro}%\`}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            `;

    code = code.substring(0, startIndex) + nuevoBloqueInicio + code.substring(endIndex);
    fs.writeFileSync(appPath, code, 'utf8');
    console.log("✅ Pantalla de Inicio transformada con éxito en src/App.jsx!");
  } else {
    console.log("⚠️ No se encontraron los puntos exactos de anclaje en src/App.jsx");
  }
}
