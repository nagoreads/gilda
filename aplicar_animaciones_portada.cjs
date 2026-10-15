const fs = require('fs');

const appPath = 'src/App.jsx';
if (fs.existsSync(appPath)) {
  let code = fs.readFileSync(appPath, 'utf8');

  const startMarker = 'if (!supabaseSession) {';
  const endMarker = 'return (\n    <div className="min-h-screen flex flex-col items-center';

  const startIndex = code.indexOf(startMarker);
  const endIndex = code.indexOf(endMarker);

  if (startIndex !== -1 && endIndex !== -1) {
    const nuevoBloqueAcceso = `if (!supabaseSession) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 w-full py-12 bg-[#ffffee] page-transition">
        {vistaAcceso === 'crea-tu-gilda' ? (
          <div className="w-full max-w-md animate-fade-in">
            <div className="text-center mb-2 flex flex-col items-center">
              <p className="text-[10px] uppercase tracking-widest text-[#75706b] font-sans font-medium hover:text-[#23211e] transition-colors cursor-default">club de lectura, mailclub y comunidad</p>
              <div className="flex justify-center my-0">
                <img 
                  src="/icon-192.png" 
                  alt="Gilda" 
                  className="w-56 h-56 object-contain hover:scale-105 hover:rotate-3 transition-all duration-300 ease-out cursor-pointer active:scale-95" 
                  title="¡Hola!"
                />
              </div>
              <h1 className="font-babydoll text-6xl text-[#23211e] font-bold -mt-4 hover:scale-105 transition-transform duration-200 cursor-default">gilda</h1>
            </div>
            <div className="editorial-card p-4 border border-[#e8e4d9] modal-elastic shadow-sm hover:shadow-md transition-shadow">
              <CreaTuGilda
                enEntrarGratis={() => setVistaAcceso('menu')}
                enIrALogin={() => setVistaAcceso('menu')}
              />
            </div>
          </div>
        ) : (
          <div className="editorial-card max-w-md w-full p-8 space-y-6 text-center border border-[#e8e4d9] modal-elastic shadow-sm hover:shadow-md transition-shadow animate-fade-in">
            <div className="text-center mb-2 flex flex-col items-center">
              <p className="text-[10px] uppercase tracking-widest text-[#75706b] font-sans font-medium hover:text-[#23211e] transition-colors cursor-default">club de lectura, mailclub y comunidad</p>
              <div className="flex justify-center my-0">
                <img 
                  src="/icon-192.png" 
                  alt="Gilda" 
                  className="w-56 h-56 object-contain hover:scale-105 hover:rotate-3 transition-all duration-300 ease-out cursor-pointer active:scale-95" 
                  title="¡Hola!"
                />
              </div>
              <h1 className="font-babydoll text-6xl text-[#23211e] font-bold -mt-4 hover:scale-105 transition-transform duration-200 cursor-default">gilda</h1>
            </div>

            {vistaAcceso === 'menu' && (
              <form onSubmit={handleMagicLinkLogin} className="space-y-4 font-sans text-left pt-2">
                <div>
                  <label className="block text-xs font-medium text-[#23211e] mb-1">Correo electrónico</label>
                  <input 
                    type="email" 
                    placeholder="tuemail@ejemplo.com" 
                    value={emailLogin} 
                    onChange={e => setEmailLogin(e.target.value)} 
                    disabled={esperandoToken} 
                    required 
                    className="w-full editorial-input px-3.5 py-2.5 text-xs disabled:opacity-50 focus:scale-[1.01] transition-transform duration-200" 
                  />
                </div>
                
                {esperandoToken && (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-medium text-[#23211e] mt-3 mb-1">Código de 6 dígitos recibido</label>
                    <input 
                      type="text" 
                      placeholder="123456" 
                      value={tokenLogin} 
                      onChange={e => setTokenLogin(e.target.value)} 
                      required 
                      className="w-full editorial-input px-3.5 py-2.5 text-xs text-center tracking-[0.5em] font-bold focus:scale-[1.01] transition-transform duration-200" 
                      maxLength={6} 
                    />
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loadingAuth} 
                  className="w-full editorial-btn py-3 text-xs font-medium hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow"
                >
                  {loadingAuth ? "procesando..." : (esperandoToken ? "entrar al club" : "enviadme la llave por correo")}
                </button>
                
                {!esperandoToken && (
                  <div className="space-y-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setVistaAcceso("crea-tu-gilda")} 
                      className="w-full bg-[#23211e] text-white rounded-xl py-3 text-xs font-medium hover:bg-[#383531] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 shadow-sm"
                    >
                      crear una gilda propia
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setVistaAcceso("modalidades")} 
                      className="w-full bg-white text-[#23211e] border border-[#e8e4d9] rounded-xl py-3 text-xs font-medium hover:bg-[#ffffee] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
                    >
                      Ver todas las membresías
                    </button>
                  </div>
                )}
              </form>
            )}

            {vistaAcceso === 'modalidades' && (
              <div className="space-y-4 text-left page-transition">
                <button onClick={() => setVistaAcceso('crea-tu-gilda')} className="text-xs font-medium text-[#75706b] hover:text-[#23211e] flex items-center transition-colors">← Volver al test</button>
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {modalidades.map(m => (
                    <div key={m.id} className="editorial-card p-4 space-y-2 bg-white border border-[#e8e4d9] hover:-translate-y-0.5 transition-transform duration-200">
                      <div className="flex justify-between items-center"><h3 className="font-babydoll font-bold text-lg">{m.nombre}</h3><span className="text-xs font-medium bg-[#23211e] text-[#ffffee] px-2.5 py-1 rounded-full">{m.precio}</span></div>
                      <p className="text-xs text-[#75706b] font-sans">{m.descripcion}</p>
                      <a href={m.esGratis ? '#' : m.enlaceStripe} onClick={e => { if (m.esGratis) setVistaAcceso('menu'); }} className="block w-full mt-2 py-2 text-center text-xs editorial-btn font-medium hover:-translate-y-0.5 active:scale-[0.98] transition-all">{m.esGratis ? 'Probar gratis' : 'Elegir esta modalidad'}</a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }\n\n  `;

    code = code.substring(0, startIndex) + nuevoBloqueAcceso + code.substring(endIndex);
    fs.writeFileSync(appPath, code, 'utf8');
    console.log("✅ ¡Animaciones interactivas aplicadas con éxito!");
  } else {
    console.log("⚠️ No se encontraron los puntos exactos de anclaje en src/App.jsx");
  }
}
