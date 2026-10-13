import { useState } from 'react';

export default function EdificioClub({
  AvatarUsuaria,
  usuarias,
  libroActual,
  sesionEmail,
  chatBloqueado,
  onAddWantToRead,
  onAbrirPrivado
}) {
  const [gildaSeleccionada, setGildaSeleccionada] = useState(null);

  return (
    <div className="space-y-5 page-transition">
      {/* Cabecera */}
      <section className="editorial-card p-5 text-center space-y-1">
        <h1 className="font-babydoll text-3xl font-bold text-[#23211e]">Nuestro hogar</h1>
        <p className="text-xs text-[#75706b] font-sans leading-relaxed">
          En esta casita, cada una tenemos nuestra propia habitación, que ya era hora :)
          <br />
          También puedes visitar las de las demás para ver qué están leyendo &lt;3
        </p>
      </section>

      {/* Grid de Ventanas */}
      <section className="editorial-card p-5 space-y-4">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {usuarias.map((gilda, idx) => {
            const esYo = (gilda.email || '').toLowerCase().trim() === (sesionEmail || '').toLowerCase().trim();
            const estaLeyendo = gilda.estaLeyendo;

            return (
              <button
                key={gilda.email || idx}
                onClick={() => setGildaSeleccionada(gilda)}
                className={`ventana-casa p-3 flex flex-col items-center justify-between min-h-[110px] transition-all relative ${
                  estaLeyendo ? 'leyendo' : ''
                }`}
              >
                <AvatarUsuaria foto={gilda.foto_perfil} nombre={gilda.nombre} sizeClass="w-9 h-9" textClass="text-sm" />
                <div className="text-center w-full mt-2">
                  <span className="font-babydoll text-xs font-bold text-[#23211e] block truncate">{gilda.nombre}</span>
                  <span className="text-[9px] text-[#75706b] font-sans block truncate">
                    {estaLeyendo ? 'Leyendo' : 'En pausa'}
                  </span>
                </div>
                {esYo && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#23211e]"></span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Modal / Ficha de la Gilda Seleccionada con rebote elástico */}
      {gildaSeleccionada && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setGildaSeleccionada(null)}>
          <div className="editorial-card max-w-sm w-full p-5 space-y-4 bg-white modal-elastic" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-[#e8e4d9] pb-3">
              <AvatarUsuaria foto={gildaSeleccionada.foto_perfil} nombre={gildaSeleccionada.nombre} sizeClass="w-12 h-12" textClass="text-xl" />
              <div className="min-w-0 flex-grow">
                <h3 className="font-babydoll text-xl font-bold text-[#23211e] truncate">{gildaSeleccionada.nombre}</h3>
                <p className="text-xs text-[#75706b] font-sans truncate">{gildaSeleccionada.ciudad || 'Gilda del club'}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs font-sans text-[#23211e]">
              <div className="flex justify-between py-1 border-b border-[#e8e4d9]">
                <span className="text-[#75706b]">Avance del club:</span>
                <span className="font-bold">pág. {gildaSeleccionada.pagina || 0}</span>
              </div>
              {gildaSeleccionada.misLecturasPersonales && gildaSeleccionada.misLecturasPersonales.length > 0 && (
                <div className="pt-1">
                  <span className="text-[#75706b] block mb-1">También está leyendo:</span>
                  <ul className="space-y-1">
                    {gildaSeleccionada.misLecturasPersonales.map((l, i) => (
                      <li key={i} className="font-medium flex justify-between items-center bg-[#ffffee] p-2 rounded-lg border border-[#e8e4d9]">
                        <span className="truncate pr-2">{l.libro}</span>
                        <button
                          type="button"
                          onClick={() => {
                            onAddWantToRead(l.libro, l.autora, l.portada);
                            setGildaSeleccionada(null);
                          }}
                          className="text-[10px] underline text-[#23211e] shrink-0 font-bold"
                        >
                          Quiero leer
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const g = gildaSeleccionada;
                  setGildaSeleccionada(null);
                  onAbrirPrivado(g);
                }}
                className="editorial-btn flex-1 py-2 text-xs font-medium"
              >
                Escribir privado
              </button>
              <button
                type="button"
                onClick={() => setGildaSeleccionada(null)}
                className="bg-white border border-[#e8e4d9] px-4 py-2 rounded-xl text-xs font-medium text-[#75706b]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}