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
        {vistaAcceso === 'menu' ? (
          <div className="w-full max-w-md text-center animate-fade-in">
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
                <div className="pt-3 flex justify-center items-center text-xs text-[#75706b] border-t border-[#e8e4d9]/60">
                  <button 
                    type="button" 
                    onClick={() => setVistaAcceso("crea-tu-gilda")} 
                    className="hover:text-[#23211e] transition-colors border-b border-transparent hover:border-[#23211e]"
                  >
                    ← ver las formas de estar en gilda
                  </button>
                </div>
              )}
            </form>
          </div>
        ) : (
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
            <div className="pt-2">
              <CreaTuGilda
                enEntrarGratis={() => setVistaAcceso('menu')}
                enIrALogin={() => setVistaAcceso('menu')}
              />
            </div>
          </div>
        )}
      </div>
    );
  }\n\n  `;

    code = code.substring(0, startIndex) + nuevoBloqueAcceso + code.substring(endIndex);
    fs.writeFileSync(appPath, code, 'utf8');
    console.log("✅ Vista unificada con éxito en src/App.jsx!");
  }
}
