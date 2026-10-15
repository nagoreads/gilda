const fs = require('fs');

const appPath = 'src/App.jsx';
if (fs.existsSync(appPath)) {
  let code = fs.readFileSync(appPath, 'utf8');

  // Buscar el inicio de la navegación de Inicio
  const startMarker = '{/* Pestañas Niveladas */}';
  let startIndex = code.indexOf(startMarker);
  if (startIndex === -1) {
    startIndex = code.indexOf('{/* Navegación Artesanal de Inicio */}');
  }

  // Buscar el final de las subpestañas de Inicio (justo antes del nav inferior o siguiente sección)
  const endMarker = '{/* SUBTAB 3: MURO */}';
  const endIndex = code.indexOf(endMarker);

  if (startIndex !== -1) {
    // Reemplazar la barra de pestañas por una estética de cuaderno de campo
    const nuevoInicio = `{/* Navegación Artesanal de Inicio */}
          <div className="flex justify-start items-center gap-6 text-xs font-sans mb-6 pb-2 border-b border-dashed border-[#e8e4d9]">
            <button
              onClick={() => setSubTabInicio('progreso')}
              className={\`transition-all capitalize pb-1 text-xs \${subTabInicio === 'progreso' ? 'font-bold text-[#23211e] border-b-2 border-[#23211e]' : 'text-[#75706b] hover:text-[#23211e]'}\`}
            >
              lectura en curso
            </button>
            <button
              onClick={() => setSubTabInicio('aqui_ahora')}
              className={\`relative transition-all capitalize pb-1 text-xs \${subTabInicio === 'aqui_ahora' ? 'font-bold text-[#23211e] border-b-2 border-[#23211e]' : 'text-[#75706b] hover:text-[#23211e]'}\`}
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
              className={\`transition-all capitalize pb-1 text-xs \${subTabInicio === 'muro' ? 'font-bold text-[#23211e] border-b-2 border-[#23211e]' : 'text-[#75706b] hover:text-[#23211e]'} \${esRestringida ? 'opacity-60' : ''}\`}
            >
              muro del club {esRestringida && '✦'}
            </button>
          </div>

          {/* SUBTAB 1: LECTURAS (Estilo ficha de cuaderno) */}
          {subTabInicio === 'progreso' && (
            <div className="space-y-6 animate-fade-in font-sans">
              <div className="py-2 space-y-4">
                <div className="flex justify-between items-baseline border-b border-[#e8e4d9]/60 pb-2">
                  <span className="text-[10px] uppercase tracking-widest text-[#75706b] font-medium">✦ libro del mes</span>
                  <button 
                    onClick={() => setMostrarModalShare(true)} 
                    className="text-[11px] text-[#75706b] hover:text-[#23211e] transition-colors border-b border-transparent hover:border-[#23211e]"
                  >
                    compartir en story
                  </button>
                </div>

                <div className="flex gap-4 items-start pt-1">
                  <PortadaLibro titulo={libroActual.titulo} autora={libroActual.autora} portada={libroActual.portada} size="large" />
                  <div className="space-y-2 w-full">
                    <div>
                      <span className="text-[11px] text-[#75706b] italic block">leyendo juntas</span>
                      <h2 className="font-babydoll text-2xl font-bold leading-tight text-[#23211e]">{libroActual.titulo}</h2>
                      <p className="text-xs text-[#75706b] italic">{libroActual.autora}</p>
                    </div>

                    <div className="pt-2 space-y-1">
                      <div className="flex justify-between text-[11px] text-[#75706b]">
                        <span>avance de la lectura</span>
                        <span className="font-bold text-[#23211e]">{porcentajeLibro}%</span>
                      </div>
                      <div className="w-full bg-[#e8e4d9]/50 rounded-full h-1 overflow-hidden">
                        <div className="bg-[#23211e] h-full rounded-full transition-all duration-300" style={{width: \`\${porcentajeLibro}%\`}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nota o recordatorio del club */}
              <div className="pt-3 border-t border-dashed border-[#e8e4d9] flex justify-between items-center text-xs text-[#75706b]">
                <span className="italic text-[11px]">¿has terminado el capítulo de hoy?</span>
                <button 
                  onClick={() => setTab('capitulos')}
                  className="font-medium text-[#23211e] hover:underline underline-offset-4"
                >
                  ir a los comentarios →
                </button>
              </div>
            </div>
          )}`;

    if (endIndex !== -1) {
      code = code.substring(0, startIndex) + nuevoInicio + code.substring(endIndex);
    } else {
      // Si no encuentra el endMarker exacto, reemplaza desde startIndex en un bloque controlado
      const proximoBloque = code.indexOf('{/* SUBTAB 2: AQUI Y AHORA */}', startIndex);
      if (proximoBloque !== -1) {
        code = code.substring(0, startIndex) + nuevoInicio + '\n\n          ' + code.substring(proximoBloque);
      }
    }

    fs.writeFileSync(appPath, code, 'utf8');
    console.log("✅ Pantalla de Inicio totalmente librada de cajas cuadradas.");
  } else {
    console.log("⚠️ No se encontraron las marcas de inicio en src/App.jsx");
  }
}
